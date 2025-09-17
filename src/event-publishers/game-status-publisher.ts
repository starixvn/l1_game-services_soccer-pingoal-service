import { Core } from "sc-game-base";

/**
 * Task List
 * 1. Let's override the `publishStartGame` method that remove the `remainingTime` property from the payload
 */

export default class GameStatusPublisher extends Core.BaseEventPublishers.GameStatusPublisher {}
