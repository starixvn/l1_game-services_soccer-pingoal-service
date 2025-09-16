import type { Socket } from "socket.io";

import { Core } from "sc-game-base";

import { getOrDefault, callAndForget } from "sc-game-base/src/core/game-management-api";

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
        //await super.handleSuccessBet(player, balance, roundId, bet);

        console.log("balance", balance);
        console.log("player", player);
        console.log("roundId", roundId);
        console.log("bet", bet);

        const rate = this.calculateCurrencyRate(player.session);

        // if (this.betLogsRepository) {
        //     await this.insertBetLog(player, roundId, bet, rate);
        // }

        await this.upsertBet(player, roundId, bet, rate);

        if (this.isCountOnTotalBets(player)) {
            this.adjustTotalBets(player, bet, rate);
        }

        this.adjustOwnBets(player.profile.name, bet);


        callAndForget(
            this.gameManagementApiClient.users.setBalanceAndDecreaseScoins({
                id: player.UID,
                balance: (balance as { red: number }).red,
                deductionscoins: 0,
            })
        );
        this.notifyPlacingBetResult(player, balance, bet, rate);


        if  (player.profile.minBet !== (balance as any).minBet || player.profile.maxBet !== (balance as any).maxBet) {
            this.updateUserStakeLevel(player, (balance as any).minBet, (balance as any).maxBet);
        }
    }
}
