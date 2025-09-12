import { asClass, asValue, AwilixContainer } from "awilix";
import { Table } from "sc-game-base";
import { GameCron, ProcessBetQueue } from "./crons";
import { InGameConsumer, PlaceBetConsumer, SettleGameRoundConsumer } from "./event-consumers";
import { betLogs, bets, rounds, tmpBets } from "./models";

export default class ContainerRegistry extends Table.TableContainerRegistry {
    register(appConfigs: any, definition: any, gameData: any): AwilixContainer<any> {
        super.register(appConfigs, definition, gameData);

        return this.container;
    }

    registerModels() {
        super.registerModels();

        this.container.register({
            betsRepository: asValue(bets),
            tempBetsRepository: asValue(tmpBets),
            betLogsRepository: asValue(betLogs),
            roundsRepository: asValue(rounds),
        });
    }

    registerCrons(): void {
        super.registerCrons();

        this.container.register({
            gameCron: asClass(GameCron).singleton().proxy(),
            processBetQueue: asClass(ProcessBetQueue).singleton().proxy(),
        });
    }

    registerConsumers() {
        super.registerConsumers();

        this.container.register({
            inGameConsumer: asClass(InGameConsumer).singleton(),
            settleGameRoundConsumer: asClass(SettleGameRoundConsumer).singleton().proxy(),
            placeBetConsumer: asClass(PlaceBetConsumer).singleton(),
        });
    }
}
