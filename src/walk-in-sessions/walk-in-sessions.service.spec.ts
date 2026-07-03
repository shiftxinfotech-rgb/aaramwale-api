import { Test, TestingModule } from "@nestjs/testing";
import { WalkInSessionsService } from "./walk-in-sessions.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { WalkInSession } from "./walk-in-session.entity";
import { Customer } from "../customers/customer.entity";
import { Asset } from "../assets/asset.entity";
import { Outlet } from "../outlets/outlet.entity";
import { User } from "../users/user.entity";
import { DataSource } from "typeorm";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("WalkInSessionsService - Payment Capture & Validation", () => {
  let service: WalkInSessionsService;

  const mockWalkInSessionRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockCustomerRepository = {
    findOne: jest.fn(),
  };

  const mockAssetRepository = {
    findOne: jest.fn(),
  };

  const mockOutletRepository = {
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      count: jest.fn(() => 0),
      create: jest.fn((entity: unknown, data: Record<string, unknown>) => ({
        id: 1,
        ...data,
      })),
      save: jest.fn((entity: Record<string, unknown>) => entity),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalkInSessionsService,
        {
          provide: getRepositoryToken(WalkInSession),
          useValue: mockWalkInSessionRepository,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: getRepositoryToken(Asset),
          useValue: mockAssetRepository,
        },
        {
          provide: getRepositoryToken(Outlet),
          useValue: mockOutletRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<WalkInSessionsService>(WalkInSessionsService);

    jest.clearAllMocks();
  });

  it("should fail creation if customer does not exist", async () => {
    mockCustomerRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create(
        {
          customerId: 99,
          outletId: 1,
          assetId: 1,
          quantity: 1,
        },
        1,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it("should fail creation if finalAmount > 0 and paymentMethod is missing", async () => {
    mockCustomerRepository.findOne.mockResolvedValue({ id: 1, outletId: 1 });
    mockOutletRepository.findOne.mockResolvedValue({ id: 1 });
    mockAssetRepository.findOne.mockResolvedValue({
      id: 1,
      isActive: true,
      unitPrice: 100,
      outletId: 1,
      categoryId: 1,
    });

    await expect(
      service.create(
        {
          customerId: 1,
          outletId: 1,
          assetId: 1,
          quantity: 2, // finalAmount = 200 > 0
        },
        1,
      ),
    ).rejects.toThrow(new BadRequestException("Payment method is required"));
  });

  it("should fail creation if paidAmount exceeds finalAmount", async () => {
    mockCustomerRepository.findOne.mockResolvedValue({ id: 1, outletId: 1 });
    mockOutletRepository.findOne.mockResolvedValue({ id: 1 });
    mockAssetRepository.findOne.mockResolvedValue({
      id: 1,
      isActive: true,
      unitPrice: 100,
      outletId: 1,
      categoryId: 1,
    });

    await expect(
      service.create(
        {
          customerId: 1,
          outletId: 1,
          assetId: 1,
          quantity: 2, // finalAmount = 200
          paymentMethod: "CASH",
          paidAmount: 250, // exceeds finalAmount
        },
        1,
      ),
    ).rejects.toThrow(
      new BadRequestException("Paid amount cannot exceed final amount"),
    );
  });

  it("should create successfully with full payment when data is correct", async () => {
    mockCustomerRepository.findOne.mockResolvedValue({ id: 1, outletId: 1 });
    mockOutletRepository.findOne.mockResolvedValue({ id: 1 });
    mockAssetRepository.findOne.mockResolvedValue({
      id: 1,
      isActive: true,
      unitPrice: 100,
      outletId: 1,
      categoryId: 1,
    });

    // Mock findOne at the end of create to return the created entity
    const mockCreatedSession = {
      id: 1,
      customerId: 1,
      outletId: 1,
      assetId: 1,
      quantity: 2,
      finalAmount: 200,
      paymentMethod: "CASH",
      paidAmount: 200,
      paymentStatus: "PAID",
      employeeId: 1,
      receivedByUserId: 1,
    };
    mockWalkInSessionRepository.findOne.mockResolvedValue(mockCreatedSession);

    const result = await service.create(
      {
        customerId: 1,
        outletId: 1,
        assetId: 1,
        quantity: 2,
        paymentMethod: "CASH",
        paidAmount: 200,
      },
      1,
    );

    expect(result).toBeDefined();
    expect(result.paymentMethod).toBe("CASH");
    expect(result.paidAmount).toBe(200);
    expect(result.paymentStatus).toBe("PAID");
    expect(result.receivedByUserId).toBe(1);
  });

  it("should auto-set paymentStatus to PARTIAL when paidAmount < finalAmount", async () => {
    mockCustomerRepository.findOne.mockResolvedValue({ id: 1, outletId: 1 });
    mockOutletRepository.findOne.mockResolvedValue({ id: 1 });
    mockAssetRepository.findOne.mockResolvedValue({
      id: 1,
      isActive: true,
      unitPrice: 100,
      outletId: 1,
      categoryId: 1,
    });

    const mockCreatedSession = {
      id: 1,
      customerId: 1,
      outletId: 1,
      assetId: 1,
      quantity: 2,
      finalAmount: 200,
      paymentMethod: "CASH",
      paidAmount: 100,
      paymentStatus: "PARTIAL",
      employeeId: 1,
      receivedByUserId: 1,
    };
    mockWalkInSessionRepository.findOne.mockResolvedValue(mockCreatedSession);

    const result = await service.create(
      {
        customerId: 1,
        outletId: 1,
        assetId: 1,
        quantity: 2,
        paymentMethod: "CASH",
        paidAmount: 100, // partially paid
      },
      1,
    );

    expect(result).toBeDefined();
    expect(result.paymentStatus).toBe("PARTIAL");
  });
});
