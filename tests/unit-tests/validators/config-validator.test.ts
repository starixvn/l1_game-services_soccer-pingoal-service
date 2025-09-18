// Global variable to control mock behavior
let mockBetChoiceRate = {
    red: 0.45,
    blue: 0.45,
    draw: 0.10
};

// Mock the constants module to test different scenarios
jest.mock("../../../src/constants", () => {
    // Use a getter function to return current mock values
    return {
        get BET_CHOICE_RATE() {
            return mockBetChoiceRate;
        }
    };
});

import {
    validateBetChoiceRateProbabilities,
    validateAllConfigurations
} from "../../../src/validators/config-validator";

describe("config-validator", () => {
    beforeEach(() => {
        // Reset to valid default values before each test
        mockBetChoiceRate = {
            red: 0.45,
            blue: 0.45,
            draw: 0.10
        };
    });

    describe("validateBetChoiceRateProbabilities", () => {
        it("should pass validation when probabilities sum to 1.0", () => {
            mockBetChoiceRate = {
                red: 0.45,
                blue: 0.45,
                draw: 0.10
            };

            expect(() => validateBetChoiceRateProbabilities()).not.toThrow();
        });

        it("should pass validation when probabilities sum to 1.0 with small rounding differences", () => {
            mockBetChoiceRate = {
                red: 0.333333,  // Small rounding differences
                blue: 0.333333,
                draw: 0.333334
            };

            expect(() => validateBetChoiceRateProbabilities()).not.toThrow();
        });

        it("should throw error when probabilities sum to less than 1.0", () => {
            mockBetChoiceRate = {
                red: 0.40,
                blue: 0.40,
                draw: 0.10  // Total = 0.90
            };

            expect(() => validateBetChoiceRateProbabilities()).toThrow(
                "BET_CHOICE_RATE probabilities must sum to 1.0, got: 0.9"
            );
        });

        it("should throw error when probabilities sum to more than 1.0", () => {
            mockBetChoiceRate = {
                red: 0.50,
                blue: 0.50,
                draw: 0.10  // Total = 1.10
            };

            expect(() => validateBetChoiceRateProbabilities()).toThrow(
                "BET_CHOICE_RATE probabilities must sum to 1.0, got: 1.1"
            );
        });

        it("should throw error with detailed rate information in error message", () => {
            mockBetChoiceRate = {
                red: 0.60,
                blue: 0.30,
                draw: 0.05  // Total = 0.95
            };

            expect(() => validateBetChoiceRateProbabilities()).toThrow(
                /Individual rates: red=0\.6, blue=0\.3, draw=0\.05/
            );
        });

        it("should handle edge case with zero probabilities", () => {
            mockBetChoiceRate = {
                red: 1.0,
                blue: 0.0,
                draw: 0.0  // Total = 1.0 but extreme distribution
            };

            expect(() => validateBetChoiceRateProbabilities()).not.toThrow();
        });

        it("should handle negative probabilities (invalid scenario)", () => {
            mockBetChoiceRate = {
                red: 0.6,
                blue: 0.6,
                draw: -0.2  // Negative probability, total = 1.0
            };

            expect(() => validateBetChoiceRateProbabilities()).not.toThrow();
            // Note: This tests that the sum validation works, even with invalid negative values
            // In a real scenario, you might want additional validation for negative values
        });

        it("should handle very small differences within tolerance", () => {
            mockBetChoiceRate = {
                red: 0.45001,   // Small difference within tolerance
                blue: 0.44999,
                draw: 0.10
            };

            expect(() => validateBetChoiceRateProbabilities()).not.toThrow();
        });

        it("should fail for differences just outside tolerance", () => {
            mockBetChoiceRate = {
                red: 0.45,
                blue: 0.45,
                draw: 0.098  // Total = 0.998, difference = 0.002 > 0.001 tolerance
            };

            expect(() => validateBetChoiceRateProbabilities()).toThrow();
        });
    });

    describe("validateAllConfigurations", () => {
        it("should pass when all configurations are valid", () => {
            mockBetChoiceRate = {
                red: 0.45,
                blue: 0.45,
                draw: 0.10
            };

            expect(() => validateAllConfigurations()).not.toThrow();
        });

        it("should throw error when BET_CHOICE_RATE validation fails", () => {
            mockBetChoiceRate = {
                red: 0.50,
                blue: 0.50,
                draw: 0.10  // Total = 1.10
            };

            expect(() => validateAllConfigurations()).toThrow(
                /Configuration validation failed:/
            );
        });

        it("should wrap the original error message in configuration validation context", () => {
            mockBetChoiceRate = {
                red: 0.40,
                blue: 0.40,
                draw: 0.10  // Total = 0.90
            };

            expect(() => validateAllConfigurations()).toThrow(
                "Configuration validation failed: BET_CHOICE_RATE probabilities must sum to 1.0, got: 0.9"
            );
        });

        it("should handle multiple validation scenarios", () => {
            // Test that validateAllConfigurations properly orchestrates all validations
            const testCases = [
                {
                    name: "valid configuration",
                    rates: { red: 0.4, blue: 0.4, draw: 0.2 },
                    shouldThrow: false
                },
                {
                    name: "invalid sum too high",
                    rates: { red: 0.5, blue: 0.4, draw: 0.2 },
                    shouldThrow: true
                },
                {
                    name: "invalid sum too low",
                    rates: { red: 0.3, blue: 0.3, draw: 0.2 },
                    shouldThrow: true
                }
            ];

            testCases.forEach(testCase => {
                mockBetChoiceRate = testCase.rates;

                if (testCase.shouldThrow) {
                    expect(() => validateAllConfigurations()).toThrow();
                } else {
                    expect(() => validateAllConfigurations()).not.toThrow();
                }
            });
        });
    });

    describe("error handling edge cases", () => {
        it("should handle non-Error exceptions by using String conversion", () => {
            // Temporarily mock validateBetChoiceRateProbabilities within this module
            const originalFunction = validateBetChoiceRateProbabilities;
            
            // Create a new implementation that throws a string
            const mockValidateFunction = jest.fn(() => {
                throw "String error instead of Error object";
            });

            // Replace the function in the validator module by importing and mocking
            const validator = require("../../../src/validators/config-validator");
            const originalValidateBetChoiceRateProbabilities = validator.validateBetChoiceRateProbabilities;
            
            // Mock the function to throw a non-Error type
            validator.validateBetChoiceRateProbabilities = mockValidateFunction;

            // This should trigger the String(error) branch in validateAllConfigurations
            expect(() => validator.validateAllConfigurations()).toThrow(
                "Configuration validation failed: String error instead of Error object"
            );

            // Restore the original function
            validator.validateBetChoiceRateProbabilities = originalValidateBetChoiceRateProbabilities;
        });

        it("should handle object exceptions by using String conversion", () => {
            const validator = require("../../../src/validators/config-validator");
            const originalValidateBetChoiceRateProbabilities = validator.validateBetChoiceRateProbabilities;
            
            // Mock the function to throw an object
            validator.validateBetChoiceRateProbabilities = jest.fn(() => {
                throw { type: "CustomError", details: "Something went wrong" };
            });

            // This should convert the object to "[object Object]" via String()
            expect(() => validator.validateAllConfigurations()).toThrow(
                "Configuration validation failed: [object Object]"
            );

            // Restore the original function
            validator.validateBetChoiceRateProbabilities = originalValidateBetChoiceRateProbabilities;
        });

        it("should handle number exceptions by using String conversion", () => {
            const validator = require("../../../src/validators/config-validator");
            const originalValidateBetChoiceRateProbabilities = validator.validateBetChoiceRateProbabilities;
            
            // Mock the function to throw a number
            validator.validateBetChoiceRateProbabilities = jest.fn(() => {
                throw 404;
            });

            // This should convert the number to "404" via String()
            expect(() => validator.validateAllConfigurations()).toThrow(
                "Configuration validation failed: 404"
            );

            // Restore the original function
            validator.validateBetChoiceRateProbabilities = originalValidateBetChoiceRateProbabilities;
        });
    });

    describe("integration with actual constants", () => {
        beforeEach(() => {
            // Reset modules to test with actual constants
            jest.resetModules();
        });

        it("should work with actual BET_CHOICE_RATE from constants", async () => {
            // Dynamically import to get actual constants after reset
            const actualValidator = await import("../../../src/validators/config-validator");

            // This tests that the actual constants in the codebase are valid
            expect(() => actualValidator.validateBetChoiceRateProbabilities()).not.toThrow();
            expect(() => actualValidator.validateAllConfigurations()).not.toThrow();
        });
    });
});
