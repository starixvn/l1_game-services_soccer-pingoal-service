# Game Result Generation Requirements

## Overview
The game result generation system needs to use probability-based scoring instead of simple random generation. The system should respect the tunnel selections made by players and generate realistic game scores based on configured probability distributions.

## Current Implementation Issue
Currently, the `generateResult` function uses simple random generation:
```typescript
const redScore = secureRandomRange(0, 3); // 0-3 goals
const blueScore = secureRandomRange(0, 3); // 0-3 goals
```

This approach doesn't reflect realistic game distributions or respect the tunnel-based scoring system.

## New Requirements

### ⚠️ **CRITICAL CONSTRAINT**
**All game scores MUST come exclusively from `matchResultConfig`**. No scores should be randomly generated outside of the configured probability distributions. If a tunnel combination is not configured, the system should throw an error rather than generate fallback scores.

### 1. Tunnel-Based Score Generation
When a player selects tunnel combinations (e.g., RedTunnel=2, BlueTunnel=1), the system should:

1. **Map to Configuration Key**: Convert player selections to config key format
   - Player selection: `RedTunnel=2, BlueTunnel=1`
   - Config key: `"R2B1"` (format: `R{RedTunnel}B{BlueTunnel}`)

2. **Lookup Probability Distribution**: Find the corresponding probability weights in `matchResultConfig`
   ```typescript
   // Example from matchResultConfig["R1B2"]
   {
     "R10B10": 0.02,  // 2% chance
     "R15B7": 0.08,   // 8% chance  
     "R13B12": 0.05,  // 5% chance
     // ... more combinations
   }
   ```

3. **Weighted Random Selection**: Use `sc-core-rng` with probability weights to select actual game score
   - Use `secureWeightedPick` to respect the configured probabilities
   - Selected result example: `"R15B7"` (Red=15, Blue=7)

4. **Parse Selected Score**: Extract red and blue scores from selected key
   ```typescript
   // From "R15B7" extract:
   const redScore = 15;   // Red team score
   const blueScore = 7;   // Blue team score
   ```

### 2. Video Index Generation
After selecting the game score, determine video index:

1. **Lookup Video Count**: Use `DEFAULT_NUMBER_OF_VIDEOS` to find available video variants
   ```typescript
   // Example: DEFAULT_NUMBER_OF_VIDEOS["R1B2"]["R15B7"] = 2
   // This means 2 video variants available: index 0 and 1
   ```

2. **Random Index Selection**: Randomly select from available indices
   ```typescript
   const maxIndex = DEFAULT_NUMBER_OF_VIDEOS[tunnelKey][scoreKey] - 1;
   const videoIndex = secureRandomRange(0, maxIndex); // 0 to (count-1)
   ```

### 3. Video Filename Generation
Generate final video filename using all components:

```typescript
video: `R${playerSelections.redTunnel}B${playerSelections.blueTunnel}-R${redScore}B${blueScore}_${videoIndex}.mp4`
```

**Example**:
- Player: RedTunnel=2, BlueTunnel=1
- Selected: "R15B7" with videoIndex=1  
- Result: `"R2B1-R15B7_1.mp4"`

## Data Flow Example

### Input
```typescript
playerSelections = {
  redTunnel: 2,    // Player's red tunnel choice
  blueTunnel: 1    // Player's blue tunnel choice
}
```

### Step 1: Build Config Key
```typescript
const tunnelKey = `R${playerSelections.redTunnel}B${playerSelections.blueTunnel}`;
// Result: "R2B1"
```

### Step 2: Get Probability Distribution  
```typescript
const probabilities = matchResultConfig[tunnelKey];
// Result: { "R10B10": 0.02, "R15B7": 0.08, ... }
```

### Step 3: Weighted Random Selection
```typescript
const scoreKeys = Object.keys(probabilities);
const weights = Object.values(probabilities);
const selectedScore = secureWeightedPick(scoreKeys, weights);
// Result: "R15B7" (selected based on probability weights)
```

### Step 4: Parse Score
```typescript
// Parse "R15B7" to extract scores
const redScore = 15;
const blueScore = 7;
```

### Step 5: Get Video Index
```typescript
const videoCount = DEFAULT_NUMBER_OF_VIDEOS[tunnelKey][selectedScore];
const videoIndex = secureRandomRange(0, videoCount - 1);
// Result: index 0 or 1 (if videoCount = 2)
```

### Step 6: Generate Result
```typescript
return {
  red: redScore,                           // 15
  blue: blueScore,                         // 7  
  redTunnel: playerSelections.redTunnel,   // 2
  blueTunnel: playerSelections.blueTunnel, // 1
  video: "R2B1-R15B7_1.mp4"              // Final video filename
};
```

## Configuration Requirements

### Current Config Structure Issue
The current `matchResultConfig` only contains keys for Red tunnel = 1:
- `"R1B2"`, `"R1B3"`, `"R1B4"`, `"R1B5"`, `"R1B6"`

**Missing configurations** for other red tunnel values:
- `"R2B1"`, `"R2B3"`, `"R2B4"`, etc.
- `"R3B1"`, `"R3B2"`, `"R3B4"`, etc.  
- ... (all other combinations)

### Required Actions
1. **Expand matchResultConfig**: Add probability configurations for all tunnel combinations (R1-R6, B1-B6)
2. **Expand DEFAULT_NUMBER_OF_VIDEOS**: Add video count mappings for all combinations
3. **Validate Configuration**: Ensure probabilities sum to 1.0 for each tunnel combination

## Error Handling

### Missing Configuration
```typescript
if (!matchResultConfig[tunnelKey]) {
  console.error("CRITICAL: Cannot generate result - no valid score combinations available!");
  throw new Error(`No score configuration available for tunnel combination: ${tunnelKey}. All scores must be defined in matchResultConfig.`);
}
```

**Important**: System will **never** generate fallback scores. All possible scores must be pre-configured in `matchResultConfig`.

### Invalid Probability Data
```typescript
const totalProbability = Object.values(probabilities).reduce((sum, p) => sum + p, 0);
if (Math.abs(totalProbability - 1.0) > 0.01) {
  console.warn(`Probability sum for ${tunnelKey} is ${totalProbability}, expected 1.0`);
}
```

### Missing Video Configuration
```typescript
if (!DEFAULT_NUMBER_OF_VIDEOS[tunnelKey] || !DEFAULT_NUMBER_OF_VIDEOS[tunnelKey][selectedScore]) {
  console.warn(`No video count configuration for ${tunnelKey}:${selectedScore}, using default index 0`);
  videoIndex = 0;
}
```

## Implementation Notes

1. **Use sc-core-rng**: All random operations must use secure random functions
2. **Preserve Player Selections**: Tunnel values in result must match player's original choices
3. **Realistic Scoring**: Generated scores should follow configured probability distributions
4. **Video Consistency**: Video filename must accurately reflect all game components
5. **Performance**: Cache configuration lookups if needed for high-frequency operations

## Testing Scenarios

1. **Standard Tunnel Combinations**: Test all configured tunnel pairs
2. **Probability Distribution**: Verify random selection respects configured weights
3. **Video Index Range**: Ensure generated indices are within available video counts
4. **Error Cases**: Test missing configurations and invalid data
5. **Integration**: Verify end-to-end flow from player selection to video generation
