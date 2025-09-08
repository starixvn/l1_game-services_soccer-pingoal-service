import appConfigs from "./app-configs";
import gameSettings from "./game-settings";
import { Core } from "sc-game-base";
import GameDefinition from "./game-definition";
import { Table } from "sc-game-base";

const run = async () => {
    const definition = new GameDefinition(
        gameSettings as any,
        () => {},
        () => {},
        () => {}
    );

    const gameData = new Table.TableGameData(gameSettings.durations.wholeRound);

    const container = new Table.TableContainerRegistry().register(appConfigs, definition, gameData);

    const app = new Core.BaseGameApp(gameSettings.name, appConfigs);

    await app.run();

    await app.startGame(container);
};

run();
