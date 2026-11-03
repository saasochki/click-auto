import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type Redis from 'ioredis';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap';
import { MailService, type MailMessage } from '../../src/infra/mail.service';
import { REDIS } from '../../src/infra/redis.module';
import { PrismaService } from '../../src/prisma/prisma.service';

/** E2E tests need PostgreSQL and Redis (docker compose locally, services in CI). */
export const E2E = process.env.E2E === '1';
export const ORIGIN = 'http://localhost:3000';

export class FakeMail {
  readonly sent: MailMessage[] = [];

  send(message: MailMessage): Promise<void> {
    this.sent.push(message);
    return Promise.resolve();
  }

  lastCodeFor(to: string): string {
    const message = [...this.sent].reverse().find((m) => m.to === to);
    const code = message?.text.match(/\b(\d{6})\b/)?.[1];
    if (!code) throw new Error(`no code sent to ${to}`);
    return code;
  }
}

export interface TestApp {
  app: INestApplication;
  mail: FakeMail;
  prisma: PrismaService;
  redis: Redis;
}

export async function createTestApp(): Promise<TestApp> {
  process.env.ALLOWED_ORIGINS = ORIGIN;
  const mail = new FakeMail();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(MailService)
    .useValue(mail)
    .compile();
  const app = moduleRef.createNestApplication();
  configureApp(app, [ORIGIN]);
  await app.init();
  return { app, mail, prisma: app.get(PrismaService), redis: app.get(REDIS) };
}

/** Unique fictional email per test run. */
export const testEmail = (label: string): string =>
  `${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
