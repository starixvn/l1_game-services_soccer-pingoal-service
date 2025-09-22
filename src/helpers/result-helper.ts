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

// Interface for player's tunnel selections
interface PlayerTunnelSelections {
    redTunnel: number;   // Player's specified red tunnel choice (1-6)
    blueTunnel: number;  // Player's specified blue tunnel choice (1-6)
}

export const generateResult = (playerSelections: PlayerTunnelSelections, roundId: number): Result => {
    // Generate random game scores (this is the actual game outcome)
    const redScore = secureRandomRange(0, 3); // 0-3 goals
    const blueScore = secureRandomRange(0, 3); // 0-3 goals
    const index = 0;
    
    // Store player's specified tunnel choices in the result
    return {
        red: redScore,                         // Generated game outcome
        blue: blueScore,                       // Generated game outcome
        redTunnel: playerSelections.redTunnel,  // Player's specified red tunnel choice
        blueTunnel: playerSelections.blueTunnel, // Player's specified blue tunnel choice
        video : `R${playerSelections.redTunnel}B${playerSelections.blueTunnel}-R${redScore}-B${blueScore}_${index}.mp4`,
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
