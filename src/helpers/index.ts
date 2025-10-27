import * as resultHelper from "./result-helper";

export { resultHelper };

/**
 * Extract tunnel-specific odds from V3 flat odds structure
 * @param flatOdds - V3 flat odds object with keys like "R1B2_red", "R1B2_blue", "R1B2_draw"
 * @param redTunnel - Red tunnel selection (1-6)
 * @param blueTunnel - Blue tunnel selection (1-6)
 * @returns Object with red, blue, draw odds for the specified tunnel combination
 */
export const extractTunnelOdds = (
    flatOdds: Record<string, number>,
    redTunnel: number,
    blueTunnel: number
): { red: number; blue: number; draw: number } => {
    const tunnelKey = `R${redTunnel}B${blueTunnel}`;
    
    const redOdds = flatOdds[`${tunnelKey}_red`];
    const blueOdds = flatOdds[`${tunnelKey}_blue`];
    const drawOdds = flatOdds[`${tunnelKey}_draw`];

    if (redOdds === undefined || blueOdds === undefined || drawOdds === undefined) {
        throw new Error(
            `Missing odds for tunnel combination ${tunnelKey}. ` +
            `Expected keys: ${tunnelKey}_red, ${tunnelKey}_blue, ${tunnelKey}_draw`
        );
    }

    return {
        red: redOdds,
        blue: blueOdds,
        draw: drawOdds,
    };
};
