import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Problem } from '../../common/problem';
import { CurrentAuth, SessionGuard, type AuthContext } from '../identity/auth.guard';
import { MeDto } from '../identity/dto';
import { toMe } from '../identity/user.mapper';

@ApiTags('me')
@ApiCookieAuth()
@Controller('me')
export class MeController {
  @Get()
  @UseGuards(SessionGuard)
  @ApiOperation({ operationId: 'getMe', summary: 'Current user' })
  @ApiOkResponse({ type: MeDto })
  @ApiUnauthorizedResponse({ type: Problem })
  getMe(@CurrentAuth() auth: AuthContext): MeDto {
    return toMe(auth.user);
  }
}
