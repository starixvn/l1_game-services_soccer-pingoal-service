import mongoose from "mongoose";
import { MODEL_NAME_PREFIX } from "../constants";

export interface IRound {
    id: number;
    result: any;
    settlementResult: any;
    time: Date;
    exchangeRateId: number;
}

const RoundSchema = new mongoose.Schema<IRound>({
    id: { type: Number, required: true },
    result: { type: Object },
    settlementResult: { type: Object },
    time: { type: Date, default: () => new Date() },
    exchangeRateId: { type: Number, required: true },
});

const modelName = `${MODEL_NAME_PREFIX}_rounds`;
const Round = mongoose.model(modelName, RoundSchema);

export default Round;
