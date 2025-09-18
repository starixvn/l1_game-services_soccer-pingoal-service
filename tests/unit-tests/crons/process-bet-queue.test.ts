import ProcessBetQueue from "../../../src/crons/process-bet-queue";
import SettleGameRoundConsumer from "../../../src/event-consumers/settle-game-round-consumer";
import type { Socket } from "socket.io";

// Mock the sc-game-base module
jest.mock("sc-game-base", () => ({
    Core: {
        Crons: {
            ProcessBetQueue: class MockProcessBetQueue {
                gameData: any;
                constructor(dependencies: any) {
                    this.gameData = { roundId: 100 };
                }
                async handleSuccessBet(...args: any[]): Promise<void> {
                    // Mock implementation
                }
            }
        }
    }
}));

// Mock console methods to avoid noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
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
    let mockSettleGameRoundConsumer: any;
    let mockDependencies: any;

    beforeEach(() => {
        // Mock roundsRepository
        mockRoundsRepository = {
            findOne: jest.fn().mockReturnValue({
                lean: jest.fn().mockReturnValue({
                    exec: jest.fn()
                }),
                sort: jest.fn()
            })
        };

        // Mock SettleGameRoundConsumer
        mockSettleGameRoundConsumer = {
            setPlayerTunnelSelections: jest.fn(),
            settleRound: jest.fn()
        } as Partial<SettleGameRoundConsumer>;

        mockDependencies = {
            settleGameRoundConsumer: mockSettleGameRoundConsumer,
            roundsRepository: mockRoundsRepository
        };

        processBetQueue = new ProcessBetQueue(mockDependencies);
        
        // Reset console mocks
        jest.clearAllMocks();
    });

    describe("generateNewRoundId", () => {
        it("should generate new round ID based on database when rounds exist", async () => {
            // Setup: Mock database to return a round with id 500
            const mockLastRound = { id: 500 };
            mockRoundsRepository.findOne.mockReturnValue({
                lean: () => ({
                    exec: async () => mockLastRound
                })
            });

            // Execute private method via public method
            const newRoundId = await processBetQueue.getNewRoundForBetting();

            // Verify
            expect(mockRoundsRepository.findOne).toHaveBeenCalledWith({}, "id", { sort: { id: -1 } });
            expect(newRoundId).toBe(501); // 500 + 1
            expect(processBetQueue['gameData'].roundId).toBe(501);
            expect(console.log).toHaveBeenCalledWith("Generated new round ID: 501");
        });

        it("should generate new round ID based on gameData when no rounds exist", async () => {
            // Setup: Mock database to return null (no rounds)
            mockRoundsRepository.findOne.mockReturnValue({
                lean: () => ({
                    exec: async () => null
                })
            });

            // Set initial gameData roundId
            processBetQueue['gameData'].roundId = 200;

            // Execute
            const newRoundId = await processBetQueue.getNewRoundForBetting();

            // Verify
            expect(mockRoundsRepository.findOne).toHaveBeenCalledWith({}, "id", { sort: { id: -1 } });
            expect(newRoundId).toBe(201); // 200 + 1
            expect(processBetQueue['gameData'].roundId).toBe(201);
            expect(console.log).toHaveBeenCalledWith("Generated new round ID: 201");
        });

        it("should handle database errors gracefully", async () => {
            // Setup: Mock database to throw error
            mockRoundsRepository.findOne.mockReturnValue({
                lean: () => ({
                    exec: async () => {
                        throw new Error("Database connection failed");
                    }
                })
            });

            // Execute and verify it throws
            await expect(processBetQueue.getNewRoundForBetting()).rejects.toThrow("Database connection failed");
        });
    });

    describe("getNewRoundForBetting", () => {
        it("should call generateNewRoundId and return the result", async () => {
            // Setup: Mock database to return a round
            const mockLastRound = { id: 300 };
            mockRoundsRepository.findOne.mockReturnValue({
                lean: () => ({
                    exec: async () => mockLastRound
                })
            });

            // Execute
            const result = await processBetQueue.getNewRoundForBetting();

            // Verify
            expect(result).toBe(301);
            expect(mockRoundsRepository.findOne).toHaveBeenCalled();
        });
    });

    describe("prepareNewRoundForBet", () => {
        it("should prepare new round ID and log preparation message", async () => {
            // Setup: Mock database to return a round
            const mockLastRound = { id: 400 };
            mockRoundsRepository.findOne.mockReturnValue({
                lean: () => ({
                    exec: async () => mockLastRound
                })
            });

            // Execute
            const result = await processBetQueue.prepareNewRoundForBet();

            // Verify
            expect(result).toBe(401);
            expect(console.log).toHaveBeenCalledWith("Generated new round ID: 401");
            expect(console.log).toHaveBeenCalledWith("Prepared new round ID: 401 for incoming bet");
        });
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
                    maxBet: 1000
                },
                socketClient: {} as Socket,
                session: {}
            };

            mockBet = {
                amount: 100,
                betChoice: "blue",
                freeBet: false,
                roundId: 123,
                mode: "single",
                receivedTime: new Date(),
                redTunnel: 1,
                blueTunnel: 3
            };

            mockBalance = { balance: 5000 };
            roundId = 123;

            // Mock parent class method
            const superHandleSuccessBet = jest.fn();
            Object.setPrototypeOf(ProcessBetQueue.prototype, {
                handleSuccessBet: superHandleSuccessBet
            });
        });

        it("should successfully process bet and settle round", async () => {
            // Execute
            await processBetQueue.handleSuccessBet(mockPlayer, mockBalance, roundId, mockBet);

            // Verify parent method was called
            expect(Object.getPrototypeOf(ProcessBetQueue.prototype).handleSuccessBet)
                .toHaveBeenCalledWith(mockPlayer, mockBalance, roundId, mockBet);

            // Verify tunnel selections were set
            expect(mockSettleGameRoundConsumer.setPlayerTunnelSelections)
                .toHaveBeenCalledWith({
                    redTunnel: mockBet.redTunnel,
                    blueTunnel: mockBet.blueTunnel
                });

            // Verify settlement was triggered
            expect(mockSettleGameRoundConsumer.settleRound).toHaveBeenCalled();

            // Verify success logging
            expect(console.log).toHaveBeenCalledWith(`Successful bet by ${mockPlayer.profile.name} on round ${roundId}`);
            expect(console.log).toHaveBeenCalledWith(
                `Settlement completed for round ${roundId} with player tunnel selections: red=${mockBet.redTunnel}, blue=${mockBet.blueTunnel}`
            );
        });

        it("should handle settlement errors gracefully", async () => {
            // Setup: Mock settlement to throw error
            mockSettleGameRoundConsumer.settleRound.mockRejectedValue(new Error("Settlement failed"));

            // Execute - should not throw
            await expect(processBetQueue.handleSuccessBet(mockPlayer, mockBalance, roundId, mockBet))
                .resolves.toBeUndefined();

            // Verify parent method was still called
            expect(Object.getPrototypeOf(ProcessBetQueue.prototype).handleSuccessBet)
                .toHaveBeenCalledWith(mockPlayer, mockBalance, roundId, mockBet);

            // Verify tunnel selections were set
            expect(mockSettleGameRoundConsumer.setPlayerTunnelSelections)
                .toHaveBeenCalledWith({
                    redTunnel: mockBet.redTunnel,
                    blueTunnel: mockBet.blueTunnel
                });

            // Verify settlement was attempted
            expect(mockSettleGameRoundConsumer.settleRound).toHaveBeenCalled();

            // Verify error logging
            expect(console.error).toHaveBeenCalledWith(
                `Settlement failed for round ${roundId}:`,
                expect.any(Error)
            );
        });

        it("should handle tunnel selection errors gracefully", async () => {
            // Setup: Mock setPlayerTunnelSelections to throw error
            mockSettleGameRoundConsumer.setPlayerTunnelSelections.mockImplementation(() => {
                throw new Error("Failed to set tunnel selections");
            });

            // Execute - should not throw
            await expect(processBetQueue.handleSuccessBet(mockPlayer, mockBalance, roundId, mockBet))
                .resolves.toBeUndefined();

            // Verify parent method was still called
            expect(Object.getPrototypeOf(ProcessBetQueue.prototype).handleSuccessBet)
                .toHaveBeenCalledWith(mockPlayer, mockBalance, roundId, mockBet);

            // Verify error was logged
            expect(console.error).toHaveBeenCalledWith(
                `Settlement failed for round ${roundId}:`,
                expect.any(Error)
            );
        });

        it("should work with different tunnel combinations", async () => {
            const testCases = [
                { redTunnel: 1, blueTunnel: 6 },
                { redTunnel: 3, blueTunnel: 2 },
                { redTunnel: 6, blueTunnel: 1 }
            ];

            for (const tunnelCase of testCases) {
                const testBet = { ...mockBet, ...tunnelCase };
                
                // Reset mocks
                jest.clearAllMocks();

                // Execute
                await processBetQueue.handleSuccessBet(mockPlayer, mockBalance, roundId, testBet);

                // Verify tunnel selections were set correctly
                expect(mockSettleGameRoundConsumer.setPlayerTunnelSelections)
                    .toHaveBeenCalledWith({
                        redTunnel: tunnelCase.redTunnel,
                        blueTunnel: tunnelCase.blueTunnel
                    });
            }
        });
    });

    describe("integration scenarios", () => {
        it("should handle complete bet processing workflow", async () => {
            // Setup: Mock database for round generation
            const mockLastRound = { id: 150 };
            mockRoundsRepository.findOne.mockReturnValue({
                lean: () => ({
                    exec: async () => mockLastRound
                })
            });

            const mockPlayer: Player = {
                UID: "integration-player",
                profile: { name: "IntegrationTest", minBet: 10, maxBet: 1000 },
                socketClient: {} as Socket,
                session: {}
            };

            const mockBet: BetPayload = {
                amount: 250,
                betChoice: "red",
                freeBet: false,
                roundId: 0, // Will be overridden
                mode: "single",
                receivedTime: new Date(),
                redTunnel: 2,
                blueTunnel: 5
            };

            // Execute: Generate new round and process bet
            const newRoundId = await processBetQueue.prepareNewRoundForBet();
            await processBetQueue.handleSuccessBet(mockPlayer, { balance: 10000 }, newRoundId, mockBet);

            // Verify the complete workflow
            expect(newRoundId).toBe(151); // 150 + 1
            expect(mockSettleGameRoundConsumer.setPlayerTunnelSelections).toHaveBeenCalledWith({
                redTunnel: 2,
                blueTunnel: 5
            });
            expect(mockSettleGameRoundConsumer.settleRound).toHaveBeenCalled();
        });

        it("should handle concurrent round generation correctly", async () => {
            // Setup: Mock different database responses for concurrent calls
            let callCount = 0;
            mockRoundsRepository.findOne.mockImplementation(() => ({
                lean: () => ({
                    exec: async () => {
                        callCount++;
                        return { id: 200 + callCount }; // Simulate incrementing database state
                    }
                })
            }));

            // Execute multiple concurrent round generations
            const promises = [
                processBetQueue.getNewRoundForBetting(),
                processBetQueue.getNewRoundForBetting(),
                processBetQueue.getNewRoundForBetting()
            ];

            const results = await Promise.all(promises);

            // Verify each call generated a unique round ID based on database state
            expect(results).toEqual([202, 203, 204]); // Each call gets incremented database value + 1
            expect(mockRoundsRepository.findOne).toHaveBeenCalledTimes(3);
        });
    });
});
