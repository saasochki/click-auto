import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';
import { AppError, type Problem, type ProblemFieldError } from './problem';

const TITLES: Record<number, string> = {
  400: 'Bad request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not found',
  409: 'Conflict',
  410: 'Gone',
  422: 'Validation failed',
  429: 'Too many requests',
  500: 'Internal server error',
};

const DEFAULT_CODES: Record<number, string> = {
  400: 'bad_request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  410: 'gone',
  422: 'validation_failed',
  429: 'rate_limited',
  500: 'internal_error',
};

function fromZod(error: ZodError): ProblemFieldError[] {
  return error.issues.map((issue) => ({ field: issue.path.join('.'), code: issue.message }));
}

/** Converts every error to RFC 9457 Problem Details. Never leaks stack traces. */
@Catch()
export class ProblemFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { id?: string }>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string | undefined;
    let errors: ProblemFieldError[] | undefined;

    if (exception instanceof AppError) {
      status = exception.status;
      code = exception.code;
      errors = exception.errors;
      for (const [name, value] of Object.entries(exception.headers ?? {}))
        res.setHeader(name, value);
    } else if (exception instanceof ZodValidationException) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      errors = fromZod(exception.getZodError() as ZodError);
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
    } else {
      this.logger.error(exception);
    }

    const resolvedCode = code ?? DEFAULT_CODES[status] ?? 'error';
    const body: Problem = {
      type: `https://clickauto/errors/${resolvedCode}`,
      title: TITLES[status] ?? 'Error',
      status,
      code: resolvedCode,
      detail: null,
      ...(errors ? { errors } : {}),
      ...(status >= 500 ? { traceId: req.id ? String(req.id) : null } : {}),
    };
    res.status(status).type('application/problem+json').json(body);
  }
}
