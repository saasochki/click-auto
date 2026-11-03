import { Module } from '@nestjs/common';

/**
 * Background jobs: outbox → search index, exchange rates, import, emails.
 * Queues are added module by module.
 */
@Module({})
export class WorkerModule {}
