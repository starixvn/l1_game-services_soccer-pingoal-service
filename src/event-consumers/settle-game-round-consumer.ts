import { Core } from "sc-game-base";

/**
 * This consumer will be called by ProcessBetQueue after processing bet successfully
 *
 * The main flow:
 * 1. Generate result
 * 2. Calculate settlementResult
 * 3. Insert round to rounds table
 * 4. Publish round result to player
 * 5. Settle bets in bets table
 * 6. Publish bet's settlement result to player
 */

export default class SettleGameRoundConsumer extends Core.BaseEventConsumers.SettleGameRoundConsumer {}
