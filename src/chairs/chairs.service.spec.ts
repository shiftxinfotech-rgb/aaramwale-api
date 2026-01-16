import { Test, TestingModule } from '@nestjs/testing';
import { ChairsService } from './chairs.service';

describe('ChairsService', () => {
  let service: ChairsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChairsService],
    }).compile();

    service = module.get<ChairsService>(ChairsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
