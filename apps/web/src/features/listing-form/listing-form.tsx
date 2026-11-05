'use client';

import type { ListingInput } from '@clickauto/shared';
import { Button, cn } from '@clickauto/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  createListing,
  publishListing,
  updateListing,
} from '@/shared/api/generated/listings/listings';
import {
  getCountMyListingsQueryKey,
  getGetMyListingQueryKey,
  getListMyListingsQueryKey,
} from '@/shared/api/generated/me/me';
import type { CreateListingBody, ListingDto } from '@/shared/api/generated/model';
import { ApiError } from '@/shared/api/http-client';
import { Link, useRouter } from '@/shared/i18n/routing';
import { BackIcon, CloseIcon } from '@/shared/ui/icons';
import { CarDescriptionStep, CarMainStep, CarSpecsStep } from './car-fields';
import { GoodsFields } from './goods-fields';
import {
  carStepOf,
  emptyForm,
  formFromListing,
  validate,
  type FieldErrors,
  type ListingFormState,
} from './model';
import { ServiceFields } from './service-fields';
import { useCategoryOptions } from './use-categories';

type SaveMode = 'draft' | 'publish' | 'save';

const CAR_STEPS = 3;

/**
 * Listing form: car in three steps (design 17, 24, 25), goods and service on one screen (30–32).
 * New listing: "Черновик" or "Опубликовать". Existing one: "Сохранить" keeps its status.
 */
export function ListingForm({
  type,
  listing,
  onPublished,
}: {
  type: ListingFormState['type'];
  listing?: ListingDto;
  onPublished: (listing: ListingDto) => void;
}) {
  const t = useTranslations('listingForm');
  const te = useTranslations('errors');
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ListingFormState>(() =>
    listing ? formFromListing(listing) : emptyForm(type),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const goods = useCategoryOptions('goods');
  const attributeDefs =
    type === 'goods' ? (goods.byId.get(form.goods.categoryId)?.attributes ?? []) : [];

  const isCar = type === 'car';
  const lastStep = isCar ? CAR_STEPS - 1 : 0;
  const isDraft = !listing || listing.status === 'draft';

  const save = useMutation({
    mutationFn: async ({ input, mode }: { input: ListingInput; mode: SaveMode }) => {
      const body = input as CreateListingBody;
      const saved = listing
        ? await updateListing(listing.id, body, {
            headers: { 'If-Match': String(listing.version) },
          })
        : await createListing(body);
      // httpClient already throws ApiError on 4xx/5xx; these checks only narrow the type.
      if (saved.status !== 200 && saved.status !== 201) throw new Error('unexpected_status');
      if (mode !== 'publish') return saved.data;
      const published = await publishListing(saved.data.id);
      if (published.status !== 200) throw new Error('unexpected_status');
      return published.data;
    },
    onSuccess: async (saved, { mode }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListMyListingsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getCountMyListingsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetMyListingQueryKey(saved.id) }),
      ]);
      if (mode === 'publish') onPublished(saved);
      else router.push(`/me/listings?status=${saved.status}`);
    },
    onError: (error) => {
      if (!(error instanceof ApiError)) return setBanner(te('unknown_error'));
      const { code, errors: fields } = error.problem;
      if (code === 'validation_failed' && fields?.length) {
        const next: FieldErrors = {};
        for (const item of fields) {
          const field = item.field.startsWith('price') ? 'price' : item.field;
          next[field] ??=
            field === 'price' && item.code === 'required' ? 'price_required' : item.code;
        }
        showErrors(next);
        return;
      }
      setBanner(t.has(`serverErrors.${code}`) ? t(`serverErrors.${code}`) : te('unknown_error'));
    },
  });

  const showErrors = (next: FieldErrors) => {
    setErrors(next);
    if (isCar) {
      const first = Math.min(...Object.keys(next).map(carStepOf));
      if (Number.isFinite(first)) setStep(first);
    }
    setBanner(t('fixErrors'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = (mode: SaveMode) => {
    setBanner(null);
    const publishing = mode === 'publish' || !isDraft;
    const result = validate(form, attributeDefs, publishing);
    if (!result.input) return showErrors(result.errors);
    setErrors({});
    save.mutate({ input: result.input, mode });
  };

  const patch = (update: (current: ListingFormState) => ListingFormState) => setForm(update);
  const props = { form, patch, errors };
  const title = listing ? t('editTitle') : t(`newTitle.${type}`);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 bg-bg px-4 pt-3 pb-2">
        <div className="flex h-12 items-center gap-3">
          {isCar && step > 0 ? (
            <button
              type="button"
              aria-label={t('back')}
              onClick={() => setStep(step - 1)}
              className="-ml-2 p-2"
            >
              <BackIcon className="size-6" />
            </button>
          ) : (
            <Link href="/me/listings" aria-label={t('close')} className="-ml-2 p-2">
              <CloseIcon className="size-6" />
            </Link>
          )}
          <h1 className="text-h2">{title}</h1>
        </div>
        {isCar ? (
          <div className="mt-2 grid grid-cols-3 gap-1.5" aria-hidden>
            {Array.from({ length: CAR_STEPS }, (_, i) => (
              <span
                key={i}
                className={cn('h-1 rounded-full', i <= step ? 'bg-accent' : 'bg-border')}
              />
            ))}
          </div>
        ) : null}
      </header>

      <form
        noValidate
        className="flex flex-1 flex-col gap-5 px-4 pt-3 pb-32"
        onSubmit={(event) => {
          event.preventDefault();
          if (step < lastStep) setStep(step + 1);
          else submit(isDraft ? 'publish' : 'save');
        }}
      >
        {banner ? (
          <p role="alert" className="rounded-md bg-danger-subtle px-4 py-3 text-label text-danger">
            {banner}
          </p>
        ) : null}
        {isCar && step === 0 ? <CarMainStep {...props} /> : null}
        {isCar && step === 1 ? <CarSpecsStep {...props} /> : null}
        {isCar && step === 2 ? <CarDescriptionStep {...props} /> : null}
        {type === 'goods' ? <GoodsFields {...props} /> : null}
        {type === 'service' ? <ServiceFields {...props} /> : null}

        <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-bg px-4 pt-3 pb-safe">
          <div className="mx-auto flex max-w-2xl gap-3">
            {step < lastStep ? (
              <Button type="submit" size="lg" fullWidth>
                {t(`next.${step}`)}
              </Button>
            ) : isDraft ? (
              <>
                <Button
                  kind="secondary"
                  size="lg"
                  className="flex-1"
                  disabled={save.isPending}
                  onClick={() => submit('draft')}
                >
                  {t('saveDraft')}
                </Button>
                <Button type="submit" size="lg" className="flex-1" disabled={save.isPending}>
                  {t('publish')}
                </Button>
              </>
            ) : (
              <Button type="submit" size="lg" fullWidth disabled={save.isPending}>
                {t('save')}
              </Button>
            )}
          </div>
        </footer>
      </form>
    </div>
  );
}
