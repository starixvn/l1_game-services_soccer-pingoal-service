import { Core } from "sc-game-base";
import { MODEL_NAME_PREFIX } from "../../constants";

export class RoundQuery extends Core.QueryApis.RoundQuery {
    private readonly betsRepository: any;

    constructor(roundsRepository: any, resultsRepository: any, betsRepository: any) {
        super(roundsRepository, resultsRepository);
        this.betsRepository = betsRepository;
    }


    override async getList(limit: number, userid?: string) {
        if (userid) {
            return this.getPlayerRounds(limit, userid);
        }
        return super.getList(limit);
    }

    private async getPlayerRounds(limit: number, userid: string): Promise<any[]> {
        const userBetsWithRounds = await this.betsRepository.aggregate([
            {
                $match: {
                    playerId: userid,
                    paid: true
                }
            },
            {
                $sort: { _id: -1 }
            },
            {
                $limit: limit
            },
            {
                $lookup: {
                    from: `${MODEL_NAME_PREFIX}_rounds`,
                    localField: 'roundId',
                    foreignField: 'id',
                    as: 'round'
                }
            },
            {
                $unwind: '$round'
            }
        ]);

        return userBetsWithRounds.map((item: any) => {
            const roundData = item.round;
            const result = roundData.result ?? this.convertResult(roundData);
            const settlementResult = roundData.settlementResult ?? this.convertSettlementResult(result);

            return {
                settlementResult,
                result
            };
        });
    }
}