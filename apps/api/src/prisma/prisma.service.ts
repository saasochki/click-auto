import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@clickauto/db';

/** Single Prisma client for the API process. Connects lazily on the first query. */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
