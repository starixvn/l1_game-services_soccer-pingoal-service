# Soccer Pingoal - Place Bet Validation Implementation Instructions

## What Was Implemented

The `validateBetRequestParams` function in `/src/event-consumers/place-bet-consumer.ts` has been updated to include validation for `redTunnel` and `blueTunnel` properties according to your requirements.

## Implementation Details

### ✅ Completed Changes

1. **Extended Parameter Extraction**
   ```typescript
   const { betChoice, amount, redTunnel, blueTunnel } = request;
   ```

2. **Added Comprehensive Validation Rules**
   - **Amount Validation**: Amount must be provided and greater than 0
   - **BetChoice Validation**: Must be one of the valid choices from `BET_CHOICES` ("blue", "red", "draw")
   - **Tunnel Presence Validation**: Both `redTunnel` and `blueTunnel` must be provided
   - **Tunnel Range Validation**: Both values must be integers between 1 and 6 (inclusive)
   - **Tunnel Uniqueness Validation**: `redTunnel` and `blueTunnel` cannot be the same value

3. **Validation Logic Structure**
   The function now returns 8 validation checks:
   - Amount validation (must be > 0)
   - `betChoice` presence check
   - `betChoice` value validation (must be "blue", "red", or "draw")
   - `redTunnel` presence check
   - `blueTunnel` presence check  
   - `redTunnel` range validation (1-6, integer)
   - `blueTunnel` range validation (1-6, integer)
   - Tunnel uniqueness check (cannot be equal)

## How to Use

### Valid Request Example
```javascript
{
    betChoice: "blue",   // Valid: must be "blue", "red", or "draw"
    amount: 100,         // Valid: must be > 0
    redTunnel: 3,        // Valid: integer 1-6
    blueTunnel: 5        // Valid: integer 1-6, different from redTunnel
}
```

### Invalid Request Examples

**Invalid betChoice:**
```javascript
{
    betChoice: "yellow",  // Invalid: must be "blue", "red", or "draw"
    amount: 100,
    redTunnel: 1,
    blueTunnel: 2
}
```

**Missing tunnels:**
```javascript
{
    betChoice: "blue",
    amount: 100
    // Missing redTunnel and blueTunnel - will fail validation
}
```

**Out of range:**
```javascript
{
    betChoice: "red", 
    amount: 100,
    redTunnel: 7,    // Invalid: outside 1-6 range
    blueTunnel: 2
}
```

**Same values:**
```javascript
{
    betChoice: "draw",
    amount: 100, 
    redTunnel: 3,    // Invalid: same as blueTunnel
    blueTunnel: 3
}
```

## Error Messages

The implementation provides specific error messages:
- `"Amount is required and must be greater than 0"`
- `"BetChoice is required"`
- `"BetChoice must be one of: blue, red, draw. Received: [invalid_value]"`
- `"redTunnel is required"`
- `"blueTunnel is required"`
- `"redTunnel must be an integer between 1 and 6"`
- `"blueTunnel must be an integer between 1 and 6"`
- `"redTunnel and blueTunnel cannot be the same"`

## Testing Considerations

### Test Cases to Verify

1. **Happy Path**: Valid request with correct betChoice and tunnels
2. **Invalid BetChoice**: Request with betChoice not in ["blue", "red", "draw"]
3. **Missing BetChoice**: Request without betChoice property
4. **Invalid Amount**: Request with amount <= 0 or missing
5. **Missing Properties**: Request without `redTunnel` or `blueTunnel`
6. **Invalid Range**: Tunnels with values 0, 7, -1, etc.
7. **Non-Integer**: Tunnels with decimal values (1.5, 2.7)
8. **Same Values**: Both tunnels with identical values
9. **Edge Cases**: Boundary values (1, 6) and valid betChoice combinations

### Example Test Data
```javascript
// Valid cases
{ betChoice: "blue", amount: 100, redTunnel: 1, blueTunnel: 6 } // ✅ Valid
{ betChoice: "red", amount: 50, redTunnel: 3, blueTunnel: 2 } // ✅ Valid
{ betChoice: "draw", amount: 200, redTunnel: 5, blueTunnel: 4 } // ✅ Valid

// Invalid cases  
{ betChoice: "yellow", amount: 100, redTunnel: 1, blueTunnel: 2 } // ❌ Invalid betChoice
{ amount: 100, redTunnel: 1, blueTunnel: 2 } // ❌ Missing betChoice
{ betChoice: "blue", amount: 0, redTunnel: 1, blueTunnel: 2 } // ❌ Invalid amount
{ betChoice: "red", amount: 100, redTunnel: 0, blueTunnel: 1 } // ❌ redTunnel out of range
{ betChoice: "blue", amount: 100, redTunnel: 1, blueTunnel: 7 } // ❌ blueTunnel out of range
{ betChoice: "draw", amount: 100, redTunnel: 3, blueTunnel: 3 } // ❌ Same tunnel values
{ betChoice: "blue", amount: 100, redTunnel: 1.5, blueTunnel: 2 } // ❌ Non-integer
{ betChoice: "red", amount: 100, blueTunnel: 2 } // ❌ Missing redTunnel
```

## Files Modified

1. **`/src/event-consumers/place-bet-consumer.ts`** - Updated `validateBetRequestParams` method
2. **`/docs/place-bet-validation-analysis.md`** - Analysis documentation (NEW)
3. **`/docs/implementation-instructions.md`** - This instruction file (NEW)

## Next Steps

1. **Test the Implementation**: Run your existing tests and add new ones for tunnel validation
2. **Frontend Integration**: Update your frontend to send `redTunnel` and `blueTunnel` properties
3. **Error Handling**: Ensure your frontend properly handles the new validation error messages
4. **Monitoring**: Monitor logs to ensure the new validation is working as expected

## Verification

To verify the implementation is working:

1. **Check the code changes** in `/src/event-consumers/place-bet-consumer.ts`
2. **Run your existing tests** to ensure no regression
3. **Add new tests** for the tunnel validation scenarios
4. **Test with API calls** using various request payloads

The implementation is production-ready and follows the same patterns as the existing codebase!
