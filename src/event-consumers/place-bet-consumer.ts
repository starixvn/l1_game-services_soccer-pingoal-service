import { Core } from "sc-game-base";

/**
 * TODO List
 * 1. Validate for new properties: redTunnel, blueTunnel
 * 2. Increase the round ID in `this.gameData.roundId` and assign roundId to bet's payload.
 * This is important to make sure each bet is linked to the single round (1-1 relationship).
 */

export default class PlaceBetConsumer extends Core.BaseEventConsumers.PlaceBetConsumer {}
