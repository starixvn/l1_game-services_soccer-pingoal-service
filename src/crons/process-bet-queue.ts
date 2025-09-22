import type { Socket } from "socket.io";

import { Core } from "sc-game-base";


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
     * Handle successful bet processing and immediate settlement
     * In single-player mode, each bet is settled independently and immediately
     */
    async handleSuccessBet(player: Player, balance: unknown, roundId: number, bet: BetPayload) {
        await super.handleSuccessBet(player, balance, roundId, bet);

        console.log(`Successful bet by ${player.profile.name} on round ${roundId}`);

        // For single-player style, each bet gets its own round and should be settled immediately
        try {
            // Pass player's specified tunnel choices and player info to settlement method (thread-safe)
            await this.settleGameRoundConsumer.settleRoundWithSelections(
                {
                    redTunnel: bet.redTunnel,
                    blueTunnel: bet.blueTunnel
                },
                {
                    nickname: player.profile.name
                }
            );
            console.log(`Settlement completed for round ${roundId} with player tunnel selections: red=${bet.redTunnel}, blue=${bet.blueTunnel}, player=${player.profile.name}`);
        } catch (error) {
            console.error(`Settlement failed for round ${roundId}:`, error);
            // Note: Settlement failure shouldn't affect the bet processing result
            // Consider implementing a retry mechanism or queuing system for failed settlements
        }
    }

    adjustOwnBets(playerName: string, bet: BetPayload): void {
        const { betChoice, amount, redTunnel, blueTunnel } = bet;

        if (this.gameData.ingame?.[playerName]) {
            const playerInGame = this.gameData.ingame[playerName];

            if (!playerInGame.ownBets) {
                playerInGame.ownBets = {};
            }

            // Store bet amount by choice (overwrite for soccerpingoal - one bet per round)
            playerInGame.ownBets[betChoice] = amount;
            
            // Store tunnel selections for this player (latest bet overwrites previous selections)
            if (!playerInGame.tunnelSelections) {
                playerInGame.tunnelSelections = {};
            }
            
            playerInGame.tunnelSelections = {
                redTunnel,
                blueTunnel,
                lastUpdated: new Date()
            };
        }
    }

}
