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
    private preAssignedRoundId: number | null = null;
    
    /**
     * Atomically get next available round ID to prevent race conditions
     * This method ensures thread-safe round ID generation for concurrent betting
     */
    private async getNextRoundIdAtomically(): Promise<number> {
        const roundsRepository = (this as any).roundsRepository;
        
        if (roundsRepository) {
            try {
                // Find the latest round by id in descending order
                const lastRound = await roundsRepository
                    .findOne({}, "id", { sort: { id: -1 } })
                    .lean()
                    .exec();
                
                if (lastRound) {
                    // Increment from the latest database round ID
                    const nextRoundId = lastRound.id + 1;
                    console.log(`Generated next round ID: ${nextRoundId} (from database max: ${lastRound.id})`);
                    return nextRoundId;
                } else {
                    // If no rounds exist, start from 1
                    console.log(`No existing rounds found, starting from round ID: 1`);
                    return 1;
                }
            } catch (error) {
                console.error(`Atomic round ID generation failed: ${error}`);
                throw new Error('Failed to generate round ID');
            }
        }
        
        throw new Error('roundsRepository not available');
    }
    
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
     * Settle a round with specific tunnel selections and player info (thread-safe)
     * This method avoids race conditions by pre-assigning roundId before settlement
     */
    async settleRoundWithSelections(selections: PlayerTunnelSelections, playerInfo?: PlayerInfo): Promise<void> {
        // First, atomically get the next round ID to prevent race conditions
        const assignedRoundId = await this.getNextRoundIdAtomically();
        
        console.log(`Starting settlement for pre-assigned round ${assignedRoundId} with tunnel selections: red=${selections.redTunnel}, blue=${selections.blueTunnel}, player=${playerInfo?.nickname || 'unknown'}`);
        
        // Temporarily set selections, player info, and pre-assigned round ID
        this.currentPlayerSelections = selections;
        this.currentPlayerInfo = playerInfo || null;
        this.preAssignedRoundId = assignedRoundId;
        
        // Update gameData.roundId to the pre-assigned value
        const originalRoundId = this.gameData.roundId;
        this.gameData.roundId = assignedRoundId;
        
        try {
            // Call our overridden settleRound method
            await this.settleRound();
            console.log(`Successfully settled round ${assignedRoundId}`);
        } catch (error) {
            // If settlement fails, restore original roundId
            this.gameData.roundId = originalRoundId;
         
            throw error;
        } finally {
            // Always clean up state after settlement
            this.currentPlayerSelections = null;
            this.currentPlayerInfo = null;
            this.preAssignedRoundId = null;
        }
    }
    
    /**
     * Override settleRound to prevent race conditions in roundId management
     * This version uses pre-assigned roundId instead of auto-incrementing
     */
    async settleRound(): Promise<void> {
        const result = this.generateResult();
        const settlementResult = (this.definition as any).settle(result);
        const { roundId, exchangeRates } = this.gameData;
        
        // Validate required fields before creating round
        if (!roundId) {
            throw new Error('roundId is required but not available');
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
            // Publish round result
            (this as any).roundResultPublisher.publishRoundResult(
                (this as any).collectRoundResult(result, settlementResult, roundId)
            );

            const finish = {
                settlementResult,
                result,
                roundId: newRound.id,
                time: newRound.time,
            };

            // ⚠️ CRITICAL DIFFERENCE: We DON'T increment roundId here
            // The roundId increment is handled externally by settleRoundWithSelections
            // This prevents race conditions in multi-player scenarios
            
            console.log(`Round ${roundId} settled successfully, NOT auto-incrementing roundId to prevent race conditions`);

            // Settle bets
            await (this as any).settleBets(finish);

            // Publish winners
            (this as any).roundResultPublisher.publishWinners(roundId, this.gameData.winningPlayers);
        }
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
        
        console.log("gameData", this.gameData);
        
        console.log(`Generating result for round ${this.gameData.roundId} with player tunnel selections`);
        
        // Generate result with player's specified tunnel choices and player info for admin settlement
        // Note: Don't clear selections here as settleRoundWithSelections handles cleanup
        return generateResult(
            this.currentPlayerSelections, 
            this.gameData.roundId,
            this.gameData,
            this.currentPlayerInfo?.nickname
        );
    }
}
