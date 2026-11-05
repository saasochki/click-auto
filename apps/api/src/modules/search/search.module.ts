import { Module } from '@nestjs/common';
import { createMeiliClient } from '@clickauto/search';
import { ENV } from '../../config/config.module';
import type { Env } from '../../config/env';
import { MediaModule } from '../media/media.module';
import { PricingModule } from '../pricing/pricing.module';
import { MEILI, SearchService } from './application/search.service';
import { SearchController } from './search.controller';

@Module({
  imports: [PricingModule, MediaModule],
  controllers: [SearchController],
  providers: [
    {
      provide: MEILI,
      inject: [ENV],
      useFactory: (env: Env) => createMeiliClient({ url: env.MEILI_URL, key: env.MEILI_KEY }),
    },
    SearchService,
  ],
  exports: [SearchService],
})
export class SearchModule {}
