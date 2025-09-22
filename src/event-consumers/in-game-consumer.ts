import { Core } from "sc-game-base";
import appConfigs from "../app-configs";

interface Player {
    UID: string;
    profile: {
        name: string;
        minBet?: number;
        maxBet?: number;
    };
    session: {
        playerId: string;
        playerName: string;
        currencyCode: string;
        currencyGroupId: string;
        multiplier: number;
        operatorId: string;
        system: string;
    };
    socketClient: any;
    promotion?: any;
    promotionTOProgress?: any;
}
/**
 * Task List
 * 1. Query round history by player id, because this game is not support multiple players in one round
 * 2. remove remainingTime from payload
 */

export default class InGameConsumer extends Core.BaseEventConsumers.InGameConsumer {

    async consume(realPlayer: Player) {
        console.log("consume", realPlayer);
        const { gameConfigs } = this.gameData;
        const disabled = !gameConfigs || !gameConfigs.enabled || this.gameData.delayStartTime > 0;
        realPlayer.socketClient.emit(this.definition.name, { um: disabled, um_message: this.gameData.umMessages });

        const payload = await this.buildPayload(realPlayer);
        this.publisher.publishToUser(realPlayer.UID, payload);
    }

    // @ts-expect-error Intentionally omitting roundId from payload
    override async buildPayload(realPlayer: Player) {
        const user = await this.getUserInfo(realPlayer);
        const { odds } = this.gameData.gameConfigs;
        const { exchangeRates } = this.gameData;
        const { session } = realPlayer;
        const rate = exchangeRates.code[session.currencyCode] * session.multiplier;
        const settings = this.gameData.currencyGroupGames.find((x) => x.groupId.toString() === session.currencyGroupId);
        const gameConfigs = { ...settings, odds };
        const roundHistory = await this.roundQuery.getList(
            this.definition.numberOfRoundHistory,
            realPlayer.session.playerId
        );
        const liveStreamServer = appConfigs.liveStreamServer;

        return {
            gameConfigs,
            roundHistory,
            user: { ...user, rate },
            liveStreamServer,
        };
    }
}
