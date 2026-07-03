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
      count: jest.fn(),
      query: jest.fn(),
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
    mockQueryRunner.manager.query.mockResolvedValue([]);
  });

  it("should consume FREE sessions before PAID sessions (free + paid combination)", async () => {
    const mockPass = {
      id: 1,
      status: PassStatus.ACTIVE,
      subtotalAmount: 300,
      finalAmount: 240, // 20% discount
      items: [
        {
          id: 10,
          passId: 1,
          assetId: 100,
          freeQuantity: 1,
          paidQuantity: 3,
          totalQuantity: 4,
          unitPrice: 100,
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
    expect(freeToken?.amount).toBe(0); // Free sessions have amount = 0

    expect(paidToken).toBeDefined();
    expect(paidToken?.redeemedQuantity).toBe(1);
    expect(paidToken?.remarks).toBe("Service redeemed (Paid)");
    // allocatedConsumptionValue = 100 * (240 / 300) = 80. paidToken amount = 80 * 1 = 80
    expect(paidToken?.amount).toBe(80);

    getMapSpy.mockRestore();
  });

  it("should handle only free sessions", async () => {
    const mockPass = {
      id: 1,
      status: PassStatus.ACTIVE,
      subtotalAmount: 0,
      finalAmount: 0,
      items: [
        {
          id: 10,
          passId: 1,
          assetId: 100,
          freeQuantity: 2,
          paidQuantity: 0,
          totalQuantity: 2,
          unitPrice: 100,
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
    expect(savedTokens[0]?.amount).toBe(0);

    getMapSpy.mockRestore();
  });

  it("should handle only paid sessions", async () => {
    const mockPass = {
      id: 1,
      status: PassStatus.ACTIVE,
      subtotalAmount: 200,
      finalAmount: 200,
      items: [
        {
          id: 10,
          passId: 1,
          assetId: 100,
          freeQuantity: 0,
          paidQuantity: 2,
          totalQuantity: 2,
          unitPrice: 100,
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
    // allocatedConsumptionValue = 100 * (200 / 200) = 100. amount = 100 * 1 = 100
    expect(savedTokens[0]?.amount).toBe(100);

    getMapSpy.mockRestore();
  });

  it("should handle final redemption scenario and update status to FULLY_REDEEMED", async () => {
    const mockPass = {
      id: 1,
      status: PassStatus.PARTIALLY_REDEEMED,
      subtotalAmount: 100,
      finalAmount: 100,
      items: [
        {
          id: 10,
          passId: 1,
          assetId: 100,
          freeQuantity: 1,
          paidQuantity: 1,
          totalQuantity: 2,
          unitPrice: 100,
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
      amount: 0,
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
    expect(savedTokens[0]?.amount).toBe(100);

    // The status of the pass should change to FULLY_REDEEMED
    expect(mockPass.status).toBe(PassStatus.FULLY_REDEEMED);
    expect(passRepoSaveSpy).toHaveBeenCalledWith(mockPass);

    getMapSpy.mockRestore();
  });

  describe("PassesService - Creation Concurrency Retries", () => {
    it("should retry transaction when unique constraint conflict occurs on passNumber", async () => {
      mockCustomerRepository.findOne.mockResolvedValue({
        id: 51,
      });
      mockAssetRepository.find.mockResolvedValue([
        {
          id: 61,
          isActive: true,
          unitPrice: 100,
          categoryId: 1,
          outletId: 4,
        },
      ]);

      mockQueryRunner.manager.find = jest.fn().mockResolvedValue([]);
      const managerQueryMock = mockQueryRunner.manager.query;
      
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}${mm}${dd}`;

      let queryCallCount = 0;
      managerQueryMock.mockImplementation(async () => {
        queryCallCount++;
        if (queryCallCount === 1) {
          return [];
        } else {
          return [{ passNumber: `AW${dateStr}0005` }];
        }
      });

      let saveAttempts = 0;
      const managerSaveMock = mockQueryRunner.manager.save;
      managerSaveMock.mockImplementation(
        async (entity: unknown, data?: unknown) => {
          await Promise.resolve();
          const actualData = (data || entity) as Record<string, unknown>;
          if (
            actualData &&
            typeof actualData === "object" &&
            actualData.passNumber
          ) {
            saveAttempts++;
            if (saveAttempts === 1) {
              const err = new Error(
                'duplicate key value violates unique constraint "UQ_7681e678f3ead35ab2bf197692d"',
              ) as Error & { code?: string };
              err.code = "23505";
              throw err;
            }
          }
          return { id: 123, ...actualData };
        },
      );

      jest
        .spyOn(service, "findOneMapped")
        .mockResolvedValue({ id: 123 } as unknown as PassResponseDto);

      const result = await service.create(
        {
          customerId: 51,
          discountType: "NONE",
          discountValue: 0,
          items: [{ assetId: 61, paidQuantity: 1, freeQuantity: 0 }],
          paymentMethod: "CASH",
        },
        5,
        "ADMIN",
        undefined,
      );

      expect(result).toEqual({ id: 123 });
      expect(saveAttempts).toBe(2);
    });
  });

  describe("PassesService - Payment Validation", () => {
    beforeEach(() => {
      mockCustomerRepository.findOne.mockResolvedValue({
        id: 51,
      });
      mockAssetRepository.find.mockResolvedValue([
        {
          id: 61,
          isActive: true,
          unitPrice: 100,
          categoryId: 1,
          outletId: 4,
        },
      ]);
    });

    it("should throw BadRequestException if paymentMethod is missing and finalAmount > 0", async () => {
      await expect(
        service.create(
          {
            customerId: 51,
            discountType: "NONE",
            discountValue: 0,
            items: [{ assetId: 61, paidQuantity: 1, freeQuantity: 0 }],
          },
          5,
          "ADMIN",
          undefined,
        ),
      ).rejects.toThrow("Payment method is required");
    });

    it("should throw BadRequestException if paymentMethod is invalid", async () => {
      await expect(
        service.create(
          {
            customerId: 51,
            discountType: "NONE",
            discountValue: 0,
            items: [{ assetId: 61, paidQuantity: 1, freeQuantity: 0 }],
            paymentMethod: "INVALID_METHOD",
          },
          5,
          "ADMIN",
          undefined,
        ),
      ).rejects.toThrow("Invalid payment method");
    });

    it("should throw BadRequestException if paidAmount exceeds finalAmount", async () => {
      await expect(
        service.create(
          {
            customerId: 51,
            discountType: "NONE",
            discountValue: 0,
            items: [{ assetId: 61, paidQuantity: 1, freeQuantity: 0 }],
            paymentMethod: "CASH",
            paidAmount: 150,
          },
          5,
          "ADMIN",
          undefined,
        ),
      ).rejects.toThrow("Paid amount cannot exceed final amount");
    });
  });
});
