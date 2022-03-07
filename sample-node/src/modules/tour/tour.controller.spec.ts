import { Test, TestingModule } from '@nestjs/testing';
import { TourController } from './tour.controller';

describe('Poi Controller', () => {
  let controller: TourController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TourController],
    }).compile();

    controller = module.get<TourController>(TourController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});