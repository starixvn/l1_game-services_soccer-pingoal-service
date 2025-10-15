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
    redTunnel: number; // Player's specified red tunnel choice (1-6)
    blueTunnel: number; // Player's specified blue tunnel choice (1-6)
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
    // Note: roundsRepository dependency removed - roundId now managed in PlaceBetConsumer

    constructor(dependencies: any) {
        super(dependencies);
        this.settleGameRoundConsumer = dependencies.settleGameRoundConsumer;
        // Removed roundsRepository initialization as we no longer query database for roundId
    }

    override composeBettingTimeValidationCriteria() {
        return [];
    }

    /**
     * Handle successful bet processing and immediate settlement
     * In single-player mode, each bet is settled independently and immediately
     * roundId is already assigned by PlaceBetConsumer when request was received
     */
    override async handleSuccessBet(player: Player, balance: unknown, roundId: number, bet: BetPayload) {
        await super.handleSuccessBet(player, balance, roundId, bet);

        // For single-player style, each bet gets its own round and should be settled immediately
        try {
            // Pass player's specified tunnel choices, roundId from bet payload, and player info to settlement method (thread-safe)
            await this.settleGameRoundConsumer.settleRoundWithSelections(
                {
                    redTunnel: bet.redTunnel,
                    blueTunnel: bet.blueTunnel,
                },
                bet.roundId, // Use the roundId generated when player placed their bet
                {
                    nickname: player.profile.name,
                    UID: player.UID,
                }
            );
        } catch (error) {
            console.error(`Settlement failed for round ${roundId}:`, error);
            // Note: Settlement failure shouldn't affect the bet processing result
            // Consider implementing a retry mechanism or queuing system for failed settlements
        }
    }
}
