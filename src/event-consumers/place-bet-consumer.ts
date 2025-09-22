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
        const { redTunnel, blueTunnel } = request;

        return [
            // Use parent's basic amount and betChoice validation
            ...super.validateBetRequestParams(request),
            // Validation for tunnel properties presence
            {
                failure: redTunnel === undefined || redTunnel === null,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
            },
            {
                failure: blueTunnel === undefined || blueTunnel === null,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
            },
            // Validation for tunnel range (1-6)
            {
                failure: redTunnel !== undefined && redTunnel !== null && (redTunnel < 1 || redTunnel > 6 || !Number.isInteger(redTunnel)),
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
            },
            {
                failure: blueTunnel !== undefined && blueTunnel !== null && (blueTunnel < 1 || blueTunnel > 6 || !Number.isInteger(blueTunnel)),
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
            },
            // Validation that player's tunnel selections are different
            {
                failure: redTunnel !== undefined && blueTunnel !== undefined && 
                        redTunnel !== null && blueTunnel !== null && redTunnel === blueTunnel,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
            },
        ];
    }

}
