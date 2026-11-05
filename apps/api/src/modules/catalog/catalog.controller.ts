import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Locale } from '@clickauto/shared';
import { RequestLocale } from '../../common/locale';
import { Problem } from '../../common/problem';
import { CatalogService } from './catalog.service';
import {
  BrandDto,
  CategoriesQueryDto,
  CategoryDto,
  ModelDto,
  NearestCityDto,
  NearestCityQueryDto,
  RegionDto,
} from './dto';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('brands')
  @ApiOperation({ operationId: 'listBrands' })
  @ApiOkResponse({ type: [BrandDto] })
  listBrands(): Promise<BrandDto[]> {
    return this.catalog.brands();
  }

  @Get('brands/:brandId/models')
  @ApiOperation({ operationId: 'listModels' })
  @ApiOkResponse({ type: [ModelDto] })
  listModels(@Param('brandId', ParseUUIDPipe) brandId: string): Promise<ModelDto[]> {
    return this.catalog.models(brandId);
  }

  @Get('categories')
  @ApiOperation({ operationId: 'listCategories', summary: 'Flat category list with attributes' })
  @ApiOkResponse({ type: [CategoryDto] })
  listCategories(
    @Query() query: CategoriesQueryDto,
    @RequestLocale() locale: Locale,
  ): Promise<CategoryDto[]> {
    return this.catalog.categories(query.kind, locale);
  }

  @Get('regions')
  @ApiOperation({ operationId: 'listRegions', summary: 'Regions with cities' })
  @ApiOkResponse({ type: [RegionDto] })
  listRegions(@RequestLocale() locale: Locale): Promise<RegionDto[]> {
    return this.catalog.regions(locale);
  }

  @Get('cities/nearest')
  @ApiOperation({ operationId: 'getNearestCity', summary: 'Nearest known city for geolocation' })
  @ApiOkResponse({ type: NearestCityDto })
  @ApiNotFoundResponse({ type: Problem, description: 'city_not_found — ask the user to pick' })
  getNearestCity(
    @Query() query: NearestCityQueryDto,
    @RequestLocale() locale: Locale,
  ): Promise<NearestCityDto> {
    return this.catalog.nearestCity(query.lat, query.lng, locale);
  }
}
