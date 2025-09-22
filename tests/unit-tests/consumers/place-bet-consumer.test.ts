import PlaceBetConsumer from "../../../src/event-consumers/place-bet-consumer";
import { BET_CHOICES } from "../../../src/constants";
import { helpers } from "sc-common";

// Mock the sc-common helpers
jest.mock("sc-common", () => ({
    helpers: {
        noticeHelper: {
            invalidBet: "INVALID_BET"
        }
    }
}));

// Mock the sc-game-base Core module
jest.mock("sc-game-base", () => ({
    Core: {
        BaseEventConsumers: {
            PlaceBetConsumer: class MockPlaceBetConsumer {
                constructor() {}
                
                getNoticeObj(type: string, data?: any) {
                    return { type, ...data };
                }
                
                composeBetChoiceValidationCriteria(betChoice: string) {
                    // Mock implementation that returns validation criteria
                    const validChoices = ["blue", "red", "draw"];
                    return [{
                        failure: !betChoice || !validChoices.includes(betChoice),
                        notice: this.getNoticeObj("INVALID_BET_CHOICE")
                    }];
                }
            }
        }
    }
}));

describe("PlaceBetConsumer", () => {
    let placeBetConsumer: PlaceBetConsumer;

    beforeEach(() => {
        // Mock the constructor parameters - definition, registrationOptions, gameSettings
        const mockDefinition = {} as any;
        const mockRegistrationOptions = {} as any;
        const mockGameSettings = {} as any;
        
        placeBetConsumer = new PlaceBetConsumer(mockDefinition, mockRegistrationOptions, mockGameSettings);
        
        // Mock the getNoticeObj method
        jest.spyOn(placeBetConsumer, 'getNoticeObj').mockImplementation((type, data) => ({
            type,
            ...data
        }));
    });

    describe("validateBetRequestParams", () => {
        const validRequest = {
            amount: 100,
            betChoice: BET_CHOICES.blue,
            redTunnel: 1,
            blueTunnel: 2
        };

        describe("valid scenarios", () => {
            it("should pass validation for valid request with blue bet choice", () => {
                const request = { ...validRequest, betChoice: BET_CHOICES.blue };
                const validations = placeBetConsumer.validateBetRequestParams(request);
                
                // All validation failures should be false
                expect(validations.every(validation => validation.failure === false)).toBe(true);
            });

            it("should pass validation for valid request with red bet choice", () => {
                const request = { ...validRequest, betChoice: BET_CHOICES.red };
                const validations = placeBetConsumer.validateBetRequestParams(request);
                
                expect(validations.every(validation => validation.failure === false)).toBe(true);
            });

            it("should pass validation for valid request with draw bet choice", () => {
                const request = { ...validRequest, betChoice: BET_CHOICES.draw };
                const validations = placeBetConsumer.validateBetRequestParams(request);
                
                expect(validations.every(validation => validation.failure === false)).toBe(true);
            });

            it("should pass validation with different valid tunnel combinations", () => {
                const testCases = [
                    { redTunnel: 1, blueTunnel: 6 },
                    { redTunnel: 3, blueTunnel: 4 },
                    { redTunnel: 6, blueTunnel: 1 }
                ];

                testCases.forEach(tunnelCase => {
                    const request = { ...validRequest, ...tunnelCase };
                    const validations = placeBetConsumer.validateBetRequestParams(request);
                    
                    expect(validations.every(validation => validation.failure === false)).toBe(true);
                });
            });
        });

        describe("amount validation", () => {
            it("should fail when amount is missing", () => {
                const request = { ...validRequest, amount: undefined } as any;
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                // The first validation should be for amount (index 0)
                const amountValidation = validations[0];
                
                expect(amountValidation.failure).toBe(true);
                expect(amountValidation.notice.type).toBe(helpers.noticeHelper.invalidBet);
            });

            it("should fail when amount is zero", () => {
                const request = { ...validRequest, amount: 0 };
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                // The first validation should be for amount (index 0)
                const amountValidation = validations[0];
                
                expect(amountValidation.failure).toBe(true);
                expect(amountValidation.notice.type).toBe(helpers.noticeHelper.invalidBet);
            });

            it("should fail when amount is negative", () => {
                const request = { ...validRequest, amount: -100 };
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                // The first validation should be for amount (index 0)
                const amountValidation = validations[0];
                
                expect(amountValidation.failure).toBe(true);
                expect(amountValidation.notice.type).toBe(helpers.noticeHelper.invalidBet);
            });
        });

        describe("betChoice validation", () => {
            it("should fail when betChoice is missing", () => {
                const request = { ...validRequest, betChoice: undefined } as any;
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                // betChoice validation is from the parent class (last validation)
                const betChoiceValidation = validations[validations.length - 1];
                
                expect(betChoiceValidation.failure).toBe(true);
                expect(betChoiceValidation.notice.type).toBe("INVALID_BET_CHOICE");
            });

            it("should fail when betChoice is invalid", () => {
                const request = { ...validRequest, betChoice: "invalid" };
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                // betChoice validation is from the parent class (last validation)
                const betChoiceValidation = validations[validations.length - 1];
                
                expect(betChoiceValidation.failure).toBe(true);
                expect(betChoiceValidation.notice.type).toBe("INVALID_BET_CHOICE");
            });

            it("should fail when betChoice is empty string", () => {
                const request = { ...validRequest, betChoice: "" };
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                // betChoice validation is from the parent class (last validation)
                const betChoiceValidation = validations[validations.length - 1];
                
                expect(betChoiceValidation.failure).toBe(true);
                expect(betChoiceValidation.notice.type).toBe("INVALID_BET_CHOICE");
            });
        });

        describe("redTunnel validation", () => {
            it("should fail when redTunnel is missing", () => {
                const request = { ...validRequest, redTunnel: undefined } as any;
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                // redTunnel presence validation is at index 1
                const redTunnelValidation = validations[1];
                
                expect(redTunnelValidation.failure).toBe(true);
                expect(redTunnelValidation.notice.type).toBe(helpers.noticeHelper.invalidBet);
            });

            it("should fail when redTunnel is null", () => {
                const request = { ...validRequest, redTunnel: null } as any;
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                // redTunnel presence validation is at index 1
                const redTunnelValidation = validations[1];
                
                expect(redTunnelValidation.failure).toBe(true);
                expect(redTunnelValidation.notice.type).toBe(helpers.noticeHelper.invalidBet);
            });

            it("should fail when redTunnel is less than 1", () => {
                const request = { ...validRequest, redTunnel: 0 };
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                // redTunnel range validation is at index 3
                const redTunnelValidation = validations[3];
                
                expect(redTunnelValidation.failure).toBe(true);
                expect(redTunnelValidation.notice.type).toBe(helpers.noticeHelper.invalidBet);
            });

            it("should fail when redTunnel is greater than 6", () => {
                const request = { ...validRequest, redTunnel: 7 };
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                // redTunnel range validation is at index 3
                const redTunnelValidation = validations[3];
                
                expect(redTunnelValidation.failure).toBe(true);
                expect(redTunnelValidation.notice.type).toBe(helpers.noticeHelper.invalidBet);
            });

            it("should fail when redTunnel is not an integer", () => {
                const request = { ...validRequest, redTunnel: 1.5 };
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                // redTunnel range validation is at index 3
                const redTunnelValidation = validations[3];
                
                expect(redTunnelValidation.failure).toBe(true);
                expect(redTunnelValidation.notice.type).toBe(helpers.noticeHelper.invalidBet);
            });
        });

        describe("blueTunnel validation", () => {
            it("should fail when blueTunnel is missing", () => {
                const request = { ...validRequest, blueTunnel: undefined } as any;
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                // blueTunnel presence validation is at index 2
                const blueTunnelValidation = validations[2];
                
                expect(blueTunnelValidation.failure).toBe(true);
                expect(blueTunnelValidation.notice.type).toBe(helpers.noticeHelper.invalidBet);
            });

            it("should fail when blueTunnel is null", () => {
                const request = { ...validRequest, blueTunnel: null } as any;
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                // blueTunnel presence validation is at index 2
                const blueTunnelValidation = validations[2];
                
                expect(blueTunnelValidation.failure).toBe(true);
                expect(blueTunnelValidation.notice.type).toBe(helpers.noticeHelper.invalidBet);
            });

            it("should fail when blueTunnel is less than 1", () => {
                const request = { ...validRequest, blueTunnel: 0 };
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                // blueTunnel range validation is at index 4
                const blueTunnelValidation = validations[4];
                
                expect(blueTunnelValidation.failure).toBe(true);
                expect(blueTunnelValidation.notice.type).toBe(helpers.noticeHelper.invalidBet);
            });

            it("should fail when blueTunnel is greater than 6", () => {
                const request = { ...validRequest, blueTunnel: 7 };
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                // blueTunnel range validation is at index 4
                const blueTunnelValidation = validations[4];
                
                expect(blueTunnelValidation.failure).toBe(true);
                expect(blueTunnelValidation.notice.type).toBe(helpers.noticeHelper.invalidBet);
            });

            it("should fail when blueTunnel is not an integer", () => {
                const request = { ...validRequest, blueTunnel: 1.5 };
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                // blueTunnel range validation is at index 4
                const blueTunnelValidation = validations[4];
                
                expect(blueTunnelValidation.failure).toBe(true);
                expect(blueTunnelValidation.notice.type).toBe(helpers.noticeHelper.invalidBet);
            });
        });

        describe("tunnel combination validation", () => {
            it("should fail when redTunnel and blueTunnel are the same", () => {
                const sameTunnelCases = [1, 2, 3, 4, 5, 6];
                
                sameTunnelCases.forEach(tunnelValue => {
                    const request = { ...validRequest, redTunnel: tunnelValue, blueTunnel: tunnelValue };
                    const validations = placeBetConsumer.validateBetRequestParams(request);
                    
                    // Tunnel combination validation is at index 5
                    const tunnelCombinationValidation = validations[5];
                    
                    expect(tunnelCombinationValidation.failure).toBe(true);
                    expect(tunnelCombinationValidation.notice.type).toBe(helpers.noticeHelper.invalidBet);
                });
            });

            it("should pass when redTunnel and blueTunnel are different", () => {
                const differentTunnelCases = [
                    { redTunnel: 1, blueTunnel: 2 },
                    { redTunnel: 3, blueTunnel: 6 },
                    { redTunnel: 5, blueTunnel: 1 }
                ];
                
                differentTunnelCases.forEach(tunnelCase => {
                    const request = { ...validRequest, ...tunnelCase };
                    const validations = placeBetConsumer.validateBetRequestParams(request);
                    
                    // Tunnel combination validation is at index 5
                    const tunnelCombinationValidation = validations[5];
                    
                    expect(tunnelCombinationValidation.failure).toBe(false);
                });
            });
        });

        describe("multiple validation failures", () => {
            it("should return multiple failures when multiple validations fail", () => {
                const invalidRequest = {
                    amount: 0,          // Invalid amount
                    betChoice: "invalid", // Invalid bet choice
                    redTunnel: undefined, // Missing redTunnel
                    blueTunnel: 7        // Invalid blueTunnel range
                };
                
                const validations = placeBetConsumer.validateBetRequestParams(invalidRequest);
                const failures = validations.filter(v => v.failure === true);
                
                expect(failures.length).toBeGreaterThan(1);
                expect(failures.every(f => f.notice.type.length > 0)).toBe(true);
            });

            it("should handle edge case with undefined values", () => {
                const invalidRequest = {};
                
                const validations = placeBetConsumer.validateBetRequestParams(invalidRequest);
                const failures = validations.filter(v => v.failure === true);
                
                expect(failures.length).toBeGreaterThan(0);
            });
        });

        describe("boundary value testing", () => {
            it("should pass validation for valid boundary values", () => {
                const boundaryTestCases = [
                    { redTunnel: 1, blueTunnel: 6 },
                    { redTunnel: 6, blueTunnel: 1 }
                ];

                boundaryTestCases.forEach(testCase => {
                    const request = { ...validRequest, ...testCase };
                    const validations = placeBetConsumer.validateBetRequestParams(request);
                    
                    expect(validations.every(validation => validation.failure === false)).toBe(true);
                });
            });

            it("should fail validation for invalid boundary values", () => {
                const invalidBoundaryTestCases = [
                    { redTunnel: 0, blueTunnel: 2 },   // redTunnel too low
                    { redTunnel: 7, blueTunnel: 2 },   // redTunnel too high
                    { redTunnel: 2, blueTunnel: 0 },   // blueTunnel too low
                    { redTunnel: 2, blueTunnel: 7 }    // blueTunnel too high
                ];

                invalidBoundaryTestCases.forEach(testCase => {
                    const request = { ...validRequest, ...testCase };
                    const validations = placeBetConsumer.validateBetRequestParams(request);
                    
                    const hasFailures = validations.some(validation => validation.failure === true);
                    expect(hasFailures).toBe(true);
                });
            });
        });
    });
});