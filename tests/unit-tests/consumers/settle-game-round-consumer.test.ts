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
                    generateResult: jest.fn(),
                    settle: jest.fn()
                };
                gameData = {
                    roundId: 123,
                    exchangeRates: { exId: 1 }
                };
            }
        }
    }
}));

describe("SettleGameRoundConsumer", () => {
    let settleGameRoundConsumer: SettleGameRoundConsumer;
    let mockGenerateResult: jest.MockedFunction<typeof generateResult>;
    let mockDefinitionGenerateResult: jest.Mock;
    let mockDefinitionSettle: jest.Mock;
    let consoleLogSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;

    const mockResult: Result = {
        red: 2,
        blue: 1,
        redTunnel: 1,
        blueTunnel: 2,
        video: "test-video-hash"
    };

    const mockSettlementResult = {
        blue: false,
        red: true,
        draw: false
    };

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        
        // Setup console spies
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        
        // Create instance
        settleGameRoundConsumer = new SettleGameRoundConsumer({} as any);
        
        // Mock roundsRepository directly on the instance for getNextRoundIdAtomically
        const mockFindOne = {
            lean: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue({ id: 122 }) // Return a round with id 122 so next will be 123
        };
        
        const mockRoundsRepository = {
            findOne: jest.fn().mockReturnValue(mockFindOne),
            create: jest.fn().mockResolvedValue({ id: 123, time: new Date() })
        };
        
        // Set roundsRepository as instance property (this is how the actual code accesses it)
        (settleGameRoundConsumer as any).roundsRepository = mockRoundsRepository;
        
        // Mock other required methods for settleBets, roundResultPublisher, etc
        (settleGameRoundConsumer as any).settleBets = jest.fn().mockResolvedValue(undefined);
        (settleGameRoundConsumer as any).roundResultPublisher = {
            publishRoundResult: jest.fn(),
            publishWinners: jest.fn()
        };
        (settleGameRoundConsumer as any).collectRoundResult = jest.fn().mockReturnValue({});
        
        // Mock gameData for settleRound - use roundId 123 to match test expectations
        settleGameRoundConsumer.gameData = {
            roundId: 123,
            exchangeRates: { exId: 1 },
            ingame: {} // Add ingame property to prevent TypeError
        } as any;
        
        // Get references to mocked functions
        mockGenerateResult = generateResult as jest.MockedFunction<typeof generateResult>;
        mockDefinitionGenerateResult = settleGameRoundConsumer.definition.generateResult as jest.Mock;
        mockDefinitionSettle = settleGameRoundConsumer.definition.settle as jest.Mock;
        
        // Set up default mock return values
        mockDefinitionSettle.mockReturnValue(mockSettlementResult);
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleWarnSpy.mockRestore();
    });

    describe("settleRoundWithSelections", () => {
        it("should successfully settle round with selections and roundId", async () => {
            const selections = { redTunnel: 2, blueTunnel: 4 };
            const roundId = 123;
            const playerInfo = { nickname: "testPlayer" };
            
            // Mock generateResult to return expected result
            mockGenerateResult.mockReturnValue(mockResult);
            
            await settleGameRoundConsumer.settleRoundWithSelections(selections, roundId, playerInfo);
            
            // Verify generateResult was called with correct parameters
            expect(mockGenerateResult).toHaveBeenCalledWith(selections, roundId, {roundId: 123, exchangeRates: { exId: 1 }, ingame: {}}, "testPlayer");
            
            // Verify logging
            expect(consoleLogSpy).toHaveBeenCalledWith(
                "Starting settlement with tunnel selections: red=2, blue=4, roundId=123, player=testPlayer"
            );
            expect(consoleLogSpy).toHaveBeenCalledWith("gameData", {roundId: 123, exchangeRates: { exId: 1 }, ingame: {}});
            expect(consoleLogSpy).toHaveBeenCalledWith("Generating result for round 123 with player tunnel selections");
        });

        it("should handle settlement without player info", async () => {
            const selections = { redTunnel: 3, blueTunnel: 5 };
            const roundId = 124;
            
            mockGenerateResult.mockReturnValue(mockResult);
            
            await settleGameRoundConsumer.settleRoundWithSelections(selections, roundId);
            
            // Verify generateResult was called with undefined nickname
            expect(mockGenerateResult).toHaveBeenCalledWith(selections, roundId, {roundId: 123, exchangeRates: { exId: 1 }, ingame: {}}, undefined);
            
            // Verify logging shows unknown player (4 logs since no player reset log)
            expect(consoleLogSpy).toHaveBeenCalledTimes(4);
            expect(consoleLogSpy).toHaveBeenNthCalledWith(1,
                "Starting settlement with tunnel selections: red=3, blue=5, roundId=124, player=unknown"
            );
            expect(consoleLogSpy).toHaveBeenNthCalledWith(2,
                "gameData", {roundId: 123, exchangeRates: { exId: 1 }, ingame: {}}
            );
            expect(consoleLogSpy).toHaveBeenNthCalledWith(3,
                "Generating result for round 124 with player tunnel selections"
            );
            expect(consoleLogSpy).toHaveBeenNthCalledWith(4,
                "Creating round in database with ID: 124, exchangeRateId: 1"
            );
        });

        it("should handle errors during settlement", async () => {
            const selections = { redTunnel: 1, blueTunnel: 6 };
            const roundId = 125;
            
            // Mock generateResult to throw error
            mockGenerateResult.mockImplementation(() => {
                throw new Error("Result generation failed");
            });
            
            await expect(settleGameRoundConsumer.settleRoundWithSelections(selections, roundId))
                .rejects.toThrow("Result generation failed");
        });
    });

    describe("deprecated methods", () => {
        it("should warn when setPlayerTunnelSelections is called", () => {
            const selections = { redTunnel: 1, blueTunnel: 2 };

            settleGameRoundConsumer.setPlayerTunnelSelections(selections);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "setPlayerTunnelSelections is deprecated and not thread-safe. Use settleRoundWithSelections instead."
            );
        });

        it("should warn and throw error when settleRound is called directly", async () => {
            await expect(settleGameRoundConsumer.settleRound())
                .rejects.toThrow("Direct settleRound() calls are not supported. Use settleRoundWithSelections() instead.");
            
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "settleRound() called directly - this may cause race conditions. Use settleRoundWithSelections instead."
            );
        });

        it("should warn when generateResult is called directly", () => {
            const fallbackResult = { red: 0, blue: 0, redTunnel: -1, blueTunnel: -1, video: "fallback" };
            mockDefinitionGenerateResult.mockReturnValue(fallbackResult);

            const result = settleGameRoundConsumer.generateResult();

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "generateResult() called directly - this may cause race conditions. Use settleRoundWithSelections instead."
            );
            expect(result).toEqual(fallbackResult);
        });
    });

    describe("thread safety", () => {
        it("should handle concurrent settlements without race conditions", async () => {
            const selections1 = { redTunnel: 1, blueTunnel: 2 };
            const selections2 = { redTunnel: 3, blueTunnel: 4 };
            const roundId1 = 123;
            const roundId2 = 124;
            const playerInfo1 = { nickname: "player1" };
            const playerInfo2 = { nickname: "player2" };

            mockGenerateResult.mockReturnValue(mockResult);

            // Simulate concurrent settlements
            const settlement1 = settleGameRoundConsumer.settleRoundWithSelections(selections1, roundId1, playerInfo1);
            const settlement2 = settleGameRoundConsumer.settleRoundWithSelections(selections2, roundId2, playerInfo2);

            await Promise.all([settlement1, settlement2]);

            // Verify both settlements used correct parameters
            expect(mockGenerateResult).toHaveBeenCalledTimes(2);
            expect(mockGenerateResult).toHaveBeenNthCalledWith(1, selections1, roundId1, {roundId: 123, exchangeRates: { exId: 1 }, ingame: {}}, "player1");
            expect(mockGenerateResult).toHaveBeenNthCalledWith(2, selections2, roundId2, {roundId: 123, exchangeRates: { exId: 1 }, ingame: {}}, "player2");
        });

        it("should maintain parameter isolation between settlements", async () => {
            const selections1 = { redTunnel: 1, blueTunnel: 2 };
            const selections2 = { redTunnel: 5, blueTunnel: 6 };
            const roundId1 = 125;
            const roundId2 = 126;

            const result1 = { ...mockResult, redTunnel: 1, blueTunnel: 2 };
            const result2 = { ...mockResult, redTunnel: 5, blueTunnel: 6 };

            mockGenerateResult
                .mockReturnValueOnce(result1)
                .mockReturnValueOnce(result2);

            await settleGameRoundConsumer.settleRoundWithSelections(selections1, roundId1);
            await settleGameRoundConsumer.settleRoundWithSelections(selections2, roundId2);

            // Each settlement should use its own parameters
            expect(mockGenerateResult).toHaveBeenCalledTimes(2);
            expect(mockGenerateResult).toHaveBeenNthCalledWith(1, selections1, roundId1, {roundId: 123, exchangeRates: { exId: 1 }, ingame: {}}, undefined);
            expect(mockGenerateResult).toHaveBeenNthCalledWith(2, selections2, roundId2, {roundId: 123, exchangeRates: { exId: 1 }, ingame: {}}, undefined);
        });
    });

    describe("logging behavior", () => {
        it("should log all expected messages during settlement", async () => {
            const selections = { redTunnel: 1, blueTunnel: 2 };
            const roundId = 123;
            const playerInfo = { nickname: "testPlayer" };
            
            mockGenerateResult.mockReturnValue(mockResult);

            await settleGameRoundConsumer.settleRoundWithSelections(selections, roundId, playerInfo);

            expect(consoleLogSpy).toHaveBeenCalledTimes(5);
            expect(consoleLogSpy).toHaveBeenNthCalledWith(1,
                "Starting settlement with tunnel selections: red=1, blue=2, roundId=123, player=testPlayer"
            );
            expect(consoleLogSpy).toHaveBeenNthCalledWith(2,
                "gameData", {roundId: 123, exchangeRates: { exId: 1 }, ingame: {}}
            );
            expect(consoleLogSpy).toHaveBeenNthCalledWith(3,
                "Generating result for round 123 with player tunnel selections"
            );
            expect(consoleLogSpy).toHaveBeenNthCalledWith(4,
                "Creating round in database with ID: 123, exchangeRateId: 1"
            );
            expect(consoleLogSpy).toHaveBeenNthCalledWith(5,
                "Reset player data for next round: testPlayer"
            );
        });

        it("should log unknown player when no player info provided", async () => {
            const selections = { redTunnel: 3, blueTunnel: 4 };
            const roundId = 124;
            
            mockGenerateResult.mockReturnValue(mockResult);

            await settleGameRoundConsumer.settleRoundWithSelections(selections, roundId);

            expect(consoleLogSpy).toHaveBeenCalledWith(
                "Starting settlement with tunnel selections: red=3, blue=4, roundId=124, player=unknown"
            );
        });
    });
});
