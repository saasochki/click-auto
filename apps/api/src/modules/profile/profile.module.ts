import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { MeController } from './me.controller';

@Module({
  imports: [IdentityModule],
  controllers: [MeController],
})
export class ProfileModule {}
