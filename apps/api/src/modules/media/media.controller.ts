import { Body, Controller, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Problem } from '../../common/problem';
import { CurrentAuth, RegisteredGuard, type AuthContext } from '../identity/auth.guard';
import { CreateUploadDto, PhotoDto, UploadTicketDto } from './dto';
import { MediaService } from './media.service';

@ApiTags('media')
@ApiCookieAuth()
@UseGuards(RegisteredGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('uploads')
  @ApiOperation({ operationId: 'createPhotoUpload', summary: 'Get a presigned URL for a photo' })
  @ApiCreatedResponse({ type: UploadTicketDto })
  @ApiUnprocessableEntityResponse({ type: Problem })
  createUpload(
    @Body() body: CreateUploadDto,
    @CurrentAuth() auth: AuthContext,
  ): Promise<UploadTicketDto> {
    return this.media.createUpload(auth.user.id, body.mimeType, body.sizeBytes);
  }

  @Post(':mediaId/complete')
  @HttpCode(200)
  @ApiOperation({ operationId: 'completePhotoUpload', summary: 'Process the uploaded photo' })
  @ApiOkResponse({ type: PhotoDto })
  @ApiConflictResponse({ type: Problem, description: 'upload_missing' })
  @ApiUnprocessableEntityResponse({ type: Problem, description: 'image_invalid' })
  complete(
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
    @CurrentAuth() auth: AuthContext,
  ): Promise<PhotoDto> {
    return this.media.complete(auth.user.id, mediaId);
  }
}
