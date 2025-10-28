// Global variable to control mock behavior for V3
let mockBetChoiceRate: Record<string, number> = {};

// Helper to generate valid V3 BET_CHOICE_RATE structure
const generateValidBetChoiceRate = (baseRed = 0.45, baseBlue = 0.45, baseDraw = 0.10): Record<string, number> => {
    const tunnels = [
        'R1B2', 'R1B3', 'R1B4', 'R1B5', 'R1B6',
        'R2B1', 'R2B3', 'R2B4', 'R2B5', 'R2B6',
        'R3B1', 'R3B2', 'R3B4', 'R3B5', 'R3B6',
        'R4B1', 'R4B2', 'R4B3', 'R4B5', 'R4B6',
        'R5B1', 'R5B2', 'R5B3', 'R5B4', 'R5B6',
        'R6B1', 'R6B2', 'R6B3', 'R6B4', 'R6B5',
    ];
    
    const rates: Record<string, number> = {};
    tunnels.forEach(tunnel => {
        rates[`${tunnel}_red`] = baseRed;
        rates[`${tunnel}_blue`] = baseBlue;
        rates[`${tunnel}_draw`] = baseDraw;
    });
    
    return rates;
};

// Mock getBetChoiceRate function
const mockGetBetChoiceRate = (tunnelKey: string, outcome: string): number => {
    const key = `${tunnelKey}_${outcome}`;
    const rate = mockBetChoiceRate[key];
    if (rate === undefined) {
        throw new Error(`Bet choice rate not found for ${key}`);
    }
    return rate;
};

// Mock the constants module to test different scenarios
jest.mock("../../../src/constants", () => {
    return {
        get BET_CHOICE_RATE() {
            return mockBetChoiceRate;
        },
        getBetChoiceRate: (tunnelKey: string, outcome: string) => mockGetBetChoiceRate(tunnelKey, outcome),
        Outcome: {} as any,
    };
});

import {
    validateAllConfigurations,
    validateTunnelRateKeys,
    validateTunnelSpecificProbabilities,
    VALID_TUNNELS,
} from "../../../src/validators/config-validator";

describe("config-validator (V3)", () => {
    beforeEach(() => {
        // Reset to valid default values before each test
        mockBetChoiceRate = generateValidBetChoiceRate();
    });

    describe("validateTunnelRateKeys", () => {
        it("should pass validation when all 90 keys are present", () => {
            mockBetChoiceRate = generateValidBetChoiceRate();
            expect(() => validateTunnelRateKeys()).not.toThrow();
        });

        it("should throw error when keys are missing", () => {
            // Only add a few keys instead of all 90
            mockBetChoiceRate = {
                R1B2_red: 0.45,
                R1B2_blue: 0.45,
                R1B2_draw: 0.10,
            };

            expect(() => validateTunnelRateKeys()).toThrow(/Missing key:/);
        });

        it("should throw error with list of all missing keys", () => {
            mockBetChoiceRate = {};

            expect(() => validateTunnelRateKeys()).toThrow();
            try {
                validateTunnelRateKeys();
            } catch (error: any) {
                // Should list multiple missing keys
                expect(error.message).toContain('R1B2_red');
                expect(error.message).toContain('R1B2_blue');
                expect(error.message).toContain('R1B2_draw');
            }
        });

        it("should validate all 30 tunnel combinations", () => {
            expect(VALID_TUNNELS).toHaveLength(30);
        });
    });

    describe("validateTunnelSpecificProbabilities", () => {
        it("should pass validation when all tunnel probabilities sum to 1.0", () => {
            mockBetChoiceRate = generateValidBetChoiceRate(0.45, 0.45, 0.10);
            expect(() => validateTunnelSpecificProbabilities()).not.toThrow();
        });

        it("should pass validation with alternative valid distribution", () => {
            mockBetChoiceRate = generateValidBetChoiceRate(0.40, 0.50, 0.10);
            expect(() => validateTunnelSpecificProbabilities()).not.toThrow();
        });

        it("should throw error when one tunnel's probabilities don't sum to 1.0", () => {
            mockBetChoiceRate = generateValidBetChoiceRate(0.45, 0.45, 0.10);
            // Make one tunnel invalid
            mockBetChoiceRate['R1B2_red'] = 0.40; // Now R1B2 sums to 0.95
            
            expect(() => validateTunnelSpecificProbabilities()).toThrow(
                /Probabilities for tunnel R1B2 must sum to 1\.0, got: 0\.95/
            );
        });

        it("should throw error with details for invalid tunnel", () => {
            mockBetChoiceRate = generateValidBetChoiceRate(0.45, 0.45, 0.10);
            mockBetChoiceRate['R3B4_blue'] = 0.50; // Now R3B4 sums to 1.05
            
            expect(() => validateTunnelSpecificProbabilities()).toThrow(
                /Rates: red=0\.45, blue=0\.5, draw=0\.1/
            );
        });

        it("should detect negative probabilities", () => {
            mockBetChoiceRate = generateValidBetChoiceRate(0.45, 0.45, 0.10);
            mockBetChoiceRate['R2B3_red'] = -0.05;
            mockBetChoiceRate['R2B3_blue'] = 0.55; // Adjusting to still sum to 1.0
            
            expect(() => validateTunnelSpecificProbabilities()).toThrow(
                /Probabilities for tunnel R2B3 must be non-negative/
            );
        });

        it("should handle small rounding differences within tolerance", () => {
            mockBetChoiceRate = generateValidBetChoiceRate();
            mockBetChoiceRate['R4B5_red'] = 0.450001;
            mockBetChoiceRate['R4B5_blue'] = 0.449999;
            // Total = 1.00, within tolerance
            
            expect(() => validateTunnelSpecificProbabilities()).not.toThrow();
        });

        it("should report multiple invalid tunnels", () => {
            mockBetChoiceRate = generateValidBetChoiceRate(0.40, 0.40, 0.10); // All sum to 0.90
            
            expect(() => validateTunnelSpecificProbabilities()).toThrow();
            try {
                validateTunnelSpecificProbabilities();
            } catch (error: any) {
                // Should mention multiple tunnels
                expect(error.message).toContain('R1B2');
                expect(error.message).toContain('R2B1');
            }
        });
    });

    describe("validateAllConfigurations", () => {
        it("should pass when all V3 configurations are valid", () => {
            mockBetChoiceRate = generateValidBetChoiceRate(0.45, 0.45, 0.10);
            expect(() => validateAllConfigurations()).not.toThrow();
        });

        it("should throw error when tunnel keys are missing", () => {
            mockBetChoiceRate = {
                R1B2_red: 0.45,
                R1B2_blue: 0.45,
                R1B2_draw: 0.10,
            };

            expect(() => validateAllConfigurations()).toThrow(
                /Configuration validation failed:/
            );
        });

        it("should throw error when tunnel probabilities are invalid", () => {
            mockBetChoiceRate = generateValidBetChoiceRate(0.40, 0.40, 0.10); // Sums to 0.90
            
            expect(() => validateAllConfigurations()).toThrow(
                /Configuration validation failed:/
            );
        });

        it("should validate in correct order (keys first, then probabilities)", () => {
            // Missing keys should be caught before probability validation
            mockBetChoiceRate = {};
            
            expect(() => validateAllConfigurations()).toThrow();
            try {
                validateAllConfigurations();
            } catch (error: any) {
                // Error should be about missing keys, not probabilities
                expect(error.message).toContain('Missing key');
            }
        });
    });

    describe("integration with actual constants", () => {
        beforeEach(() => {
            // Reset modules to test with actual constants
            jest.resetModules();
        });

        it("should work with actual V3 BET_CHOICE_RATE from constants", async () => {
            // Dynamically import to get actual constants after reset
            const actualValidator = await import("../../../src/validators/config-validator");

            // This tests that the actual V3 constants in the codebase are valid
            expect(() => actualValidator.validateTunnelRateKeys()).not.toThrow();
            expect(() => actualValidator.validateTunnelSpecificProbabilities()).not.toThrow();
            expect(() => actualValidator.validateAllConfigurations()).not.toThrow();
        });

        it("should validate all 30 tunnels from actual constants", async () => {
            const actualValidator = await import("../../../src/validators/config-validator");
            
            // Verify VALID_TUNNELS constant
            expect(actualValidator.VALID_TUNNELS).toHaveLength(30);
            
            // Verify no duplicate tunnels
            const tunnelSet = new Set(actualValidator.VALID_TUNNELS);
            expect(tunnelSet.size).toBe(30);
        });
    });

    describe("error handling edge cases", () => {
        it("should handle non-Error exceptions by using String conversion", () => {
            const validator = require("../../../src/validators/config-validator");
            const originalValidate = validator.validateTunnelRateKeys;
            
            validator.validateTunnelRateKeys = jest.fn(() => {
                throw "String error instead of Error object";
            });

            expect(() => validator.validateAllConfigurations()).toThrow(
                "Configuration validation failed: String error instead of Error object"
            );

            validator.validateTunnelRateKeys = originalValidate;
        });

        it("should provide helpful error messages for debugging", () => {
            mockBetChoiceRate = generateValidBetChoiceRate(0.45, 0.45, 0.10);
            mockBetChoiceRate['R5B2_red'] = 0.40; // Make R5B2 invalid
            
            try {
                validateTunnelSpecificProbabilities();
                fail('Should have thrown an error');
            } catch (error: any) {
                // Error should include tunnel name and actual values
                expect(error.message).toContain('R5B2');
                expect(error.message).toContain('red=0.4');
                expect(error.message).toContain('blue=0.45');
                expect(error.message).toContain('draw=0.1');
            }
        });
    });
});
