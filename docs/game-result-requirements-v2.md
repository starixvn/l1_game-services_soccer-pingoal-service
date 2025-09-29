# Game Result Generation Requirements V2

## Overview
The game result generation system uses a two-stage approach:
1. **Outcome Selection**: Randomly select game outcome (red win/blue win/draw) based on configured probabilities
2. **Score Selection**: From available scores that match the selected outcome, randomly pick one and generate video index

## New Game Flow Architecture

### Stage 1: Player Tunnel Selection
Players select their tunnel combination (e.g., RedTunnel=1, BlueTunnel=5).

### Stage 2: Outcome Probability Selection  
System uses `BET_CHOICE_RATE` configuration to randomly determine game outcome:

```typescript
// Configuration in constants.ts
export const BET_CHOICE_RATE = {
    red: 0.45,    // 45% chance red team wins
    blue: 0.45,   // 45% chance blue team wins  
    draw: 0.10    // 10% chance draw
};
```

### Stage 3: Score Filtering & Selection
Based on the selected outcome, filter available scores and randomly select one:

```typescript
// From player tunnel selection "R1B5", get all possible scores
const availableScores = DEFAULT_NUMBER_OF_VIDEOS["R1B5"];

// Filter scores based on selected outcome
if (selectedOutcome === "red") {
    // Find scores where red > blue (e.g., R13B12, R15B7, R10B5)
    validScores = scores.filter(score => redScore > blueScore);
} else if (selectedOutcome === "blue") {
    // Find scores where blue > red (e.g., R5B12, R7B15, R3B10)
    validScores = scores.filter(score => blueScore > redScore);
} else { // draw
    // Find scores where red === blue (e.g., R10B10, R7B7, R12B12)
    validScores = scores.filter(score => redScore === blueScore);
}

// Randomly select one valid score
const selectedScore = securePickOne(validScores);
```

### Stage 4: Video Index Generation
Generate random video index based on available video files:

```typescript
const videoCount = DEFAULT_NUMBER_OF_VIDEOS[tunnelKey][selectedScore];
const videoIndex = secureRandomRange(0, videoCount - 1);
```

## Detailed Flow Example

### Input
```typescript
playerSelections = { redTunnel: 1, blueTunnel: 5 }  // Player chooses R1B5 track
```

### Step 1: Outcome Selection
```typescript
// Use BET_CHOICE_RATE probabilities
const outcomes = ["red", "blue", "draw"];
const weights = [0.45, 0.45, 0.10];
const selectedOutcome = secureWeightedPick(outcomes, weights);
// Result: "red" (45% chance)
```

### Step 2: Available Scores Lookup
```typescript
const tunnelKey = "R1B5";
const availableScores = DEFAULT_NUMBER_OF_VIDEOS["R1B5"];
// Available: { "R13B12": 2, "R10B10": 1, "R11B5": 3, "R5B12": 1, ... }
```

### Step 3: Filter by Outcome
```typescript
// Selected outcome: "red" (red team wins)
// Filter for red > blue scores:
const validScores = [
    "R13B12",  // 13 > 12 ✅
    "R11B5",   // 11 > 5 ✅  
    "R14B10",  // 14 > 10 ✅
    // "R10B10" excluded (10 === 10, draw)
    // "R5B12" excluded (5 < 12, blue wins)
];
```

### Step 4: Random Score Selection
```typescript
const selectedScore = securePickOne(validScores);
// Result: "R13B12" (randomly selected from valid red-win scores)
```

### Step 5: Parse Selected Score
```typescript
// Parse "R13B12" -> red=13, blue=12
const redScore = 13;
const blueScore = 12;
```

### Step 6: Video Index Generation
```typescript
const videoCount = DEFAULT_NUMBER_OF_VIDEOS["R1B5"]["R13B12"]; // 2
const videoIndex = secureRandomRange(0, 1); // 0 or 1
// Result: videoIndex = 0
```

### Final Output
```typescript
return {
    red: 13,                    // Parsed from selected score
    blue: 12,                   // Parsed from selected score
    redTunnel: 1,              // Player's selection
    blueTunnel: 5,             // Player's selection  
    video: "R1B5-R13B12_0.mp4" // Final video filename
};
```

## Configuration Requirements

### 1. BET_CHOICE_RATE Configuration
```typescript
// New addition to constants.ts
export const BET_CHOICE_RATE = {
    red: 0.45,    // Red team win probability
    blue: 0.45,   // Blue team win probability
    draw: 0.10    // Draw probability
};
```

**Requirements**:
- Probabilities must sum to 1.0
- All values must be between 0.0 and 1.0
- System should validate probability sum on startup

### 2. DEFAULT_NUMBER_OF_VIDEOS Structure
Current structure remains the same:
```typescript
"R1B5": {
    "R13B12": 2,  // 2 video files for this score
    "R10B10": 1,  // 1 video file for this score
    "R11B5": 3,   // 3 video files for this score
    // ...
}
```

### 3. Remove matchResultConfig
The `matchResultConfig` from match-configs.ts is no longer needed and should be removed.

## Score Classification Logic

### Red Team Wins (red > blue)
```typescript
const isRedWin = (scoreKey: string): boolean => {
    const match = scoreKey.match(/^R(\d+)B(\d+)$/);
    if (!match) return false;
    const red = parseInt(match[1], 10);
    const blue = parseInt(match[2], 10);
    return red > blue;
};
```

### Blue Team Wins (blue > red)
```typescript
const isBlueWin = (scoreKey: string): boolean => {
    const match = scoreKey.match(/^R(\d+)B(\d+)$/);
    if (!match) return false;
    const red = parseInt(match[1], 10);
    const blue = parseInt(match[2], 10);
    return blue > red;
};
```

### Draw (red === blue)
```typescript
const isDraw = (scoreKey: string): boolean => {
    const match = scoreKey.match(/^R(\d+)B(\d+)$/);
    if (!match) return false;
    const red = parseInt(match[1], 10);
    const blue = parseInt(match[2], 10);
    return red === blue;
};
```

## Error Handling

### Missing Tunnel Configuration
```typescript
if (!DEFAULT_NUMBER_OF_VIDEOS[tunnelKey]) {
    throw new Error(`No video configuration found for tunnel: ${tunnelKey}`);
}
```

### No Valid Scores for Outcome
```typescript
const validScores = filterScoresByOutcome(availableScores, selectedOutcome);
if (validScores.length === 0) {
    throw new Error(`No valid scores found for ${tunnelKey} with outcome: ${selectedOutcome}`);
}
```

### Invalid Probability Configuration
```typescript
const totalProbability = Object.values(BET_CHOICE_RATE).reduce((sum, p) => sum + p, 0);
if (Math.abs(totalProbability - 1.0) > 0.001) {
    throw new Error(`BET_CHOICE_RATE probabilities must sum to 1.0, got: ${totalProbability}`);
}
```

## Implementation Notes

1. **Two-Stage Randomness**: First select outcome, then select specific score
2. **Outcome-Based Filtering**: Scores must match the randomly selected game outcome
3. **Flexible Video Support**: Each score can have different numbers of video variants
4. **Secure Random Operations**: All randomness uses sc-core-rng functions
5. **Clear Separation**: Outcome probability vs specific score selection

## Testing Scenarios

1. **Outcome Distribution**: Verify red/blue/draw selection matches configured probabilities
2. **Score Filtering**: Ensure only valid scores for each outcome are selected
3. **Video Index Range**: Confirm video indices stay within available file counts
4. **Edge Cases**: Test tunnels with limited outcome options (e.g., only draw scores)
5. **Configuration Validation**: Test invalid probability configurations

## Migration from V1

### Removed Components
- `matchResultConfig` from match-configs.ts
- Complex probability distributions per tunnel
- Direct score probability weighting

### New Components  
- `BET_CHOICE_RATE` outcome probabilities
- Score filtering by game outcome
- Two-stage random selection process

This new approach provides more predictable outcome distributions while maintaining variety in specific scores within each outcome category.


