import { Core } from "sc-game-base";
import { helpers } from "sc-common";
import { BET_CHOICES } from "../constants";

/**
 * Task List
 * 1. ✅ Validate for new properties: redTunnel, blueTunnel - COMPLETED
 *    - Added validation for redTunnel and blueTunnel properties
 *    - Validates range (1-6) and ensures they are different values
 * 2. ✅ Validate betChoice against BET_CHOICES - COMPLETED
 *    - Added validation to ensure betChoice is one of: "blue", "red", "draw"
 *    - Provides specific error messages with valid options
 * 
 * Note: Round ID management is now handled in ProcessBetQueue.generateNewRoundId()
 * Each bet gets a unique round ID in single-player mode.
 */

export default class PlaceBetConsumer extends Core.BaseEventConsumers.PlaceBetConsumer {
    validateBetRequestParams(request: any) {
        const { betChoice, amount, redTunnel, blueTunnel } = request;

        // Get valid bet choices for validation
        const validBetChoices = Object.values(BET_CHOICES);

        return [
            // Amount validation
            {
                failure: !amount || amount <= 0,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet, { message: "Amount is required and must be greater than 0" }),
            },
            // BetChoice presence validation
            {
                failure: !betChoice,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet, { message: "BetChoice is required" }),
            },
            // BetChoice value validation - must be one of valid choices
            {
                failure: betChoice && !validBetChoices.includes(betChoice),
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet, { 
                    message: `BetChoice must be one of: ${validBetChoices.join(', ')}. Received: ${betChoice}` 
                }),
            },
            // Validation for tunnel properties presence
            {
                failure: redTunnel === undefined || redTunnel === null,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet, { message: "redTunnel is required" }),
            },
            {
                failure: blueTunnel === undefined || blueTunnel === null,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet, { message: "blueTunnel is required" }),
            },
            // Validation for tunnel range (1-6)
            {
                failure: redTunnel !== undefined && redTunnel !== null && (redTunnel < 1 || redTunnel > 6 || !Number.isInteger(redTunnel)),
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet, { message: "redTunnel must be an integer between 1 and 6" }),
            },
            {
                failure: blueTunnel !== undefined && blueTunnel !== null && (blueTunnel < 1 || blueTunnel > 6 || !Number.isInteger(blueTunnel)),
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet, { message: "blueTunnel must be an integer between 1 and 6" }),
            },
            // Validation that player's tunnel selections are different
            {
                failure: redTunnel !== undefined && blueTunnel !== undefined && 
                        redTunnel !== null && blueTunnel !== null && redTunnel === blueTunnel,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet, { message: "redTunnel and blueTunnel selections cannot be the same" }),
            },
        ];
    }

}
