import {
  ATTR_PARAM_PREFIX,
  BODY_TYPES,
  CAR_PAIRS_MAX,
  COLORS,
  CURRENCIES,
  DRIVES,
  FUEL_TYPES,
  POSTED_WITHIN_DAYS,
  REGISTRATIONS,
  STEERINGS,
  TRANSMISSIONS,
  type ListingType,
} from '@clickauto/shared';

/**
 * Filter panel configuration (docs/analytics/05-filters.md, docs/frontend/02-architecture.md#фильтры).
 * The site renders the panel from it: fields in order, their kind, values and dependencies.
 * Query parameter names are the ones of GET /api/v1/listings.
 */

export const FILTER_KINDS = [
  /** One value of a repeated parameter as chips, with "Все" first. */
  'chips',
  /** Several values as checkboxes. */
  'checkboxes',
  /** Several values as chips. */
  'chip_multi',
  /** One value of a repeated parameter from a drop-down, "Любая" by default. */
  'select',
  /** Number range: params are [from, to]. */
  'range',
  /** On / off flag as a switch. */
  'switch',
  /** On / off flag as a checkbox. */
  'checkbox',
  /** Price range, currency and "Договорная": params are [from, to, currency, negotiable]. */
  'price',
  /** "Дата выкладки": one of the options, in days. */
  'posted',
  /** Brand → model pairs; models come with listing counts from the feed facets. */
  'car_pairs',
  /** Category tree; options carry the parent slug. */
  'category',
  /** Parts compatibility: model id and year of the buyer's car. */
  'compatibility',
  /** Free value of a category attribute. */
  'text',
] as const;
export type FilterKind = (typeof FILTER_KINDS)[number];

export interface FilterOption {
  value: string;
  /** Present for values from the database (categories, brands); others are translated by the site. */
  label?: string;
  /** Category tree: slug of the parent category. */
  parent?: string;
}

export interface FilterField {
  /** Stable field id; the site uses it as the label key. */
  key: string;
  kind: FilterKind;
  /** Query parameters the field writes. */
  params: string[];
  options?: FilterOption[];
  /** Dictionary of option labels on the site: dict.<dictionary>.<value>. */
  dictionary?: string;
  unit?: string;
  /** Range: digit grouping (off for years). */
  grouping?: boolean;
  /** Shown under "Ещё фильтры". */
  advanced?: boolean;
  /** Hidden while `param` has exactly these values (engine volume for electric cars only). */
  hiddenWhen?: { param: string; only: string[] };
  /** Parameters reset when this field changes; a trailing "*" matches a prefix. */
  resets?: string[];
  /** Most values at once (car pairs). */
  max?: number;
}

export interface FilterConfig {
  type: ListingType;
  fields: FilterField[];
}

const options = (values: readonly (string | number)[]): FilterOption[] =>
  values.map((value) => ({ value: String(value) }));

const range = (key: string, extra: Partial<FilterField> = {}): FilterField => ({
  key,
  kind: 'range',
  params: [`${key}From`, `${key}To`],
  ...extra,
});

const select = (key: string, values: readonly string[], advanced = false): FilterField => ({
  key,
  kind: 'select',
  params: [key],
  options: options(values),
  dictionary: key,
  ...(advanced ? { advanced } : {}),
});

const PRICE: FilterField = {
  key: 'price',
  kind: 'price',
  params: ['priceFrom', 'priceTo', 'priceCurrency', 'negotiable'],
  options: options(CURRENCIES),
};

const posted = (advanced = false): FilterField => ({
  key: 'posted',
  kind: 'posted',
  params: ['posted'],
  options: options(POSTED_WITHIN_DAYS),
  ...(advanced ? { advanced } : {}),
});

/** Car filters do not depend on the brand, except the model (05-filters, «Зависимости»). */
export const CAR_FIELDS: FilterField[] = [
  {
    key: 'condition',
    kind: 'chips',
    params: ['condition'],
    options: options(['used', 'new', 'needs_repair']),
    dictionary: 'carCondition',
  },
  { key: 'car', kind: 'car_pairs', params: ['car'], max: CAR_PAIRS_MAX },
  PRICE,
  range('year', { grouping: false }),
  range('mileage', { unit: 'km' }),
  {
    key: 'fuel',
    kind: 'checkboxes',
    params: ['fuel'],
    options: options(FUEL_TYPES),
    dictionary: 'fuel',
  },
  select('transmission', TRANSMISSIONS),
  select('bodyType', BODY_TYPES),
  select('drive', DRIVES),
  range('engine', {
    unit: 'cm3',
    advanced: true,
    hiddenWhen: { param: 'fuel', only: ['electric'] },
  }),
  range('power', { unit: 'hp', advanced: true }),
  select('steering', STEERINGS, true),
  select('color', COLORS, true),
  {
    key: 'registration',
    kind: 'chip_multi',
    params: ['registration'],
    options: options(REGISTRATIONS),
    dictionary: 'registration',
    advanced: true,
  },
  { key: 'exchange', kind: 'switch', params: ['exchange'], advanced: true },
  posted(true),
];

/** Roots whose goods are filtered by the buyer's car (05-filters, «Фильтры, зависящие от категории»). */
export const COMPATIBILITY_ROOTS = ['parts', 'electronics', 'accessories'];

/** Attributes that are not panel filters: OEM is found by text search, quantity is informational. */
const NOT_FILTERS = new Set(['oem', 'quantity']);

export interface CategoryOption {
  slug: string;
  name: string;
  parentSlug: string | null;
}

export interface AttributeInfo {
  key: string;
  type: 'number' | 'range' | 'enum' | 'multi_enum' | 'bool' | 'text';
  options: string[] | null;
  unit: string | null;
  filterable: boolean;
}

function categoryField(categories: CategoryOption[], resets?: string[]): FilterField {
  return {
    key: 'category',
    kind: 'category',
    params: ['category'],
    options: categories.map((c) => ({
      value: c.slug,
      label: c.name,
      ...(c.parentSlug ? { parent: c.parentSlug } : {}),
    })),
    ...(resets ? { resets } : {}),
  };
}

export function attributeField(attribute: AttributeInfo): FilterField | null {
  if (!attribute.filterable || NOT_FILTERS.has(attribute.key)) return null;
  const param = `${ATTR_PARAM_PREFIX}${attribute.key}`;
  const base = { key: param, params: [param], ...(attribute.unit ? { unit: attribute.unit } : {}) };
  if ((attribute.type === 'enum' || attribute.type === 'multi_enum') && attribute.options) {
    return {
      ...base,
      kind: 'chip_multi',
      options: options(attribute.options),
      dictionary: `attrOption.${attribute.key}`,
    };
  }
  if (attribute.type === 'bool') return { ...base, kind: 'checkbox' };
  return { ...base, kind: 'text' };
}

/** Goods: the category is the main filter; its attributes appear once it is chosen. */
export function goodsFields(
  categories: CategoryOption[],
  chosen: { root: string; attributes: AttributeInfo[] } | null,
): FilterField[] {
  const fields: FilterField[] = [
    categoryField(categories, [`${ATTR_PARAM_PREFIX}*`, 'compatModel', 'compatYear']),
    {
      key: 'condition',
      kind: 'chips',
      params: ['condition'],
      options: options(['new', 'used']),
      dictionary: 'goodsCondition',
    },
  ];
  if (chosen) {
    for (const attribute of chosen.attributes) {
      const field = attributeField(attribute);
      if (field) fields.push(field);
    }
    if (COMPATIBILITY_ROOTS.includes(chosen.root)) {
      fields.push({
        key: 'compatibility',
        kind: 'compatibility',
        params: ['compatModel', 'compatYear'],
      });
    }
  }
  fields.push(PRICE, posted());
  return fields;
}

export function serviceFields(
  categories: CategoryOption[],
  brands: { slug: string; name: string }[],
): FilterField[] {
  return [
    categoryField(categories),
    {
      key: 'servedBrand',
      kind: 'select',
      params: ['servedBrand'],
      options: brands.map((b) => ({ value: b.slug, label: b.name })),
    },
    { key: 'mobile', kind: 'switch', params: ['mobile'] },
    PRICE,
    posted(),
  ];
}
