import { Core } from "sc-game-base";

interface Player {
    UID: string;
    profile: {
        name: string;
        minBet?: number;
        maxBet?: number;
    };
    session: {
        userId: string;
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
 */

export default class InGameConsumer extends Core.BaseEventConsumers.InGameConsumer {
    async consume(realPlayer: Player) {
        const { gameConfigs } = this.gameData;
        const disabled = !gameConfigs || !gameConfigs.enabled || this.gameData.delayStartTime > 0;

        realPlayer.socketClient.emit(this.definition.name, { um: disabled, um_message: this.gameData.umMessages });

        const payload = await this.buildPayload(realPlayer);

        this.publisher.publishToUser(realPlayer.UID, payload);
    }
}
