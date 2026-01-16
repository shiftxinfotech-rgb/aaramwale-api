import { Test, TestingModule } from '@nestjs/testing';
import { ChairsController } from './chairs.controller';

describe('ChairsController', () => {
  let controller: ChairsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChairsController],
    }).compile();

    controller = module.get<ChairsController>(ChairsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
