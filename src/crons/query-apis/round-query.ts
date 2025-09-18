import { Core } from "sc-game-base";

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

    private async getPlayerRounds(limit: number, userid: string): Promise<any[]>  {
        const bets = await this.betsRepository
            .find(
                { 
                    playerId: userid,
                    paid: true 
                },
                { roundId: 1 },
                { 
                    sort: { _id: -1 },
                    limit: limit 
                }
            )
            .lean()
            .exec();

        // 取出所有 roundId
        const roundIds = bets.map((bet: { roundId: number }) => bet.roundId);

        // 用這些 roundId 去查 rounds 表
        const rounds = await this.roundsRepository
            .find(
                { id: { $in: roundIds } },
                {},
                { sort: { _id: -1 } }
            )
            .lean()
            .exec();

        return rounds.map((round: any) => {
            const result = round.result ?? this.convertResult(round);
            const settlementResult = round.settlementResult ?? this.convertSettlementResult(result);

            return {
                settlementResult,
            };
        });
    }
}