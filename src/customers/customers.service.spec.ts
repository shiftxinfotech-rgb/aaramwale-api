import { Test, TestingModule } from "@nestjs/testing";
import { CustomersService } from "./customers.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Customer } from "./customer.entity";
import { DataSource } from "typeorm";
import { OutletsService } from "../outlets/outlets.service";

describe("CustomersService - Employee Outlet Validation", () => {
  let service: CustomersService;
  let customerRepoSaveSpy: jest.Mock;
  let customerRepoFindOneSpy: jest.Mock;
  let outletsServiceFindOneSpy: jest.Mock;

  const mockCustomerRepository = {
    findOne: jest.fn(),
    create: jest.fn((data: unknown) => data as Record<string, unknown>),
    save: jest.fn(),
  };

  const mockOutletsService = {
    findOne: jest.fn(),
  };

  const mockDataSource = {
    getRepository: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: OutletsService,
          useValue: mockOutletsService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    customerRepoSaveSpy = mockCustomerRepository.save;
    customerRepoFindOneSpy = mockCustomerRepository.findOne;
    outletsServiceFindOneSpy = mockOutletsService.findOne;

    jest.clearAllMocks();
  });

  it("should allow employee to create customer for their own assigned outlet", async () => {
    outletsServiceFindOneSpy.mockResolvedValue({ id: 4, name: "Test Outlet" });
    customerRepoFindOneSpy.mockResolvedValue(null); // mobile doesn't exist
    customerRepoSaveSpy.mockResolvedValue({
      id: 1,
      name: "John Doe",
      outletId: 4,
    });
    customerRepoFindOneSpy.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 1,
      name: "John Doe",
      mobile: "9999888877",
      outletId: 4,
      outlet: { id: 4, name: "Test Outlet" },
    });

    const result = (await service.create(
      {
        name: "John Doe",
        mobile: "9999888877",
        outletId: 4,
      },
      { role: "EMPLOYEE", outletId: 4 },
    )) as Record<string, unknown>;

    expect(result.outletId).toBe(4);
    expect(customerRepoSaveSpy).toHaveBeenCalled();
  });

  it("should throw BadRequestException if employee tries to create customer for a different outlet", async () => {
    await expect(
      service.create(
        {
          name: "John Doe",
          mobile: "9999888877",
          outletId: 5, // different outlet
        },
        { role: "EMPLOYEE", outletId: 4 },
      ),
    ).rejects.toThrow("Employee cannot create customer for another outlet");
  });

  it("should allow admin to create customer for any valid outlet", async () => {
    outletsServiceFindOneSpy.mockResolvedValue({
      id: 5,
      name: "Different Outlet",
    });
    customerRepoFindOneSpy.mockResolvedValue(null);
    customerRepoSaveSpy.mockResolvedValue({
      id: 2,
      name: "Jane Doe",
      outletId: 5,
    });
    customerRepoFindOneSpy.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 2,
      name: "Jane Doe",
      mobile: "9999888866",
      outletId: 5,
      outlet: { id: 5, name: "Different Outlet" },
    });

    const result = (await service.create(
      {
        name: "Jane Doe",
        mobile: "9999888866",
        outletId: 5,
      },
      { role: "ADMIN" },
    )) as Record<string, unknown>;

    expect(result.outletId).toBe(5);
    expect(customerRepoSaveSpy).toHaveBeenCalled();
  });
});
