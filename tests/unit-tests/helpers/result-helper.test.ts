import { 
    generateResult, 
    generateResultLegacy, 
    getSettlementResult 
} from "../../../src/helpers/result-helper";
import { Result } from "../../../src/models/rounds";

// Mock sc-core-rng - this is the only module that needs mocking
jest.mock("sc-core-rng", () => ({
    secureWeightedPick: jest.fn(),
    secureRandomRange: jest.fn(),
    securePickOne: jest.fn()
}));

// Mock console methods to avoid noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

import { secureWeightedPick, secureRandomRange, securePickOne } from "sc-core-rng";

describe("result-helper", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("generateResult", () => {
        const mockPlayerSelections = {
            redTunnel: 1,
            blueTunnel: 2
        };

        it("should generate result with proper structure", () => {
            // Mock the random functions to return predictable values
            (secureWeightedPick as jest.Mock).mockReturnValue('red');
            (securePickOne as jest.Mock).mockReturnValue('R10B8');
            (secureRandomRange as jest.Mock).mockReturnValue(0);

            const result = generateResult(mockPlayerSelections, 123);

            // Verify result structure
            expect(result).toHaveProperty('red');
            expect(result).toHaveProperty('blue');
            expect(result).toHaveProperty('redTunnel', 1);
            expect(result).toHaveProperty('blueTunnel', 2);
            expect(result).toHaveProperty('video');
            
            // Verify video hash is a valid SHA-256 hash
            expect(result.video).toMatch(/^[a-f0-9]{64}$/);
        });

        it("should use player tunnel selections correctly", () => {
            const customSelections = {
                redTunnel: 1, // Must be 1 based on available configs
                blueTunnel: 5 // Available: 2,3,4,5,6
            };

            (secureWeightedPick as jest.Mock).mockReturnValue('blue');
            (securePickOne as jest.Mock).mockReturnValue('R5B12');
            (secureRandomRange as jest.Mock).mockReturnValue(1);

            const result = generateResult(customSelections, 456);

            expect(result.redTunnel).toBe(1);
            expect(result.blueTunnel).toBe(5);
            expect(result.red).toBe(5);
            expect(result.blue).toBe(12);
        });

        it("should call sc-core-rng functions with correct parameters", () => {
            (secureWeightedPick as jest.Mock).mockReturnValue('draw');
            (securePickOne as jest.Mock).mockReturnValue('R8B8');
            (secureRandomRange as jest.Mock).mockReturnValue(0);

            generateResult(mockPlayerSelections, 789);

            // Verify the random functions were called
            expect(secureWeightedPick).toHaveBeenCalledWith(
                ['red', 'blue', 'draw'],
                expect.arrayContaining([expect.any(Number), expect.any(Number), expect.any(Number)])
            );
            expect(securePickOne).toHaveBeenCalled();
        });

        it("should handle different tunnel combinations", () => {
            // Only these combinations are available based on actual config files
            const testCases = [
                { redTunnel: 1, blueTunnel: 6 }, // R1B6
                { redTunnel: 1, blueTunnel: 3 }, // R1B3  
                { redTunnel: 1, blueTunnel: 2 }  // R1B2
            ];

            testCases.forEach((testCase, index) => {
                (secureWeightedPick as jest.Mock).mockReturnValue('red');
                (securePickOne as jest.Mock).mockReturnValue('R10B5');
                (secureRandomRange as jest.Mock).mockReturnValue(0);

                const result = generateResult(testCase, 100 + index);

                expect(result.redTunnel).toBe(testCase.redTunnel);
                expect(result.blueTunnel).toBe(testCase.blueTunnel);
                expect(result.red).toBe(10);
                expect(result.blue).toBe(5);
            });
        });

        it("should generate different video hashes for different inputs", () => {
            (secureWeightedPick as jest.Mock).mockReturnValue('red');
            (securePickOne as jest.Mock).mockReturnValue('R10B8');
            (secureRandomRange as jest.Mock).mockReturnValue(0);

            const result1 = generateResult({ redTunnel: 1, blueTunnel: 2 }, 100);
            const result2 = generateResult({ redTunnel: 1, blueTunnel: 3 }, 200);

            // Should generate different hashes due to different tunnel combinations
            expect(result1.video).not.toBe(result2.video);
            expect(result1.video).toMatch(/^[a-f0-9]{64}$/);
            expect(result2.video).toMatch(/^[a-f0-9]{64}$/);
        });

        it("should throw error for invalid tunnel configuration", () => {
            // This should throw an error if the tunnel combination doesn't exist in constants
            const invalidSelections = {
                redTunnel: 99, // Invalid tunnel number
                blueTunnel: 99
            };

            (secureWeightedPick as jest.Mock).mockReturnValue('red');
            (securePickOne as jest.Mock).mockReturnValue('R10B8');

            expect(() => generateResult(invalidSelections, 999))
                .toThrow();
        });
    });

    describe("generateResultLegacy", () => {
        it("should generate legacy result with error indicators", () => {
            (secureRandomRange as jest.Mock)
                .mockReturnValueOnce(2)  // red score
                .mockReturnValueOnce(1); // blue score

            const result = generateResultLegacy();

            expect(result).toEqual({
                red: 2,
                blue: 1,
                redTunnel: -1,  // Error indicator
                blueTunnel: -1, // Error indicator
                video: "ERROR-missing-player-selections.mp4"
            });

            expect(secureRandomRange).toHaveBeenCalledWith(0, 3);
            expect(console.error).toHaveBeenCalledWith(
                "CRITICAL ERROR: generateResultLegacy called - tunnel values should come from player selections!"
            );
            expect(console.error).toHaveBeenCalledWith(
                "This suggests missing player tunnel selections in the betting flow."
            );
        });

        it("should handle different random score combinations", () => {
            (secureRandomRange as jest.Mock)
                .mockReturnValueOnce(0)  // red score
                .mockReturnValueOnce(3); // blue score

            const result = generateResultLegacy();

            expect(result.red).toBe(0);
            expect(result.blue).toBe(3);
            expect(result.redTunnel).toBe(-1);
            expect(result.blueTunnel).toBe(-1);
        });
    });

    describe("getSettlementResult", () => {
        it("should return red win when red score is higher", () => {
            const roundResult: Result = {
                red: 10,
                blue: 7,
                redTunnel: 1,
                blueTunnel: 2,
                video: "test-video"
            };

            const settlement = getSettlementResult(roundResult);

            expect(settlement).toEqual({
                blue: false,
                red: true,
                draw: false
            });
        });

        it("should return blue win when blue score is higher", () => {
            const roundResult: Result = {
                red: 5,
                blue: 8,
                redTunnel: 3,
                blueTunnel: 4,
                video: "test-video"
            };

            const settlement = getSettlementResult(roundResult);

            expect(settlement).toEqual({
                blue: true,
                red: false,
                draw: false
            });
        });

        it("should return draw when scores are equal", () => {
            const roundResult: Result = {
                red: 6,
                blue: 6,
                redTunnel: 5,
                blueTunnel: 6,
                video: "test-video"
            };

            const settlement = getSettlementResult(roundResult);

            expect(settlement).toEqual({
                blue: false,
                red: false,
                draw: true
            });
        });

        it("should handle zero scores correctly", () => {
            const roundResult: Result = {
                red: 0,
                blue: 0,
                redTunnel: 1,
                blueTunnel: 2,
                video: "test-video"
            };

            const settlement = getSettlementResult(roundResult);

            expect(settlement).toEqual({
                blue: false,
                red: false,
                draw: true
            });
        });

        it("should handle large score differences", () => {
            const testCases = [
                { red: 100, blue: 1, expected: { red: true, blue: false, draw: false } },
                { red: 1, blue: 100, expected: { red: false, blue: true, draw: false } },
                { red: 999, blue: 999, expected: { red: false, blue: false, draw: true } }
            ];

            testCases.forEach(testCase => {
                const roundResult: Result = {
                    red: testCase.red,
                    blue: testCase.blue,
                    redTunnel: 1,
                    blueTunnel: 2,
                    video: "test-video"
                };

                const settlement = getSettlementResult(roundResult);
                expect(settlement).toEqual(testCase.expected);
            });
        });
    });

    describe("integration scenarios", () => {
        it("should handle complete result generation workflow", () => {
            // Test that all components work together
            (secureWeightedPick as jest.Mock).mockReturnValue('red');
            (securePickOne as jest.Mock).mockReturnValue('R15B10');
            (secureRandomRange as jest.Mock).mockReturnValue(0);

            const playerSelections = { redTunnel: 1, blueTunnel: 4 };
            const result = generateResult(playerSelections, 500);
            const settlement = getSettlementResult(result);

            // Verify result
            expect(result.redTunnel).toBe(1);
            expect(result.blueTunnel).toBe(4);
            expect(result.red).toBe(15);
            expect(result.blue).toBe(10);
            expect(result.video).toBeTruthy();

            // Verify settlement logic
            expect(settlement.red).toBe(true);
            expect(settlement.blue).toBe(false);
            expect(settlement.draw).toBe(false);

            // Verify logging
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining("Generating result for round 500")
            );
        });

        it("should maintain consistency across multiple calls", () => {
            const selections = { redTunnel: 1, blueTunnel: 3 };

            // First call
            (secureWeightedPick as jest.Mock).mockReturnValue('blue');
            (securePickOne as jest.Mock).mockReturnValue('R8B12');
            (secureRandomRange as jest.Mock).mockReturnValue(1);

            const result1 = generateResult(selections, 600);

            // Second call with same inputs
            jest.clearAllMocks();
            (secureWeightedPick as jest.Mock).mockReturnValue('blue');
            (securePickOne as jest.Mock).mockReturnValue('R8B12');
            (secureRandomRange as jest.Mock).mockReturnValue(1);

            const result2 = generateResult(selections, 600);

            // Should produce same results given same mocked random values
            expect(result1.red).toBe(result2.red);
            expect(result1.blue).toBe(result2.blue);
            expect(result1.redTunnel).toBe(result2.redTunnel);
            expect(result1.blueTunnel).toBe(result2.blueTunnel);
        });
    });
});