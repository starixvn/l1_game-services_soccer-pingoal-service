import type { Socket } from "socket.io";

import { Core } from "sc-game-base";

import { getOrDefault, callAndForget } from "sc-game-base/src/core/game-management-api";
import { SettleGameRoundConsumer } from "../event-consumers";

interface BetPayload {
    amount: number;
    betChoice: string;
    freeBet: boolean;
    roundId: number; // This property for multiple-players game only
    mode: string;
    receivedTime: Date;
    redTunnel: number;
    blueTunnel: number;
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
    private settleGameRoundConsumer: SettleGameRoundConsumer;

    constructor(dependencies: any) {
        super(dependencies);
        this.settleGameRoundConsumer = dependencies.settleGameRoundConsumer;
    }

    async handleSuccessBet(player: Player, balance: unknown, roundId: number, bet: BetPayload) {
        await super.handleSuccessBet(player, balance, roundId, bet);


        // Call settlement consumer after successful bet processing
        try {
            await this.settleGameRoundConsumer.settleRound();
            console.log(`Settlement completed for round ${roundId}`);
        } catch (error) {
            console.error(`Settlement failed for round ${roundId}:`, error);
            // Note: Settlement failure shouldn't affect the bet processing result
            // Consider implementing a retry mechanism or queuing system for failed settlements
        }
    }
}
