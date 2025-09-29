/**
 * Type definition for race track configuration
 * Maps race result keys (e.g., "R10B10") to number of videos
 */
export type RaceTrackConfig = Record<string, number>;

/**
 * Type definition for the complete video configuration
 * Maps track types (e.g., "R1B2") to their respective configurations
 */
export type VideoConfigurationMap = Record<string, RaceTrackConfig>;
