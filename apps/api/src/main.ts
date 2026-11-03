import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { buildOpenApi, configureApp } from './bootstrap';
import { loadEnv } from './config/env';

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  configureApp(app, env.ALLOWED_ORIGINS.split(','));
  if (env.NODE_ENV !== 'production') SwaggerModule.setup('api/docs', app, buildOpenApi(app));
  app.enableShutdownHooks();
  await app.listen(env.API_PORT);
}

void bootstrap();
