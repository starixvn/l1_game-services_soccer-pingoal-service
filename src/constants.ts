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
    r1b2_red: 0.45,
    r1b2_blue: 0.45,
    r1b2_draw: 0.10,
    r1b3_red: 0.44,
    r1b3_blue: 0.46,
    r1b3_draw: 0.10,
    r1b4_red: 0.46,
    r1b4_blue: 0.44,
    r1b4_draw: 0.10,
    r1b5_red: 0.43,
    r1b5_blue: 0.47,
    r1b5_draw: 0.10,
    r1b6_red: 0.45,
    r1b6_blue: 0.45,
    r1b6_draw: 0.10,
    r2b1_red: 0.47,
    r2b1_blue: 0.43,
    r2b1_draw: 0.10,
    r2b3_red: 0.45,
    r2b3_blue: 0.45,
    r2b3_draw: 0.10,
    r2b4_red: 0.44,
    r2b4_blue: 0.46,
    r2b4_draw: 0.10,
    r2b5_red: 0.46,
    r2b5_blue: 0.44,
    r2b5_draw: 0.10,
    r2b6_red: 0.45,
    r2b6_blue: 0.45,
    r2b6_draw: 0.10,
    r3b1_red: 0.46,
    r3b1_blue: 0.44,
    r3b1_draw: 0.10,
    r3b2_red: 0.45,
    r3b2_blue: 0.45,
    r3b2_draw: 0.10,
    r3b4_red: 0.44,
    r3b4_blue: 0.46,
    r3b4_draw: 0.10,
    r3b5_red: 0.47,
    r3b5_blue: 0.43,
    r3b5_draw: 0.10,
    r3b6_red: 0.45,
    r3b6_blue: 0.45,
    r3b6_draw: 0.10,
    r4b1_red: 0.44,
    r4b1_blue: 0.46,
    r4b1_draw: 0.10,
    r4b2_red: 0.46,
    r4b2_blue: 0.44,
    r4b2_draw: 0.10,
    r4b3_red: 0.46,
    r4b3_blue: 0.44,
    r4b3_draw: 0.10,
    r4b5_red: 0.45,
    r4b5_blue: 0.45,
    r4b5_draw: 0.10,
    r4b6_red: 0.44,
    r4b6_blue: 0.46,
    r4b6_draw: 0.10,
    r5b1_red: 0.47,
    r5b1_blue: 0.43,
    r5b1_draw: 0.10,
    r5b2_red: 0.46,
    r5b2_blue: 0.44,
    r5b2_draw: 0.10,
    r5b3_red: 0.44,
    r5b3_blue: 0.46,
    r5b3_draw: 0.10,
    r5b4_red: 0.45,
    r5b4_blue: 0.45,
    r5b4_draw: 0.10,
    r5b6_red: 0.45,
    r5b6_blue: 0.45,
    r5b6_draw: 0.10,
    r6b1_red: 0.46,
    r6b1_blue: 0.44,
    r6b1_draw: 0.10,
    r6b2_red: 0.45,
    r6b2_blue: 0.45,
    r6b2_draw: 0.10,
    r6b3_red: 0.45,
    r6b3_blue: 0.45,
    r6b3_draw: 0.10,
    r6b4_red: 0.46,
    r6b4_blue: 0.44,
    r6b4_draw: 0.10,
    r6b5_red: 0.45,
    r6b5_blue: 0.45,
    r6b5_draw: 0.10,
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
