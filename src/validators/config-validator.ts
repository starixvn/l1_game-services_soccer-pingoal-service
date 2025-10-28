/**
 * Configuration validation utilities (V3)
 * 
 * This module contains functions to validate application configurations
 * to ensure they meet the required constraints before the application starts.
 */

import { BET_CHOICE_RATE, getBetChoiceRate } from '../constants';

/**
 * List of all valid tunnel combinations
 */
export const VALID_TUNNELS = [
    'R1B2', 'R1B3', 'R1B4', 'R1B5', 'R1B6',
    'R2B1', 'R2B3', 'R2B4', 'R2B5', 'R2B6',
    'R3B1', 'R3B2', 'R3B4', 'R3B5', 'R3B6',
    'R4B1', 'R4B2', 'R4B3', 'R4B5', 'R4B6',
    'R5B1', 'R5B2', 'R5B3', 'R5B4', 'R5B6',
    'R6B1', 'R6B2', 'R6B3', 'R6B4', 'R6B5',
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
