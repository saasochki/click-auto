import { Controller, Get, Query, Req } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Locale } from '@clickauto/shared';
import type { Request } from 'express';
import { RequestLocale } from '../../common/locale';
import { Problem } from '../../common/problem';
import { SearchService } from './application/search.service';
import { SearchCountDto, SearchQueryDto, SearchResultDto } from './dto';

const ATTR_HINT =
  'Category attributes are passed as attr.<key>=<value> (repeat or comma-separate values).';

/** Registered before ListingsController so that /listings/count is not taken for an id. */
@ApiTags('listings')
@Controller('listings')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  @ApiOperation({
    operationId: 'searchListings',
    summary: 'Feed with filters',
    description: ATTR_HINT,
  })
  @ApiOkResponse({ type: SearchResultDto })
  @ApiBadRequestResponse({ type: Problem, description: 'bad_cursor' })
  @ApiServiceUnavailableResponse({
    type: Problem,
    description: 'search_unavailable, rates_unavailable',
  })
  searchListings(
    @Query() query: SearchQueryDto,
    @Req() req: Request,
    @RequestLocale() locale: Locale,
  ): Promise<SearchResultDto> {
    return this.search.search(query, req.query as Record<string, unknown>, locale);
  }

  @Get('count')
  @ApiOperation({
    operationId: 'countListings',
    summary: 'Number of matches for the filter panel',
    description: ATTR_HINT,
  })
  @ApiOkResponse({ type: SearchCountDto })
  @ApiServiceUnavailableResponse({ type: Problem })
  async countListings(
    @Query() query: SearchQueryDto,
    @Req() req: Request,
  ): Promise<SearchCountDto> {
    return { total: await this.search.count(query, req.query as Record<string, unknown>) };
  }
}
