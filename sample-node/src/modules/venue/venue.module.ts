import { Module } from '@nestjs/common';
import { VenueController } from './venue.controller';
import { SharedModule } from 'src/shared/shared.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [VenueController],
  imports: [
    SharedModule,
    AuthModule,
  ]
})
export class VenueModule {}
