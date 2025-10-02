/**
 * Recommend library for random is: sc-core-rng
 *
 * import { secureWeightedPick, secureRandomRange } from "sc-core-rng";
 *
 * For hashing, encrypting, decrypting use: crypto
 *
 * import crypto from "crypto";
 */

import { secureWeightedPick, secureRandomRange, securePickOne } from "sc-core-rng";
import crypto from "crypto";
import { Result } from "../models/rounds";
import * as constants from "../constants";
import { logger } from "sc-common";

// Type alias for game outcomes - using BET_CHOICES for consistency
type GameOutcome = keyof typeof constants.BET_CHOICES;

// Interface for player's tunnel selections
interface PlayerTunnelSelections {
    redTunnel: number;   // Player's specified red tunnel choice (1-6)
    blueTunnel: number;  // Player's specified blue tunnel choice (1-6)
}



/**
 * Determines game outcome using BET_CHOICE_RATE probabilities
 */
const selectGameOutcome = (): GameOutcome => {
    const outcomes: GameOutcome[] = Object.values(constants.BET_CHOICES) as GameOutcome[];
    const weights = outcomes.map(outcome => constants.BET_CHOICE_RATE[outcome]);
    
    const selectedOutcome = secureWeightedPick(outcomes, weights) as GameOutcome;
    console.log(`Selected game outcome: ${selectedOutcome} (red:${constants.BET_CHOICE_RATE.red}, blue:${constants.BET_CHOICE_RATE.blue}, draw:${constants.BET_CHOICE_RATE.draw})`);
    
    return selectedOutcome;
};

/**
 * Classifies score key by outcome type
 */
export const classifyScore = (scoreKey: string): GameOutcome | null => {
    const match = scoreKey.match(/^R(\d+)B(\d+)$/);
    if (!match) {
        return null;
    }
    
    const red = parseInt(match[1], 10);
    const blue = parseInt(match[2], 10);
    
    if (red > blue) {
        return 'red';
    }
    if (blue > red) {
        return 'blue';
    }
    return 'draw';
};

/**
 * Filters available scores by desired outcome
 */
const filterScoresByOutcome = (availableScores: Record<string, number>, targetOutcome: GameOutcome): string[] => {
    const scoreKeys = Object.keys(availableScores);
    const validScores = scoreKeys.filter(scoreKey => {
        const outcome = classifyScore(scoreKey);
        return outcome === targetOutcome;
    });
    
    console.log(`Available scores for ${targetOutcome} outcome: ${validScores.length} out of ${scoreKeys.length} total`);
    console.log(`Valid ${targetOutcome} scores: ${validScores.join(', ')}`);
    
    return validScores;
};

/**
 * Generates game score based on two-stage selection process
 */
const generateScoreFromOutcome = (tunnelKey: string): { redScore: number, blueScore: number, selectedScoreKey: string } => {
    // Get available scores for this tunnel combination
    const availableScores = constants.DEFAULT_NUMBER_OF_VIDEOS?.[tunnelKey];
    
    if (!availableScores) {
        throw new Error(`No video configuration found for tunnel: ${tunnelKey}`);
    }
    
    // Stage 1: Select game outcome using BET_CHOICE_RATE
    const selectedOutcome = selectGameOutcome();
    
    // Stage 2: Filter scores by selected outcome
    const validScores = filterScoresByOutcome(availableScores, selectedOutcome);
    
    if (validScores.length === 0) {
        throw new Error(`No valid scores found for ${tunnelKey} with outcome: ${selectedOutcome}`);
    }
    
    // Stage 3: Randomly select one valid score
    const selectedScoreKey = securePickOne(validScores);
    
    // Parse the selected score key (e.g., "R13B12" -> red=13, blue=12)
    const scoreMatch = selectedScoreKey.match(/^R(\d+)B(\d+)$/);
    if (!scoreMatch) {
        throw new Error(`Invalid score key format: ${selectedScoreKey}. Expected format: R{number}B{number}`);
    }
    
    const redScore = parseInt(scoreMatch[1], 10);
    const blueScore = parseInt(scoreMatch[2], 10);
    
    console.log(`Selected score for ${tunnelKey}: ${selectedScoreKey} (Red=${redScore}, Blue=${blueScore}) [${selectedOutcome} outcome]`);
    
    return { redScore, blueScore, selectedScoreKey };
};

/**
 * Generates video index based on available video count
 */
const generateVideoIndex = (tunnelKey: string, selectedScoreKey: string): number => {
    // Get video count configuration
    const tunnelVideos = constants.DEFAULT_NUMBER_OF_VIDEOS?.[tunnelKey];
    if (!tunnelVideos || !tunnelVideos[selectedScoreKey]) {
        console.warn(`No video count configuration for ${tunnelKey}:${selectedScoreKey}, using default index 0`);
        return 0;
    }
    
    const videoCount = tunnelVideos[selectedScoreKey];
    if (videoCount <= 1) {
        return 0; // Only one video available
    }
    
    // Randomly select from available video indices (0 to count-1)
    const videoIndex = secureRandomRange(0, videoCount - 1);
    console.log(`Selected video index for ${tunnelKey}:${selectedScoreKey}: ${videoIndex} (out of ${videoCount} available)`);
    
    return videoIndex;
};

/**
 * Generates tunnel key from player selections
 */
const generateTunnelKey = (playerSelections: PlayerTunnelSelections): string => {
    return `R${playerSelections.redTunnel}B${playerSelections.blueTunnel}`;
};

/**
 * Generates video name hash from tunnel and score information
 */
const generateVideoName = (playerSelections: PlayerTunnelSelections, redScore: number, blueScore: number, videoIndex: number): string => {
    const rawVideoName = `R${playerSelections.redTunnel}B${playerSelections.blueTunnel}-R${redScore}B${blueScore}-${videoIndex}`;
    const videoName = crypto.createHash("sha256").update(`${rawVideoName}`).digest("hex");
    return `${videoName}.m3u8`;
};

/**
 * Creates Result object with given scores and player selections
 */
const createResult = (playerSelections: PlayerTunnelSelections, redScore: number, blueScore: number, video: string): Result => {
    return {
        red: redScore,
        blue: blueScore,
        redTunnel: playerSelections.redTunnel,
        blueTunnel: playerSelections.blueTunnel,
        video: video,
    };
};

/**
 * Generates complete result from scores - common logic for both admin and normal settlement
 */
export const generateCompleteResult = (
    playerSelections: PlayerTunnelSelections, 
    redScore: number, 
    blueScore: number, 
    selectedScoreKey: string
): Result => {
    const tunnelKey = generateTunnelKey(playerSelections);
    const videoIndex = generateVideoIndex(tunnelKey, selectedScoreKey);
    const video = generateVideoName(playerSelections, redScore, blueScore, videoIndex);
    return createResult(playerSelections, redScore, blueScore, video);
};

export const generateResult = (playerSelections: PlayerTunnelSelections, roundId: number): Result => {
    const tunnelKey = generateTunnelKey(playerSelections);
    
    console.log(`Generating result for round ${roundId} with tunnel combination: ${tunnelKey}`);
    
    // Use probability-based selection
    const scoreResult = generateScoreFromOutcome(tunnelKey);
    const redScore = scoreResult.redScore;
    const blueScore = scoreResult.blueScore;
    const selectedScoreKey = scoreResult.selectedScoreKey;
    
    // Generate complete result using unified logic
    return generateCompleteResult(playerSelections, redScore, blueScore, selectedScoreKey);
};

// ❌ DEPRECATED: This function should not be used in normal gameplay
// Tunnel values MUST come from player selections, not random generation
export const generateResultLegacy = (): Result => {
    // Log error for debugging - this indicates a system issue
    console.error("CRITICAL ERROR: generateResultLegacy called - tunnel values should come from player selections!");
    console.error("This suggests missing player tunnel selections in the betting flow.");
    
    // Return result with clearly invalid tunnel values to indicate error
    // These values should never be used in actual gameplay
    return {
        red: secureRandomRange(0, 3),    // Only scores should be random
        blue: secureRandomRange(0, 3),   // Only scores should be random  
        redTunnel: -1,                   // ❌ Invalid tunnel - indicates missing player data
        blueTunnel: -1,                  // ❌ Invalid tunnel - indicates missing player data
        video: "ERROR-missing-player-selections.mp4",
    };
};

export const getSettlementResult = (roundResult: Result): Record<string, boolean> => {
    return {
        blue: roundResult.blue > roundResult.red,
        red: roundResult.red > roundResult.blue,
        draw: roundResult.red === roundResult.blue,
    };
};

// Skip for this game
export const generateRawResultForHash = () => {};
