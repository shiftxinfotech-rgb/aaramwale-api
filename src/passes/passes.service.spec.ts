import { Test, TestingModule } from "@nestjs/testing";
import { PassesService } from "./passes.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Pass, PassStatus } from "./pass.entity";
import { Asset } from "../assets/asset.entity";
import { Customer } from "../customers/customer.entity";
import { Token } from "./token.entity";
import { DataSource } from "typeorm";
import { PassResponseDto } from "./dto/pass-response.dto";

describe("PassesService - Redemption Priority", () => {
  let service: PassesService;
  let passRepoFindOneSpy: jest.Mock;
  let passRepoSaveSpy: jest.Mock;
  let queryRunnerManagerFindSpy: jest.Mock;
  let queryRunnerManagerSaveSpy: jest.Mock;

  const mockPassRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockAssetRepository = {
    find: jest.fn(),
  };

  const mockCustomerRepository = {
    findOne: jest.fn(),
  };

  const mockTokenRepository = {
    find: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      find: jest.fn(),
      create: jest.fn((entity: unknown, data: Record<string, unknown>) => ({
        id: Math.floor(Math.random() * 1000) + 1,
        ...data,
      })),
      save: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
    getRepository: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PassesService,
        {
          provide: getRepositoryToken(Pass),
          useValue: mockPassRepository,
        },
        {
          provide: getRepositoryToken(Asset),
          useValue: mockAssetRepository,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: getRepositoryToken(Token),
          useValue: mockTokenRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<PassesService>(PassesService);

    passRepoFindOneSpy = mockPassRepository.findOne;
    passRepoSaveSpy = mockPassRepository.save;
    queryRunnerManagerFindSpy = mockQueryRunner.manager.find;
    queryRunnerManagerSaveSpy = mockQueryRunner.manager.save;

    jest.clearAllMocks();
  });

  it("should consume FREE sessions before PAID sessions (free + paid combination)", async () => {
    const mockPass = {
      id: 1,
      status: PassStatus.ACTIVE,
      items: [
        {
          id: 10,
          passId: 1,
          assetId: 100,
          freeQuantity: 1,
          paidQuantity: 3,
          totalQuantity: 4,
        },
      ],
    } as unknown as Pass;

    passRepoFindOneSpy.mockResolvedValue(mockPass);
    queryRunnerManagerFindSpy.mockResolvedValue([]); // no tokens previously saved

    // Mock getRedemptionMapForPasses
    const mockRedemptionMap = new Map<number, number>();
    mockRedemptionMap.set(10, 0); // 0 total redeemed before
    const getMapSpy = jest
      .spyOn(
        service as unknown as {
          getRedemptionMapForPasses: (
            ids: number[],
          ) => Promise<Map<number, number>>;
        },
        "getRedemptionMapForPasses",
      )
      .mockResolvedValue(mockRedemptionMap);

    // Mock findOneMapped
    jest
      .spyOn(service, "findOneMapped")
      .mockResolvedValue({ id: 1 } as unknown as PassResponseDto);

    // Call redeem to consume 2 sessions (should consume 1 free first, then 1 paid)
    await service.redeem(
      1,
      { items: [{ passItemId: 10, redeemQuantity: 2 }] },
      5,
    );

    // Check manager.save calls
    const savedTokens = (
      queryRunnerManagerSaveSpy.mock.calls as unknown[][]
    ).map((call) => call[1] as Token);
    expect(savedTokens).toHaveLength(2);

    const freeToken = savedTokens.find((t) => t.isFreeConsumption === true);
    const paidToken = savedTokens.find((t) => t.isFreeConsumption === false);

    expect(freeToken).toBeDefined();
    expect(freeToken?.redeemedQuantity).toBe(1);
    expect(freeToken?.remarks).toBe("Service redeemed (Free)");

    expect(paidToken).toBeDefined();
    expect(paidToken?.redeemedQuantity).toBe(1);
    expect(paidToken?.remarks).toBe("Service redeemed (Paid)");

    getMapSpy.mockRestore();
  });

  it("should handle only free sessions", async () => {
    const mockPass = {
      id: 1,
      status: PassStatus.ACTIVE,
      items: [
        {
          id: 10,
          passId: 1,
          assetId: 100,
          freeQuantity: 2,
          paidQuantity: 0,
          totalQuantity: 2,
        },
      ],
    } as unknown as Pass;

    passRepoFindOneSpy.mockResolvedValue(mockPass);
    queryRunnerManagerFindSpy.mockResolvedValue([]); // no tokens previously saved

    const mockRedemptionMap = new Map<number, number>();
    mockRedemptionMap.set(10, 0);
    const getMapSpy = jest
      .spyOn(
        service as unknown as {
          getRedemptionMapForPasses: (
            ids: number[],
          ) => Promise<Map<number, number>>;
        },
        "getRedemptionMapForPasses",
      )
      .mockResolvedValue(mockRedemptionMap);

    jest
      .spyOn(service, "findOneMapped")
      .mockResolvedValue({ id: 1 } as unknown as PassResponseDto);

    // Redeem 1 session
    await service.redeem(
      1,
      { items: [{ passItemId: 10, redeemQuantity: 1 }] },
      5,
    );

    const savedTokens = (
      queryRunnerManagerSaveSpy.mock.calls as unknown[][]
    ).map((call) => call[1] as Token);
    expect(savedTokens).toHaveLength(1);
    expect(savedTokens[0]?.isFreeConsumption).toBe(true);
    expect(savedTokens[0]?.redeemedQuantity).toBe(1);

    getMapSpy.mockRestore();
  });

  it("should handle only paid sessions", async () => {
    const mockPass = {
      id: 1,
      status: PassStatus.ACTIVE,
      items: [
        {
          id: 10,
          passId: 1,
          assetId: 100,
          freeQuantity: 0,
          paidQuantity: 2,
          totalQuantity: 2,
        },
      ],
    } as unknown as Pass;

    passRepoFindOneSpy.mockResolvedValue(mockPass);
    queryRunnerManagerFindSpy.mockResolvedValue([]); // no tokens previously saved

    const mockRedemptionMap = new Map<number, number>();
    mockRedemptionMap.set(10, 0);
    const getMapSpy = jest
      .spyOn(
        service as unknown as {
          getRedemptionMapForPasses: (
            ids: number[],
          ) => Promise<Map<number, number>>;
        },
        "getRedemptionMapForPasses",
      )
      .mockResolvedValue(mockRedemptionMap);

    jest
      .spyOn(service, "findOneMapped")
      .mockResolvedValue({ id: 1 } as unknown as PassResponseDto);

    // Redeem 1 session
    await service.redeem(
      1,
      { items: [{ passItemId: 10, redeemQuantity: 1 }] },
      5,
    );

    const savedTokens = (
      queryRunnerManagerSaveSpy.mock.calls as unknown[][]
    ).map((call) => call[1] as Token);
    expect(savedTokens).toHaveLength(1);
    expect(savedTokens[0]?.isFreeConsumption).toBe(false);
    expect(savedTokens[0]?.redeemedQuantity).toBe(1);

    getMapSpy.mockRestore();
  });

  it("should handle final redemption scenario and update status to FULLY_REDEEMED", async () => {
    const mockPass = {
      id: 1,
      status: PassStatus.PARTIALLY_REDEEMED,
      items: [
        {
          id: 10,
          passId: 1,
          assetId: 100,
          freeQuantity: 1,
          paidQuantity: 1,
          totalQuantity: 2,
        },
      ],
    } as unknown as Pass;

    passRepoFindOneSpy.mockResolvedValue(mockPass);

    // Mock that 1 free session is already redeemed in the tokens table
    const existingToken = {
      id: 99,
      passItemId: 10,
      redeemedQuantity: 1,
      isFreeConsumption: true,
    } as Token;
    queryRunnerManagerFindSpy.mockResolvedValue([existingToken]);

    // For pass status update checking at the end, getRedemptionMapForPasses needs to return full redemption
    const mockRedemptionMap = new Map<number, number>();
    mockRedemptionMap.set(10, 2); // 2 total redeemed (1 existing + 1 new)
    const getMapSpy = jest
      .spyOn(
        service as unknown as {
          getRedemptionMapForPasses: (
            ids: number[],
          ) => Promise<Map<number, number>>;
        },
        "getRedemptionMapForPasses",
      )
      .mockResolvedValue(mockRedemptionMap);

    jest
      .spyOn(service, "findOneMapped")
      .mockResolvedValue({ id: 1 } as unknown as PassResponseDto);

    // Redeem remaining 1 session (should consume paid session)
    await service.redeem(
      1,
      { items: [{ passItemId: 10, redeemQuantity: 1 }] },
      5,
    );

    const savedTokens = (
      queryRunnerManagerSaveSpy.mock.calls as unknown[][]
    ).map((call) => call[1] as Token);
    expect(savedTokens).toHaveLength(1);
    expect(savedTokens[0]?.isFreeConsumption).toBe(false);
    expect(savedTokens[0]?.redeemedQuantity).toBe(1);

    // The status of the pass should change to FULLY_REDEEMED
    expect(mockPass.status).toBe(PassStatus.FULLY_REDEEMED);
    expect(passRepoSaveSpy).toHaveBeenCalledWith(mockPass);

    getMapSpy.mockRestore();
  });
});
