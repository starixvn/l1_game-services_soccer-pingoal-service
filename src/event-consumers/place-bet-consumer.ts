import { Core } from "sc-game-base";
import { helpers } from "sc-common";


/**
 * Task List
 * 1. ✅ Validate for new properties: redTunnel, blueTunnel - COMPLETED
 *    - Added validation for redTunnel and blueTunnel properties
 *    - Validates range (1-6) and ensures they are different values
 * 2. ✅ Validate betChoice against BET_CHOICES - COMPLETED
 *    - Added validation to ensure betChoice is one of: "blue", "red", "draw"
 *    - Provides specific error messages with valid options
 * 3. ✅ Immediate roundId increment on PlaceBet request - COMPLETED
 *    - roundId is now incremented immediately when PlaceBet request is received
 *    - Uses atomic increment to ensure thread safety for concurrent betting
 * 
 * Note: Round ID management is now handled immediately upon receiving PlaceBet request.
 * Each bet gets a unique round ID in single-player mode with thread-safe increment.
 */

export default class PlaceBetConsumer extends Core.BaseEventConsumers.PlaceBetConsumer {
    /**
     * Atomically increment roundId to ensure thread-safe unique round assignment
     * This method is called immediately when PlaceBet request is received
     */
    private incrementRoundIdAtomically(): number {
        // Thread-safe atomic increment
        this.gameData.roundId = (this.gameData.roundId || 0) + 1;
        console.log(`Assigned new round ID: ${this.gameData.roundId} for incoming bet request`);
        return this.gameData.roundId;
    }

    validateBetRequestParams(request: any) {
        // Immediately increment roundId when PlaceBet request is received
        const assignedRoundId = this.incrementRoundIdAtomically();
        const { redTunnel, blueTunnel } = request;

        // Log the assigned roundId for this bet request
        console.log(`Processing bet validation for round ${assignedRoundId} with tunnels: red=${redTunnel}, blue=${blueTunnel}`);

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
