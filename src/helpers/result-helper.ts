/**
 * Recommend library for random is: sc-core-rng
 *
 * import { secureShuffle, secureWeightedPick } from "sc-core-rng";
 *
 * For hashing, encrypting, decrypting use: crypto
 *
 * import crypto from "crypto";
 */

import { Result } from "../models/rounds";

export const generateResult = (): Result => {
    // Example implementation, replace with actual logic
    return {
        red: 1,
        blue: 0,
        redTunnel: 2,
        blueTunnel: 1,
        video: "1-0_2-1.mp4",
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
