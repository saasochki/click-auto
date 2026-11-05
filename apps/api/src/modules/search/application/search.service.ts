import { Inject, Injectable, Logger } from '@nestjs/common';
import { listingsIndex, type ListingDocument, type MeiliSearch } from '@clickauto/search';
import {
  readAttributeFilters,
  type GoodsCondition,
  type CarCondition,
  type ImportSourceCode,
  type Locale,
  type SearchQuery,
} from '@clickauto/shared';
import { AppError } from '../../../common/problem';
import { ENV } from '../../../config/config.module';
import type { Env } from '../../../config/env';
import { MediaService } from '../../media/media.service';
import { PricingService } from '../../pricing/pricing.service';
import {
  buildSearchFilter,
  decodeCursor,
  encodeCursor,
  FACET_FIELDS,
  searchSort,
  type PriceBoundsUsd,
} from '../domain/search-filter';
import type { ListingSummary } from '../dto';

export const MEILI = Symbol('MEILI');

const FIELD_TO_FACET = Object.fromEntries(
  Object.entries(FACET_FIELDS).map(([facet, field]) => [field, facet]),
);

export interface SearchResult {
  items: ListingSummary[];
  nextCursor: string | null;
  total: number;
  facets: Record<string, Record<string, number>> | null;
}

/** Public service of the search module: feeds from the Meilisearch index. */
@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @Inject(MEILI) private readonly meili: MeiliSearch,
    @Inject(ENV) private readonly env: Env,
    private readonly pricing: PricingService,
    private readonly media: MediaService,
  ) {}

  async search(
    query: SearchQuery,
    rawQuery: Record<string, unknown>,
    locale: Locale,
  ): Promise<SearchResult> {
    const page = decodeCursor(query.cursor);
    if (page === null) throw new AppError(400, 'bad_cursor');
    const filter = await this.filter(query, rawQuery);
    const response = await this.run(query.q, {
      filter,
      sort: searchSort(query),
      page,
      hitsPerPage: query.limit,
      facets: query.facets?.map((facet) => FACET_FIELDS[facet]),
    });

    const facets = query.facets?.length
      ? Object.fromEntries<Record<string, number>>(
          Object.entries(response.facetDistribution ?? {}).map(([field, counts]) => [
            FIELD_TO_FACET[field] ?? field,
            counts as Record<string, number>,
          ]),
        )
      : null;
    return {
      items: response.hits.map((hit) => this.summary(hit, locale)),
      nextCursor: page < (response.totalPages ?? 0) ? encodeCursor(page + 1) : null,
      total: response.totalHits ?? 0,
      facets,
    };
  }

  /** Only the number of matches: the "Показать 1 248" button of the filter panel. */
  async count(query: SearchQuery, rawQuery: Record<string, unknown>): Promise<number> {
    const filter = await this.filter(query, rawQuery);
    const response = await this.run(query.q, { filter, page: 1, hitsPerPage: 0 });
    return response.totalHits ?? 0;
  }

  private async filter(query: SearchQuery, rawQuery: Record<string, unknown>): Promise<string[]> {
    return buildSearchFilter(
      query,
      query.type === 'goods' ? readAttributeFilters(rawQuery) : {},
      await this.priceBounds(query),
      new Date(),
    );
  }

  /** Price range in the author's chosen currency → USD minor units of the index. */
  private async priceBounds(query: SearchQuery): Promise<PriceBoundsUsd | null> {
    if (query.priceFrom === undefined && query.priceTo === undefined) return null;
    const convert = (major: number | undefined) =>
      major === undefined
        ? Promise.resolve(undefined)
        : this.pricing.toUsdMinor(major * 100, query.priceCurrency);
    const [from, to] = await Promise.all([convert(query.priceFrom), convert(query.priceTo)]);
    if (from === null || to === null) throw new AppError(503, 'rates_unavailable');
    return { from, to };
  }

  private async run(
    q: string | undefined,
    params: {
      filter: string[];
      sort?: string[];
      page: number;
      hitsPerPage: number;
      facets?: string[];
    },
  ) {
    try {
      return await listingsIndex(this.meili, this.env.MEILI_INDEX).search(q ?? '', params);
    } catch (error) {
      const code = (error as { cause?: { code?: string } }).cause?.code;
      if (code === 'index_not_found') {
        return { hits: [], totalHits: 0, totalPages: 0, facetDistribution: {} };
      }
      this.logger.error(`search failed: ${(error as Error).message}`);
      throw new AppError(503, 'search_unavailable');
    }
  }

  private summary(doc: ListingDocument, locale: Locale): ListingSummary {
    const name = (ru: string | null, ro: string | null) => (locale === 'ro' ? ro : ru) ?? '';
    const category = {
      slug: doc.categorySlug ?? '',
      name: name(doc.categoryRu, doc.categoryRo),
    };
    return {
      id: doc.id,
      type: doc.type,
      origin: doc.origin,
      sourceCode: doc.sourceCode as ImportSourceCode | null,
      title: doc.title,
      price:
        doc.priceAmount !== null && doc.priceCurrency
          ? { amount: doc.priceAmount, currency: doc.priceCurrency }
          : null,
      priceNegotiable: doc.priceNegotiable,
      city: { slug: doc.citySlug, name: name(doc.cityRu, doc.cityRo) },
      publishedAt: new Date(doc.publishedAt * 1000).toISOString(),
      photo: doc.cover
        ? {
            url: this.media.thumbUrl(doc.cover.key),
            width: doc.cover.width,
            height: doc.cover.height,
          }
        : null,
      photoCount: doc.photoCount,
      car:
        doc.type === 'car' && doc.year !== null
          ? {
              brand:
                doc.brandSlug && doc.brandName
                  ? { slug: doc.brandSlug, name: doc.brandName }
                  : null,
              modelName: doc.modelName,
              year: doc.year,
              mileageKm: doc.mileageKm,
              engineVolumeCc: doc.engineVolumeCc,
              powerHp: doc.powerHp,
              transmission: doc.transmission,
              bodyType: doc.bodyType,
              fuelTypes: doc.fuel,
              condition: (doc.condition ?? 'used') as CarCondition,
            }
          : null,
      goods:
        doc.type === 'goods'
          ? {
              category,
              condition: (doc.condition ?? 'used') as GoodsCondition,
              quantity: doc.quantity,
            }
          : null,
      service:
        doc.type === 'service'
          ? { category, workingHours: doc.workingHours, mobileService: doc.mobileService }
          : null,
    };
  }
}
