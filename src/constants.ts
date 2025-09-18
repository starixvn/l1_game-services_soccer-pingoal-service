// Import types
import type { VideoConfigurationMap, RaceTrackConfig } from './types/game-config';

// Import JSON configurations using ES6 import syntax
import R1B2_CONFIG from '../configs/gamedata/r1b2.json';
import R1B3_CONFIG from '../configs/gamedata/r1b3.json';
import R1B4_CONFIG from '../configs/gamedata/r1b4.json';
import R1B5_CONFIG from '../configs/gamedata/r1b5.json';
import R1B6_CONFIG from '../configs/gamedata/r1b6.json';

// Type assertion to ensure JSON imports have correct type
const r1b2Config: RaceTrackConfig = R1B2_CONFIG;
const r1b3Config: RaceTrackConfig = R1B3_CONFIG;
const r1b4Config: RaceTrackConfig = R1B4_CONFIG;
const r1b5Config: RaceTrackConfig = R1B5_CONFIG;
const r1b6Config: RaceTrackConfig = R1B6_CONFIG;

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

/**
 * Configuration mapping for default number of videos per race track combination.
 * Each key represents a race track type (R1B2, R1B3, etc.) and maps to 
 * a configuration object containing race result patterns and their video counts.
 * 
 * @example
 * // Access R1B2 configuration
 * const r1b2Videos = DEFAULT_NUMBER_OF_VIDEOS["R1B2"]["R10B10"]; // returns 1
 */
//NOSONAR
export const DEFAULT_NUMBER_OF_VIDEOS: VideoConfigurationMap = {
    "R1B2": r1b2Config,
    "R1B3": r1b3Config,
    "R1B4": r1b4Config,
    "R1B5": r1b5Config,
    "R1B6": r1b6Config
} as const;