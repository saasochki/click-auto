import { Injectable } from '@nestjs/common';
import { newId, Prisma, type ListingStatus, type User } from '@clickauto/db';
import {
  hasValidPrice,
  type ImportSourceCode,
  type ListingInput,
  type Locale,
} from '@clickauto/shared';
import { AppError } from '../../../common/problem';
import { PrismaService } from '../../../prisma/prisma.service';
import { CatalogService } from '../../catalog/catalog.service';
import { MediaService } from '../../media/media.service';
import { ProfileService } from '../../profile/profile.service';
import { validateAttributes } from '../domain/attributes';
import {
  carTitle,
  EDITABLE_STATUSES,
  nextStatus,
  publicVisibility,
  type ListingAction,
} from '../domain/listing-rules';
import type { ListingView } from '../http/dto';

const fullInclude = {
  car: true,
  goods: true,
  service: true,
  photos: { orderBy: { position: 'asc' } },
  external: { include: { source: true } },
} satisfies Prisma.ListingInclude;

type FullListing = Prisma.ListingGetPayload<{ include: typeof fullInclude }>;

/** Public service of the listings module. */
@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
    private readonly media: MediaService,
    private readonly profile: ProfileService,
  ) {}

  async create(user: User, input: ListingInput, locale: Locale): Promise<ListingView> {
    const prepared = await this.prepare(user, input);
    const id = newId();
    const created = await this.prisma.listing.create({
      data: {
        id,
        type: input.type,
        ownerId: user.id,
        status: 'draft',
        ...prepared.listing,
        ...prepared.details(),
      },
      include: fullInclude,
    });
    return (await this.view([created], locale, { withContacts: true }))[0] as ListingView;
  }

  async update(
    user: User,
    id: string,
    input: ListingInput,
    ifMatch: number | null,
    locale: Locale,
  ): Promise<ListingView> {
    const current = await this.ownListing(user, id);
    if (current.type !== input.type) {
      throw new AppError(422, 'validation_failed', [{ field: 'type', code: 'immutable' }]);
    }
    if (!EDITABLE_STATUSES.includes(current.status))
      throw new AppError(409, 'listing_not_editable');
    if (ifMatch !== null && ifMatch !== current.version)
      throw new AppError(409, 'version_conflict');
    const prepared = await this.prepare(user, input);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.listingPhoto.deleteMany({ where: { listingId: id } });
      await tx.carDetails.deleteMany({ where: { listingId: id } });
      await tx.goodsDetails.deleteMany({ where: { listingId: id } });
      await tx.serviceDetails.deleteMany({ where: { listingId: id } });
      // Optimistic lock: the version must not have changed since we read it.
      const { count } = await tx.listing.updateMany({
        where: { id, version: current.version },
        data: { ...prepared.listing, version: { increment: 1 } },
      });
      if (count === 0) throw new AppError(409, 'version_conflict');
      const saved = await tx.listing.update({
        where: { id },
        data: prepared.details(),
        include: fullInclude,
      });
      if (saved.status === 'active') await this.outbox(tx, 'listing.updated', id);
      return saved;
    });
    return (await this.view([updated], locale, { withContacts: true }))[0] as ListingView;
  }

  async act(user: User, id: string, action: ListingAction, locale: Locale): Promise<ListingView> {
    const current = await this.ownListing(user, id);
    const to = nextStatus(action, current.status);
    if (!to) throw new AppError(409, 'invalid_status_transition');
    if (
      action === 'publish' &&
      !hasValidPrice({
        price: current.priceAmount,
        priceNegotiable: current.priceNegotiable,
      })
    ) {
      throw new AppError(422, 'validation_failed', [{ field: 'price', code: 'required' }]);
    }
    const now = new Date();
    const data: Prisma.ListingUpdateInput = { status: to, version: { increment: 1 } };
    if (to === 'active' && !current.publishedAt) data.publishedAt = now;
    if (to === 'active') data.hiddenAt = null;
    if (to === 'hidden') data.hiddenAt = now;
    if (to === 'removed') data.removedAt = now;

    const saved = await this.prisma.$transaction(async (tx) => {
      const row = await tx.listing.update({ where: { id }, data, include: fullInclude });
      await this.outbox(tx, to === 'active' ? 'listing.published' : 'listing.unpublished', id);
      return row;
    });
    return (await this.view([saved], locale, { withContacts: true }))[0] as ListingView;
  }

  /** Public card. Hidden, removed and blocked answer 410; drafts 404. */
  async getPublic(id: string, locale: Locale): Promise<ListingView> {
    const row = await this.prisma.listing.findUnique({ where: { id }, include: fullInclude });
    if (!row) throw new AppError(404, 'not_found');
    const visibility = publicVisibility(row.status);
    if (visibility === 'missing') throw new AppError(404, 'not_found');
    if (visibility === 'gone') throw new AppError(410, 'listing_gone');
    return (await this.view([row], locale, { withContacts: true }))[0] as ListingView;
  }

  async getMine(user: User, id: string, locale: Locale): Promise<ListingView> {
    const row = await this.ownListing(user, id);
    return (await this.view([row], locale, { withContacts: true }))[0] as ListingView;
  }

  async listMine(
    user: User,
    query: {
      status?: ListingStatus;
      type?: 'car' | 'goods' | 'service';
      limit: number;
      cursor?: string;
    },
    locale: Locale,
  ): Promise<{ items: ListingView[]; nextCursor: string | null }> {
    const rows = await this.prisma.listing.findMany({
      where: {
        ownerId: user.id,
        status: query.status ?? { not: 'removed' },
        ...(query.type ? { type: query.type } : {}),
        ...(query.cursor ? { id: { lt: query.cursor } } : {}),
      },
      orderBy: { id: 'desc' },
      take: query.limit + 1,
      include: fullInclude,
    });
    const page = rows.slice(0, query.limit);
    return {
      items: await this.view(page, locale, { withContacts: false }),
      nextCursor: rows.length > query.limit ? (page.at(-1)?.id ?? null) : null,
    };
  }

  async countMine(user: User): Promise<Record<ListingStatus, number>> {
    const groups = await this.prisma.listing.groupBy({
      by: ['status'],
      where: { ownerId: user.id },
      _count: { _all: true },
    });
    const counts: Record<ListingStatus, number> = {
      draft: 0,
      active: 0,
      hidden: 0,
      removed: 0,
      blocked: 0,
    };
    for (const g of groups) counts[g.status] = g._count._all;
    return counts;
  }

  /** Account deactivation and deletion use this to take listings off the site. */
  async hideAllOf(userId: string, to: 'hidden' | 'removed'): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const rows = await tx.listing.findMany({
        where: {
          ownerId: userId,
          status: { in: to === 'hidden' ? ['active'] : ['draft', 'active', 'hidden'] },
        },
        select: { id: true },
      });
      if (rows.length === 0) return;
      const now = new Date();
      await tx.listing.updateMany({
        where: { id: { in: rows.map((r) => r.id) } },
        data:
          to === 'hidden'
            ? { status: 'hidden', hiddenAt: now }
            : { status: 'removed', removedAt: now },
      });
      for (const row of rows) await this.outbox(tx, 'listing.unpublished', row.id);
    });
  }

  // ---------- internals ----------

  private async ownListing(user: User, id: string): Promise<FullListing> {
    const row = await this.prisma.listing.findUnique({ where: { id }, include: fullInclude });
    if (!row || row.ownerId !== user.id) throw new AppError(404, 'not_found');
    return row;
  }

  private async outbox(
    tx: Prisma.TransactionClient,
    type: string,
    listingId: string,
  ): Promise<void> {
    await tx.outboxEvent.create({ data: { id: newId(), type, payload: { listingId } } });
  }

  /** Validates references and builds Prisma data shared by create and update. */
  private async prepare(user: User, input: ListingInput) {
    if (!(await this.catalog.cityExists(input.cityId))) {
      throw new AppError(422, 'validation_failed', [{ field: 'cityId', code: 'unknown' }]);
    }
    const photoIds = await this.media.assertOwnedPhotos(user.id, input.photoIds);

    let title: string;
    if (input.type === 'car') {
      const names = await this.catalog.carNames(input.car.modelId, input.car.brandId);
      if (!names)
        throw new AppError(422, 'validation_failed', [{ field: 'car.modelId', code: 'unknown' }]);
      title = carTitle(names.brand, names.model ?? input.car.customModelName ?? '', input.car.year);
    } else {
      title = input.title;
      const kind = input.type === 'goods' ? 'goods' : 'service';
      const categoryId = input.type === 'goods' ? input.goods.categoryId : input.service.categoryId;
      const defs = await this.catalog.categoryAttributes(categoryId, kind);
      if (input.type === 'goods') {
        const errors = validateAttributes(defs, input.goods.attributes);
        if (errors.length) throw new AppError(422, 'validation_failed', errors);
      }
    }

    const listing = {
      title,
      description: input.description,
      priceNegotiable: input.priceNegotiable,
      priceAmount: input.priceNegotiable || !input.price ? null : BigInt(input.price.amount),
      priceCurrency: input.priceNegotiable || !input.price ? null : input.price.currency,
      cityId: input.cityId,
      contactPhone: input.contactPhone ?? (await this.profile.contactPhone(user.id)),
    };

    const details = () => {
      const photos = {
        create: photoIds.map((mediaId, position) => ({ id: newId(), mediaId, position })),
      };
      if (input.type === 'car') {
        const { brandId, modelId, customModelName, ...car } = input.car;
        return {
          photos,
          car: {
            create: {
              ...car,
              modelId: customModelName ? null : modelId,
              brandId: customModelName ? brandId : null,
              customModelName,
            },
          },
        };
      }
      if (input.type === 'goods') {
        return {
          photos,
          goods: {
            create: {
              categoryId: input.goods.categoryId,
              condition: input.goods.condition,
              attributes: input.goods.attributes,
              compatibleModels: input.goods.compatibleModels,
            },
          },
        };
      }
      return { photos, service: { create: input.service } };
    };

    return { listing, details };
  }

  private async view(
    rows: FullListing[],
    locale: Locale,
    opts: { withContacts: boolean },
  ): Promise<ListingView[]> {
    const [cities, owners, photos, cars, categories] = await Promise.all([
      this.catalog.cityLabels(
        rows.map((r) => r.cityId),
        locale,
      ),
      this.profile.publicUsers(rows.flatMap((r) => (r.ownerId ? [r.ownerId] : []))),
      this.media.photos(rows.flatMap((r) => r.photos.map((p) => p.mediaId))),
      this.catalog.carLabels(
        rows.flatMap((r) => (r.car?.modelId ? [r.car.modelId] : [])),
        rows.flatMap((r) => (r.car?.brandId ? [r.car.brandId] : [])),
      ),
      this.catalog.categoryLabels(
        rows.flatMap((r) =>
          [r.goods?.categoryId, r.service?.categoryId].filter((x): x is string => !!x),
        ),
        locale,
      ),
    ]);

    return rows.map((r) => {
      const city = cities.get(r.cityId);
      if (!city) throw new Error(`city ${r.cityId} missing`);
      const model = r.car?.modelId ? cars.models.get(r.car.modelId) : undefined;
      const brand = model?.brand ?? (r.car?.brandId ? cars.brands.get(r.car.brandId) : undefined);
      const category = (id: string) => categories.get(id) ?? { id, slug: '', name: '' };
      return {
        id: r.id,
        type: r.type,
        status: r.status,
        origin: r.origin,
        title: r.title,
        description: r.description,
        price:
          r.priceAmount !== null && r.priceCurrency
            ? { amount: Number(r.priceAmount), currency: r.priceCurrency }
            : null,
        priceNegotiable: r.priceNegotiable,
        city,
        photos: r.photos.flatMap((p) => {
          const photo = photos.get(p.mediaId);
          return photo ? [photo] : [];
        }),
        owner: r.ownerId ? (owners.get(r.ownerId) ?? null) : null,
        contactPhone: opts.withContacts ? r.contactPhone : null,
        contactName: opts.withContacts ? r.contactName : null,
        car: r.car
          ? {
              brand: brand ? { id: brand.id, slug: brand.slug, name: brand.name } : null,
              model:
                model && r.car.modelId
                  ? { id: r.car.modelId, slug: model.slug, name: model.name }
                  : null,
              customModelName: r.car.customModelName,
              year: r.car.year,
              mileageKm: r.car.mileageKm,
              bodyType: r.car.bodyType,
              transmission: r.car.transmission,
              drive: r.car.drive,
              fuelTypes: r.car.fuelTypes,
              engineVolumeCc: r.car.engineVolumeCc,
              powerHp: r.car.powerHp,
              steering: r.car.steering,
              color: r.car.color,
              registration: r.car.registration,
              condition: r.car.condition,
              ownersCount: r.car.ownersCount,
              vin: r.car.vin,
              exchangePossible: r.car.exchangePossible,
            }
          : null,
        goods: r.goods
          ? {
              category: category(r.goods.categoryId),
              condition: r.goods.condition,
              attributes: r.goods.attributes as Record<string, unknown>,
              compatibleModels: r.goods.compatibleModels as {
                modelId: string;
                yearFrom: number | null;
                yearTo: number | null;
              }[],
            }
          : null,
        service: r.service
          ? {
              category: category(r.service.categoryId),
              address: r.service.address,
              workingHours: r.service.workingHours,
              mobileService: r.service.mobileService,
              servedBrands: r.service.servedBrands,
            }
          : null,
        source: r.external
          ? { code: r.external.source.code as ImportSourceCode, url: r.external.url }
          : null,
        version: r.version,
        publishedAt: r.publishedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      };
    });
  }
}
