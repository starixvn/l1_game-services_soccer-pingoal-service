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
// Each key format: R{1-6}B{1-6}_{red|blue|draw}
export const BET_CHOICE_RATE = {
    R1B2_red: 0.45,
    R1B2_blue: 0.45,
    R1B2_draw: 0.10,
    R1B3_red: 0.44,
    R1B3_blue: 0.46,
    R1B3_draw: 0.10,
    R1B4_red: 0.46,
    R1B4_blue: 0.44,
    R1B4_draw: 0.10,
    R1B5_red: 0.43,
    R1B5_blue: 0.47,
    R1B5_draw: 0.10,
    R1B6_red: 0.45,
    R1B6_blue: 0.45,
    R1B6_draw: 0.10,
    R2B1_red: 0.47,
    R2B1_blue: 0.43,
    R2B1_draw: 0.10,
    R2B3_red: 0.45,
    R2B3_blue: 0.45,
    R2B3_draw: 0.10,
    R2B4_red: 0.44,
    R2B4_blue: 0.46,
    R2B4_draw: 0.10,
    R2B5_red: 0.46,
    R2B5_blue: 0.44,
    R2B5_draw: 0.10,
    R2B6_red: 0.45,
    R2B6_blue: 0.45,
    R2B6_draw: 0.10,
    R3B1_red: 0.46,
    R3B1_blue: 0.44,
    R3B1_draw: 0.10,
    R3B2_red: 0.45,
    R3B2_blue: 0.45,
    R3B2_draw: 0.10,
    R3B4_red: 0.44,
    R3B4_blue: 0.46,
    R3B4_draw: 0.10,
    R3B5_red: 0.47,
    R3B5_blue: 0.43,
    R3B5_draw: 0.10,
    R3B6_red: 0.45,
    R3B6_blue: 0.45,
    R3B6_draw: 0.10,
    R4B1_red: 0.44,
    R4B1_blue: 0.46,
    R4B1_draw: 0.10,
    R4B2_red: 0.46,
    R4B2_blue: 0.44,
    R4B2_draw: 0.10,
    R4B3_red: 0.46,
    R4B3_blue: 0.44,
    R4B3_draw: 0.10,
    R4B5_red: 0.45,
    R4B5_blue: 0.45,
    R4B5_draw: 0.10,
    R4B6_red: 0.44,
    R4B6_blue: 0.46,
    R4B6_draw: 0.10,
    R5B1_red: 0.47,
    R5B1_blue: 0.43,
    R5B1_draw: 0.10,
    R5B2_red: 0.46,
    R5B2_blue: 0.44,
    R5B2_draw: 0.10,
    R5B3_red: 0.44,
    R5B3_blue: 0.46,
    R5B3_draw: 0.10,
    R5B4_red: 0.45,
    R5B4_blue: 0.45,
    R5B4_draw: 0.10,
    R5B6_red: 0.45,
    R5B6_blue: 0.45,
    R5B6_draw: 0.10,
    R6B1_red: 0.46,
    R6B1_blue: 0.44,
    R6B1_draw: 0.10,
    R6B2_red: 0.45,
    R6B2_blue: 0.45,
    R6B2_draw: 0.10,
    R6B3_red: 0.45,
    R6B3_blue: 0.45,
    R6B3_draw: 0.10,
    R6B4_red: 0.46,
    R6B4_blue: 0.44,
    R6B4_draw: 0.10,
    R6B5_red: 0.45,
    R6B5_blue: 0.45,
    R6B5_draw: 0.10,
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
