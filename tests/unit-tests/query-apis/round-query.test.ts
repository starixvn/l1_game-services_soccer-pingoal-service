import { RoundQuery } from "../../../src/crons/query-apis/round-query";

describe("RoundQuery", () => {
    let roundQuery: RoundQuery;
    let mockRoundsRepository: any;
    let mockResultsRepository: any;
    let mockBetsRepository: any;

    beforeEach(() => {
        const createMockRepository = () => ({
            find: jest.fn().mockReturnThis(),
            lean: jest.fn().mockReturnThis(),
            exec: jest.fn()
        });

        mockRoundsRepository = createMockRepository();
        mockResultsRepository = createMockRepository();
        mockBetsRepository = createMockRepository();

        roundQuery = new RoundQuery(mockRoundsRepository, mockResultsRepository, mockBetsRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getList", () => {
        it("should call getPlayerRounds when userid is provided", async () => {
            const limit = 10;
            const userid = "player123";
            jest.spyOn(roundQuery as any, 'getPlayerRounds').mockResolvedValue([]);

            await roundQuery.getList(limit, userid);

            expect((roundQuery as any).getPlayerRounds).toHaveBeenCalledWith(limit, userid);
        });

        it("should call parent getList when userid is not provided", async () => {
            const limit = 10;

            const parentGetListSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(roundQuery)), 'getList').mockResolvedValue([]);

            await roundQuery.getList(limit);

            expect(parentGetListSpy).toHaveBeenCalledWith(limit);
        });

        it("should call parent getList when userid is undefined", async () => {
            const limit = 5;

            const parentGetListSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(roundQuery)), 'getList').mockResolvedValue([]);

            await roundQuery.getList(limit, undefined);

            expect(parentGetListSpy).toHaveBeenCalledWith(limit);
        });
    });
});
