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
   
    
    /**
     * Settle a round with specific tunnel selections, player info, and roundId (thread-safe)
     * This method uses the roundId generated when the player placed their bet
     */
    async settleRoundWithSelections(selections: PlayerTunnelSelections, roundId: number, playerInfo?: PlayerInfo): Promise<void> {
        console.log(`Starting settlement with tunnel selections: red=${selections.redTunnel}, blue=${selections.blueTunnel}, roundId=${roundId}, player=${playerInfo?.nickname || 'unknown'}`);
        
        // Call our private thread-safe settleRound method with all parameters
        await this.settleRoundWithId(selections, roundId, playerInfo);
    }
    
    /**
     * Private method to settle round with specific parameters (thread-safe)
     */
    private async settleRoundWithId(selections: PlayerTunnelSelections, roundId: number, playerInfo?: PlayerInfo): Promise<void> {
        const result = this.generateResultWithId(selections, roundId, playerInfo);
        const settlementResult = (this.definition as any).settle(result);
        const { exchangeRates } = this.gameData;
        
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
            // ✅ Always publish round result first (same as base implementation)
            (this as any).roundResultPublisher.publishRoundResult(this.collectRoundResult(result, settlementResult, roundId));

            const finish = {
                settlementResult,
                result,
                roundId: newRound.id,
                time: newRound.time,
            };

            // Settle bets - this handles the individual player's settlement
            await (this as any).settleBets(finish);
            
            // ✅ Base implementation handles result publishing automatically
            // No need for additional single-player mode since queue ensures sequential processing
            
            // Reset player data for next round if player info is available
            if (playerInfo?.nickname) {
                this.resetForNextRound(playerInfo.nickname);
                console.log(`Reset player data for next round: ${playerInfo.nickname}`);
            }
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
     * Private method to generate result with specific parameters (thread-safe)
     */
    private generateResultWithId(selections: PlayerTunnelSelections, roundId: number, playerInfo?: PlayerInfo): Result {
        console.log("gameData", this.gameData);
        console.log(`Generating result for round ${roundId} with player tunnel selections`);
        
        // Generate result with player's specified tunnel choices and player info for admin settlement
        return generateResult(
            selections, 
            roundId,
            this.gameData,
            playerInfo?.nickname
        );
    }
    
    /**
     * Override generateResult to use player's specified tunnel choices
     * This method is kept for compatibility but should not be used directly
     * @deprecated Use settleRoundWithSelections instead
     */
    override generateResult(): Result {
        console.warn("generateResult() called directly - this may cause race conditions. Use settleRoundWithSelections instead.");
        // This is a fallback - should not be used in production
        return this.definition.generateResult();
    }
    
    /**
     * Override settleRound - kept for compatibility but should not be used directly
     * @deprecated Use settleRoundWithSelections instead
     */
    async settleRound(): Promise<void> {
        console.warn("settleRound() called directly - this may cause race conditions. Use settleRoundWithSelections instead.");
        // This is a fallback - should not be used in production
        throw new Error("Direct settleRound() calls are not supported. Use settleRoundWithSelections() instead.");
    }
    
    /**
     * Set player tunnel selections - kept for compatibility but should not be used directly
     * @deprecated Use settleRoundWithSelections instead
     */
    setPlayerTunnelSelections(selections: PlayerTunnelSelections): void {
        console.warn("setPlayerTunnelSelections is deprecated and not thread-safe. Use settleRoundWithSelections instead.");
        // This method is kept for compatibility but does nothing
        // The actual tunnel selections are now passed directly to settleRoundWithSelections
    }
}
