import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiGoneResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { listingInputSchema, type ListingInput, type Locale } from '@clickauto/shared';
import { ZodValidationPipe } from 'nestjs-zod';
import { RequestLocale } from '../../../common/locale';
import { AppError, Problem } from '../../../common/problem';
import { CurrentAuth, RegisteredGuard, type AuthContext } from '../../identity/auth.guard';
import { ListingsService } from '../application/listings.service';
import type { ListingAction } from '../domain/listing-rules';
import {
  ListingDto,
  CarListingInputDto,
  GoodsListingInputDto,
  ServiceListingInputDto,
  ListingPageDto,
  MyListingCountsDto,
  MyListingsQueryDto,
} from './dto';

function parseIfMatch(header: string | undefined): number | null {
  if (!header) return null;
  const version = Number(header.replace(/"/g, ''));
  if (!Number.isInteger(version)) throw new AppError(400, 'bad_if_match');
  return version;
}

const listingBody = ApiBody({
  schema: {
    oneOf: [
      { $ref: getSchemaPath(CarListingInputDto) },
      { $ref: getSchemaPath(GoodsListingInputDto) },
      { $ref: getSchemaPath(ServiceListingInputDto) },
    ],
    discriminator: { propertyName: 'type' },
  },
});

@ApiTags('listings')
@ApiExtraModels(CarListingInputDto, GoodsListingInputDto, ServiceListingInputDto)
@Controller('listings')
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get(':id')
  @ApiOperation({ operationId: 'getListing', summary: 'Public card of an active listing' })
  @ApiOkResponse({ type: ListingDto })
  @ApiNotFoundResponse({ type: Problem })
  @ApiGoneResponse({ type: Problem, description: 'Hidden, removed or blocked' })
  getListing(
    @Param('id', ParseUUIDPipe) id: string,
    @RequestLocale() locale: Locale,
  ): Promise<ListingDto> {
    return this.listings.getPublic(id, locale);
  }

  @Post()
  @UseGuards(RegisteredGuard)
  @ApiCookieAuth()
  @ApiOperation({ operationId: 'createListing', summary: 'Create a draft' })
  @listingBody
  @ApiCreatedResponse({ type: ListingDto })
  @ApiUnprocessableEntityResponse({ type: Problem })
  createListing(
    @Body(new ZodValidationPipe(listingInputSchema)) body: ListingInput,
    @CurrentAuth() auth: AuthContext,
    @RequestLocale() locale: Locale,
  ): Promise<ListingDto> {
    return this.listings.create(auth.user, body, locale);
  }

  @Patch(':id')
  @UseGuards(RegisteredGuard)
  @ApiCookieAuth()
  @ApiHeader({ name: 'If-Match', required: false, description: 'Listing version' })
  @ApiOperation({ operationId: 'updateListing', summary: 'Replace listing content' })
  @listingBody
  @ApiOkResponse({ type: ListingDto })
  @ApiConflictResponse({ type: Problem, description: 'version_conflict or listing_not_editable' })
  @ApiUnprocessableEntityResponse({ type: Problem })
  updateListing(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(listingInputSchema)) body: ListingInput,
    @Headers('if-match') ifMatch: string | undefined,
    @CurrentAuth() auth: AuthContext,
    @RequestLocale() locale: Locale,
  ): Promise<ListingDto> {
    return this.listings.update(auth.user, id, body, parseIfMatch(ifMatch), locale);
  }

  private act(id: string, action: ListingAction, auth: AuthContext, locale: Locale) {
    return this.listings.act(auth.user, id, action, locale);
  }

  @Post(':id/publish')
  @HttpCode(200)
  @UseGuards(RegisteredGuard)
  @ApiCookieAuth()
  @ApiOperation({ operationId: 'publishListing' })
  @ApiOkResponse({ type: ListingDto })
  @ApiConflictResponse({ type: Problem, description: 'invalid_status_transition' })
  @ApiUnprocessableEntityResponse({ type: Problem })
  publish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAuth() auth: AuthContext,
    @RequestLocale() locale: Locale,
  ): Promise<ListingDto> {
    return this.act(id, 'publish', auth, locale);
  }

  @Post(':id/hide')
  @HttpCode(200)
  @UseGuards(RegisteredGuard)
  @ApiCookieAuth()
  @ApiOperation({ operationId: 'hideListing', summary: 'Hide from search' })
  @ApiOkResponse({ type: ListingDto })
  @ApiConflictResponse({ type: Problem })
  hide(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAuth() auth: AuthContext,
    @RequestLocale() locale: Locale,
  ): Promise<ListingDto> {
    return this.act(id, 'hide', auth, locale);
  }

  @Post(':id/unhide')
  @HttpCode(200)
  @UseGuards(RegisteredGuard)
  @ApiCookieAuth()
  @ApiOperation({ operationId: 'unhideListing', summary: 'Return to search' })
  @ApiOkResponse({ type: ListingDto })
  @ApiConflictResponse({ type: Problem })
  unhide(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAuth() auth: AuthContext,
    @RequestLocale() locale: Locale,
  ): Promise<ListingDto> {
    return this.act(id, 'unhide', auth, locale);
  }

  @Post(':id/remove')
  @HttpCode(200)
  @UseGuards(RegisteredGuard)
  @ApiCookieAuth()
  @ApiOperation({ operationId: 'removeListing', summary: 'Take off sale' })
  @ApiOkResponse({ type: ListingDto })
  @ApiConflictResponse({ type: Problem })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAuth() auth: AuthContext,
    @RequestLocale() locale: Locale,
  ): Promise<ListingDto> {
    return this.act(id, 'remove', auth, locale);
  }
}

@ApiTags('me')
@ApiCookieAuth()
@UseGuards(RegisteredGuard)
@Controller('me/listings')
export class MyListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  @ApiOperation({ operationId: 'listMyListings' })
  @ApiOkResponse({ type: ListingPageDto })
  listMine(
    @Query() query: MyListingsQueryDto,
    @CurrentAuth() auth: AuthContext,
    @RequestLocale() locale: Locale,
  ): Promise<ListingPageDto> {
    return this.listings.listMine(auth.user, query, locale);
  }

  @Get('counts')
  @ApiOperation({ operationId: 'countMyListings', summary: 'Counts by status for tabs' })
  @ApiOkResponse({ type: MyListingCountsDto })
  countMine(@CurrentAuth() auth: AuthContext): Promise<MyListingCountsDto> {
    return this.listings.countMine(auth.user);
  }

  @Get(':id')
  @ApiOperation({ operationId: 'getMyListing', summary: 'Own listing in any status, for editing' })
  @ApiOkResponse({ type: ListingDto })
  @ApiNotFoundResponse({ type: Problem })
  getMine(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAuth() auth: AuthContext,
    @RequestLocale() locale: Locale,
  ): Promise<ListingDto> {
    return this.listings.getMine(auth.user, id, locale);
  }
}
