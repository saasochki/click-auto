/**
 * Writes packages/api-contract/openapi.json from NestJS decorators.
 * Runs without a database: Prisma connects lazily and no queries are made.
 */
import 'reflect-metadata';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { buildOpenApi } from '../src/bootstrap';

async function main(): Promise<void> {
  process.env.DATABASE_URL ??= 'postgresql://openapi:openapi@localhost:5432/openapi';
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1');
  const document = buildOpenApi(app);
  const target = resolve(__dirname, '../../../packages/api-contract/openapi.json');
  writeFileSync(target, `${JSON.stringify(document, null, 2)}\n`);
  await app.close();
}

void main();
