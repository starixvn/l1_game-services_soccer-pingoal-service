/**
 * Configuration validation utilities (V3)
 * 
 * This module contains functions to validate application configurations
 * to ensure they meet the required constraints before the application starts.
 */

import { BET_CHOICE_RATE, getBetChoiceRate } from '../constants';

/**
 * List of all valid tunnel combinations (lowercase for Admin camelCase compatibility)
 */
export const VALID_TUNNELS = [
    'r1b2', 'r1b3', 'r1b4', 'r1b5', 'r1b6',
    'r2b1', 'r2b3', 'r2b4', 'r2b5', 'r2b6',
    'r3b1', 'r3b2', 'r3b4', 'r3b5', 'r3b6',
    'r4b1', 'r4b2', 'r4b3', 'r4b5', 'r4b6',
    'r5b1', 'r5b2', 'r5b3', 'r5b4', 'r5b6',
    'r6b1', 'r6b2', 'r6b3', 'r6b4', 'r6b5',
] as const;

/**
 * Validates that all required tunnel keys exist in BET_CHOICE_RATE
 * 
 * @throws {Error} If any required keys are missing
 */
export const validateTunnelRateKeys = (): void => {
    const errors: string[] = [];
    const outcomes = ['red', 'blue', 'draw'] as const;
    
    VALID_TUNNELS.forEach((tunnelKey) => {
        outcomes.forEach((outcome) => {
            const key = `${tunnelKey}_${outcome}`;
            if (!(key in BET_CHOICE_RATE)) {
                errors.push(`Missing key: ${key}`);
            }
        });
    });
    
    if (errors.length > 0) {
        throw new Error(`BET_CHOICE_RATE missing keys:\n${errors.join('\n')}`);
    }
};

/**
 * Validates that probability rates sum to 1.0 for each tunnel
 * 
 * @throws {Error} If probabilities for any tunnel don't sum to 1.0 (within tolerance)
 */
export const validateTunnelSpecificProbabilities = (): void => {
    const tolerance = 0.001;
    const errors: string[] = [];
    
    VALID_TUNNELS.forEach((tunnelKey) => {
        const red = getBetChoiceRate(tunnelKey, 'red');
        const blue = getBetChoiceRate(tunnelKey, 'blue');
        const draw = getBetChoiceRate(tunnelKey, 'draw');
        
        const total = red + blue + draw;
        
        if (Math.abs(total - 1.0) > tolerance) {
            errors.push(
                `Probabilities for tunnel ${tunnelKey} must sum to 1.0, got: ${total}. ` +
                `Rates: red=${red}, blue=${blue}, draw=${draw}`
            );
        }
        
        // Also validate that all rates are non-negative
        if (red < 0 || blue < 0 || draw < 0) {
            errors.push(
                `Probabilities for tunnel ${tunnelKey} must be non-negative. ` +
                `Rates: red=${red}, blue=${blue}, draw=${draw}`
            );
        }
    });
    
    if (errors.length > 0) {
        throw new Error(`BET_CHOICE_RATE validation failed:\n${errors.join('\n')}`);
    }
};

/**
 * Validates all application configurations (V3)
 * 
 * This function should be called during application startup to ensure
 * all configurations are valid before the game service begins operation.
 * 
 * @throws {Error} If any configuration validation fails
 */
export const validateAllConfigurations = (): void => {
    try {
        // V3 validations
        validateTunnelRateKeys();
        validateTunnelSpecificProbabilities();
        
        // Future configuration validations can be added here, for example:
        // validateVideoConfigurations();
        // validateOddsConfigurations();
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Configuration validation failed: ${errorMessage}`);
    }
};
