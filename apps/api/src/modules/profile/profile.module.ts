import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { MeController } from './me.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [IdentityModule],
  controllers: [MeController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
