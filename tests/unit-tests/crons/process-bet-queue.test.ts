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
                }, {
                    nickname: "TestPlayer"
                });

            // Verify success logging
            expect(console.log).toHaveBeenCalledWith(`Successful bet by ${mockPlayer.profile.name} on round ${roundId}`);
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
                }, {
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
                    }, {
                        nickname: "TestPlayer"
                    });
            }
        });
    });

    describe("adjustOwnBets", () => {
        let mockBet: BetPayload;

        beforeEach(() => {
            mockBet = {
                amount: 100,
                betChoice: "blue",
                freeBet: false,
                roundId: 123,
                mode: "single",
                receivedTime: new Date(),
                redTunnel: 2,
                blueTunnel: 4
            };

            // Initialize gameData with ingame player
            processBetQueue.gameData.ingame = {
                "TestPlayer": {
                    ownBets: {},
                    tunnelSelections: {}
                }
            };
        });

        it("should overwrite bet amount for same choice (not accumulate)", () => {
            const playerName = "TestPlayer";
            
            // First bet
            processBetQueue.adjustOwnBets(playerName, { ...mockBet, amount: 100, betChoice: "red" });
            expect(processBetQueue.gameData.ingame[playerName].ownBets["red"]).toBe(100);

            // Second bet on same choice - should overwrite, not add
            processBetQueue.adjustOwnBets(playerName, { ...mockBet, amount: 200, betChoice: "red" });
            expect(processBetQueue.gameData.ingame[playerName].ownBets["red"]).toBe(200); // Not 300!
        });

        it("should store different bet choices separately", () => {
            const playerName = "TestPlayer";
            
            // Bet on red
            processBetQueue.adjustOwnBets(playerName, { ...mockBet, amount: 150, betChoice: "red" });
            
            // Bet on blue 
            processBetQueue.adjustOwnBets(playerName, { ...mockBet, amount: 75, betChoice: "blue" });
            
            // Bet on draw
            processBetQueue.adjustOwnBets(playerName, { ...mockBet, amount: 50, betChoice: "draw" });

            expect(processBetQueue.gameData.ingame[playerName].ownBets["red"]).toBe(150);
            expect(processBetQueue.gameData.ingame[playerName].ownBets["blue"]).toBe(75);
            expect(processBetQueue.gameData.ingame[playerName].ownBets["draw"]).toBe(50);
        });

        it("should overwrite tunnel selections for same player", () => {
            const playerName = "TestPlayer";
            
            // First tunnel selection
            processBetQueue.adjustOwnBets(playerName, { 
                ...mockBet, 
                redTunnel: 1, 
                blueTunnel: 3 
            });
            
            expect(processBetQueue.gameData.ingame[playerName].tunnelSelections.redTunnel).toBe(1);
            expect(processBetQueue.gameData.ingame[playerName].tunnelSelections.blueTunnel).toBe(3);

            // Second tunnel selection - should overwrite
            processBetQueue.adjustOwnBets(playerName, { 
                ...mockBet, 
                redTunnel: 5, 
                blueTunnel: 2 
            });
            
            expect(processBetQueue.gameData.ingame[playerName].tunnelSelections.redTunnel).toBe(5);
            expect(processBetQueue.gameData.ingame[playerName].tunnelSelections.blueTunnel).toBe(2);
            expect(processBetQueue.gameData.ingame[playerName].tunnelSelections.lastUpdated).toBeDefined();
        });

        it("should initialize ownBets if not exists", () => {
            const playerName = "NewPlayer";
            
            // Initialize player without ownBets
            processBetQueue.gameData.ingame[playerName] = {};

            processBetQueue.adjustOwnBets(playerName, mockBet);

            expect(processBetQueue.gameData.ingame[playerName].ownBets).toBeDefined();
            expect(processBetQueue.gameData.ingame[playerName].ownBets[mockBet.betChoice]).toBe(mockBet.amount);
        });

        it("should initialize tunnelSelections if not exists", () => {
            const playerName = "NewPlayer";
            
            // Initialize player without tunnelSelections
            processBetQueue.gameData.ingame[playerName] = {};

            processBetQueue.adjustOwnBets(playerName, mockBet);

            expect(processBetQueue.gameData.ingame[playerName].tunnelSelections).toBeDefined();
            expect(processBetQueue.gameData.ingame[playerName].tunnelSelections.redTunnel).toBe(mockBet.redTunnel);
            expect(processBetQueue.gameData.ingame[playerName].tunnelSelections.blueTunnel).toBe(mockBet.blueTunnel);
        });

        it("should do nothing if player not in ingame", () => {
            const playerName = "NonExistentPlayer";
            
            // Should not throw error
            expect(() => {
                processBetQueue.adjustOwnBets(playerName, mockBet);
            }).not.toThrow();

            // Should not create the player
            expect(processBetQueue.gameData.ingame[playerName]).toBeUndefined();
        });

        it("should demonstrate soccerpingoal overwrite behavior vs traditional accumulation", () => {
            const playerName = "TestPlayer";
            const betChoice = "blue";
            
            // Simulate multiple bets in traditional games (would accumulate)
            const bet1 = { ...mockBet, amount: 50, betChoice };
            const bet2 = { ...mockBet, amount: 75, betChoice };
            const bet3 = { ...mockBet, amount: 100, betChoice };
            
            processBetQueue.adjustOwnBets(playerName, bet1);
            expect(processBetQueue.gameData.ingame[playerName].ownBets[betChoice]).toBe(50);
            
            processBetQueue.adjustOwnBets(playerName, bet2);  
            expect(processBetQueue.gameData.ingame[playerName].ownBets[betChoice]).toBe(75); // Overwrite, not 125
            
            processBetQueue.adjustOwnBets(playerName, bet3);
            expect(processBetQueue.gameData.ingame[playerName].ownBets[betChoice]).toBe(100); // Overwrite, not 225
            
            // Verify: In soccerpingoal, only the latest bet amount is kept
            expect(processBetQueue.gameData.ingame[playerName].ownBets[betChoice]).not.toBe(225);
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

            // Execute: Process bet without separate round generation
            // Note: Round ID is now automatically generated internally
            await processBetQueue.handleSuccessBet(mockPlayer, { balance: 10000 }, 151, mockBet);

            // Verify the complete workflow uses the new thread-safe method
            expect(mockSettleGameRoundConsumer.settleRoundWithSelections).toHaveBeenCalledWith({
                redTunnel: 2,
                blueTunnel: 5
            }, {
                nickname: "IntegrationTest"
            });
        });

    });
});
