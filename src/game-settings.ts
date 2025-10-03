import { BET_CHOICES, BET_CHOICE_ENUM } from "./constants";

export default {
    id: 156,
    name: "SoccerPingoal",
    configName: "soccerpingoal",
    durations: {
        wholeRound: 60,
    },
    choices: Object.values(BET_CHOICES),
    choicesMapper: BET_CHOICE_ENUM,
    hedgeBetGroups: [], // No hedge bet restrictions - each bet is independent
    provablyFair: false,
    historyPageSize: 12,
    defaultBetTracks: {},
    botSettings: {
        ratio: { mainOpts: 80, subOpts: 20 },
        mainOpts: [BET_CHOICES.blue, BET_CHOICES.red],
        subOpts: [BET_CHOICES.draw],
    },
};
