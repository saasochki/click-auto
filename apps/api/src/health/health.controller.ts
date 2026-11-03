import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

class HealthDto {
  @ApiProperty({ enum: ['ok', 'degraded'] })
  status!: 'ok' | 'degraded';

  @ApiProperty()
  database!: boolean;
}

@ApiTags('system')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ operationId: 'getHealth', summary: 'Liveness and database check' })
  @ApiOkResponse({ type: HealthDto })
  async getHealth(): Promise<HealthDto> {
    const database = await this.prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
    return { status: database ? 'ok' : 'degraded', database };
  }
}
