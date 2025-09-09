import { TableGameDefinition } from "sc-game-base/src/table";
export default class GameDefinition extends TableGameDefinition {
    constructor(gameSettings: GameSettings, generateResult: Function, settle: Function, generateRawResultForHash: Function) {
        super(
            {
                ...gameSettings,
                durations: {
                    ...gameSettings.durations,
                    placingBets: gameSettings.durations.placingBetsFirstHalf,
                    lockingBet: gameSettings.durations.lockingBetFirstHalf,
                },
            },
            generateResult,
            settle,
            generateRawResultForHash
        );
    }
}

export type GameSettings = {
    id: number;
    name: string;
    configName: string;
    durations: any;
    provablyFair?: boolean;
    choices: string[];
    choicesMapper: any;
    hedgeBetGroups: any[];
    numberOfRoundHistory: number;
    historyPageSize: number;
};
