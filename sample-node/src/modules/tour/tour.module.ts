import { Module } from '@nestjs/common';
import { TourController } from './tour.controller';
import { SharedModule } from 'src/shared/shared.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [TourController],
  imports: [
    SharedModule,
    AuthModule,
  ]
})
export class TourModule {}
