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
    UID: string;         // Player's UID for targeted publishing
}

export default class SettleGameRoundConsumer extends Core.BaseEventConsumers.SettleGameRoundConsumer {
   
    
    /**
     * Settle a round with specific tunnel selections, player info, and roundId (thread-safe)
     * This method uses the roundId generated when the player placed their bet
     */
    async settleRoundWithSelections(selections: PlayerTunnelSelections, roundId: number, playerInfo?: PlayerInfo): Promise<void> {
        
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
        const newRound = await (this as any).roundsRepository.create({
            id: roundId,
            result,
            settlementResult,
            time: new Date(),
            exchangeRateId: exchangeRates.exId,
        });

        if (newRound) {
            // ✅ Create finish object with all result data
            const finish = {
                settlementResult,
                result,
                roundId: newRound.id,
                time: newRound.time,
            };
            
            // ✅ Publish finish object to specific player (single-player game)
            if (playerInfo?.UID) {
                (this as any).roundResultPublisher.publishToUser(playerInfo.UID, finish);
            } 
            
            // Settle bets - this handles the individual player's settlement
            await (this as any).settleBets(finish);        
               
            // Reset player data for next round if player info is available
            if (playerInfo?.nickname) {
                this.resetForNextRound(playerInfo.nickname);              
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

        
        // Generate result with player's specified tunnel choices and player info for admin settlement
        return generateResult(
            selections, 
            roundId,
            this.gameData,
            playerInfo?.nickname
        );
    }
    
   }
