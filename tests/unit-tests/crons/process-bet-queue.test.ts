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
            settleRound: jest.fn(),
            settleRoundWithSelections: jest.fn()
        } as Partial<SettleGameRoundConsumer>;

        mockDependencies = {
            settleGameRoundConsumer: mockSettleGameRoundConsumer,
            roundsRepository: mockRoundsRepository
        };

        processBetQueue = new ProcessBetQueue(mockDependencies);
        
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

            // Verify new thread-safe settlement method was called with tunnel selections
            expect(mockSettleGameRoundConsumer.settleRoundWithSelections)
                .toHaveBeenCalledWith({
                    redTunnel: mockBet.redTunnel,
                    blueTunnel: mockBet.blueTunnel
                }, mockBet.roundId, {
                    nickname: "TestPlayer"
                });

            // Verify success logging
            expect(console.log).toHaveBeenCalledWith(`Successful bet by ${mockPlayer.profile.name} on round ${roundId} (assigned at request time)`);
            expect(console.log).toHaveBeenCalledWith(
                `Settlement completed for round ${roundId} with player tunnel selections: red=${mockBet.redTunnel}, blue=${mockBet.blueTunnel}, player=${mockPlayer.profile.name}`
            );
        });

        it("should handle settlement errors gracefully", async () => {
            // Setup: Mock settlement to throw error
            mockSettleGameRoundConsumer.settleRoundWithSelections.mockRejectedValue(new Error("Settlement failed"));

            // Execute - should not throw
            await expect(processBetQueue.handleSuccessBet(mockPlayer, mockBalance, roundId, mockBet))
                .resolves.toBeUndefined();

            // Verify parent method was still called
            expect(Object.getPrototypeOf(ProcessBetQueue.prototype).handleSuccessBet)
                .toHaveBeenCalledWith(mockPlayer, mockBalance, roundId, mockBet);

            // Verify new settlement method was called with tunnel selections
            expect(mockSettleGameRoundConsumer.settleRoundWithSelections)
                .toHaveBeenCalledWith({
                    redTunnel: mockBet.redTunnel,
                    blueTunnel: mockBet.blueTunnel
                }, mockBet.roundId, {
                    nickname: "TestPlayer"
                });

            // Verify error logging
            expect(console.error).toHaveBeenCalledWith(
                `Settlement failed for round ${roundId}:`,
                expect.any(Error)
            );
        });

        it("should handle settlement method errors gracefully", async () => {
            // Setup: Mock settleRoundWithSelections to throw error
            mockSettleGameRoundConsumer.settleRoundWithSelections.mockImplementation(() => {
                throw new Error("Failed to settle round with selections");
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

                // Verify new settlement method was called with correct tunnel selections
                expect(mockSettleGameRoundConsumer.settleRoundWithSelections)
                    .toHaveBeenCalledWith({
                        redTunnel: tunnelCase.redTunnel,
                        blueTunnel: tunnelCase.blueTunnel
                    }, roundId, {
                        nickname: "TestPlayer"
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
                roundId: 151, // Use the expected roundId
                mode: "single",
                receivedTime: new Date(),
                redTunnel: 2,
                blueTunnel: 5
            };

            // Execute: Process bet without separate round generation
            // Note: Round ID is now automatically generated internally
            await processBetQueue.handleSuccessBet(mockPlayer, { balance: 10000 }, 151, mockBet);

            // Verify the complete workflow uses the new thread-safe method
            expect(mockSettleGameRoundConsumer.settleRoundWithSelections).toHaveBeenCalledWith({
                redTunnel: 2,
                blueTunnel: 5
            }, 151, {
                nickname: "IntegrationTest"
            });
        });

    });
});
