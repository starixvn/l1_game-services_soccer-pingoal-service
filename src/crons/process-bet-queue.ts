import type { Socket } from "socket.io";

import { Core } from "sc-game-base";

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
    async handleSuccessBet(player: Player, balance: unknown, roundId: number, bet: BetPayload) {
        await super.handleSuccessBet(player, balance, roundId, bet);

        /**
         * TODO list
         * 1. Call settlement consumer
         */
    }
}
