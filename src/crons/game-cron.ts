import { Core } from "sc-game-base";

export default class GameCron extends Core.Crons.BaseGameCron {
    async start() {
        await this.roundIdConsumer.initRoundId();

        // Set first round ID
        if (this.gameData.roundId === 1) {
            const firstRoundId = 6800;

            this.gameData.roundId = firstRoundId;
        }

        await this.getSettingForNewRound();
        await this.updateExchangeRates();
        this.startCron();
    }

    async proceed() {
        const { durations } = this.definition;

        if (this.gameData.remainingTime === durations.wholeRound) {
            await this.checkGameStatus();
        }

        if (!this.gameData.disabled) {
            this.gameData.remainingTime = this.gameData.remainingTime < 0 ? durations.wholeRound : this.gameData.remainingTime - 1;
        }
    }
}
