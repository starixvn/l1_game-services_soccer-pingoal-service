/**
 * Recommend library for random is: sc-core-rng
 *
 * import { secureShuffle, secureWeightedPick, secureRandomRange } from "sc-core-rng";
 *
 * For hashing, encrypting, decrypting use: crypto
 *
 * import crypto from "crypto";
 */

import { secureShuffle, secureWeightedPick, secureRandomRange } from "sc-core-rng";
import crypto from "crypto";
import { Result } from "../models/rounds";
import { matchResultConfig } from "../match-configs";
import * as constants from "../constants";

// Interface for player's tunnel selections
interface PlayerTunnelSelections {
    redTunnel: number;   // Player's specified red tunnel choice (1-6)
    blueTunnel: number;  // Player's specified blue tunnel choice (1-6)
}

/**
 * Generates a weighted random game score based on tunnel configuration
 */
const generateScoreFromProbabilities = (tunnelKey: string): { redScore: number, blueScore: number, selectedScoreKey: string } => {
    // Get probability distribution for this tunnel combination
    const probabilities = matchResultConfig[tunnelKey];
    
    if (!probabilities) {
        console.error(`No configuration found for tunnel combination: ${tunnelKey}`);
        console.error("CRITICAL: Cannot generate result - no valid score combinations available!");
        // ❌ ERROR: Cannot generate scores without proper configuration
        // All scores MUST come from matchResultConfig, not random generation
        throw new Error(`No score configuration available for tunnel combination: ${tunnelKey}. All scores must be defined in matchResultConfig.`);
    }
    
    // Validate probability sum (should be close to 1.0)
    const totalProbability = Object.values(probabilities).reduce((sum, p) => sum + p, 0);
    if (Math.abs(totalProbability - 1.0) > 0.01) {
        console.warn(`Probability sum for ${tunnelKey} is ${totalProbability}, expected 1.0`);
    }
    
    // Use weighted random selection based on probabilities
    const scoreKeys = Object.keys(probabilities);
    const weights = Object.values(probabilities);
    const selectedScoreKey = secureWeightedPick(scoreKeys, weights);
    
    // Parse the selected score key (e.g., "R15B7" -> red=15, blue=7)
    const scoreMatch = selectedScoreKey.match(/^R(\d+)B(\d+)$/);
    if (!scoreMatch) {
        console.error(`Invalid score key format: ${selectedScoreKey}`);
        throw new Error(`Invalid score key format in matchResultConfig: ${selectedScoreKey}. Expected format: R{number}B{number}`);
    }
    
    const redScore = parseInt(scoreMatch[1], 10);
    const blueScore = parseInt(scoreMatch[2], 10);
    
    console.log(`Selected score for ${tunnelKey}: ${selectedScoreKey} (Red=${redScore}, Blue=${blueScore})`);
    
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

export const generateResult = (playerSelections: PlayerTunnelSelections, roundId: number): Result => {
    // Build tunnel configuration key from player selections
    // Format: R{RedTunnel}B{BlueTunnel}
    const tunnelKey = `R${playerSelections.redTunnel}B${playerSelections.blueTunnel}`;
    
    console.log(`Generating result for round ${roundId} with tunnel combination: ${tunnelKey}`);
    
    // Generate game scores based on probability distribution
    const { redScore, blueScore, selectedScoreKey } = generateScoreFromProbabilities(tunnelKey);
    
    // Generate video index based on available videos
    const videoIndex = generateVideoIndex(tunnelKey, selectedScoreKey);
    
    // Store player's specified tunnel choices and generated scores in the result
    return {
        red: redScore,                         // Probability-based game outcome
        blue: blueScore,                       // Probability-based game outcome
        redTunnel: playerSelections.redTunnel,  // Player's specified red tunnel choice
        blueTunnel: playerSelections.blueTunnel, // Player's specified blue tunnel choice
        video: `R${playerSelections.redTunnel}B${playerSelections.blueTunnel}-R${redScore}B${blueScore}_${videoIndex}.mp4`,
    };
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
