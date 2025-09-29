# GetRoundIdByPayload - Code Modification Plan

Besides PlaceBetConsumer, the following places that currently use `this.gameData.roundId` need to be changed to get `payload.roundId`:

## 1. src/event-consumers/settle-game-round-consumer.ts

### Areas that need modification:

**Line 92** - Save original roundId in settleRoundWithSelections method
```typescript
const originalRoundId = this.gameData.roundId;  // ← Need to change to get from payload
```

**Line 93** - Set roundId
```typescript
this.gameData.roundId = assignedRoundId;  // ← Logic may need adjustment
```

**Line 101** - Restore original roundId in error handling
```typescript
this.gameData.roundId = originalRoundId;  // ← Need to adjust accordingly
```

**Line 193** - Log output
```typescript
console.log(`Generating result for round ${this.gameData.roundId} with player tunnel selections`);  // ← Need to change to get from payload
```

**Line 199** - Parameter passed to generateResult
```typescript
return generateResult(
    this.currentPlayerSelections, 
    this.gameData.roundId,  // ← Need to change to get from payload
    this.gameData,
    this.currentPlayerInfo?.nickname
);
```

### Modification Details:
- The `settleRoundWithSelections` method needs to receive a payload parameter containing roundId
- Related log outputs and parameter passing need to get roundId from payload
- Need to redesign roundId management logic, avoiding direct modification of `this.gameData.roundId`

## Summary

Total files that need modification: 1
1. **settle-game-round-consumer.ts** - 5 modification points

### Main Modification Directions:
1. Method signatures need to add payload parameter
2. Change `this.gameData.roundId` to `payload.roundId`
3. Redesign roundId management and passing logic
4. Ensure all related log outputs and parameter passing use the correct roundId source

### Important Notes:
- Need to ensure payload structure contains roundId field
- Need to check all places that call these methods, ensuring correct payload passing
