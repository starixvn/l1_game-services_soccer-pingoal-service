// Import types
import type { VideoConfigurationMap } from "./types/game-config";

// Import TypeScript configurations
import videos from "./gamedata/summary.json" assert { type: "json" };

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

// Game outcome probabilities for bet result determination (V3 - Tunnel-Specific)
// Flat structure with all 90 keys (30 tunnels × 3 outcomes)
// Each key format: r{1-6}b{1-6}_{red|blue|draw} (lowercase for Admin camelCase compatibility)
export const BET_CHOICE_RATE = {
    r1b2_red: 0.546,
    r1b2_blue: 0.4,
    r1b2_draw: 0.054,
    r1b3_red: 0.408,
    r1b3_blue: 0.532,
    r1b3_draw: 0.06,
    r1b4_red: 0.486,
    r1b4_blue: 0.439,
    r1b4_draw: 0.075,
    r1b5_red: 0.419,
    r1b5_blue: 0.508,
    r1b5_draw: 0.073,
    r1b6_red: 0.453,
    r1b6_blue: 0.433,
    r1b6_draw: 0.114,
    r2b1_red: 0.473,
    r2b1_blue: 0.473,
    r2b1_draw: 0.054,
    r2b3_red: 0.539,
    r2b3_blue: 0.394,
    r2b3_draw: 0.067,
    r2b4_red: 0.398,
    r2b4_blue: 0.539,
    r2b4_draw: 0.063,
    r2b5_red: 0.51,
    r2b5_blue: 0.41,
    r2b5_draw: 0.08,
    r2b6_red: 0.416,
    r2b6_blue: 0.516,
    r2b6_draw: 0.068,
    r3b1_red: 0.464,
    r3b1_blue: 0.446,
    r3b1_draw: 0.09,
    r3b2_red: 0.475,
    r3b2_blue: 0.475,
    r3b2_draw: 0.05,
    r3b4_red: 0.54,
    r3b4_blue: 0.399,
    r3b4_draw: 0.061,
    r3b5_red: 0.393,
    r3b5_blue: 0.541,
    r3b5_draw: 0.066,
    r3b6_red: 0.503,
    r3b6_blue: 0.41,
    r3b6_draw: 0.087,
    r4b1_red: 0.436,
    r4b1_blue: 0.478,
    r4b1_draw: 0.086,
    r4b2_red: 0.458,
    r4b2_blue: 0.449,
    r4b2_draw: 0.093,
    r4b3_red: 0.48,
    r4b3_blue: 0.471,
    r4b3_draw: 0.049,
    r4b5_red: 0.541,
    r4b5_blue: 0.402,
    r4b5_draw: 0.057,
    r4b6_red: 0.41,
    r4b6_blue: 0.518,
    r4b6_draw: 0.072,
    r5b1_red: 0.501,
    r5b1_blue: 0.424,
    r5b1_draw: 0.075,
    r5b2_red: 0.429,
    r5b2_blue: 0.488,
    r5b2_draw: 0.083,
    r5b3_red: 0.44,
    r5b3_blue: 0.45,
    r5b3_draw: 0.11,
    r5b4_red: 0.47,
    r5b4_blue: 0.484,
    r5b4_draw: 0.046,
    r5b6_red: 0.524,
    r5b6_blue: 0.421,
    r5b6_draw: 0.055,
    r6b1_red: 0.396,
    r6b1_blue: 0.536,
    r6b1_draw: 0.068,
    r6b2_red: 0.508,
    r6b2_blue: 0.423,
    r6b2_draw: 0.069,
    r6b3_red: 0.423,
    r6b3_blue: 0.493,
    r6b3_draw: 0.084,
    r6b4_red: 0.442,
    r6b4_blue: 0.455,
    r6b4_draw: 0.103,
    r6b5_red: 0.477,
    r6b5_blue: 0.475,
    r6b5_draw: 0.048,
} as const;

// Helper type for outcomes
export type Outcome = 'red' | 'blue' | 'draw';

/**
 * Helper function to get bet choice rate by tunnel and outcome
 * @param tunnelKey - Tunnel combination (e.g., "R1B2")
 * @param outcome - Bet outcome ("red", "blue", or "draw")
 * @returns Probability rate for the specific tunnel and outcome
 */
export const getBetChoiceRate = (tunnelKey: string, outcome: Outcome): number => {
    const key = `${tunnelKey}_${outcome}` as keyof typeof BET_CHOICE_RATE;
    const rate = BET_CHOICE_RATE[key];
    
    if (rate === undefined) {
        throw new Error(`Bet choice rate not found for ${key}`);
    }
    
    return rate;
};

/**
 * Configuration mapping for default number of videos per race track combination.
 * Each key represents a race track type (R1B2, R1B3, etc.) and maps to
 * a configuration object containing race result patterns and their video counts.
 *
 * @example
 * // Access R1B2 configuration
 * const r1b2Videos = DEFAULT_NUMBER_OF_VIDEOS["R1B2"]["R10B10"]; // returns 1
 */
export const DEFAULT_NUMBER_OF_VIDEOS: VideoConfigurationMap = videos as Record<string, Record<string, number>>;
