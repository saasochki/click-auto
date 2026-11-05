import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { IdentityModule } from '../identity/identity.module';
import { MediaModule } from '../media/media.module';
import { ProfileModule } from '../profile/profile.module';
import { ListingsService } from './application/listings.service';
import { ListingsController, MyListingsController } from './http/listings.controller';

@Module({
  imports: [IdentityModule, CatalogModule, MediaModule, ProfileModule],
  controllers: [MyListingsController, ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
