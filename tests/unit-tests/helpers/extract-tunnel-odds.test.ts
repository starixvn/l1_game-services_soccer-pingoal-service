import { extractTunnelOdds } from "../../../src/helpers";

describe("extractTunnelOdds", () => {
    const mockFlatOdds = {
        R1B2_red: 2.1,
        R1B2_blue: 2.1,
        R1B2_draw: 9.0,
        R1B3_red: 2.2,
        R1B3_blue: 2.2,
        R1B3_draw: 9.5,
        R2B4_red: 1.9,
        R2B4_blue: 1.9,
        R2B4_draw: 8.5,
        R5B6_red: 2.5,
        R5B6_blue: 2.5,
        R5B6_draw: 10.0,
    };

    describe("Successful extraction", () => {
        it("should extract correct odds for R1B2 tunnel combination", () => {
            const result = extractTunnelOdds(mockFlatOdds, 1, 2);

            expect(result).toEqual({
                red: 2.1,
                blue: 2.1,
                draw: 9.0,
            });
        });

        it("should extract correct odds for R1B3 tunnel combination", () => {
            const result = extractTunnelOdds(mockFlatOdds, 1, 3);

            expect(result).toEqual({
                red: 2.2,
                blue: 2.2,
                draw: 9.5,
            });
        });

        it("should extract correct odds for R2B4 tunnel combination", () => {
            const result = extractTunnelOdds(mockFlatOdds, 2, 4);

            expect(result).toEqual({
                red: 1.9,
                blue: 1.9,
                draw: 8.5,
            });
        });

        it("should extract correct odds for R5B6 tunnel combination", () => {
            const result = extractTunnelOdds(mockFlatOdds, 5, 6);

            expect(result).toEqual({
                red: 2.5,
                blue: 2.5,
                draw: 10.0,
            });
        });
    });

    describe("Error handling", () => {
        it("should throw error when red odds is missing", () => {
            const incompleteOdds = {
                R1B2_blue: 2.1,
                R1B2_draw: 9.0,
            };

            expect(() => extractTunnelOdds(incompleteOdds, 1, 2)).toThrow(
                "Missing odds for tunnel combination R1B2. Expected keys: R1B2_red, R1B2_blue, R1B2_draw"
            );
        });

        it("should throw error when blue odds is missing", () => {
            const incompleteOdds = {
                R1B2_red: 2.1,
                R1B2_draw: 9.0,
            };

            expect(() => extractTunnelOdds(incompleteOdds, 1, 2)).toThrow(
                "Missing odds for tunnel combination R1B2. Expected keys: R1B2_red, R1B2_blue, R1B2_draw"
            );
        });

        it("should throw error when draw odds is missing", () => {
            const incompleteOdds = {
                R1B2_red: 2.1,
                R1B2_blue: 2.1,
            };

            expect(() => extractTunnelOdds(incompleteOdds, 1, 2)).toThrow(
                "Missing odds for tunnel combination R1B2. Expected keys: R1B2_red, R1B2_blue, R1B2_draw"
            );
        });

        it("should throw error when all odds are missing for the tunnel", () => {
            const emptyOdds = {};

            expect(() => extractTunnelOdds(emptyOdds, 3, 5)).toThrow(
                "Missing odds for tunnel combination R3B5. Expected keys: R3B5_red, R3B5_blue, R3B5_draw"
            );
        });

        it("should throw error for non-existent tunnel combination", () => {
            expect(() => extractTunnelOdds(mockFlatOdds, 3, 5)).toThrow(
                "Missing odds for tunnel combination R3B5. Expected keys: R3B5_red, R3B5_blue, R3B5_draw"
            );
        });
    });

    describe("Edge cases", () => {
        it("should handle odds with value 0", () => {
            const oddsWithZero = {
                R1B2_red: 0,
                R1B2_blue: 2.1,
                R1B2_draw: 9.0,
            };

            const result = extractTunnelOdds(oddsWithZero, 1, 2);

            expect(result).toEqual({
                red: 0,
                blue: 2.1,
                draw: 9.0,
            });
        });

        it("should handle very large odds values", () => {
            const largeOdds = {
                R1B2_red: 999.99,
                R1B2_blue: 888.88,
                R1B2_draw: 1000.0,
            };

            const result = extractTunnelOdds(largeOdds, 1, 2);

            expect(result).toEqual({
                red: 999.99,
                blue: 888.88,
                draw: 1000.0,
            });
        });

        it("should handle decimal precision", () => {
            const preciseOdds = {
                R1B2_red: 2.123456,
                R1B2_blue: 2.654321,
                R1B2_draw: 9.111111,
            };

            const result = extractTunnelOdds(preciseOdds, 1, 2);

            expect(result).toEqual({
                red: 2.123456,
                blue: 2.654321,
                draw: 9.111111,
            });
        });
    });

    describe("Type safety", () => {
        it("should work with all valid tunnel numbers (1-6)", () => {
            const completeOdds = {
                R1B2_red: 2.0,
                R1B2_blue: 2.0,
                R1B2_draw: 9.0,
                R1B6_red: 2.0,
                R1B6_blue: 2.0,
                R1B6_draw: 9.0,
                R6B1_red: 2.0,
                R6B1_blue: 2.0,
                R6B1_draw: 9.0,
            };

            expect(() => extractTunnelOdds(completeOdds, 1, 2)).not.toThrow();
            expect(() => extractTunnelOdds(completeOdds, 1, 6)).not.toThrow();
            expect(() => extractTunnelOdds(completeOdds, 6, 1)).not.toThrow();
        });
    });
});

