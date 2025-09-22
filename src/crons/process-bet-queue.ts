import type { Socket } from "socket.io";

import { Core } from "sc-game-base";

//import { getOrDefault, callAndForget } from "sc-game-base/src/core/game-management-api";
import SettleGameRoundConsumer from "../event-consumers/settle-game-round-consumer";

interface BetPayload {
    amount: number;
    betChoice: string;
    freeBet: boolean;
    roundId: number; // Unique round ID for each bet in single-player mode
    mode: string;
    receivedTime: Date;
    redTunnel: number;    // Player's specified red tunnel choice (1-6)
    blueTunnel: number;   // Player's specified blue tunnel choice (1-6)
}

interface Player {
    UID: string;
    profile: {
        name: string;
        minBet: number;
        maxBet: number;
    };
    socketClient: Socket;
    session: Record<string, string | number | boolean>;
}

export default class ProcessBetQueue extends Core.Crons.ProcessBetQueue {
    private readonly settleGameRoundConsumer: SettleGameRoundConsumer;
    private readonly roundsRepository: any; // Reference to rounds repository

    constructor(dependencies: any) {
        super(dependencies);
        this.settleGameRoundConsumer = dependencies.settleGameRoundConsumer;
        this.roundsRepository = dependencies.roundsRepository;
    }

    /**
     * Generate a new unique roundId for each bet (single-player style)
     * Each bet gets its own round ID, allowing concurrent independent betting
     */
    private async generateNewRoundId(): Promise<number> {
        // Get the latest round from database
        const lastRound = await this.roundsRepository
            .findOne({}, "id", { sort: { id: -1 } })
            .lean()
            .exec();
        
        if (lastRound) {
            // Increment from the latest database round ID
            const newRoundId = lastRound.id + 1;
            this.gameData.roundId = newRoundId;
            console.log(`Generated new round ID: ${newRoundId}`);
            return newRoundId;
        } else {
            // If no rounds exist, increment from current gameData
            this.gameData.roundId += 1;
            console.log(`Generated new round ID: ${this.gameData.roundId}`);
            return this.gameData.roundId;
        }
    }

    /**
     * Get a new unique round ID for each bet
     * Used when you need a fresh round ID for betting operations
     */
    async getNewRoundForBetting(): Promise<number> {
        return this.generateNewRoundId();
    }

    /**
     * Public method to be called before processing any bet to ensure unique roundId
     * Prepares a new round ID and logs the preparation for tracking purposes
     */
    async prepareNewRoundForBet(): Promise<number> {
        const newRoundId = await this.generateNewRoundId();
        console.log(`Prepared new round ID: ${newRoundId} for incoming bet`);
        return newRoundId;
    }

    /**
     * Handle successful bet processing and immediate settlement
     * In single-player mode, each bet is settled independently and immediately
     */
    async handleSuccessBet(player: Player, balance: unknown, roundId: number, bet: BetPayload) {
        await super.handleSuccessBet(player, balance, roundId, bet);

        console.log(`Successful bet by ${player.profile.name} on round ${roundId}`);

        // For single-player style, each bet gets its own round and should be settled immediately
        try {
            // Pass player's specified tunnel choices to settlement consumer
            this.settleGameRoundConsumer.setPlayerTunnelSelections({
                redTunnel: bet.redTunnel,
                blueTunnel: bet.blueTunnel
            });
            
            await this.settleGameRoundConsumer.settleRound();
            console.log(`Settlement completed for round ${roundId} with player tunnel selections: red=${bet.redTunnel}, blue=${bet.blueTunnel}`);
        } catch (error) {
            console.error(`Settlement failed for round ${roundId}:`, error);
            // Note: Settlement failure shouldn't affect the bet processing result
            // Consider implementing a retry mechanism or queuing system for failed settlements
        }
    }

}
