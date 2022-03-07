import { Test, TestingModule } from '@nestjs/testing';
import { GallaryController } from './gallary.controller';

describe('Gallary Controller', () => {
  let controller: GallaryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GallaryController],
    }).compile();

    controller = module.get<GallaryController>(GallaryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
