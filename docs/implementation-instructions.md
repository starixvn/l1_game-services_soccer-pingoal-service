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
   - **Presence Validation**: Both `redTunnel` and `blueTunnel` must be provided
   - **Range Validation**: Both values must be integers between 1 and 6 (inclusive)
   - **Uniqueness Validation**: `redTunnel` and `blueTunnel` cannot be the same value

3. **Validation Logic Structure**
   The function now returns 6 validation checks:
   - Basic validation (original: `amount` and `betChoice`)
   - `redTunnel` presence check
   - `blueTunnel` presence check  
   - `redTunnel` range validation (1-6, integer)
   - `blueTunnel` range validation (1-6, integer)
   - Tunnel uniqueness check (cannot be equal)

## How to Use

### Valid Request Example
```javascript
{
    betChoice: "some_bet_choice",
    amount: 100,
    redTunnel: 3,    // Valid: integer 1-6
    blueTunnel: 5    // Valid: integer 1-6, different from redTunnel
}
```

### Invalid Request Examples

**Missing tunnels:**
```javascript
{
    betChoice: "some_bet_choice",
    amount: 100
    // Missing redTunnel and blueTunnel - will fail validation
}
```

**Out of range:**
```javascript
{
    betChoice: "some_bet_choice", 
    amount: 100,
    redTunnel: 7,    // Invalid: outside 1-6 range
    blueTunnel: 2
}
```

**Same values:**
```javascript
{
    betChoice: "some_bet_choice",
    amount: 100, 
    redTunnel: 3,    // Invalid: same as blueTunnel
    blueTunnel: 3
}
```

## Error Messages

The implementation provides specific error messages:
- `"redTunnel is required"`
- `"blueTunnel is required"`
- `"redTunnel must be an integer between 1 and 6"`
- `"blueTunnel must be an integer between 1 and 6"`
- `"redTunnel and blueTunnel cannot be the same"`

## Testing Considerations

### Test Cases to Verify

1. **Happy Path**: Valid tunnels (different values, 1-6 range)
2. **Missing Properties**: Request without `redTunnel` or `blueTunnel`
3. **Invalid Range**: Tunnels with values 0, 7, -1, etc.
4. **Non-Integer**: Tunnels with decimal values (1.5, 2.7)
5. **Same Values**: Both tunnels with identical values
6. **Edge Cases**: Boundary values (1, 6)

### Example Test Data
```javascript
// Valid cases
{ redTunnel: 1, blueTunnel: 6 } // ✅ Valid
{ redTunnel: 3, blueTunnel: 2 } // ✅ Valid

// Invalid cases  
{ redTunnel: 0, blueTunnel: 1 } // ❌ redTunnel out of range
{ redTunnel: 1, blueTunnel: 7 } // ❌ blueTunnel out of range
{ redTunnel: 3, blueTunnel: 3 } // ❌ Same values
{ redTunnel: 1.5, blueTunnel: 2 } // ❌ Non-integer
{ blueTunnel: 2 } // ❌ Missing redTunnel
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
