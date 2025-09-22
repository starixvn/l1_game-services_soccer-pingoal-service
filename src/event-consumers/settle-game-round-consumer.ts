import { Core } from "sc-game-base";
import { generateResult } from "../helpers/result-helper";
import { Result } from "../models/rounds";

/**
 * This consumer will be called by ProcessBetQueue after processing bet successfully
 *
 * The main flow:
 * 1. Generate result with player's specified tunnel choices
 * 2. Calculate settlementResult
 * 3. Insert round to rounds table
 * 4. Publish round result to player
 * 5. Settle bets in bets table
 * 6. Publish bet's settlement result to player
 * 7. Publish game status to player
 */

interface PlayerTunnelSelections {
    redTunnel: number;   // Player's specified red tunnel choice (1-6)
    blueTunnel: number;  // Player's specified blue tunnel choice (1-6)
}

export default class SettleGameRoundConsumer extends Core.BaseEventConsumers.SettleGameRoundConsumer {
    private currentPlayerSelections: PlayerTunnelSelections | null = null;
    
    /**
     * Set the current player's tunnel selections before settlement
     * This should be called by ProcessBetQueue before settling the round
     */
    setPlayerTunnelSelections(selections: PlayerTunnelSelections): void {
        this.currentPlayerSelections = selections;
        console.log(`Set player tunnel selections: red=${selections.redTunnel}, blue=${selections.blueTunnel}`);
    }
    
    /**
     * Override generateResult to use player's specified tunnel choices
     * instead of random values
     */
    generateResult(): Result {
        if (!this.currentPlayerSelections) {
            console.warn("No player tunnel selections available, using legacy random generation");
            return this.definition.generateResult();
        }
        
        console.log(`Generating result for round ${this.gameData.roundId} with player tunnel selections`);
        
        // Generate result with player's specified tunnel choices
        const result = generateResult(this.currentPlayerSelections, this.gameData.roundId);
        
        // Clear selections after use
        this.currentPlayerSelections = null;
        
        return result;
    }
}
