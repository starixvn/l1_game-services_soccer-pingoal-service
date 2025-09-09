export const BET_CHOICES = {
    blue: "blue",
    red: "red",
    draw: "draw",
};

export const BET_CHOICE_ENUM = {
    [BET_CHOICES.blue]: 1,
    [BET_CHOICES.red]: 2,
    [BET_CHOICES.draw]: 3,
};

export const IS_DEV_ENV = process.env.NODE_ENV === "development";

export const GAME_NAME = "soccerpingoal";

export const MODEL_NAME_PREFIX = IS_DEV_ENV ? `${GAME_NAME}_dev` : `${GAME_NAME}`;
