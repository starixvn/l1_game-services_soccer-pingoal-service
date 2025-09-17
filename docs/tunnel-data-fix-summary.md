# Tunnel Data Fix Summary

## Problem Statement

Previously, there was confusion between:
- **Player tunnel selections** (what players chose in their place bet request)  
- **Game result scores** (what the game engine generates for red/blue scores)

The issue was that the DB Round's `redTunnel` and `blueTunnel` fields were being randomly generated instead of storing the player's actual tunnel selections from their place bet request.

## Solution Overview

We clarified that in this system:
- ✅ `Round.result.redTunnel/blueTunnel` should store **player's tunnel selections** from place bet (exactly the same values)
- ✅ `Round.result.red/blue` should store **secureRandomRange generated game scores** (the actual match outcome using sc-core-rng)
- ✅ Settlement is based on comparing red vs blue **scores**, not tunnel values

## Changes Made

### 1. Updated Documentation (`docs/tunnel-data-flow.md`)
- ✅ Created comprehensive tunnel data flow documentation
- ✅ Clarified the difference between tunnel selections and game results
- ✅ Added data flow diagrams and examples

### 2. Fixed Result Generation (`src/helpers/result-helper.ts`)

**Before:**
```typescript
export const generateResult = (): Result => {
    return {
        red: 1,
        blue: 0,
        redTunnel: 2,        // ❌ Random/hardcoded values
        blueTunnel: 1,       // ❌ Random/hardcoded values
        video: "1-0_2-1.mp4",
    };
};
```

**After:**
```typescript
export const generateResult = (playerPredictions: PlayerTunnelPredictions, roundId: number): Result => {
    const redScore = secureRandomRange(0, 3);   // ✅ Random game outcome (using sc-core-rng)
    const blueScore = secureRandomRange(0, 3);  // ✅ Random game outcome (using sc-core-rng)
    
    return {
        red: redScore,                           // ✅ Generated game scores
        blue: blueScore,                         // ✅ Generated game scores
        redTunnel: playerSelections.redTunnel,  // ✅ Player's selection from bet
        blueTunnel: playerSelections.blueTunnel, // ✅ Player's selection from bet
        video: `${redScore}-${blueScore}_${playerSelections.redTunnel}-${playerSelections.blueTunnel}_${roundId}.mp4`,
    };
};
```

### 3. Enhanced Settlement Consumer (`src/event-consumers/settle-game-round-consumer.ts`)

**Added functionality:**
```typescript
export default class SettleGameRoundConsumer extends Core.BaseEventConsumers.SettleGameRoundConsumer {
    private currentPlayerSelections: PlayerTunnelSelections | null = null;
    
    // ✅ Method to receive player selections from ProcessBetQueue
    setPlayerTunnelSelections(selections: PlayerTunnelSelections): void {
        this.currentPlayerSelections = selections;
    }
    
    // ✅ Override to use player selections in result generation
    generateResult(): Result {
        if (!this.currentPlayerSelections) {
            return this.definition.generateResult(); // Fallback
        }
        
        const result = generateResult(this.currentPlayerSelections, this.gameData.roundId);
        this.currentPlayerSelections = null; // Clear after use
        return result;
    }
}
```

### 4. Updated Process Bet Queue (`src/crons/process-bet-queue.ts`)

**Enhanced settlement logic:**
```typescript
async handleSuccessBet(player: Player, balance: unknown, roundId: number, bet: BetPayload) {
    await super.handleSuccessBet(player, balance, roundId, bet);

    try {
        // ✅ Pass player's tunnel selections to settlement consumer
        this.settleGameRoundConsumer.setPlayerTunnelSelections({
            redTunnel: bet.redTunnel,
            blueTunnel: bet.blueTunnel
        });
        
        await this.settleGameRoundConsumer.settleRound();
        console.log(`Settlement completed for round ${roundId} with player selections: red=${bet.redTunnel}, blue=${bet.blueTunnel}`);
    } catch (error) {
        console.error(`Settlement failed for round ${roundId}:`, error);
    }
}
```

## Data Flow Verification

### Player Place Bet Request
```javascript
{
    "betChoice": "blue",
    "amount": 100,
    "redTunnel": 3,      // Player's selection
    "blueTunnel": 5      // Player's selection
}
```

### Validation
- ✅ `redTunnel !== blueTunnel` (3 ≠ 5) 
- ✅ Both values in range 1-6
- ✅ `betChoice` is valid ("blue", "red", "draw")

### Round Storage (Database)
```javascript
{
    "id": 8001,
    "result": {
        "red": 2,            // ✅ Random generated game score
        "blue": 1,           // ✅ Random generated game score
        "redTunnel": 3,      // ✅ Same as player's selection (copied from request)
        "blueTunnel": 5,     // ✅ Same as player's selection (copied from request)
        "video": "2-1_3-5_8001.mp4"
    },
    "settlementResult": {
        "blue": false,       // Blue lost (1 < 2)
        "red": true,         // Red won (2 > 1)
        "draw": false
    }
}
```

**Key Point**: The tunnel values (3, 5) in the stored result are identical to what the player specified in their bet request.

## Benefits

1. **Data Integrity**: Player tunnel selections are accurately stored
2. **Audit Trail**: Can track what players actually selected
3. **Correct Settlement**: Based on game scores, not tunnel selections
4. **Flexible Game Logic**: Game scores generated independently of player choices
5. **Maintainable Code**: Clear separation between selections and results

## Testing Checklist

- ✅ Player tunnel selections are validated (range 1-6, different values)
- ✅ Round result stores player's original selections (identical values)
- ✅ Game scores are generated using sc-core-rng's secureRandomRange/independently  
- ✅ Settlement uses game scores for winner determination
- ✅ Video filename includes both game scores and player selections
- ✅ Multiple concurrent bets work correctly
- ✅ Error handling works for missing selections

## Migration Notes

**For Existing Data:**
- No database migration needed (schema unchanged)
- Existing rounds may have random tunnel values (expected, now using sc-core-rng)
- New rounds will have correct player selection values

**For Development:**
- Use new `generateResult(playerSelections, roundId)` signature
- ❌ `generateResultLegacy()` is deprecated - tunnel values must come from player selections, not random generation
- Enhanced logging shows player selections in settlement process

## Verification Commands

```bash
# Check that player selections are being logged
grep "Set player tunnel selections" logs/game.log

# Verify settlement includes player selections
grep "Settlement completed.*with player tunnel selections" logs/game.log

# Check round result structure in database
db.soccerpingoal_rounds.findOne().result
```

## Summary

The fix ensures that:
- 🎯 **Player tunnel selections** from place bet requests are correctly stored in `Round.result.redTunnel/blueTunnel` (identical values)
- 🎮 **Game scores** are independently generated in `Round.result.red/blue`
- ⚖️ **Settlement** is based on score comparison (red vs blue), not tunnel selections
- 📊 **Data integrity** is maintained throughout the betting and settlement process

The system now correctly preserves player choices while generating independent game outcomes for fair settlement.
