import SettleGameRoundConsumer from "../../../src/event-consumers/settle-game-round-consumer";
import { generateResult } from "../../../src/helpers/result-helper";
import { Result } from "../../../src/models/rounds";

// Mock the generateResult helper function
jest.mock("../../../src/helpers/result-helper", () => ({
    generateResult: jest.fn()
}));

// Mock the sc-game-base Core module
jest.mock("sc-game-base", () => ({
    Core: {
        BaseEventConsumers: {
            SettleGameRoundConsumer: class MockBaseSettleGameRoundConsumer {
                definition = {
                    generateResult: jest.fn()
                };
                gameData = {
                    roundId: 123
                };
            }
        }
    }
}));

describe("SettleGameRoundConsumer", () => {
    let settleGameRoundConsumer: SettleGameRoundConsumer;
    let mockGenerateResult: jest.MockedFunction<typeof generateResult>;
    let mockDefinitionGenerateResult: jest.Mock;
    let consoleLogSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;

    const mockResult: Result = {
        red: 2,
        blue: 1,
        redTunnel: 1,
        blueTunnel: 2,
        video: "test-video-hash"
    };

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        
        // Setup console spies
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        
        // Create instance - it appears the constructor only takes one argument
        settleGameRoundConsumer = new SettleGameRoundConsumer({} as any);
        
        // Get references to mocked functions
        mockGenerateResult = generateResult as jest.MockedFunction<typeof generateResult>;
        mockDefinitionGenerateResult = settleGameRoundConsumer.definition.generateResult as jest.Mock;
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleWarnSpy.mockRestore();
    });

    describe("settleRoundWithSelections", () => {
        it("should call settleRound and clean up selections", async () => {
            const selections = { redTunnel: 2, blueTunnel: 4 };
            
            // Mock the base settleRound method
            const mockSettleRound = jest.fn().mockResolvedValue(undefined);
            settleGameRoundConsumer.settleRound = mockSettleRound;
            
            await settleGameRoundConsumer.settleRoundWithSelections(selections);
            
            // Verify settleRound was called
            expect(mockSettleRound).toHaveBeenCalled();
            
            // Verify logging
            expect(consoleLogSpy).toHaveBeenCalledWith(
                "Starting settlement for round 123 with tunnel selections: red=2, blue=4"
            );
        });

        it("should clean up selections even if settleRound throws error", async () => {
            const selections = { redTunnel: 3, blueTunnel: 5 };
            
            // Mock settleRound to throw error
            const mockSettleRound = jest.fn().mockRejectedValue(new Error("Settlement error"));
            settleGameRoundConsumer.settleRound = mockSettleRound;
            
            await expect(settleGameRoundConsumer.settleRoundWithSelections(selections))
                .rejects.toThrow("Settlement error");
            
            // After error, selections should still be cleared
            const fallbackResult = { red: 0, blue: 0, redTunnel: -1, blueTunnel: -1, video: "fallback" };
            mockDefinitionGenerateResult.mockReturnValue(fallbackResult);
            
            const result = settleGameRoundConsumer.generateResult();
            expect(result).toEqual(fallbackResult);
            expect(mockDefinitionGenerateResult).toHaveBeenCalled();
        });
    });

    describe("setPlayerTunnelSelections", () => {
        it("should set player tunnel selections correctly", () => {
            const selections = {
                redTunnel: 1,
                blueTunnel: 2
            };

            settleGameRoundConsumer.setPlayerTunnelSelections(selections);

            expect(consoleLogSpy).toHaveBeenCalledWith(
                "Set player tunnel selections: red=1, blue=2"
            );
        });

        it("should handle different tunnel selection combinations", () => {
            const testCases = [
                { redTunnel: 1, blueTunnel: 6 },
                { redTunnel: 3, blueTunnel: 4 },
                { redTunnel: 6, blueTunnel: 1 }
            ];

            testCases.forEach(selections => {
                settleGameRoundConsumer.setPlayerTunnelSelections(selections);
                
                expect(consoleLogSpy).toHaveBeenCalledWith(
                    `Set player tunnel selections: red=${selections.redTunnel}, blue=${selections.blueTunnel}`
                );
            });

            expect(consoleLogSpy).toHaveBeenCalledTimes(testCases.length);
        });

        it("should overwrite previous tunnel selections", () => {
            const firstSelections = { redTunnel: 1, blueTunnel: 2 };
            const secondSelections = { redTunnel: 3, blueTunnel: 4 };

            settleGameRoundConsumer.setPlayerTunnelSelections(firstSelections);
            settleGameRoundConsumer.setPlayerTunnelSelections(secondSelections);

            expect(consoleLogSpy).toHaveBeenCalledTimes(2);
            expect(consoleLogSpy).toHaveBeenNthCalledWith(1, 
                "Set player tunnel selections: red=1, blue=2"
            );
            expect(consoleLogSpy).toHaveBeenNthCalledWith(2,
                "Set player tunnel selections: red=3, blue=4"
            );
        });
    });

    describe("generateResult", () => {
        describe("with player tunnel selections", () => {
            beforeEach(() => {
                mockGenerateResult.mockReturnValue(mockResult);
            });

            it("should generate result using player tunnel selections", () => {
                const selections = { redTunnel: 1, blueTunnel: 2 };
                
                settleGameRoundConsumer.setPlayerTunnelSelections(selections);
                const result = settleGameRoundConsumer.generateResult();

                expect(mockGenerateResult).toHaveBeenCalledWith(selections, 123);
                expect(result).toEqual(mockResult);
                expect(consoleLogSpy).toHaveBeenCalledWith(
                    "Generating result for round 123 with player tunnel selections"
                );
            });

            it("should NOT clear player selections after generating result (handled by settleRoundWithSelections)", () => {
                const selections = { redTunnel: 1, blueTunnel: 2 };
                
                settleGameRoundConsumer.setPlayerTunnelSelections(selections);
                settleGameRoundConsumer.generateResult();

                // Call generateResult again - should still use selections since generateResult no longer clears them
                const secondResult = settleGameRoundConsumer.generateResult();

                // Should still use the selections, not fall back
                expect(mockGenerateResult).toHaveBeenCalledTimes(2);
                expect(secondResult).toEqual(mockResult);
                expect(mockDefinitionGenerateResult).not.toHaveBeenCalled();
                expect(consoleWarnSpy).not.toHaveBeenCalled();
            });

            it("should handle multiple generate result calls with different selections", () => {
                const firstSelections = { redTunnel: 1, blueTunnel: 2 };
                const secondSelections = { redTunnel: 3, blueTunnel: 4 };
                
                const firstResult = { ...mockResult, redTunnel: 1, blueTunnel: 2 };
                const secondResult = { ...mockResult, redTunnel: 3, blueTunnel: 4 };
                
                mockGenerateResult
                    .mockReturnValueOnce(firstResult)
                    .mockReturnValueOnce(secondResult);

                // First round
                settleGameRoundConsumer.setPlayerTunnelSelections(firstSelections);
                const result1 = settleGameRoundConsumer.generateResult();

                // Second round  
                settleGameRoundConsumer.setPlayerTunnelSelections(secondSelections);
                const result2 = settleGameRoundConsumer.generateResult();

                expect(mockGenerateResult).toHaveBeenCalledTimes(2);
                expect(mockGenerateResult).toHaveBeenNthCalledWith(1, firstSelections, 123);
                expect(mockGenerateResult).toHaveBeenNthCalledWith(2, secondSelections, 123);
                expect(result1).toEqual(firstResult);
                expect(result2).toEqual(secondResult);
            });
        });

        describe("without player tunnel selections", () => {
            it("should fall back to definition.generateResult when no player selections", () => {
                const fallbackResult: Result = {
                    red: 0,
                    blue: 3,
                    redTunnel: -1,
                    blueTunnel: -1,
                    video: "fallback-video"
                };
                mockDefinitionGenerateResult.mockReturnValue(fallbackResult);

                const result = settleGameRoundConsumer.generateResult();

                expect(mockDefinitionGenerateResult).toHaveBeenCalled();
                expect(mockGenerateResult).not.toHaveBeenCalled();
                expect(result).toEqual(fallbackResult);
                expect(consoleWarnSpy).toHaveBeenCalledWith(
                    "No player tunnel selections available, using legacy random generation"
                );
            });

            it("should log warning when no player selections available", () => {
                mockDefinitionGenerateResult.mockReturnValue(mockResult);

                settleGameRoundConsumer.generateResult();

                expect(consoleWarnSpy).toHaveBeenCalledWith(
                    "No player tunnel selections available, using legacy random generation"
                );
            });
        });

        describe("error handling", () => {
            it("should handle errors from generateResult helper", () => {
                const selections = { redTunnel: 1, blueTunnel: 2 };
                const error = new Error("Result generation failed");
                
                mockGenerateResult.mockImplementation(() => {
                    throw error;
                });

                settleGameRoundConsumer.setPlayerTunnelSelections(selections);

                expect(() => {
                    settleGameRoundConsumer.generateResult();
                }).toThrow("Result generation failed");
            });

            it("should handle errors from definition.generateResult", () => {
                const error = new Error("Definition result generation failed");
                
                mockDefinitionGenerateResult.mockImplementation(() => {
                    throw error;
                });

                expect(() => {
                    settleGameRoundConsumer.generateResult();
                }).toThrow("Definition result generation failed");
            });
        });

        describe("integration scenarios", () => {
            it("should handle complete workflow with settleRoundWithSelections: set selections -> generate -> clear", async () => {
                const selections = { redTunnel: 1, blueTunnel: 2 };
                const playerResult = { ...mockResult, redTunnel: 1, blueTunnel: 2 };
                const fallbackResult = {
                    red: 0,
                    blue: 0,
                    redTunnel: -1,
                    blueTunnel: -1,
                    video: "fallback"
                };

                mockGenerateResult.mockReturnValue(playerResult);
                mockDefinitionGenerateResult.mockReturnValue(fallbackResult);

                // Mock the base settleRound method
                const mockSettleRound = jest.fn().mockResolvedValue(undefined);
                settleGameRoundConsumer.settleRound = mockSettleRound;

                // Step 1: Use settleRoundWithSelections (thread-safe method)
                await settleGameRoundConsumer.settleRoundWithSelections(selections);

                expect(mockSettleRound).toHaveBeenCalled();

                // Step 2: After settlement, selections should be cleared - generate result should fallback
                const result2 = settleGameRoundConsumer.generateResult();

                expect(result2).toEqual(fallbackResult);
                expect(mockDefinitionGenerateResult).toHaveBeenCalled();
                expect(consoleWarnSpy).toHaveBeenCalledWith(
                    "No player tunnel selections available, using legacy random generation"
                );
            });
        });

        describe("boundary conditions", () => {
            it("should handle valid tunnel boundary values", () => {
                const boundarySelections = [
                    { redTunnel: 1, blueTunnel: 6 },
                    { redTunnel: 6, blueTunnel: 1 }
                ];

                boundarySelections.forEach(selections => {
                    mockGenerateResult.mockReturnValue({
                        ...mockResult,
                        redTunnel: selections.redTunnel,
                        blueTunnel: selections.blueTunnel
                    });

                    settleGameRoundConsumer.setPlayerTunnelSelections(selections);
                    const result = settleGameRoundConsumer.generateResult();

                    expect(mockGenerateResult).toHaveBeenCalledWith(selections, 123);
                    expect(result.redTunnel).toBe(selections.redTunnel);
                    expect(result.blueTunnel).toBe(selections.blueTunnel);
                });
            });
        });
    });

    describe("logging behavior", () => {
        it("should log all expected messages in correct order", () => {
            const selections = { redTunnel: 1, blueTunnel: 2 };
            mockGenerateResult.mockReturnValue(mockResult);

            settleGameRoundConsumer.setPlayerTunnelSelections(selections);
            settleGameRoundConsumer.generateResult();

            expect(consoleLogSpy).toHaveBeenCalledTimes(2);
            expect(consoleLogSpy).toHaveBeenNthCalledWith(1,
                "Set player tunnel selections: red=1, blue=2"
            );
            expect(consoleLogSpy).toHaveBeenNthCalledWith(2,
                "Generating result for round 123 with player tunnel selections"
            );
        });

        it("should not log generation message when falling back to definition", () => {
            mockDefinitionGenerateResult.mockReturnValue(mockResult);

            settleGameRoundConsumer.generateResult();

            expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
            expect(consoleLogSpy).not.toHaveBeenCalledWith(
                expect.stringContaining("Generating result for round")
            );
        });
    });

    describe("state management", () => {
        it("should maintain independent state across multiple instances", () => {
            const secondInstance = new SettleGameRoundConsumer({} as any);
            
            const selections1 = { redTunnel: 1, blueTunnel: 2 };
            const selections2 = { redTunnel: 3, blueTunnel: 4 };
            
            mockGenerateResult.mockReturnValue(mockResult);

            // Set different selections on each instance
            settleGameRoundConsumer.setPlayerTunnelSelections(selections1);
            secondInstance.setPlayerTunnelSelections(selections2);

            // Generate results
            settleGameRoundConsumer.generateResult();
            secondInstance.generateResult();

            expect(mockGenerateResult).toHaveBeenCalledTimes(2);
            expect(mockGenerateResult).toHaveBeenNthCalledWith(1, selections1, 123);
            expect(mockGenerateResult).toHaveBeenNthCalledWith(2, selections2, 123);
        });
    });
});
