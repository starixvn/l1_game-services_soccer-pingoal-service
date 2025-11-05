import ProcessBetQueue from "../../../src/crons/process-bet-queue";
import SettleGameRoundConsumer from "../../../src/event-consumers/settle-game-round-consumer";
import type { Socket } from "socket.io";
import * as helpers from "../../../src/helpers";

// Mock the helpers module
jest.mock("../../../src/helpers", () => ({
    ...jest.requireActual("../../../src/helpers"),
    extractTunnelOdds: jest.fn(),
}));

// Mock the sc-game-base module
jest.mock("sc-game-base", () => ({
    Core: {
        Crons: {
            ProcessBetQueue: class MockProcessBetQueue {
                gameData: any;
                betsRepository: any;
                constructor(dependencies: any) {
                    this.gameData = { roundId: 100, gameConfigs: { odds: {} } };
                    this.betsRepository = dependencies.betsRepository;
                }
                async handleSuccessBet(...args: any[]): Promise<void> {
                    // Mock implementation
                }
            },
        },
    },
}));

// Mock console methods to avoid noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
};

interface BetPayload {
    amount: number;
    betChoice: string;
    freeBet: boolean;
    roundId: number;
    mode: string;
    receivedTime: Date;
    redTunnel: number;
    blueTunnel: number;
}

interface Player {
    UID: string;
    profile: {
        name: string;
        minBet: number;
        maxBet: number;
    };
    socketClient: Socket;
    session: Record<string, string | number | boolean>;
}

describe("ProcessBetQueue", () => {
    let processBetQueue: ProcessBetQueue;
    let mockRoundsRepository: any;
    let mockBetsRepository: any;
    let mockSettleGameRoundConsumer: any;
    let mockDependencies: any;

    beforeEach(() => {
        // Mock roundsRepository
        mockRoundsRepository = {
            findOne: jest.fn().mockReturnValue({
                lean: jest.fn().mockReturnValue({
                    exec: jest.fn(),
                }),
                sort: jest.fn(),
            }),
        };

        // Mock betsRepository
        mockBetsRepository = {
            updateOne: jest.fn().mockResolvedValue({}),
        };

        // Mock SettleGameRoundConsumer
        mockSettleGameRoundConsumer = {
            setPlayerTunnelSelections: jest.fn(),
            settleRound: jest.fn(),
            settleRoundWithSelections: jest.fn(),
        } as Partial<SettleGameRoundConsumer>;

        mockDependencies = {
            settleGameRoundConsumer: mockSettleGameRoundConsumer,
            roundsRepository: mockRoundsRepository,
            betsRepository: mockBetsRepository,
        };

        processBetQueue = new ProcessBetQueue(mockDependencies);
        processBetQueue.gameData = {
            roundId: 100,
            gameConfigs: {
                odds: {
                    R1B2_red: 2.1,
                    R1B2_blue: 2.1,
                    R1B2_draw: 9.0,
                    R1B3_red: 2.2,
                    R1B3_blue: 2.2,
                    R1B3_draw: 9.5,
                },
            },
        };

        // Reset console mocks
        jest.clearAllMocks();
    });

    describe("handleSuccessBet", () => {
        let mockPlayer: Player;
        let mockBet: BetPayload;
        let mockBalance: unknown;
        let roundId: number;

        beforeEach(() => {
            mockPlayer = {
                UID: "player123",
                profile: {
                    name: "TestPlayer",
                    minBet: 10,
                    maxBet: 1000,
                },
                socketClient: {} as Socket,
                session: {},
            };

            mockBet = {
                amount: 100,
                betChoice: "blue",
                freeBet: false,
                roundId: 123,
                mode: "single",
                receivedTime: new Date(),
                redTunnel: 1,
                blueTunnel: 3,
            };

            mockBalance = { balance: 5000 };
            roundId = 123;

            // Mock parent class method
            const superHandleSuccessBet = jest.fn();
            Object.setPrototypeOf(ProcessBetQueue.prototype, {
                handleSuccessBet: superHandleSuccessBet,
            });
        });

        it("should successfully process bet and settle round", async () => {
            // Execute
            await processBetQueue.handleSuccessBet(mockPlayer, mockBalance, roundId, mockBet);

            // Verify parent method was called
            expect(Object.getPrototypeOf(ProcessBetQueue.prototype).handleSuccessBet).toHaveBeenCalledWith(
                mockPlayer,
                mockBalance,
                roundId,
                mockBet
            );

            // Verify new thread-safe settlement method was called with tunnel selections
            expect(mockSettleGameRoundConsumer.settleRoundWithSelections).toHaveBeenCalledWith(
                {
                    redTunnel: mockBet.redTunnel,
                    blueTunnel: mockBet.blueTunnel,
                },
                mockBet.roundId,
                {
                    nickname: "TestPlayer",
                    UID: "player123",
                }
            );
        });

        it("should handle settlement errors gracefully", async () => {
            // Setup: Mock settlement to throw error
            mockSettleGameRoundConsumer.settleRoundWithSelections.mockRejectedValue(new Error("Settlement failed"));

            // Execute - should not throw
            await expect(processBetQueue.handleSuccessBet(mockPlayer, mockBalance, roundId, mockBet)).resolves.toBeUndefined();

            // Verify parent method was still called
            expect(Object.getPrototypeOf(ProcessBetQueue.prototype).handleSuccessBet).toHaveBeenCalledWith(
                mockPlayer,
                mockBalance,
                roundId,
                mockBet
            );

            // Verify new settlement method was called with tunnel selections
            expect(mockSettleGameRoundConsumer.settleRoundWithSelections).toHaveBeenCalledWith(
                {
                    redTunnel: mockBet.redTunnel,
                    blueTunnel: mockBet.blueTunnel,
                },
                mockBet.roundId,
                {
                    nickname: "TestPlayer",
                    UID: "player123",
                }
            );

            // Verify error logging
            expect(console.error).toHaveBeenCalledWith(`Settlement failed for round ${roundId}:`, expect.any(Error));
        });

        it("should handle settlement method errors gracefully", async () => {
            // Setup: Mock settleRoundWithSelections to throw error
            mockSettleGameRoundConsumer.settleRoundWithSelections.mockImplementation(() => {
                throw new Error("Failed to settle round with selections");
            });

            // Execute - should not throw
            await expect(processBetQueue.handleSuccessBet(mockPlayer, mockBalance, roundId, mockBet)).resolves.toBeUndefined();

            // Verify parent method was still called
            expect(Object.getPrototypeOf(ProcessBetQueue.prototype).handleSuccessBet).toHaveBeenCalledWith(
                mockPlayer,
                mockBalance,
                roundId,
                mockBet
            );

            // Verify error was logged
            expect(console.error).toHaveBeenCalledWith(`Settlement failed for round ${roundId}:`, expect.any(Error));
        });

        it("should work with different tunnel combinations", async () => {
            const testCases = [
                { redTunnel: 1, blueTunnel: 6 },
                { redTunnel: 3, blueTunnel: 2 },
                { redTunnel: 6, blueTunnel: 1 },
            ];

            for (const tunnelCase of testCases) {
                const testBet = { ...mockBet, ...tunnelCase };

                // Reset mocks
                jest.clearAllMocks();

                // Execute
                await processBetQueue.handleSuccessBet(mockPlayer, mockBalance, roundId, testBet);

                // Verify new settlement method was called with correct tunnel selections
                expect(mockSettleGameRoundConsumer.settleRoundWithSelections).toHaveBeenCalledWith(
                    {
                        redTunnel: tunnelCase.redTunnel,
                        blueTunnel: tunnelCase.blueTunnel,
                    },
                    roundId,
                    {
                        nickname: "TestPlayer",
                        UID: "player123",
                    }
                );
            }
        });
    });

    describe("upsertBet", () => {
        let mockPlayer: Player;
        let mockBet: BetPayload;
        let roundId: number;
        let rate: number;

        beforeEach(() => {
            mockPlayer = {
                UID: "player123",
                profile: {
                    name: "TestPlayer",
                    minBet: 10,
                    maxBet: 1000,
                },
                socketClient: {} as Socket,
                session: {
                    siteId: "site1",
                    currencyName: "USD",
                    operatorId: "op1",
                    playerId: "p123",
                },
            };

            mockBet = {
                amount: 100,
                betChoice: "blue",
                freeBet: false,
                roundId: 123,
                mode: "single",
                receivedTime: new Date(),
                redTunnel: 1,
                blueTunnel: 2,
            };

            roundId = 123;
            rate = 1.0;

            // Mock extractTunnelOdds
            (helpers.extractTunnelOdds as jest.Mock).mockReturnValue({
                red: 2.1,
                blue: 2.1,
                draw: 9.0,
            });
        });

        it("should extract tunnel-specific odds and store them", async () => {
            await processBetQueue.upsertBet(mockPlayer, roundId, mockBet, rate);

            // Verify extractTunnelOdds was called with correct parameters
            expect(helpers.extractTunnelOdds).toHaveBeenCalledWith(
                processBetQueue.gameData.gameConfigs.odds,
                mockBet.redTunnel,
                mockBet.blueTunnel
            );

            // Verify betsRepository.updateOne was called
            expect(mockBetsRepository.updateOne).toHaveBeenCalledWith(
                { uid: "player123", roundId: 123, freeBet: false },
                {
                    $inc: { blue: 100, totalAmount: 100 },
                    $setOnInsert: expect.objectContaining({
                        uid: "player123",
                        name: "TestPlayer",
                        odds: { red: 2.1, blue: 2.1, draw: 9.0 },
                        freeBet: false,
                        roundId: 123,
                        redTunnel: 1,
                        blueTunnel: 2,
                        siteId: "site1",
                        currency: "USD",
                        rate: 1.0,
                        operatorId: "op1",
                        playerId: "p123",
                    }),
                },
                { upsert: true, setDefaultsOnInsert: true }
            );
        });

        it("should store tunnel selections in bet record", async () => {
            await processBetQueue.upsertBet(mockPlayer, roundId, mockBet, rate);

            const updateCall = mockBetsRepository.updateOne.mock.calls[0];
            const newBetData = updateCall[1].$setOnInsert;

            expect(newBetData).toHaveProperty("redTunnel", 1);
            expect(newBetData).toHaveProperty("blueTunnel", 2);
        });

        it("should work with different tunnel combinations", async () => {
            const testCases = [
                { redTunnel: 1, blueTunnel: 3, expectedOdds: { red: 2.2, blue: 2.2, draw: 9.5 } },
                { redTunnel: 2, blueTunnel: 5, expectedOdds: { red: 2.5, blue: 2.5, draw: 10.0 } },
            ];

            for (const testCase of testCases) {
                jest.clearAllMocks();
                (helpers.extractTunnelOdds as jest.Mock).mockReturnValue(testCase.expectedOdds);

                const testBet = { ...mockBet, redTunnel: testCase.redTunnel, blueTunnel: testCase.blueTunnel };
                await processBetQueue.upsertBet(mockPlayer, roundId, testBet, rate);

                expect(helpers.extractTunnelOdds).toHaveBeenCalledWith(
                    processBetQueue.gameData.gameConfigs.odds,
                    testCase.redTunnel,
                    testCase.blueTunnel
                );

                const updateCall = mockBetsRepository.updateOne.mock.calls[0];
                const newBetData = updateCall[1].$setOnInsert;

                expect(newBetData.odds).toEqual(testCase.expectedOdds);
                expect(newBetData.redTunnel).toBe(testCase.redTunnel);
                expect(newBetData.blueTunnel).toBe(testCase.blueTunnel);
            }
        });

        it("should handle extractTunnelOdds errors", async () => {
            (helpers.extractTunnelOdds as jest.Mock).mockImplementation(() => {
                throw new Error("Missing odds for tunnel combination R1B2");
            });

            await expect(processBetQueue.upsertBet(mockPlayer, roundId, mockBet, rate)).rejects.toThrow(
                "Missing odds for tunnel combination R1B2"
            );
        });

        it("should include clientSeed when provided", async () => {
            const betWithClientSeed = { ...mockBet, clientSeed: "test-seed-123" };
            await processBetQueue.upsertBet(mockPlayer, roundId, betWithClientSeed, rate);

            const updateCall = mockBetsRepository.updateOne.mock.calls[0];
            const newBetData = updateCall[1].$setOnInsert;

            expect(newBetData.clientSeed).toBe("test-seed-123");
        });

        it("should work without player session", async () => {
            const playerWithoutSession = {
                ...mockPlayer,
                session: undefined,
            };

            await processBetQueue.upsertBet(playerWithoutSession, roundId, mockBet, rate);

            const updateCall = mockBetsRepository.updateOne.mock.calls[0];
            const newBetData = updateCall[1].$setOnInsert;

            expect(newBetData).not.toHaveProperty("siteId");
            expect(newBetData).not.toHaveProperty("currency");
            expect(newBetData).not.toHaveProperty("rate");
        });
    });

    describe("integration scenarios", () => {
        it("should handle complete bet processing workflow", async () => {
            // Setup: Mock database for round generation
            const mockLastRound = { id: 150 };
            mockRoundsRepository.findOne.mockReturnValue({
                lean: () => ({
                    exec: async () => mockLastRound,
                }),
            });

            const mockPlayer: Player = {
                UID: "integration-player",
                profile: { name: "IntegrationTest", minBet: 10, maxBet: 1000 },
                socketClient: {} as Socket,
                session: {},
            };

            const mockBet: BetPayload = {
                amount: 250,
                betChoice: "red",
                freeBet: false,
                roundId: 151, // Use the expected roundId
                mode: "single",
                receivedTime: new Date(),
                redTunnel: 2,
                blueTunnel: 5,
            };

            // Execute: Process bet without separate round generation
            // Note: Round ID is now automatically generated internally
            await processBetQueue.handleSuccessBet(mockPlayer, { balance: 10000 }, 151, mockBet);

            // Verify the complete workflow uses the new thread-safe method
            expect(mockSettleGameRoundConsumer.settleRoundWithSelections).toHaveBeenCalledWith(
                {
                    redTunnel: 2,
                    blueTunnel: 5,
                },
                151,
                {
                    nickname: "IntegrationTest",
                    UID: "integration-player",
                }
            );
        });
    });
});
