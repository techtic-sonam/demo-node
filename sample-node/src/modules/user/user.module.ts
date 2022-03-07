import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { SharedModule } from 'src/shared/shared.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [UserController],
  imports: [
    SharedModule,
    AuthModule,
  ]
})
export class UserModule {}
