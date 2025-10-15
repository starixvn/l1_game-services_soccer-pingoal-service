import { Core, Table } from "sc-game-base";
import appConfigs from "./app-configs";
import ContainerRegistry from "./container-registry";
import GameDefinition from "./game-definition";
import gameSettings from "./game-settings";
import { resultHelper } from "./helpers";
import { validateAllConfigurations } from "./validators/config-validator";

const run = async () => {
    // Validate all configurations before starting the application
    validateAllConfigurations();
    
    const definition = new GameDefinition(
        gameSettings as any,
        resultHelper.generateResult,
        resultHelper.getSettlementResult,
        resultHelper.generateRawResultForHash
    );

    const gameData = new Table.TableGameData(gameSettings.durations.wholeRound);

    const container = new ContainerRegistry().register(appConfigs, definition, gameData);

    const app = new Core.BaseGameApp(gameSettings.name, appConfigs);

    await app.run();

    await app.startGame(container);
};

run();
