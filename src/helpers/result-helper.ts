/**
 * Recommend library for random is: sc-core-rng
 *
 * import { secureShuffle, secureWeightedPick } from "sc-core-rng";
 *
 * For hashing, encrypting, decrypting use: crypto
 *
 * import crypto from "crypto";
 */

import { secureShuffle, secureWeightedPick } from "sc-core-rng";
import crypto from "crypto";
import { Result } from "../models/rounds";

// Interface for player's tunnel selections
interface PlayerTunnelSelections {
    redTunnel: number;   // Player's specified red tunnel choice (1-6)
    blueTunnel: number;  // Player's specified blue tunnel choice (1-6)
}

export const generateResult = (playerSelections: PlayerTunnelSelections, roundId: number): Result => {
    // Generate random game scores (this is the actual game outcome)
    const redScore = Math.floor(Math.random() * 4); // 0-3 goals
    const blueScore = Math.floor(Math.random() * 4); // 0-3 goals
    
    // Store player's specified tunnel choices in the result
    return {
        red: redScore,                         // Generated game outcome
        blue: blueScore,                       // Generated game outcome
        redTunnel: playerSelections.redTunnel,  // Player's specified red tunnel choice
        blueTunnel: playerSelections.blueTunnel, // Player's specified blue tunnel choice
        video: `${redScore}-${blueScore}_${playerSelections.redTunnel}-${playerSelections.blueTunnel}_${roundId}.mp4`,
    };
};

// Overload for backwards compatibility (if needed)
export const generateResultLegacy = (): Result => {
    // Fallback for existing code that doesn't provide player selections
    return {
        red: Math.floor(Math.random() * 4),
        blue: Math.floor(Math.random() * 4),
        redTunnel: Math.floor(Math.random() * 6) + 1,
        blueTunnel: Math.floor(Math.random() * 6) + 1,
        video: "default.mp4",
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
