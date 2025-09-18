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

describe("PlaceBetConsumer", () => {
    let placeBetConsumer: PlaceBetConsumer;

    beforeEach(() => {
        // Mock the constructor parameters - definition, registrationOptions, gameSettings
        const mockDefinition = {} as any;
        const mockRegistrationOptions = {} as any;
        const mockGameSettings = {} as any;
        
        placeBetConsumer = new PlaceBetConsumer(mockDefinition, mockRegistrationOptions, mockGameSettings);
        
        // Mock the getNoticeObj method
        placeBetConsumer.getNoticeObj = jest.fn().mockImplementation((type, data) => ({
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

                testCases.forEach(tunnels => {
                    const request = { ...validRequest, ...tunnels };
                    const validations = placeBetConsumer.validateBetRequestParams(request);
                    
                    expect(validations.every(validation => validation.failure === false)).toBe(true);
                });
            });
        });

        describe("amount validation", () => {
            it("should fail when amount is missing", () => {
                const request = { ...validRequest, amount: undefined } as any;
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                const amountValidation = validations.find(v => v.notice.message?.includes("Amount is required"));
                
                expect(amountValidation?.failure).toBe(true);
                expect(amountValidation?.notice.type).toBe(helpers.noticeHelper.invalidBet);
                expect(amountValidation?.notice.message).toBe("Amount is required and must be greater than 0");
            });

            it("should fail when amount is zero", () => {
                const request = { ...validRequest, amount: 0 };
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                const amountValidation = validations.find(v => v.notice.message?.includes("Amount is required"));
                
                expect(amountValidation?.failure).toBe(true);
            });

            it("should fail when amount is negative", () => {
                const request = { ...validRequest, amount: -100 };
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                const amountValidation = validations.find(v => v.notice.message?.includes("Amount is required"));
                
                expect(amountValidation?.failure).toBe(true);
            });
        });

        describe("betChoice validation", () => {
            it("should fail when betChoice is missing", () => {
                const request = { ...validRequest, betChoice: undefined } as any;
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                const betChoiceValidation = validations.find(v => v.notice.message === "BetChoice is required");
                
                expect(betChoiceValidation?.failure).toBe(true);
                expect(betChoiceValidation?.notice.type).toBe(helpers.noticeHelper.invalidBet);
            });

            it("should fail when betChoice is invalid", () => {
                const request = { ...validRequest, betChoice: "invalid" };
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                const betChoiceValidation = validations.find(v => v.notice.message?.includes("BetChoice must be one of"));
                
                expect(betChoiceValidation?.failure).toBe(true);
                expect(betChoiceValidation?.notice.type).toBe(helpers.noticeHelper.invalidBet);
                expect(betChoiceValidation?.notice.message).toBe(
                    `BetChoice must be one of: ${Object.values(BET_CHOICES).join(', ')}. Received: invalid`
                );
            });

            it("should fail when betChoice is empty string", () => {
                const request = { ...validRequest, betChoice: "" };
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                
                // Empty string should fail the "BetChoice is required" validation since !betChoice is true for ""
                const requiredValidation = validations.find(v => v.notice.message === "BetChoice is required");
                expect(requiredValidation?.failure).toBe(true);
            });
        });

        describe("redTunnel validation", () => {
            it("should fail when redTunnel is missing", () => {
                const request = { ...validRequest, redTunnel: undefined } as any;
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                const redTunnelValidation = validations.find(v => v.notice.message === "redTunnel is required");
                
                expect(redTunnelValidation?.failure).toBe(true);
                expect(redTunnelValidation?.notice.type).toBe(helpers.noticeHelper.invalidBet);
            });

            it("should fail when redTunnel is null", () => {
                const request = { ...validRequest, redTunnel: null };
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                const redTunnelValidation = validations.find(v => v.notice.message === "redTunnel is required");
                
                expect(redTunnelValidation?.failure).toBe(true);
            });

            it("should fail when redTunnel is less than 1", () => {
                const request = { ...validRequest, redTunnel: 0 };
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                const redTunnelValidation = validations.find(v => v.notice.message?.includes("redTunnel must be an integer"));
                
                expect(redTunnelValidation?.failure).toBe(true);
                expect(redTunnelValidation?.notice.message).toBe("redTunnel must be an integer between 1 and 6");
            });

            it("should fail when redTunnel is greater than 6", () => {
                const request = { ...validRequest, redTunnel: 7 };
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                const redTunnelValidation = validations.find(v => v.notice.message?.includes("redTunnel must be an integer"));
                
                expect(redTunnelValidation?.failure).toBe(true);
            });

            it("should fail when redTunnel is not an integer", () => {
                const request = { ...validRequest, redTunnel: 1.5 };
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                const redTunnelValidation = validations.find(v => v.notice.message?.includes("redTunnel must be an integer"));
                
                expect(redTunnelValidation?.failure).toBe(true);
            });
        });

        describe("blueTunnel validation", () => {
            it("should fail when blueTunnel is missing", () => {
                const request = { ...validRequest, blueTunnel: undefined } as any;
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                const blueTunnelValidation = validations.find(v => v.notice.message === "blueTunnel is required");
                
                expect(blueTunnelValidation?.failure).toBe(true);
                expect(blueTunnelValidation?.notice.type).toBe(helpers.noticeHelper.invalidBet);
            });

            it("should fail when blueTunnel is null", () => {
                const request = { ...validRequest, blueTunnel: null };
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                const blueTunnelValidation = validations.find(v => v.notice.message === "blueTunnel is required");
                
                expect(blueTunnelValidation?.failure).toBe(true);
            });

            it("should fail when blueTunnel is less than 1", () => {
                const request = { ...validRequest, blueTunnel: 0 };
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                const blueTunnelValidation = validations.find(v => v.notice.message?.includes("blueTunnel must be an integer"));
                
                expect(blueTunnelValidation?.failure).toBe(true);
                expect(blueTunnelValidation?.notice.message).toBe("blueTunnel must be an integer between 1 and 6");
            });

            it("should fail when blueTunnel is greater than 6", () => {
                const request = { ...validRequest, blueTunnel: 7 };
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                const blueTunnelValidation = validations.find(v => v.notice.message?.includes("blueTunnel must be an integer"));
                
                expect(blueTunnelValidation?.failure).toBe(true);
            });

            it("should fail when blueTunnel is not an integer", () => {
                const request = { ...validRequest, blueTunnel: 2.5 };
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                const blueTunnelValidation = validations.find(v => v.notice.message?.includes("blueTunnel must be an integer"));
                
                expect(blueTunnelValidation?.failure).toBe(true);
            });
        });

        describe("tunnel combination validation", () => {
            it("should fail when redTunnel and blueTunnel are the same", () => {
                const testCases = [1, 2, 3, 4, 5, 6];
                
                testCases.forEach(tunnelValue => {
                    const request = { ...validRequest, redTunnel: tunnelValue, blueTunnel: tunnelValue };
                    
                    const validations = placeBetConsumer.validateBetRequestParams(request);
                    const tunnelCombinationValidation = validations.find(v => 
                        v.notice.message === "redTunnel and blueTunnel selections cannot be the same"
                    );
                    
                    expect(tunnelCombinationValidation?.failure).toBe(true);
                    expect(tunnelCombinationValidation?.notice.type).toBe(helpers.noticeHelper.invalidBet);
                });
            });

            it("should pass when redTunnel and blueTunnel are different", () => {
                const testCases = [
                    { redTunnel: 1, blueTunnel: 2 },
                    { redTunnel: 3, blueTunnel: 6 },
                    { redTunnel: 5, blueTunnel: 1 }
                ];
                
                testCases.forEach(tunnels => {
                    const request = { ...validRequest, ...tunnels };
                    
                    const validations = placeBetConsumer.validateBetRequestParams(request);
                    const tunnelCombinationValidation = validations.find(v => 
                        v.notice.message === "redTunnel and blueTunnel selections cannot be the same"
                    );
                    
                    expect(tunnelCombinationValidation?.failure).toBe(false);
                });
            });
        });

        describe("multiple validation failures", () => {
            it("should return multiple failures when multiple validations fail", () => {
                const request = {
                    amount: -100,
                    betChoice: "invalid",
                    redTunnel: 7,
                    blueTunnel: 0
                };
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                const failures = validations.filter(v => v.failure === true);
                
                // Should have failures for: amount, betChoice, redTunnel range, blueTunnel range
                expect(failures.length).toBeGreaterThanOrEqual(4);
            });

            it("should handle edge case with undefined values", () => {
                const request = {
                    amount: undefined,
                    betChoice: undefined,
                    redTunnel: undefined,
                    blueTunnel: undefined
                };
                
                const validations = placeBetConsumer.validateBetRequestParams(request);
                const failures = validations.filter(v => v.failure === true);
                
                // Should have failures for all required fields
                expect(failures.length).toBeGreaterThanOrEqual(4);
            });
        });

        describe("boundary value testing", () => {
            it("should pass validation for valid boundary values", () => {
                const validBoundaryTests = [
                    { ...validRequest, amount: 1, redTunnel: 1, blueTunnel: 6 },
                    { ...validRequest, amount: 0.01, redTunnel: 6, blueTunnel: 1 }
                ];

                validBoundaryTests.forEach(request => {
                    const validations = placeBetConsumer.validateBetRequestParams(request);
                    const failures = validations.filter(v => v.failure === true);
                    
                    expect(failures.length).toBe(0);
                });
            });

            it("should fail validation for invalid boundary values", () => {
                const invalidBoundaryTests = [
                    { ...validRequest, amount: 0, redTunnel: 0, blueTunnel: 7 },
                    { ...validRequest, amount: -0.01, redTunnel: -1, blueTunnel: 8 }
                ];

                invalidBoundaryTests.forEach(request => {
                    const validations = placeBetConsumer.validateBetRequestParams(request);
                    const failures = validations.filter(v => v.failure === true);
                    
                    expect(failures.length).toBeGreaterThan(0);
                });
            });
        });
    });
});
