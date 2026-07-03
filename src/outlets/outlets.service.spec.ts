import { Test, TestingModule } from "@nestjs/testing";
import { OutletsService } from "./outlets.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Outlet } from "./outlet.entity";
import { DataSource } from "typeorm";

describe("OutletsService", () => {
  let service: OutletsService;

  const mockOutletRepository = {};
  const mockDataSource = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutletsService,
        {
          provide: getRepositoryToken(Outlet),
          useValue: mockOutletRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<OutletsService>(OutletsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
