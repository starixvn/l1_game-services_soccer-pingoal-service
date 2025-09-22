import { Core } from "sc-game-base";
import { helpers } from "sc-common";

/**
 * Task List
 * 1. ✅ Validate for new properties: redTunnel, blueTunnel - COMPLETED
 *    - Added validation for redTunnel and blueTunnel properties
 *    - Validates range (1-6) and ensures they are different values
 * 2. Increase the round ID in `this.gameData.roundId` and assign roundId to bet's payload.
 * This is important to make sure each bet is linked to the single round (1-1 relationship).
 */

export default class PlaceBetConsumer extends Core.BaseEventConsumers.PlaceBetConsumer {
    validateBetRequestParams(request: any) {
        const { betChoice, amount, redTunnel, blueTunnel } = request;

        return [
            // Basic validation for existing properties
            {
                failure: !amount || !betChoice,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
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
            // Validation that tunnels are different
            {
                failure: redTunnel !== undefined && blueTunnel !== undefined && 
                        redTunnel !== null && blueTunnel !== null && redTunnel === blueTunnel,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet, { message: "redTunnel and blueTunnel cannot be the same" }),
            },
        ];
    }

}
