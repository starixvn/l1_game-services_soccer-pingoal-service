import { R1B2_CONFIG } from './config/r1b2';
import { R1B3_CONFIG } from './config/r1b3';
import { R1B4_CONFIG } from './config/r1b4';
import { R1B5_CONFIG } from './config/r1b5';
import { R1B6_CONFIG } from './config/r1b6';

export const BET_CHOICES = {
    blue: "blue",
    red: "red",
    draw: "draw",
};

export const BET_CHOICE_ENUM = {
    [BET_CHOICES.blue]: 1,
    [BET_CHOICES.red]: 2,
    [BET_CHOICES.draw]: 3,
};

export const IS_DEV_ENV = process.env.NODE_ENV === "development";

export const GAME_NAME = "soccerpingoal";

export const MODEL_NAME_PREFIX = IS_DEV_ENV ? `${GAME_NAME}_dev` : `${GAME_NAME}`;

// Game outcome probabilities for bet result determination
export const BET_CHOICE_RATE = {
    red: 0.45,    // 45% chance red team wins (red score > blue score)
    blue: 0.45,   // 45% chance blue team wins (blue score > red score)  
    draw: 0.10    // 10% chance draw (red score === blue score)
} as const;

// Validate BET_CHOICE_RATE probabilities sum to 1.0
const totalBetChoiceRate = Object.values(BET_CHOICE_RATE).reduce((sum, rate) => sum + rate, 0);
if (Math.abs(totalBetChoiceRate - 1.0) > 0.001) {
    throw new Error(`BET_CHOICE_RATE probabilities must sum to 1.0, got: ${totalBetChoiceRate}`);
}

//NOSONAR
export const DEFAULT_NUMBER_OF_VIDEOS: Record<string, Record<string, number>> = {
    "R1B2": R1B2_CONFIG,
    "R1B3": R1B3_CONFIG,
    "R1B4": R1B4_CONFIG,
    "R1B5": R1B5_CONFIG,
    "R1B6": R1B6_CONFIG
};