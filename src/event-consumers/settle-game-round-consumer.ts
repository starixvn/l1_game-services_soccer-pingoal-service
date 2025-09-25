import { Core } from "sc-game-base";
import { generateResult } from "../helpers/result-helper";
import { Result } from "../models/rounds";

/**
 * This consumer will be called by ProcessBetQueue after processing bet successfully
 *
 * The main flow:
 * 1. Generate result with player's specified tunnel choices
 * 2. Calculate settlementResult
 * 3. Insert round to rounds table
 * 4. Publish round result to player
 * 5. Settle bets in bets table
 * 6. Publish bet's settlement result to player
 * 7. Publish game status to player
 */

interface PlayerTunnelSelections {
    redTunnel: number;   // Player's specified red tunnel choice (1-6)
    blueTunnel: number;  // Player's specified blue tunnel choice (1-6)
}

interface PlayerInfo {
    nickname: string;    // Player's nickname for admin settlement matching
}

export default class SettleGameRoundConsumer extends Core.BaseEventConsumers.SettleGameRoundConsumer {
    private currentPlayerSelections: PlayerTunnelSelections | null = null;
    private currentPlayerInfo: PlayerInfo | null = null;
    private currentRoundId: number | null = null;

    
    /**
     * Set the current player's tunnel selections before settlement
     * @deprecated Use settleRoundWithSelections instead to avoid race conditions
     * This should be called by ProcessBetQueue before settling the round
     */
    setPlayerTunnelSelections(selections: PlayerTunnelSelections): void {
        this.currentPlayerSelections = selections;
        console.log(`Set player tunnel selections: red=${selections.redTunnel}, blue=${selections.blueTunnel}`);
    }
    
    /**
     * Settle a round with specific tunnel selections, player info, and roundId (thread-safe)
     * This method uses the roundId generated when the player placed their bet
     */
    async settleRoundWithSelections(selections: PlayerTunnelSelections, roundId: number, playerInfo?: PlayerInfo): Promise<void> {
        console.log(`Starting settlement with tunnel selections: red=${selections.redTunnel}, blue=${selections.blueTunnel}, roundId=${roundId}, player=${playerInfo?.nickname || 'unknown'}`);
        
        // Set selections, player info, and the roundId from the bet
        this.currentPlayerSelections = selections;
        this.currentPlayerInfo = playerInfo || null;
        this.currentRoundId = roundId;
    
        try {
            // Call our overridden settleRound method
            await this.settleRound();
        } finally {
            // Always clean up state after settlement
            this.currentPlayerSelections = null;
            this.currentPlayerInfo = null;
            this.currentRoundId = null;
        }
    }
    
    /**
     * Override settleRound to use player's bet roundId
     * This version uses the roundId generated when player placed their bet
     */
    async settleRound(): Promise<void> {
        const result = this.generateResult();
        const settlementResult = (this.definition as any).settle(result);
        const { exchangeRates } = this.gameData;
        const roundId = this.currentRoundId;
        
        // Validate required fields before creating round
        if (!roundId) {
            throw new Error('roundId is required but not available from bet payload');
        }
        
        if (!exchangeRates || !exchangeRates.exId) {
            throw new Error('exchangeRates.exId is required but not available');
        }
        
        console.log(`Creating round in database with ID: ${roundId}, exchangeRateId: ${exchangeRates.exId}`);
        
        const newRound = await (this as any).roundsRepository.create({
            id: roundId,
            result,
            settlementResult,
            time: new Date(),
            exchangeRateId: exchangeRates.exId,
        });

        if (newRound) {
            const finish = {
                settlementResult,
                result,
                roundId: newRound.id,
                time: newRound.time,
            };

            // Settle bets - this handles the individual player's settlement
            await (this as any).settleBets(finish);
            
            // ✅ Single-player mode: Send round result to the individual player who placed the bet
            if (this.currentPlayerInfo?.nickname) {
                await this.publishRoundResultToPlayer(result, settlementResult, roundId, this.currentPlayerInfo.nickname);
            }
            
            // Reset player data for next round if player info is available
            if (this.currentPlayerInfo?.nickname) {
                this.resetForNextRound(this.currentPlayerInfo.nickname);
                console.log(`Reset player data for next round: ${this.currentPlayerInfo.nickname}`);
            }
        }
    }
    
    /**
     * Send round result to individual player (single-player mode)
     * Uses sc-game-base's existing publishToUser method
     */
    private async publishRoundResultToPlayer(result: Result, settlementResult: any, roundId: number, playerNickname: string): Promise<void> {
        try {
            // Find the player's UID from gameData.ingame
            const playerData = this.gameData.ingame[playerNickname];
            if (!playerData || !playerData.uid) {
                console.warn(`Player ${playerNickname} not found in ingame data or missing UID`);
                return;
            }

            const playerUID = playerData.uid;
            const roundResult = (this as any).collectRoundResult(result, settlementResult, roundId);
            
            // Use the same payload structure as publishRoundResult
            const payload = { finish: roundResult };
            
            // Add provably fair data if available (same as base implementation)
            if (this.gameData.pf) {
                payload.finish.pf = (this as any).roundResultPublisher.getHashedResult?.() || {
                    ...this.gameData.pf,
                    roundId: roundId,
                    result: result
                };
            }

            // ✅ Use sc-game-base's existing publishToUser method
            (this as any).roundResultPublisher.publishToUser(playerUID, payload);
            console.log(`Round result sent to player ${playerNickname} (UID: ${playerUID}) for round ${roundId}`);
            
        } catch (error) {
            console.error(`Failed to send round result to player ${playerNickname}:`, error);
        }
    }

    /**
     * Reset player data for next round
     * Removes the player from ingame data after settlement
     */
    resetForNextRound(playerName: string): void {
        delete this.gameData.ingame[playerName];
    }
    
    /**
     * Override generateResult to use player's specified tunnel choices
     * instead of random values
     */
    generateResult(): Result {
        if (!this.currentPlayerSelections) {
            console.warn("No player tunnel selections available, using legacy random generation");
            return this.definition.generateResult();
        }
        
        if (!this.currentRoundId) {
            throw new Error('currentRoundId is required but not available');
        }
        
        console.log("gameData", this.gameData);
        
        console.log(`Generating result for round ${this.currentRoundId} with player tunnel selections`);
        
        // Generate result with player's specified tunnel choices and player info for admin settlement
        // Note: Don't clear selections here as settleRoundWithSelections handles cleanup
        return generateResult(
            this.currentPlayerSelections, 
            this.currentRoundId,
            this.gameData,
            this.currentPlayerInfo?.nickname
        );
    }
}
