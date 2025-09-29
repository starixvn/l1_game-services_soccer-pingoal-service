import type { RaceTrackConfig } from '../types/game-config';

/**
 * R1B3 Race Track Configuration
 * Defines the number of available videos for each race result combination
 * in the R1B3 track type (Red Team 1, Blue Team 3 configuration)
 */
export const R1B3_CONFIG: RaceTrackConfig = {
    "R10B10": 1,
    "R10B12": 1,
    "R10B9": 1,
    "R11B10": 1,
    "R11B12": 1,
    "R11B15": 1,
    "R11B20": 1,
    "R11B4": 1,
    "R11B7": 1,
    "R12B18": 1,
    "R13B12": 1,
    "R13B18": 1,
    "R13B22": 1,
    "R14B10": 1,
    "R14B11": 1,
    "R14B8": 2,
    "R14B9": 1,
    "R15B5": 1,
    "R16B14": 1,
    "R16B2": 1,
    "R17B16": 1,
    "R17B6": 1,
    "R18B8": 1,
    "R19B4": 1,
    "R20B11": 1,
    "R20B9": 1,
    "R21B8": 1,
    "R22B4": 1,
    "R4B10": 1,
    "R5B12": 1,
    "R5B14": 1,
    "R5B4": 1,
    "R5B9": 1,
    "R6B12": 1,
    "R6B5": 1,
    "R6B8": 1,
    "R7B16": 1,
    "R7B4": 1,
    "R8B10": 1,
    "R8B11": 1,
    "R8B3": 1,
    "R8B4": 1,
    "R9B11": 2,
    "R9B12": 1,
    "R9B14": 1,
    "R9B15": 1,
    "R9B19": 1,
    "R9B5": 1,
    "R9B7": 1,
    "R9B8": 2
} as const;

export default R1B3_CONFIG;
