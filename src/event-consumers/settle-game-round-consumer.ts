import { Core } from "sc-game-base";
import { generateResult, generateCompleteResult } from "../helpers/result-helper";
import { Result } from "../models/rounds";
import { logger } from "sc-common";

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
    redTunnel: number; // Player's specified red tunnel choice (1-6)
    blueTunnel: number; // Player's specified blue tunnel choice (1-6)
}

interface PlayerInfo {
    nickname: string; // Player's nickname for admin settlement matching
    UID: string; // Player's UID for targeted publishing
}

export default class SettleGameRoundConsumer extends Core.BaseEventConsumers.SettleGameRoundConsumer {
    private readonly logService: typeof logger;

    constructor(container: any) {
        super(container);
        this.logService = container.logService;
    }
    /**
     * Settle a round with specific tunnel selections, player info, and roundId (thread-safe)
     * This method uses the roundId generated when the player placed their bet
     */
    async settleRoundWithSelections(selections: PlayerTunnelSelections, roundId: number, playerInfo?: PlayerInfo): Promise<void> {
        // Call our private thread-safe settleRound method with all parameters
        await this.settleRoundWithId(selections, roundId, playerInfo);
    }


    //Private method to settle round with specific parameters (thread-safe)
    private async settleRoundWithId(selections: PlayerTunnelSelections, roundId: number, playerInfo?: PlayerInfo): Promise<void> {
        const { result, usedAdminSettlement } = this.generateResultWithId(selections, roundId, playerInfo);
        const settlementResult = (this.definition as any).settle(result);
        const { exchangeRates } = this.gameData;

        // Validate required fields before creating round
        if (!roundId) {
            this.logService.logError(`roundId is required but not available from bet payload`);
            throw new Error("roundId is required but not available from bet payload");
        }

        if (!exchangeRates || !exchangeRates.exId) {
            throw new Error("exchangeRates.exId is required but not available");
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
            const roundResult = {
                settlementResult,
                result,
                roundId: newRound.id,
                time: newRound.time,
            };

            // ✅ Publish finish object to specific player (single-player game)
            if (playerInfo?.UID) {
                (this as any).roundResultPublisher.publishToUser(playerInfo.UID, { finish: roundResult });
            }

            // Settle bets - this handles the individual player's settlement
            await (this as any).settleBets(roundResult);

            // Reset admin settlement data after successful settlement
            if (usedAdminSettlement) {
                this.resetAdminSettlementData();
            }

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

     //Generate result from admin settlement data
    private generateResultFromAdmin(selections: PlayerTunnelSelections, playerNickname: string): Result | null {
        const shouldUseAdminSettlement = this.gameData?.settlementResultFromAdmin?.result && 
                                       playerNickname && 
                                       this.gameData.settlementResultFromAdmin.result?.playerName === playerNickname;
        if (shouldUseAdminSettlement) {
            const adminResult = this.gameData.settlementResultFromAdmin.result;
            this.logService.logError(`Using admin settlement result for player ${playerNickname}: red=${adminResult.red}, blue=${adminResult.blue}`);
            
            // Use admin specified scores
            const redScore = adminResult.red;
            const blueScore = adminResult.blue;
            const selectedScoreKey = `R${redScore}B${blueScore}`;
            
            // Generate complete result using unified logic
            return generateCompleteResult(selections, redScore, blueScore, selectedScoreKey);
        }
        
        return null;
    }

    //Reset admin settlement data to prevent reuse
    private resetAdminSettlementData(): void {
        if (this.gameData?.settlementResultFromAdmin) {
            delete this.gameData.settlementResultFromAdmin;
        }
    }

    //Private method to generate result with specific parameters (thread-safe)
    private generateResultWithId(selections: PlayerTunnelSelections, roundId: number, playerInfo?: PlayerInfo): { result: Result, usedAdminSettlement: boolean } {
        // First try admin settlement if player info is available
        if (playerInfo?.nickname) {
            const adminResult = this.generateResultFromAdmin(selections, playerInfo.nickname);
            if (adminResult) {
                return { result: adminResult, usedAdminSettlement: true };
            }
        }
        // Fallback to normal result generation
        return { result: generateResult(selections, roundId), usedAdminSettlement: false };
    }
}
