import { asValue, AwilixContainer } from "awilix";
import { Table } from "sc-game-base";
import { betLogs, bets, tmpBets, rounds } from "./models";

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
}
