/**
 * Configuration validation utilities
 * 
 * This module contains functions to validate application configurations
 * to ensure they meet the required constraints before the application starts.
 */

import { BET_CHOICE_RATE } from '../constants';

/**
 * Validates that BET_CHOICE_RATE probabilities sum to 1.0
 * 
 * @throws {Error} If probabilities don't sum to 1.0 (within tolerance)
 */
export const validateBetChoiceRateProbabilities = (): void => {
    const totalBetChoiceRate = Object.values(BET_CHOICE_RATE).reduce((sum, rate) => sum + rate, 0);
    const tolerance = 0.001;
    
    if (Math.abs(totalBetChoiceRate - 1.0) > tolerance) {
        throw new Error(
            `BET_CHOICE_RATE probabilities must sum to 1.0, got: ${totalBetChoiceRate}. ` +
            `Individual rates: red=${BET_CHOICE_RATE.red}, blue=${BET_CHOICE_RATE.blue}, draw=${BET_CHOICE_RATE.draw}`
        );
    }
};

/**
 * Validates all application configurations
 * 
 * This function should be called during application startup to ensure
 * all configurations are valid before the game service begins operation.
 * 
 * @throws {Error} If any configuration validation fails
 */
export const validateAllConfigurations = (): void => {
    try {
        validateBetChoiceRateProbabilities();
        
        // Future configuration validations can be added here, for example:
        // validateVideoConfigurations();
        // validateTunnelConfigurations();
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Configuration validation failed: ${errorMessage}`);
    }
};
