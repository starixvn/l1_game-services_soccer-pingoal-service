import { currencyData } from "../_stubs/test-data";
import { GameClientDriver, normalUser, eventTypes } from "sc-game-service-integration-utils";
import gameSettings from "../_stubs/game-settings";

export const checkConnect = (socketOptions, callback) => {
    const normalUserClientDriver = new GameClientDriver(socketOptions, initUserSession(normalUser));
    normalUserClientDriver.on(eventTypes.connectError, () => {
        setTimeout(() => {
            checkConnect(socketOptions, callback);
        }, 1000);
    });
    normalUserClientDriver.on(eventTypes.connect, () => {
        normalUserClientDriver.close();
        setTimeout(callback, 2000);
    });
};

export const initUserSession = (user) => {
    return {
        session: `${user.playerId}-session-id`,
        ss: `${user.playerId}-session-id`,
        currency: currencyData.name,
        username: `${user.playerId}_${user.playerName}`,
        browserUserAgent: "browser-user-agent",
    };
};
