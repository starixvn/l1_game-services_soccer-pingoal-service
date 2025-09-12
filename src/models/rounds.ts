import mongoose from "mongoose";
import { BET_CHOICES, MODEL_NAME_PREFIX } from "../constants";

export interface Result {
    red: number;
    blue: number;
    redTunnel: number;
    blueTunnel: number;
    video: string;
}

const resultSchema = new mongoose.Schema<Result>(
    {
        red: { type: Number, required: true },
        blue: { type: Number, required: true },
        redTunnel: { type: Number, required: true },
        blueTunnel: { type: Number, required: true },
        video: { type: String, required: true },
    },
    { _id: false }
);

const dynamicResultSchema = Object.values(BET_CHOICES).reduce(
    (schema, item) => ({
        ...schema,
        [item]: { type: Boolean },
    }),
    {}
);
const settlementResultSchema = new mongoose.Schema<Record<string, boolean>>(dynamicResultSchema, { _id: false });

export interface IRound {
    id: number;
    result: Result;
    settlementResult: Record<string, boolean>;
    time: Date;
    exchangeRateId: number;
}

const RoundSchema = new mongoose.Schema<IRound>({
    id: { type: Number, required: true },
    result: resultSchema,
    settlementResult: settlementResultSchema,
    time: { type: Date, default: () => new Date() },
    exchangeRateId: { type: Number, required: true },
});

const modelName = `${MODEL_NAME_PREFIX}_rounds`;
const Round = mongoose.model(modelName, RoundSchema);

export default Round;
