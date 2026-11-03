import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { cleanupOpenApiDoc } from 'nestjs-zod';

export const API_PREFIX = 'api/v1';

/** Shared app setup for the server, tests and OpenAPI generation. */
export function configureApp(app: INestApplication, allowedOrigins: string[]): void {
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix(API_PREFIX);
  app.use(cookieParser());
  app.enableCors({ origin: allowedOrigins, credentials: true });
}

export function buildOpenApi(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('ClickAuto API')
    .setVersion('1.0.0')
    .setOpenAPIVersion('3.1.0')
    .addCookieAuth('ca_session')
    .build();
  return cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
}
