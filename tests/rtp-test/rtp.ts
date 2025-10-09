import { Table } from "sc-game-base";
import appConfigs from "../../src/app-configs";
import ContainerRegistry from "../../src/container-registry";
import GameDefinition from "../../src/game-definition";
import gameSettings from "../../src/game-settings";
import { resultHelper } from "../../src/helpers";
import { BET_CHOICES } from "../../src/constants";
import path from "path";
import fs from "fs/promises";

const definition = new GameDefinition(
    gameSettings as any,
    resultHelper.generateResult,
    resultHelper.getSettlementResult,
    resultHelper.generateRawResultForHash
);

const gameData = new Table.TableGameData(gameSettings.durations.wholeRound);

const container = new ContainerRegistry().register(appConfigs, definition, gameData);

const selections = { redTunnel: 2, blueTunnel: 4 };
const settleGameRoundConsumer = container.resolve("settleGameRoundConsumer");
const odds = {
    [BET_CHOICES.blue]: 2.1,
    [BET_CHOICES.red]: 2.1,
    [BET_CHOICES.draw]: 9,
};

async function saveData(filename: string, data: any): Promise<void> {
    try {
        const dirname = path.dirname(filename);
        const filePath = path.join(dirname, "tests", "rtp-test", filename);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        console.log(`Data saved as ${filename}`);
    } catch (err) {
        console.error("Error writing data:", err);
        throw err;
    }
}

function calculateRTP(ROUND_IN_BATCH: number) {
    const totalBetsPerBetChoice = {} as Record<string, number>;
    const totalWinsPerBetChoice = {} as Record<string, number>;
    let totalBets = 0;
    let totalWins = 0;

    for (let i = 0; i < ROUND_IN_BATCH; i++) {
        const { result } = settleGameRoundConsumer.generateResultWithId(selections, i);
        const settlementResult = definition.settle(result);

        Object.values(BET_CHOICES).forEach((betChoice) => {
            if (!totalBetsPerBetChoice[betChoice]) {
                totalBetsPerBetChoice[betChoice] = 0;
            }
            if (!totalWinsPerBetChoice[betChoice]) {
                totalWinsPerBetChoice[betChoice] = 0;
            }

            const betAmount = 1;
            const winAmount = settlementResult[betChoice] ? betAmount * odds[betChoice] : 0;

            totalBetsPerBetChoice[betChoice] += betAmount;
            totalWinsPerBetChoice[betChoice] += winAmount;

            totalBets += betAmount;
            totalWins += winAmount;
        });
    }

    const rtpPerBetChoice = Object.values(BET_CHOICES).reduce((acc, betChoice) => {
        acc[betChoice] = totalWinsPerBetChoice[betChoice] / totalBetsPerBetChoice[betChoice];
        return acc;
    }, {} as Record<string, number>);

    const rtpTotal = totalWins / totalBets;

    rtpPerBetChoice.total = rtpTotal;

    return rtpPerBetChoice;
}

// Main execution
async function main() {
    console.time("RTP");

    const totalRtp = [] as any[];
    const ROUND_IN_BATCH = 5_000;
    const TOTAL_BATCHES = 24;

    for (let i = 0; i < TOTAL_BATCHES; i++) {
        const rtp = calculateRTP(ROUND_IN_BATCH);
        totalRtp.push(rtp);
    }

    await saveData("rtp_report.json", totalRtp);

    console.timeEnd("RTP");
}

// Execute and handle errors
main().catch(console.error);
