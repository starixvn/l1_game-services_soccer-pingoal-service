# Odds V3 Implementation Summary

## Overview

Successfully implemented Odds Specification V3's **tunnel-specific odds extraction and storage mechanism**, ensuring that each bet record stores only 3 odds values (red, blue, draw) relevant to the bet's tunnel combination, instead of storing all 90 odds values.

## Implementation Date

2025-10-27

## Implementation Details

### 1. Added Helper Function (`src/helpers/index.ts`)

#### `extractTunnelOdds()`

```typescript
export const extractTunnelOdds = (
    flatOdds: Record<string, number>,
    redTunnel: number,
    blueTunnel: number
): { red: number; blue: number; draw: number }
```

**Functionality**:
- Extract odds for a specific tunnel combination from V3 flat odds structure
- Input: V3 flat odds object, redTunnel (1-6), blueTunnel (1-6)
- Output: Object containing red, blue, draw odds

**Error Handling**:
- Throws detailed error message when any odds value (red/blue/draw) is missing
- Error message includes expected key names for easier debugging

**Test Coverage**:
- ✅ Correctly extracts odds for different tunnel combinations
- ✅ Error handling when odds are missing
- ✅ Edge cases (0 values, large values, precision)
- ✅ All valid tunnel numbers (1-6)

### 2. Override `upsertBet()` Method (`src/crons/process-bet-queue.ts`)

#### Before (Base Class Behavior)
```javascript
// sc-game-base ProcessBetQueue
odds: configs.odds  // Stores entire odds object (90 values)
```

#### After
```typescript
// Extract tunnel-specific odds from V3 flat structure
const tunnelSpecificOdds = extractTunnelOdds(
    configs.odds,
    bet.redTunnel,
    bet.blueTunnel
);

const newBet = {
    // ... other fields
    odds: tunnelSpecificOdds,  // Only stores 3 values: { red, blue, draw }
    redTunnel: bet.redTunnel,  // Store tunnel selection for reference
    blueTunnel: bet.blueTunnel,
};
```

**Key Improvements**:
1. **Storage Optimization**: Each bet stores only 3 odds values instead of 90
2. **Correctness**: Ensures stored odds correspond to the player's chosen tunnel combination
3. **Traceability**: Also stores `redTunnel` and `blueTunnel` for easier querying and debugging

**Test Coverage**:
- ✅ Correctly calls `extractTunnelOdds` with proper parameters
- ✅ Stored bet records contain correct odds and tunnel information
- ✅ Supports different tunnel combinations
- ✅ Error handling (odds extraction failure)
- ✅ Handles clientSeed and session information
- ✅ Works correctly without session

### 3. Unit Tests

#### New Test Files
- `tests/unit-tests/helpers/extract-tunnel-odds.test.ts` (13 tests)

#### Updated Test Files
- `tests/unit-tests/crons/process-bet-queue.test.ts` (added 6 upsertBet tests)

#### Test Results
```
Test Suites: 8 passed, 8 total
Tests:       110 passed, 110 total
```

## Data Flow Confirmation

### Place Bet Flow

1. **Player Sends PlaceBet Request**
   ```javascript
   {
       betChoice: "blue",
       amount: 100,
       redTunnel: 1,
       blueTunnel: 2
   }
   ```

2. **PlaceBetConsumer Validates Request**
   - Validates `redTunnel` and `blueTunnel` validity (1-6, must be different)
   - Validates `betChoice`, `amount`, and other fields

3. **ProcessBetQueue Processes Bet**
   - Calls `upsertBet()` method
   - Extracts tunnel-specific odds from V3 flat `gameConfigs.odds`
   - Saves to MongoDB `bets` collection

4. **MongoDB Stored Bet Record**
   ```javascript
   {
       uid: "player123",
       name: "TestPlayer",
       roundId: 123,
       odds: {
           red: 2.1,    // Only 3 values
           blue: 2.1,
           draw: 9.0
       },
       redTunnel: 1,    // Player's tunnel selection
       blueTunnel: 2,
       betChoice: "blue",
       amount: 100,
       // ... other fields
   }
   ```

### Settlement Flow

1. **ProcessBetQueue Triggers Settlement**
   - Calls `settleGameRoundConsumer.settleRoundWithSelections()`
   - Passes `redTunnel` and `blueTunnel`

2. **SettleGameRoundConsumer Generates Result**
   - Uses tunnel-specific probabilities (from `BET_CHOICE_RATE`)
   - Generates game result

3. **Calculate Payout**
   - Reads `odds` from bet record (already tunnel-specific)
   - Calculates payout based on result and odds

## Database Schema Confirmation

### `bets` Collection

```typescript
{
    uid: String,
    name: String,
    roundId: Number,
    odds: Object,           // { red, blue, draw } - tunnel-specific
    redTunnel: Number,      // 1-6
    blueTunnel: Number,     // 1-6
    betChoice: String,      // "red", "blue", or "draw"
    amount: Number,
    totalAmount: Number,
    freeBet: Boolean,
    time: Date,
    clientSeed: String,
    // ... other fields
}
```

**Important Field Descriptions**:
- `odds`: Stores tunnel-specific odds for this bet (3 values)
- `redTunnel` / `blueTunnel`: Player's chosen tunnel combination, used for:
  - Settlement verification
  - Subsequent queries and analysis
  - Debugging and auditing

### `game_configs` Collection (MongoDB)

```javascript
{
    odds: {
        R1B2_red: 2.1,
        R1B2_blue: 2.1,
        R1B2_draw: 9.0,
        R1B3_red: 2.2,
        R1B3_blue: 2.2,
        R1B3_draw: 9.5,
        // ... Total 90 keys (30 tunnels × 3 outcomes)
    }
}
```

## Verification Checklist

### ✅ Functional Verification
- [x] `extractTunnelOdds` correctly extracts tunnel-specific odds
- [x] `upsertBet` stores correct odds to database
- [x] Bet records include `redTunnel` and `blueTunnel` information
- [x] Supports all 30 valid tunnel combinations
- [x] Error handling works correctly

### ✅ Test Verification
- [x] Unit tests cover all scenarios
- [x] All 110 tests pass
- [x] Edge case testing
- [x] Error handling testing

### ✅ Integration Verification
- [x] Integrates with PlaceBetConsumer
- [x] Integrates with SettleGameRoundConsumer
- [x] Integrates with sc-game-base
- [x] Does not affect existing functionality

## Correspondence with Odds Specification V3

| V3 Specification | Implementation Status | File |
|------------------|----------------------|------|
| Tunnel-specific probabilities | ✅ Implemented | `src/constants.ts` |
| Tunnel-specific odds (flat structure) | ✅ Implemented | MongoDB `game_configs.odds` |
| Odds extraction logic | ✅ Implemented | `src/helpers/index.ts` |
| Bet storage with tunnel-specific odds | ✅ Implemented | `src/crons/process-bet-queue.ts` |
| Validation | ✅ Implemented | `src/validators/config-validator.ts` |
| Result generation | ✅ Implemented | `src/helpers/result-helper.ts` |

## Important Notes

### 1. Database Migration
When upgrading from old odds structure to V3:
- **Newly created bets**: Automatically use new tunnel-specific odds storage format
- **Old bets**: Retain original odds format (backward compatible)
- **`game_configs`**: Requires manual update to V3 flat structure

### 2. Backward Compatibility
- The `upsertBet` override does not affect other base class methods
- All original bet fields are preserved
- The added `redTunnel` and `blueTunnel` fields are additional and do not affect existing logic

### 3. Performance Considerations
- `extractTunnelOdds` called on each bet: O(1) lookup, excellent performance
- Reduced storage space: From 90 odds values to 3 (97% reduction)
- Query efficiency: Smaller bet records, faster queries

## Future Recommendations

### 1. Monitoring and Logging
Recommended to add monitoring in production environment:
```typescript
// Add to extractTunnelOdds
console.log(`Extracted odds for ${tunnelKey}:`, { red, blue, draw });
```

### 2. Database Indexing
Recommended to add composite index for `bets` collection:
```javascript
db.bets.createIndex({ redTunnel: 1, blueTunnel: 1, roundId: 1 })
```

### 3. Audit Queries
Query bets for specific tunnel combination:
```javascript
db.bets.find({ 
    redTunnel: 1, 
    blueTunnel: 2,
    roundId: { $gte: 1000 }
})
```

### 4. Statistical Analysis
Analyze bet volume for different tunnel combinations:
```javascript
db.bets.aggregate([
    { $group: { 
        _id: { redTunnel: "$redTunnel", blueTunnel: "$blueTunnel" },
        totalBets: { $sum: 1 },
        totalAmount: { $sum: "$totalAmount" }
    }}
])
```

## Related Documentation

- [Odds Specification V3](./odds-specification-v2.md) - Detailed V3 specification
- [Game Result Implementation](./game-result-implementation-summary.md) - Result generation implementation
- [Tunnel Data Flow](./tunnel-data-flow.md) - Tunnel data flow

## Summary

✅ **Successfully implemented Odds V3's tunnel-specific odds storage mechanism**

**Core Achievements**:
1. Storage Optimization: Each bet stores only 3 odds values (97% storage reduction)
2. Correctness: Ensures stored odds correspond to player's chosen tunnel combination
3. Maintainability: Clean code structure with comprehensive test coverage
4. Traceability: Stores tunnel selections for easier auditing and analysis

**Test Coverage**: 110/110 tests passed ✅

**Backward Compatibility**: Fully compatible with existing system ✅

**Production Ready**: Ready to deploy to production environment ✅
