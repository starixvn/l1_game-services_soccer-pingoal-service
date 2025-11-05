# Soccer Pin Goal - Odds Specification V3 (Tunnel-Specific Probabilities)

## Overview
This document defines the **V3 odds and probability configuration structure** for Soccer Pin Goal game, supporting:
- **Tunnel-based odds** where different red and blue tunnel combinations have different payout rates (from V2)
- **Tunnel-based probabilities** where different tunnel combinations have different outcome distributions (**NEW in V3**)

---

## 📊 Evolution Overview

### V1 (Original) - Fixed Everything
- ❌ Same odds for all tunnels
- ❌ Same probability for all tunnels

### V2 - Tunnel-Specific Odds
- ✅ Different odds per tunnel
- ❌ Same probability for all tunnels

### V3 (Current) - Tunnel-Specific Odds + Probabilities
- ✅ Different odds per tunnel
- ✅ **Different probability per tunnel** ← NEW!

---

## ⚠️ IMPORTANT: Understanding Odds vs Probability

### 🎲 Two Separate Concepts

This is **critical** to understand: **Odds (賠率)** and **Probability (機率)** are **completely separate** in this game system.

#### 1️⃣ Probability (機率) - Controls Game Outcomes
**Location**: `src/constants.ts` → `BET_CHOICE_RATE`

**NEW Structure (V3) - Tunnel-Specific Probabilities:**

```typescript
export const BET_CHOICE_RATE = {
  R1B2_red: 0.45,
  R1B2_blue: 0.45,
  R1B2_draw: 0.10,
  R1B3_red: 0.44,
  R1B3_blue: 0.46,
  R1B3_draw: 0.10,
  R1B4_red: 0.46,
  R1B4_blue: 0.44,
  R1B4_draw: 0.10,
  R1B5_red: 0.43,
  R1B5_blue: 0.47,
  R1B5_draw: 0.10,
  R1B6_red: 0.45,
  R1B6_blue: 0.45,
  R1B6_draw: 0.10,
  R2B1_red: 0.47,
  R2B1_blue: 0.43,
  R2B1_draw: 0.10,
  R2B3_red: 0.45,
  R2B3_blue: 0.45,
  R2B3_draw: 0.10,
  R2B4_red: 0.44,
  R2B4_blue: 0.46,
  R2B4_draw: 0.10,
  R2B5_red: 0.46,
  R2B5_blue: 0.44,
  R2B5_draw: 0.10,
  R2B6_red: 0.45,
  R2B6_blue: 0.45,
  R2B6_draw: 0.10,
  R3B1_red: 0.46,
  R3B1_blue: 0.44,
  R3B1_draw: 0.10,
  R3B2_red: 0.45,
  R3B2_blue: 0.45,
  R3B2_draw: 0.10,
  R3B4_red: 0.44,
  R3B4_blue: 0.46,
  R3B4_draw: 0.10,
  R3B5_red: 0.47,
  R3B5_blue: 0.43,
  R3B5_draw: 0.10,
  R3B6_red: 0.45,
  R3B6_blue: 0.45,
  R3B6_draw: 0.10,
  R4B1_red: 0.44,
  R4B1_blue: 0.46,
  R4B1_draw: 0.10,
  R4B2_red: 0.46,
  R4B2_blue: 0.44,
  R4B2_draw: 0.10,
  R4B3_red: 0.46,
  R4B3_blue: 0.44,
  R4B3_draw: 0.10,
  R4B5_red: 0.45,
  R4B5_blue: 0.45,
  R4B5_draw: 0.10,
  R4B6_red: 0.44,
  R4B6_blue: 0.46,
  R4B6_draw: 0.10,
  R5B1_red: 0.47,
  R5B1_blue: 0.43,
  R5B1_draw: 0.10,
  R5B2_red: 0.46,
  R5B2_blue: 0.44,
  R5B2_draw: 0.10,
  R5B3_red: 0.44,
  R5B3_blue: 0.46,
  R5B3_draw: 0.10,
  R5B4_red: 0.45,
  R5B4_blue: 0.45,
  R5B4_draw: 0.10,
  R5B6_red: 0.45,
  R5B6_blue: 0.45,
  R5B6_draw: 0.10,
  R6B1_red: 0.46,
  R6B1_blue: 0.44,
  R6B1_draw: 0.10,
  R6B2_red: 0.45,
  R6B2_blue: 0.45,
  R6B2_draw: 0.10,
  R6B3_red: 0.45,
  R6B3_blue: 0.45,
  R6B3_draw: 0.10,
  R6B4_red: 0.46,
  R6B4_blue: 0.44,
  R6B4_draw: 0.10,
  R6B5_red: 0.45,
  R6B5_blue: 0.45,
  R6B5_draw: 0.10,
} as const;
```

- ✅ **Controls**: How often each outcome (red/blue/draw) appears in game results
- ✅ **Tunnel-specific**: Each tunnel combination has its own probability distribution
- ✅ **Independent of odds**: Changing odds does NOT change probability
- ⚠️ **Validation Required**: Sum of probabilities for each tunnel must equal 1.0 (red + blue + draw = 1.0)

#### 2️⃣ Odds (賠率) - Controls Payout Amounts
**Location**: Game configuration → `gameConfigs.odds` (MongoDB Collection: `game_configs`)

**NEW Structure (V3) - Flat Tunnel-Specific Odds:**

```json
{
  "odds": {
    "R1B2_red": 2.1,
    "R1B2_blue": 2.1,
    "R1B2_draw": 9,
    "R1B3_red": 2.2,
    "R1B3_blue": 2.0,
    "R1B3_draw": 8.5,
    "R1B4_red": 2.0,
    "R1B4_blue": 2.2,
    "R1B4_draw": 9,
    "R1B5_red": 2.15,
    "R1B5_blue": 2.05,
    "R1B5_draw": 9.2,
    "R1B6_red": 2.1,
    "R1B6_blue": 2.1,
    "R1B6_draw": 9,
    "R2B1_red": 2.05,
    "R2B1_blue": 2.15,
    "R2B1_draw": 8.8,
    "R2B3_red": 2.1,
    "R2B3_blue": 2.1,
    "R2B3_draw": 9,
    "R2B4_red": 2.2,
    "R2B4_blue": 2.0,
    "R2B4_draw": 8.5,
    "R2B5_red": 2.0,
    "R2B5_blue": 2.2,
    "R2B5_draw": 9,
    "R2B6_red": 2.1,
    "R2B6_blue": 2.1,
    "R2B6_draw": 9,
    "R3B1_red": 2.2,
    "R3B1_blue": 2.0,
    "R3B1_draw": 8.5,
    "R3B2_red": 2.1,
    "R3B2_blue": 2.1,
    "R3B2_draw": 9,
    "R3B4_red": 2.15,
    "R3B4_blue": 2.05,
    "R3B4_draw": 8.8,
    "R3B5_red": 2.0,
    "R3B5_blue": 2.2,
    "R3B5_draw": 9,
    "R3B6_red": 2.1,
    "R3B6_blue": 2.1,
    "R3B6_draw": 9,
    "R4B1_red": 2.05,
    "R4B1_blue": 2.15,
    "R4B1_draw": 8.8,
    "R4B2_red": 2.2,
    "R4B2_blue": 2.0,
    "R4B2_draw": 8.5,
    "R4B3_red": 2.0,
    "R4B3_blue": 2.2,
    "R4B3_draw": 9,
    "R4B5_red": 2.1,
    "R4B5_blue": 2.1,
    "R4B5_draw": 9,
    "R4B6_red": 2.15,
    "R4B6_blue": 2.05,
    "R4B6_draw": 8.8,
    "R5B1_red": 2.2,
    "R5B1_blue": 2.0,
    "R5B1_draw": 8.5,
    "R5B2_red": 2.05,
    "R5B2_blue": 2.15,
    "R5B2_draw": 8.8,
    "R5B3_red": 2.15,
    "R5B3_blue": 2.05,
    "R5B3_draw": 9.2,
    "R5B4_red": 2.1,
    "R5B4_blue": 2.1,
    "R5B4_draw": 9,
    "R5B6_red": 2.0,
    "R5B6_blue": 2.2,
    "R5B6_draw": 9,
    "R6B1_red": 2.1,
    "R6B1_blue": 2.1,
    "R6B1_draw": 9,
    "R6B2_red": 2.15,
    "R6B2_blue": 2.05,
    "R6B2_draw": 8.8,
    "R6B3_red": 2.1,
    "R6B3_blue": 2.1,
    "R6B3_draw": 9,
    "R6B4_red": 2.2,
    "R6B4_blue": 2.0,
    "R6B4_draw": 8.5,
    "R6B5_red": 2.05,
    "R6B5_blue": 2.15,
    "R6B5_draw": 8.8
  }
}
```

- ✅ **Controls**: How much players win when their bet is correct
- ✅ **Tunnel-specific**: Each tunnel combination has unique payout rates
- ✅ **Flat structure**: Direct access via `odds.R1B2_red` format
- ✅ **Independent of probability**: Changing probability does NOT change odds
- ✅ **Stored in MongoDB**: `game_configs` collection in `minigame` database

### 📊 How They Work Together

```typescript
// Example: Player bets $100 on RED for tunnel R1B2

// Step 1: System generates result using TUNNEL-SPECIFIC PROBABILITY
const tunnelKey = "R1B2";
const outcome = selectGameOutcome(tunnelKey); // Uses BET_CHOICE_RATE
// Uses: R1B2_red: 0.45, R1B2_blue: 0.45, R1B2_draw: 0.10
// Result: "red" (45% probability for this specific tunnel)

// Step 2: System calculates payout using TUNNEL-SPECIFIC ODDS (FLAT STRUCTURE)
const oddsKey = `${tunnelKey}_${outcome}`; // "R1B2_red"
const odds = gameConfigs.odds[oddsKey]; // Direct access
// Result: odds = 2.1 (from flat odds configuration)

// Step 3: Player wins if their bet matches outcome
if (playerBet === outcome) {
  const payout = betAmount * odds;  // $100 × 2.1 = $210
}
```

### ⚖️ House Edge (莊家優勢) Calculation

The **House Edge** is determined by the relationship between probability and odds:

```
House Edge = 1 - (Σ(Probability × Odds))
```

#### Example 1: Tunnel R1B2 with Specific Probability
```typescript
// Tunnel R1B2 configuration
Probability: R1B2_red=0.45, R1B2_blue=0.45, R1B2_draw=0.10
Odds: red=2.1, blue=2.1, draw=9.0

// Expected Return to Player (RTP) for R1B2
RTP_red = 0.45 × 2.1 = 0.945 (94.5%)
RTP_blue = 0.45 × 2.1 = 0.945 (94.5%)
RTP_draw = 0.10 × 9.0 = 0.90 (90.0%)

// House Edge per bet type
House Edge (red) = 1 - 0.945 = 0.055 (5.5%)
House Edge (blue) = 1 - 0.945 = 0.055 (5.5%)
House Edge (draw) = 1 - 0.90 = 0.10 (10%)
```

#### Example 2: Tunnel R1B3 with Different Probability and Odds
```typescript
// Tunnel R1B3 configuration - Different probability AND odds
Probability: R1B3_red=0.44, R1B3_blue=0.46, R1B3_draw=0.10
Odds: red=2.2, blue=2.0, draw=8.5

// Expected Return to Player for R1B3
RTP_red = 0.44 × 2.2 = 0.968 (96.8%)  → House Edge = 3.2%
RTP_blue = 0.46 × 2.0 = 0.92 (92.0%)  → House Edge = 8%
RTP_draw = 0.10 × 8.5 = 0.85 (85.0%)  → House Edge = 15%

// NOTE: Both probability AND odds are different from R1B2!
```

#### Example 3: Comparing Two Tunnels
```typescript
// Tunnel R1B2:
R1B2_red: 0.45 (prob) × 2.1 (odds) = 0.945 RTP (5.5% house edge)
R1B2_blue: 0.45 (prob) × 2.1 (odds) = 0.945 RTP (5.5% house edge)

// Tunnel R1B3:
R1B3_red: 0.44 (prob) × 2.2 (odds) = 0.968 RTP (3.2% house edge)
R1B3_blue: 0.46 (prob) × 2.0 (odds) = 0.92 RTP (8% house edge)

// Different tunnels can have BOTH different probabilities AND different odds!
```

### 🎯 Key Insights

| Aspect | Impact |
|--------|--------|
| **Higher Odds** | 📈 Higher payout, MORE attractive to players |
| **Higher Probability** | 📈 More frequent wins, MORE likely to occur |
| **Odds ONLY** | Changes payout amount, NOT win frequency |
| **Probability ONLY** | Changes win frequency, NOT payout amount |
| **House Edge** | Determined by BOTH odds and probability together |
| **Tunnel-Specific Probability** | 🎰 Each tunnel has unique win distribution (V3) |
| **Tunnel-Specific Odds** | 💰 Each tunnel has unique payout rates (V2) |

### ⚠️ **CRITICAL: This Document Now Describes V3 Structure**

This updated specification describes the **V3 approach** with **tunnel-specific probabilities**. 

**Key Change:**
```typescript
// OLD (V1/V2): Same probability for all tunnels
BET_CHOICE_RATE = { red: 0.45, blue: 0.45, draw: 0.1 }

// NEW (V3): Different probability for each tunnel
BET_CHOICE_RATE = {
  R1B2_red: 0.45, R1B2_blue: 0.45, R1B2_draw: 0.10,
  R1B3_red: 0.44, R1B3_blue: 0.46, R1B3_draw: 0.10,
  // ... all 30 tunnels
}
```

### ⚠️ Critical Design Decision

**Decision Made**: This specification adopts **tunnel-specific probabilities** (V3 approach).

#### ✅ Chosen Approach: Tunnel-Specific Probability (V3)
```typescript
// Different probabilities per tunnel - FLAT structure
export const BET_CHOICE_RATE = {
  R1B2_red: 0.45,
  R1B2_blue: 0.45,
  R1B2_draw: 0.10,
  R1B3_red: 0.44,
  R1B3_blue: 0.46,
  R1B3_draw: 0.10,
  // ... all 30 tunnels (90 keys total: 30 tunnels × 3 outcomes)
} as const;
```

**Key Features:**
- ✅ Each tunnel has unique probability distribution
- ✅ Flat structure for easy access: `BET_CHOICE_RATE.R1B2_red`
- ✅ All 30 valid tunnel combinations included
- ✅ Type-safe with TypeScript `as const`

**Advantages:**
- 🎯 Maximum flexibility per tunnel
- 🎲 Can fine-tune game balance for each combination
- 💰 Combined with tunnel-specific odds for complete control

**Challenges:**
- ⚠️ More complex to implement
- ⚠️ Requires careful balancing (90 values to manage)
- ⚠️ Must validate sum = 1.0 for each tunnel
- ⚠️ Extensive testing required

#### ❌ Previous Approach (V1/V2 - Deprecated)
```typescript
// OLD: Same probabilities for all tunnels
export const BET_CHOICE_RATE = {
  red: 0.45,
  blue: 0.45,
  draw: 0.10
} as const;
```

This simple approach is being replaced by the tunnel-specific structure above.

### 📝 Implementation Recommendations

**For V3 Implementation (Tunnel-Specific Probabilities):**

1. ✅ **Update `BET_CHOICE_RATE`** to flat structure with all 90 keys (30 tunnels × 3 outcomes)
2. ✅ **Implement helper function** to extract probability by tunnel and outcome:
   ```typescript
   const getRate = (tunnelKey: string, outcome: string) => 
     BET_CHOICE_RATE[`${tunnelKey}_${outcome}`];
   ```
3. ✅ **Add validation** to ensure each tunnel's probabilities sum to 1.0:
   ```typescript
   const validateTunnelRates = (tunnelKey: string) => {
     const red = BET_CHOICE_RATE[`${tunnelKey}_red`];
     const blue = BET_CHOICE_RATE[`${tunnelKey}_blue`];
     const draw = BET_CHOICE_RATE[`${tunnelKey}_draw`];
     if (Math.abs(red + blue + draw - 1.0) > 0.001) {
       throw new Error(`Invalid rates for ${tunnelKey}`);
     }
   };
   ```
4. ✅ **Use tunnel-specific odds** from V2 configuration in database
5. ⚠️ **Monitor house edge** for each tunnel combination closely
6. ⚠️ **Test extensively** with statistical analysis (Chi-square tests)
7. ⚠️ **Consider regulatory compliance** - ensure transparency with players

---

## 🎯 V3 System - Tunnel-Based Odds + Probabilities

### Design Principles

1. **Tunnel Combinations**: 6 tunnels → 30 possible combinations
   - Red tunnels: 1, 2, 3, 4, 5, 6
   - Blue tunnels: 1, 2, 3, 4, 5, 6
   - Constraint: `redTunnel !== blueTunnel` (30 valid combinations)

2. **Flat Configuration Structure**:
   - **Odds**: Flat structure with `{tunnel}_{outcome}` keys (e.g., `R1B2_red`)
   - **Probabilities**: Flat structure with `{tunnel}_{outcome}` keys (e.g., `R1B2_red`)

3. **No Fallback**: All 30 tunnel combinations must be configured (90 keys each)

4. **Tunnel-Specific Probability**: Each tunnel has unique `BET_CHOICE_RATE` values

---

## 🏗️ Configuration Structure (V3)

### ✅ Flat Structure (V3 Standard)

This is the **adopted structure** for V3 - a flat key-value structure for direct access.

**Complete Configuration Example:**

```json
{
  "odds": {
    "R1B2_red": 2.1,
    "R1B2_blue": 2.1,
    "R1B2_draw": 9,
    "R1B3_red": 2.15,
    "R1B3_blue": 2.05,
    "R1B3_draw": 9.5,
    "R1B4_red": 1.95,
    "R1B4_blue": 2.25,
    "R1B4_draw": 8.8,
    "R1B5_red": 2.1,
    "R1B5_blue": 2.1,
    "R1B5_draw": 9.0,
    "R1B6_red": 2.2,
    "R1B6_blue": 2.0,
    "R1B6_draw": 8.2,
    "R2B1_red": 2.2,
    "R2B1_blue": 2.0,
    "R2B1_draw": 8.5,
    "R2B3_red": 2.05,
    "R2B3_blue": 2.15,
    "R2B3_draw": 9.2,
    "R2B4_red": 2.1,
    "R2B4_blue": 2.1,
    "R2B4_draw": 9.0,
    "R2B5_red": 1.98,
    "R2B5_blue": 2.22,
    "R2B5_draw": 8.7,
    "R2B6_red": 2.12,
    "R2B6_blue": 2.08,
    "R2B6_draw": 9.1,
    "R3B1_red": 2.15,
    "R3B1_blue": 2.05,
    "R3B1_draw": 9.5,
    "R3B2_red": 2.05,
    "R3B2_blue": 2.15,
    "R3B2_draw": 9.2,
    "R3B4_red": 2.0,
    "R3B4_blue": 2.2,
    "R3B4_draw": 8.6,
    "R3B5_red": 2.25,
    "R3B5_blue": 1.95,
    "R3B5_draw": 9.3,
    "R3B6_red": 2.1,
    "R3B6_blue": 2.1,
    "R3B6_draw": 9.0,
    "R4B1_red": 1.95,
    "R4B1_blue": 2.25,
    "R4B1_draw": 8.8,
    "R4B2_red": 2.1,
    "R4B2_blue": 2.1,
    "R4B2_draw": 9.0,
    "R4B3_red": 2.2,
    "R4B3_blue": 2.0,
    "R4B3_draw": 8.5,
    "R4B5_red": 2.08,
    "R4B5_blue": 2.12,
    "R4B5_draw": 9.1,
    "R4B6_red": 1.92,
    "R4B6_blue": 2.28,
    "R4B6_draw": 8.9,
    "R5B1_red": 2.1,
    "R5B1_blue": 2.1,
    "R5B1_draw": 9.0,
    "R5B2_red": 2.22,
    "R5B2_blue": 1.98,
    "R5B2_draw": 8.7,
    "R5B3_red": 1.95,
    "R5B3_blue": 2.25,
    "R5B3_draw": 9.3,
    "R5B4_red": 2.12,
    "R5B4_blue": 2.08,
    "R5B4_draw": 9.1,
    "R5B6_red": 2.05,
    "R5B6_blue": 2.15,
    "R5B6_draw": 8.8,
    "R6B1_red": 2.2,
    "R6B1_blue": 2.0,
    "R6B1_draw": 8.2,
    "R6B2_red": 2.08,
    "R6B2_blue": 2.12,
    "R6B2_draw": 9.1,
    "R6B3_red": 2.1,
    "R6B3_blue": 2.1,
    "R6B3_draw": 9.0,
    "R6B4_red": 2.28,
    "R6B4_blue": 1.92,
    "R6B4_draw": 8.9,
    "R6B5_red": 2.15,
    "R6B5_blue": 2.05,
    "R6B5_draw": 8.8
  }
}
```

#### Schema Definition (V3)
```typescript
// V3 Flat structure - Simple Record type
type TunnelOutcomeKey = `R${1|2|3|4|5|6}B${1|2|3|4|5|6}_${'red'|'blue'|'draw'}`;

interface OddsConfigV3 {
  odds: Record<TunnelOutcomeKey, number>;
}

// Example usage
const gameConfig: OddsConfigV3 = {
  odds: {
    R1B2_red: 2.1,
    R1B2_blue: 2.1,
    R1B2_draw: 9,
    // ... all 90 keys
  }
};

// Helper function
export const getOdds = (
  odds: Record<string, number>, 
  tunnelKey: string, 
  outcome: 'red' | 'blue' | 'draw'
): number => {
  const key = `${tunnelKey}_${outcome}`;
  return odds[key];
};
```

#### Advantages ✅
- **Direct access**: No nested lookups required
- **Type-safe**: TypeScript template literals ensure valid keys
- **Simple**: Flat structure is easier to understand and maintain
- **Consistent**: Same structure as BET_CHOICE_RATE
- **No fallback needed**: All 30 tunnels must be configured

---

### ❌ Old Nested Structure (V1/V2 - Deprecated)

The previous nested structure with `default` and `tunnelOdds` is **no longer used**:

```json
{
  "odds": {
    "default": {
      "red": 2.1,
      "blue": 2.1,
      "draw": 9
    },
    "tunnelOdds": {
      "R1B2": { "red": 2.0, "blue": 2.2, "draw": 8.5 },
      "R1B3": { "red": 2.15, "blue": 2.05, "draw": 9.5 }
      // ...
    }
  }
}
```

**Why deprecated:**
- ❌ Nested structure is more complex to access
- ❌ Requires helper functions for lookups
- ❌ Inconsistent with BET_CHOICE_RATE structure
- ❌ Fallback mechanism adds unnecessary complexity

**Migration:**
- Remove `default` and `tunnelOdds` wrappers
- Flatten all keys to `{tunnel}_{outcome}` format
- Ensure all 30 tunnels are configured (no fallback)

---

## 📋 Implementation Recommendations

### Adopted Approach: **Flat Structure (V3)**

**Reasons:**
1. ✅ Direct key access - no nested lookups
2. ✅ Consistent with BET_CHOICE_RATE structure
3. ✅ Type-safe with TypeScript template literals
4. ✅ Simpler to understand and maintain
5. ✅ Single source of truth - no fallback logic needed

**How to use:**
```typescript
// Direct access
const odds = gameConfigs.odds[`${tunnelKey}_${outcome}`];

// Or with helper function
const odds = getOdds(gameConfigs.odds, tunnelKey, outcome);
```

---

## 🔧 Configuration Validation Rules (V3)

### 1. Key Format (Flat Structure)
```regex
^R[1-6]B[1-6]_(red|blue|draw)$
```
- Pattern: `R{1-6}B{1-6}_{outcome}`
- Examples: `R1B2_red`, `R3B5_blue`, `R6B1_draw`
- Red and blue tunnel numbers must be different (R1B1 is invalid)

### 2. Odds Value Constraints
```typescript
interface OddsConstraints {
  min: 1.01;      // Minimum odds (must be > 1)
  max: 100.0;     // Maximum odds
  precision: 2;   // Decimal places (e.g., 2.15)
}
```

### 3. Required Keys
- **All 90 keys must exist** (30 tunnels × 3 outcomes)
- No optional or fallback values
- Complete validation example:
```typescript
const REQUIRED_KEYS = VALID_TUNNELS.flatMap(tunnel =>
  ['red', 'blue', 'draw'].map(outcome => `${tunnel}_${outcome}`)
);
// Results in 90 keys like: R1B2_red, R1B2_blue, R1B2_draw, ...
```

### 4. Invalid Configurations
```typescript
// ❌ Invalid: Missing keys
{ 
  "R1B2_red": 2.0, 
  "R1B2_blue": 2.2  
  // Missing R1B2_draw and 87 other keys
}

// ❌ Invalid: Same tunnel number
{ 
  "R3B3_red": 2.0  // Red and blue cannot be same number
}

// ❌ Invalid: Odds too low
{ 
  "R1B2_red": 0.95  // Must be >= 1.01
}

// ❌ Invalid: Wrong key format
{ 
  "R1B2": { "red": 2.0 }  // Old nested format not supported
}

// ✅ Valid: Correct flat format
{ 
  "R1B2_red": 2.0,
  "R1B2_blue": 2.2,
  "R1B2_draw": 8.5,
  // ... all 87 other keys
}
```

### 5. Validation Helper Function
```typescript
export const validateOddsConfig = (odds: Record<string, number>): void => {
  const errors: string[] = [];
  
  // Check all required keys exist
  VALID_TUNNELS.forEach(tunnel => {
    ['red', 'blue', 'draw'].forEach(outcome => {
      const key = `${tunnel}_${outcome}`;
      if (!(key in odds)) {
        errors.push(`Missing key: ${key}`);
      } else if (odds[key] < 1.01 || odds[key] > 100) {
        errors.push(`Invalid odds value for ${key}: ${odds[key]}`);
      }
    });
  });
  
  if (errors.length > 0) {
    throw new Error(`Odds validation failed:\n${errors.join('\n')}`);
  }
};
```

---

## 📊 Complete Tunnel Combination List

### All 30 Valid Combinations

| # | Tunnel | Red | Blue | # | Tunnel | Red | Blue |
|---|--------|-----|------|---|--------|-----|------|
| 1 | R1B2   | 1   | 2    | 16| R4B1   | 4   | 1    |
| 2 | R1B3   | 1   | 3    | 17| R4B2   | 4   | 2    |
| 3 | R1B4   | 1   | 4    | 18| R4B3   | 4   | 3    |
| 4 | R1B5   | 1   | 5    | 19| R4B5   | 4   | 5    |
| 5 | R1B6   | 1   | 6    | 20| R4B6   | 4   | 6    |
| 6 | R2B1   | 2   | 1    | 21| R5B1   | 5   | 1    |
| 7 | R2B3   | 2   | 3    | 22| R5B2   | 5   | 2    |
| 8 | R2B4   | 2   | 4    | 23| R5B3   | 5   | 3    |
| 9 | R2B5   | 2   | 5    | 24| R5B4   | 5   | 4    |
| 10| R2B6   | 2   | 6    | 25| R5B6   | 5   | 6    |
| 11| R3B1   | 3   | 1    | 26| R6B1   | 6   | 1    |
| 12| R3B2   | 3   | 2    | 27| R6B2   | 6   | 2    |
| 13| R3B4   | 3   | 4    | 28| R6B3   | 6   | 3    |
| 14| R3B5   | 3   | 5    | 29| R6B4   | 6   | 4    |
| 15| R3B6   | 3   | 6    | 30| R6B5   | 6   | 5    |

---

## 🔄 Migration Strategy (V2 → V3)

### Phase 1: Prepare Flat Structure
1. Create migration script to convert nested structure to flat
2. **Script logic:**
   ```typescript
   // Convert V2 nested to V3 flat
   const convertToFlat = (v2Config) => {
     const flat = {};
     VALID_TUNNELS.forEach(tunnel => {
       const tunnelOdds = v2Config.tunnelOdds?.[tunnel] || v2Config.default;
       flat[`${tunnel}_red`] = tunnelOdds.red;
       flat[`${tunnel}_blue`] = tunnelOdds.blue;
       flat[`${tunnel}_draw`] = tunnelOdds.draw;
     });
     return flat;
   };
   ```
3. Validate output has all 90 keys

### Phase 2: Update Database
1. Run migration script on MongoDB `game_configs` collection
2. Backup original configuration
3. Update `odds` field with flat structure
4. **MongoDB Update Example:**
   ```javascript
   db.game_configs.updateOne(
     { name: "soccerpingoal" },
     { 
       $set: { 
         "odds": flatOddsStructure,
         "_migrated": true,
         "_migration_date": new Date()
       }
     }
   );
   ```

### Phase 3: Update Code
1. Remove old `getOddsForTunnel()` helper (if exists)
2. Update to direct key access or new `getOdds()` helper
3. Update validation functions
4. Remove support for nested structure

### Phase 4: Testing
1. Verify all 90 keys exist in database
2. Test payout calculations with new structure
3. Run integration tests
4. Monitor production for any issues

---

## 💻 Sample Implementation Code (V3)

### TypeScript Type Definitions

```typescript
// V3 Type definition - Flat structure
type TunnelOutcomeKey = `R${1|2|3|4|5|6}B${1|2|3|4|5|6}_${'red'|'blue'|'draw'}`;

export interface OddsConfigV3 {
  odds: Record<TunnelOutcomeKey, number>;
}

// Helper type for outcome
export type Outcome = 'red' | 'blue' | 'draw';
```

### Odds Lookup Helper Function (V3)

```typescript
/**
 * Gets odds for specific tunnel combination and outcome (V3)
 * @param odds - Flat odds configuration
 * @param tunnelKey - Tunnel combination (e.g., "R1B2")
 * @param outcome - Bet outcome ("red", "blue", or "draw")
 * @returns Odds multiplier
 */
export function getOdds(
  odds: Record<string, number>,
  tunnelKey: string,
  outcome: Outcome
): number {
  const key = `${tunnelKey}_${outcome}`;
  const oddsValue = odds[key];
  
  if (oddsValue === undefined) {
    throw new Error(`Odds not found for ${key}`);
  }
  
  return oddsValue;
}

// Alternative: Direct access (no helper needed)
// const odds = gameConfigs.odds[`${tunnelKey}_${outcome}`];
```

### Validation Function (V3)

```typescript
/**
 * Validates V3 flat odds configuration
 * @param odds - Flat odds configuration
 * @returns Array of validation errors (empty if valid)
 */
export function validateOddsConfigV3(odds: Record<string, number>): string[] {
  const errors: string[] = [];
  const MIN_ODDS = 1.01;
  const MAX_ODDS = 100.0;
  
  const VALID_TUNNELS = [
    'R1B2', 'R1B3', 'R1B4', 'R1B5', 'R1B6',
    'R2B1', 'R2B3', 'R2B4', 'R2B5', 'R2B6',
    'R3B1', 'R3B2', 'R3B4', 'R3B5', 'R3B6',
    'R4B1', 'R4B2', 'R4B3', 'R4B5', 'R4B6',
    'R5B1', 'R5B2', 'R5B3', 'R5B4', 'R5B6',
    'R6B1', 'R6B2', 'R6B3', 'R6B4', 'R6B5',
  ] as const;
  
  // Validate all required keys exist and have valid values
  VALID_TUNNELS.forEach(tunnel => {
    ['red', 'blue', 'draw'].forEach(outcome => {
      const key = `${tunnel}_${outcome}`;
      
      // Check key exists
      if (!(key in odds)) {
        errors.push(`Missing key: ${key}`);
        return;
      }
      
      // Check value is valid
      const value = odds[key];
      if (typeof value !== 'number') {
        errors.push(`${key}: Value must be a number, got ${typeof value}`);
        return;
      }
      
      if (value < MIN_ODDS || value > MAX_ODDS) {
        errors.push(`${key}: Invalid odds (${value}). Must be between ${MIN_ODDS} and ${MAX_ODDS}`);
      }
    });
  });
  
  return errors;
}
```

### Usage Example (V3)

```typescript
// In bet placement/settlement code
const tunnelKey = `R${redTunnel}B${blueTunnel}`;
const playerBetChoice: Outcome = 'red'; // or 'blue' or 'draw'

// Option 1: Direct access (simplest)
const oddsKey = `${tunnelKey}_${playerBetChoice}`;
const odds = gameConfigs.odds[oddsKey];

// Option 2: Using helper function
const odds = getOdds(gameConfigs.odds, tunnelKey, playerBetChoice);

// Calculate payout
const payout = betAmount * odds;
```

---

## 📈 Sample Configuration for Testing (V3)

### Minimal Configuration (Testing - 3 Tunnels Only)
```json
{
  "odds": {
    "R1B2_red": 2.0,
    "R1B2_blue": 2.2,
    "R1B2_draw": 8.5,
    "R1B3_red": 2.15,
    "R1B3_blue": 2.05,
    "R1B3_draw": 9.5,
    "R2B1_red": 2.2,
    "R2B1_blue": 2.0,
    "R2B1_draw": 8.5
  }
}
```
**Note:** This is incomplete - production needs all 90 keys (30 tunnels × 3 outcomes).

### Complete Configuration (Recommended Production)
See the full configuration example at the top of this document in the "Configuration Structure (V3)" section.

The complete production configuration must include all 90 keys (30 tunnels × 3 outcomes).

---

## 🎮 Impact on Game Flow (V3)

### V1 Flow (Old - Fixed Everything)
```
1. Player places bet → selects outcome (red/blue/draw)
2. System uses fixed odds: gameConfigs.odds.red
3. System uses fixed probability: BET_CHOICE_RATE.red
4. Game settles → payout = betAmount × odds[outcome]
```

### V3 Flow (Current - Tunnel-Specific Everything)
```
1. Player places bet → selects tunnels (red & blue) + outcome
2. System constructs tunnelKey = "R{red}B{blue}"
3. System looks up tunnel-specific odds: gameConfigs.odds[`${tunnelKey}_${outcome}`]
4. System uses tunnel-specific probability: BET_CHOICE_RATE[`${tunnelKey}_${outcome}`]
5. Game generates result based on tunnel-specific probability
6. Game settles → payout = betAmount × tunnelSpecificOdds
```

### Key Changes from V2 → V3
- ✅ Flat structure for odds (was nested)
- ✅ Flat structure for probabilities (NEW)
- ✅ Direct key access (no fallback mechanism)
- ✅ All 90 keys required for both odds and probabilities

### Breaking Changes
- ⚠️ Odds structure completely changed (flat vs nested)
- ⚠️ Probability now tunnel-specific (was global)
- ⚠️ No fallback/default values
- ⚠️ Frontend must display tunnel-specific odds
- ⚠️ Game result generation must use tunnel-specific probabilities

---

## 💻 V3 Implementation Details

### Overview
**V3 is the current specification** - implementing tunnel-specific probabilities using a flat structure.

### ✅ Adopted Configuration Structure (V3)

**Flat Structure Approach:**
```typescript
// src/constants.ts
export const BET_CHOICE_RATE = {
  R1B2_red: 0.45,
  R1B2_blue: 0.45,
  R1B2_draw: 0.10,
  R1B3_red: 0.44,
  R1B3_blue: 0.46,
  R1B3_draw: 0.10,
  // ... all 30 tunnels (90 keys total)
} as const;
```

**Key Features:**
- Direct key access: `BET_CHOICE_RATE.R1B2_red`
- Type-safe with TypeScript
- No nested objects needed
- Simple and efficient

### ❌ Alternative Nested Structure (Not Used)

```typescript
// NOT USED - Nested structure alternative
export interface BetChoiceRateConfig {
  default: {
    red: number;
    blue: number;
    draw: number;
  };
  tunnelRates?: {
    [tunnelKey: string]: {
      red: number;
      blue: number;
      draw: number;
    };
  };
}
```

**Why not used:**
- More complex to access
- Requires helper functions
- Nested structure harder to maintain

### Implementation Changes Required

#### 1. Update Constants (V3 Flat Structure)
```typescript
// src/constants.ts - V3 FLAT STRUCTURE

// Flat structure with all 90 keys (30 tunnels × 3 outcomes)
export const BET_CHOICE_RATE = {
  R1B2_red: 0.45,
  R1B2_blue: 0.45,
  R1B2_draw: 0.10,
  R1B3_red: 0.44,
  R1B3_blue: 0.46,
  R1B3_draw: 0.10,
  R1B4_red: 0.46,
  R1B4_blue: 0.44,
  R1B4_draw: 0.10,
  R1B5_red: 0.43,
  R1B5_blue: 0.47,
  R1B5_draw: 0.10,
  R1B6_red: 0.45,
  R1B6_blue: 0.45,
  R1B6_draw: 0.10,
  R2B1_red: 0.47,
  R2B1_blue: 0.43,
  R2B1_draw: 0.10,
  R2B3_red: 0.45,
  R2B3_blue: 0.45,
  R2B3_draw: 0.10,
  R2B4_red: 0.44,
  R2B4_blue: 0.46,
  R2B4_draw: 0.10,
  R2B5_red: 0.46,
  R2B5_blue: 0.44,
  R2B5_draw: 0.10,
  R2B6_red: 0.45,
  R2B6_blue: 0.45,
  R2B6_draw: 0.10,
  R3B1_red: 0.46,
  R3B1_blue: 0.44,
  R3B1_draw: 0.10,
  R3B2_red: 0.45,
  R3B2_blue: 0.45,
  R3B2_draw: 0.10,
  R3B4_red: 0.44,
  R3B4_blue: 0.46,
  R3B4_draw: 0.10,
  R3B5_red: 0.47,
  R3B5_blue: 0.43,
  R3B5_draw: 0.10,
  R3B6_red: 0.45,
  R3B6_blue: 0.45,
  R3B6_draw: 0.10,
  R4B1_red: 0.44,
  R4B1_blue: 0.46,
  R4B1_draw: 0.10,
  R4B2_red: 0.46,
  R4B2_blue: 0.44,
  R4B2_draw: 0.10,
  R4B3_red: 0.46,
  R4B3_blue: 0.44,
  R4B3_draw: 0.10,
  R4B5_red: 0.45,
  R4B5_blue: 0.45,
  R4B5_draw: 0.10,
  R4B6_red: 0.44,
  R4B6_blue: 0.46,
  R4B6_draw: 0.10,
  R5B1_red: 0.47,
  R5B1_blue: 0.43,
  R5B1_draw: 0.10,
  R5B2_red: 0.46,
  R5B2_blue: 0.44,
  R5B2_draw: 0.10,
  R5B3_red: 0.44,
  R5B3_blue: 0.46,
  R5B3_draw: 0.10,
  R5B4_red: 0.45,
  R5B4_blue: 0.45,
  R5B4_draw: 0.10,
  R5B6_red: 0.45,
  R5B6_blue: 0.45,
  R5B6_draw: 0.10,
  R6B1_red: 0.46,
  R6B1_blue: 0.44,
  R6B1_draw: 0.10,
  R6B2_red: 0.45,
  R6B2_blue: 0.45,
  R6B2_draw: 0.10,
  R6B3_red: 0.45,
  R6B3_blue: 0.45,
  R6B3_draw: 0.10,
  R6B4_red: 0.46,
  R6B4_blue: 0.44,
  R6B4_draw: 0.10,
  R6B5_red: 0.45,
  R6B5_blue: 0.45,
  R6B5_draw: 0.10,
} as const;

// Helper function to get rate by tunnel and outcome
export const getBetChoiceRate = (tunnelKey: string, outcome: 'red' | 'blue' | 'draw'): number => {
  const key = `${tunnelKey}_${outcome}` as keyof typeof BET_CHOICE_RATE;
  return BET_CHOICE_RATE[key];
};
```

#### 2. Update Result Helper (V3 Implementation)
```typescript
// src/helpers/result-helper.ts

/**
 * Determines game outcome using tunnel-specific probabilities
 */
const selectGameOutcome = (tunnelKey: string): GameOutcome => {
  const outcomes: GameOutcome[] = ['red', 'blue', 'draw'];
  
  // Get tunnel-specific rates using flat structure
  const weights = outcomes.map((outcome) => 
    constants.getBetChoiceRate(tunnelKey, outcome)
  );
  
  return secureWeightedPick(outcomes, weights) as GameOutcome;
};

/**
 * Generates game score with tunnel-aware probability
 */
const generateScoreFromOutcome = (
  tunnelKey: string
): { redScore: number; blueScore: number; selectedScoreKey: string } => {
  const availableScores = constants.DEFAULT_NUMBER_OF_VIDEOS?.[tunnelKey];
  
  if (!availableScores) {
    throw new Error(`No video configuration found for tunnel: ${tunnelKey}`);
  }
  
  // Use tunnel-specific probability
  const selectedOutcome = selectGameOutcome(tunnelKey);
  
  // Select score based on outcome
  const scoreOptions = availableScores[selectedOutcome];
  const selectedScoreKey = secureRandomPick(scoreOptions);
  
  const [redScore, blueScore] = selectedScoreKey.split('-').map(Number);
  
  return { redScore, blueScore, selectedScoreKey };
};
```

#### 3. Validation Function (V3)
```typescript
// src/validators/config-validator.ts

/**
 * List of all valid tunnel combinations
 */
const VALID_TUNNELS = [
  'R1B2', 'R1B3', 'R1B4', 'R1B5', 'R1B6',
  'R2B1', 'R2B3', 'R2B4', 'R2B5', 'R2B6',
  'R3B1', 'R3B2', 'R3B4', 'R3B5', 'R3B6',
  'R4B1', 'R4B2', 'R4B3', 'R4B5', 'R4B6',
  'R5B1', 'R5B2', 'R5B3', 'R5B4', 'R5B6',
  'R6B1', 'R6B2', 'R6B3', 'R6B4', 'R6B5',
] as const;

/**
 * Validates that probability rates sum to 1.0 for each tunnel
 */
export const validateTunnelSpecificProbabilities = (): void => {
  const tolerance = 0.001;
  const errors: string[] = [];
  
  VALID_TUNNELS.forEach((tunnelKey) => {
    const red = constants.getBetChoiceRate(tunnelKey, 'red');
    const blue = constants.getBetChoiceRate(tunnelKey, 'blue');
    const draw = constants.getBetChoiceRate(tunnelKey, 'draw');
    
    const total = red + blue + draw;
    
    if (Math.abs(total - 1.0) > tolerance) {
      errors.push(
        `Probabilities for tunnel ${tunnelKey} must sum to 1.0, got: ${total}. ` +
        `Rates: red=${red}, blue=${blue}, draw=${draw}`
      );
    }
    
    // Also validate that all rates are positive
    if (red < 0 || blue < 0 || draw < 0) {
      errors.push(
        `Probabilities for tunnel ${tunnelKey} must be non-negative. ` +
        `Rates: red=${red}, blue=${blue}, draw=${draw}`
      );
    }
  });
  
  if (errors.length > 0) {
    throw new Error(`BET_CHOICE_RATE validation failed:\n${errors.join('\n')}`);
  }
};

/**
 * Validates that all required tunnel keys exist in BET_CHOICE_RATE
 */
export const validateTunnelRateKeys = (): void => {
  const errors: string[] = [];
  const outcomes = ['red', 'blue', 'draw'] as const;
  
  VALID_TUNNELS.forEach((tunnelKey) => {
    outcomes.forEach((outcome) => {
      const key = `${tunnelKey}_${outcome}`;
      if (!(key in constants.BET_CHOICE_RATE)) {
        errors.push(`Missing key: ${key}`);
      }
    });
  });
  
  if (errors.length > 0) {
    throw new Error(`BET_CHOICE_RATE missing keys:\n${errors.join('\n')}`);
  }
};
```

### Balancing Considerations

When using both tunnel-specific odds AND probabilities:

```typescript
// Example: Tunnel R1B2 with custom probability and odds
Probability: red=0.50, blue=0.40, draw=0.10
Odds: red=1.9, blue=2.3, draw=9.0

// House Edge Calculation
RTP_red = 0.50 × 1.9 = 0.95 (95%) → House Edge = 5%
RTP_blue = 0.40 × 2.3 = 0.92 (92%) → House Edge = 8%
RTP_draw = 0.10 × 9.0 = 0.90 (90%) → House Edge = 10%
```

**Critical**: You must balance BOTH probability and odds to maintain desired house edge!

### Testing Strategy

1. **Unit Tests**: Validate probability sums to 1.0 for each tunnel
2. **Integration Tests**: Run 10,000+ rounds per tunnel and verify distribution
3. **Statistical Analysis**: Chi-square test for probability distribution
4. **House Edge Verification**: Calculate actual vs expected house edge

### Risks & Considerations

| Risk | Mitigation |
|------|-----------|
| 🎰 Players discover patterns | Rotate probabilities periodically |
| 📊 Harder to balance | Use simulation tools for testing |
| 🐛 Complex implementation | Extensive unit and integration tests |
| 💰 Revenue impact | Monitor house edge closely after deployment |
| 🎭 Regulatory compliance | Ensure transparency in probability disclosure |

### Recommendation

**Do NOT implement tunnel-specific probabilities unless:**
- ✅ There's a clear business requirement
- ✅ You have tools to simulate and balance the game
- ✅ Legal/compliance team approves
- ✅ Extensive testing is completed
- ✅ Players are informed of probability differences

**Instead, use tunnel-specific ODDS only (V2)**, which provides:
- ✅ Simpler implementation
- ✅ Easier to understand and balance
- ✅ Predictable player experience
- ✅ Lower implementation risk

---

## 📝 Next Steps

1. **Review & Approve** this specification
2. **Decide** on configuration format (Option 1 recommended)
3. **Decide** on probability strategy (Same for all tunnels recommended)
4. **Update** type definitions and validation
5. **Implement** odds lookup helper functions
6. **Test** with sample configurations
7. **Monitor** house edge and game balance
8. **Migrate** production configurations
9. **Deploy** with feature flag for gradual rollout

---

## 🔗 Related Documents

- [Game Result Implementation Summary](./game-result-implementation-summary.md)
- [Tunnel Data Flow](./tunnel-data-flow.md)
- [Round Implementation Guide](./round-implementation-guide.md)

---

## 📚 Glossary

| Term | Definition | Example |
|------|-----------|---------|
| **Odds (賠率)** | Payout multiplier when bet wins | 2.1 means win $210 on $100 bet |
| **Probability (機率)** | Chance of outcome occurring | 0.45 means 45% chance |
| **RTP** | Return to Player percentage | 95% RTP means $95 returned per $100 bet (long-term) |
| **House Edge** | Casino's advantage | 5% means casino keeps $5 per $100 bet (long-term) |
| **Tunnel Key** | Red+Blue tunnel combination | "R1B2" means Red tunnel 1, Blue tunnel 2 |
| **Outcome** | Game result category | "red", "blue", or "draw" |

---

**Document Version**: 3.0  
**Last Updated**: 2025-10-27  
**Author**: AI Assistant  
**Status**: Draft - Pending Review  
**Changes**: 
- V3.0 (2025-10-27): Updated BET_CHOICE_RATE to flat structure with tunnel-specific probabilities (90 keys: 30 tunnels × 3 outcomes)
- V2.0 (2025-10-22): Added Odds vs Probability explanation and future V3 enhancement guide
- V1.0: Initial tunnel-based odds specification

