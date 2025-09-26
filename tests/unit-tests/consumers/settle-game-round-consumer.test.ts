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
            publishToUser: jest.fn(),
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


    describe("settleRoundWithSelections", () => {
        it("should successfully settle round with selections and roundId", async () => {
            const selections = { redTunnel: 2, blueTunnel: 4 };
            const roundId = 123;
            const playerInfo = { nickname: "testPlayer", UID: "player123" };
            
            // Mock generateResult to return expected result
            mockGenerateResult.mockReturnValue(mockResult);
            
            await settleGameRoundConsumer.settleRoundWithSelections(selections, roundId, playerInfo);
            
            // Verify generateResult was called with correct parameters
            expect(mockGenerateResult).toHaveBeenCalledWith(selections, roundId, {roundId: 123, exchangeRates: { exId: 1 }, ingame: {}}, "testPlayer");
            
            // Verify publishToUser was called with correct parameters
            expect((settleGameRoundConsumer as any).roundResultPublisher.publishToUser).toHaveBeenCalledWith("player123", {});
        });

        it("should handle settlement without player info", async () => {
            const selections = { redTunnel: 3, blueTunnel: 5 };
            const roundId = 124;
            
            mockGenerateResult.mockReturnValue(mockResult);
            
            await settleGameRoundConsumer.settleRoundWithSelections(selections, roundId);
            
            // Verify generateResult was called with undefined nickname
            expect(mockGenerateResult).toHaveBeenCalledWith(selections, roundId, {roundId: 123, exchangeRates: { exId: 1 }, ingame: {}}, undefined);
            
            // Verify no publishing when UID is not available (since fallback was removed)
            expect((settleGameRoundConsumer as any).roundResultPublisher.publishToUser).not.toHaveBeenCalled();
            expect((settleGameRoundConsumer as any).roundResultPublisher.publishRoundResult).not.toHaveBeenCalled();
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


    describe("thread safety", () => {
        it("should handle concurrent settlements without race conditions", async () => {
            const selections1 = { redTunnel: 1, blueTunnel: 2 };
            const selections2 = { redTunnel: 3, blueTunnel: 4 };
            const roundId1 = 123;
            const roundId2 = 124;
            const playerInfo1 = { nickname: "player1", UID: "uid1" };
            const playerInfo2 = { nickname: "player2", UID: "uid2" };

            mockGenerateResult.mockReturnValue(mockResult);

            // Simulate concurrent settlements
            const settlement1 = settleGameRoundConsumer.settleRoundWithSelections(selections1, roundId1, playerInfo1);
            const settlement2 = settleGameRoundConsumer.settleRoundWithSelections(selections2, roundId2, playerInfo2);

            await Promise.all([settlement1, settlement2]);

            // Verify both settlements used correct parameters
            expect(mockGenerateResult).toHaveBeenCalledTimes(2);
            expect(mockGenerateResult).toHaveBeenNthCalledWith(1, selections1, roundId1, {roundId: 123, exchangeRates: { exId: 1 }, ingame: {}}, "player1");
            expect(mockGenerateResult).toHaveBeenNthCalledWith(2, selections2, roundId2, {roundId: 123, exchangeRates: { exId: 1 }, ingame: {}}, "player2");
            
            // Verify both used publishToUser with correct UIDs
            expect((settleGameRoundConsumer as any).roundResultPublisher.publishToUser).toHaveBeenCalledTimes(2);
            expect((settleGameRoundConsumer as any).roundResultPublisher.publishToUser).toHaveBeenNthCalledWith(1, "uid1", {});
            expect((settleGameRoundConsumer as any).roundResultPublisher.publishToUser).toHaveBeenNthCalledWith(2, "uid2", {});
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

});
