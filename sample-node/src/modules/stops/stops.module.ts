import { Module } from '@nestjs/common';
import { StopsController } from './stops.controller';
import { SharedModule } from 'src/shared/shared.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [StopsController],
  imports: [
    SharedModule,
    AuthModule,
  ]
})
export class StopsModule {}
