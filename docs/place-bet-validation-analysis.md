# Place Bet Validation Analysis

## Overview
This document analyzes the current place bet validation implementation and provides guidance on implementing custom validation for `redTunnel` and `blueTunnel` properties in the Soccer Pingoal service.

## Current Implementation

### File Structure
- **Main Implementation**: `/src/event-consumers/place-bet-consumer.ts`
- **Base Class**: `sc-game-base/src/core/event-consumers/place-bet-consumer.js`
- **Type Definitions**: `@types/sc-game-base/src/core/event-consumers/place-bet-consumer.d.ts`

### Current Code Analysis

```typescript
export default class PlaceBetConsumer extends Core.BaseEventConsumers.PlaceBetConsumer {
    validateBetRequestParams(request) {
        const { betChoice, amount } = request;

        return [
            {
                failure: !amount || !betChoice,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
            },
        ];
    }
}
```

#### What the current validation does:
- Validates that `amount` and `betChoice` are present in the request
- Returns an array of validation results
- Each validation result has `failure` (boolean) and `notice` (error message object) properties

## Validation Requirements

### New Properties to Validate
- `redTunnel`: Tunnel selection for red team (range: 1-6)
- `blueTunnel`: Tunnel selection for blue team (range: 1-6)

### Validation Rules
1. **Range Validation**: Both `redTunnel` and `blueTunnel` must be numbers between 1 and 6 (inclusive)
2. **Uniqueness Validation**: `redTunnel` and `blueTunnel` cannot have the same value
3. **Presence Validation**: Both properties must be present in the request

### Expected Request Structure
```javascript
{
    betChoice: "some_bet_choice",
    amount: 100,
    redTunnel: 3,    // Must be 1-6
    blueTunnel: 5    // Must be 1-6 and different from redTunnel
}
```

## Implementation Strategy

### Method Signature
The `validateBetRequestParams` method should:
- Accept a `request` parameter containing all bet request data
- Return an array of validation result objects
- Each result object should have `failure` (boolean) and `notice` (error message) properties

### Validation Logic Flow
1. Extract `betChoice`, `amount`, `redTunnel`, and `blueTunnel` from request
2. Validate basic properties (existing logic)
3. Validate tunnel properties are present
4. Validate tunnel range (1-6)
5. Validate tunnels are different
6. Return array of all validation results

### Error Handling
- Use `this.getNoticeObj()` method to create consistent error messages
- Each validation rule should have its own validation result
- All validations should be checked (don't short-circuit on first failure)

## Benefits of This Approach
- **Extensible**: Easy to add more validation rules
- **Consistent**: Uses the same pattern as base class validation
- **Maintainable**: Clear separation of different validation concerns
- **User-Friendly**: Provides specific error messages for different failure cases

## Next Steps
1. Update the `validateBetRequestParams` method with new validation logic
2. Test the validation with various input scenarios
3. Ensure error messages are user-friendly and internationalized if needed
