import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { ZodValidationPipe } from 'nestjs-zod';
import { OriginGuard } from './common/origin.guard';
import { ProblemFilter } from './common/problem.filter';
import { ConfigModule } from './config/config.module';
import { HealthController } from './health/health.controller';
import { InfraModule } from './infra/infra.module';
import { IdentityModule } from './modules/identity/identity.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ListingsModule } from './modules/listings/listings.module';
import { MediaModule } from './modules/media/media.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { ProfileModule } from './modules/profile/profile.module';
import { SearchModule } from './modules/search/search.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
        // Personal data must not reach logs.
        redact: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]'],
      },
    }),
    PrismaModule,
    InfraModule,
    IdentityModule,
    ProfileModule,
    CatalogModule,
    MediaModule,
    PricingModule,
    // Before ListingsModule: GET /listings/count must not match /listings/:id.
    SearchModule,
    ListingsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_FILTER, useClass: ProblemFilter },
    { provide: APP_GUARD, useClass: OriginGuard },
  ],
})
export class AppModule {}
