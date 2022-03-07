import { Module } from '@nestjs/common';
import { GallaryController } from './gallary.controller';
import { SharedModule } from 'src/shared/shared.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [GallaryController],
  imports: [
    SharedModule,
    AuthModule,
  ]
})
export class GallaryModule {}
