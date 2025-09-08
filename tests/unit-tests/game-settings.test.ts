import gameSettings from "../../src/game-settings";

describe("gameSettings", () => {
    it("should have the correct id", () => {
        expect(gameSettings.id).toBe(156);
    });
});
