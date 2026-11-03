import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Field-level error inside a Problem Details response. */
export class ProblemFieldError {
  @ApiProperty({ example: 'username' })
  field!: string;

  @ApiProperty({ example: 'taken' })
  code!: string;
}

/** RFC 9457 Problem Details. `code` is stable; the frontend translates it. */
export class Problem {
  @ApiProperty({ example: 'https://clickauto/errors/validation_failed' })
  type!: string;

  @ApiProperty({ example: 'Validation failed' })
  title!: string;

  @ApiProperty({ example: 422 })
  status!: number;

  @ApiProperty({ example: 'validation_failed' })
  code!: string;

  @ApiPropertyOptional({ example: 'Some fields are invalid', nullable: true, type: String })
  detail!: string | null;

  @ApiPropertyOptional({ type: [ProblemFieldError] })
  errors?: ProblemFieldError[];

  @ApiPropertyOptional({ nullable: true, type: String })
  traceId?: string | null;
}

/** Throw from application code to return a Problem Details response with a stable code. */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly errors?: ProblemFieldError[],
    readonly headers?: Record<string, string>,
  ) {
    super(code);
  }
}
