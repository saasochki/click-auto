/**
 * Approved dictionaries: docs/analytics/08-dictionaries.md and docs/analytics/05-filters.md.
 * Cities: one administrative centre per region for now; the full list of towns from CUATM
 * (Moldova) and the official PMR list is loaded later through the same seed.
 */

export interface CitySeed {
  slug: string;
  ru: string;
  ro: string;
  lat: number;
  lng: number;
}

export interface RegionSeed {
  slug: string;
  ru: string;
  ro: string;
  country: 'pmr' | 'md';
  cities: CitySeed[];
}

const c = (slug: string, ru: string, ro: string, lat: number, lng: number): CitySeed => ({
  slug,
  ru,
  ro,
  lat,
  lng,
});

export const REGIONS: RegionSeed[] = [
  // PMR
  {
    slug: 'tiraspol',
    ru: 'Тирасполь',
    ro: 'Tiraspol',
    country: 'pmr',
    cities: [c('tiraspol', 'Тирасполь', 'Tiraspol', 46.84, 29.63)],
  },
  {
    slug: 'bender',
    ru: 'Бендеры',
    ro: 'Bender',
    country: 'pmr',
    cities: [c('bender', 'Бендеры', 'Bender', 46.83, 29.48)],
  },
  {
    slug: 'camenca',
    ru: 'Каменский район',
    ro: 'Camenca',
    country: 'pmr',
    cities: [c('camenca', 'Каменка', 'Camenca', 48.03, 28.7)],
  },
  {
    slug: 'ribnita',
    ru: 'Рыбницкий район',
    ro: 'Rîbnița',
    country: 'pmr',
    cities: [c('ribnita', 'Рыбница', 'Rîbnița', 47.77, 29.0)],
  },
  {
    slug: 'dubasari-pmr',
    ru: 'Дубоссарский район',
    ro: 'Dubăsari (stânga Nistrului)',
    country: 'pmr',
    cities: [c('dubasari', 'Дубоссары', 'Dubăsari', 47.27, 29.17)],
  },
  {
    slug: 'grigoriopol',
    ru: 'Григориопольский район',
    ro: 'Grigoriopol',
    country: 'pmr',
    cities: [c('grigoriopol', 'Григориополь', 'Grigoriopol', 47.15, 29.3)],
  },
  {
    slug: 'slobozia',
    ru: 'Слободзейский район',
    ro: 'Slobozia',
    country: 'pmr',
    cities: [
      c('slobozia', 'Слободзея', 'Slobozia', 46.73, 29.7),
      c('dnestrovsk', 'Днестровск', 'Dnestrovsc', 46.62, 29.92),
    ],
  },
  // Moldova
  {
    slug: 'chisinau',
    ru: 'Кишинёв',
    ro: 'Chișinău',
    country: 'md',
    cities: [c('chisinau', 'Кишинёв', 'Chișinău', 47.01, 28.86)],
  },
  {
    slug: 'balti',
    ru: 'Бельцы',
    ro: 'Bălți',
    country: 'md',
    cities: [c('balti', 'Бельцы', 'Bălți', 47.76, 27.93)],
  },
  {
    slug: 'gagauzia',
    ru: 'АТО Гагаузия',
    ro: 'UTA Găgăuzia',
    country: 'md',
    cities: [
      c('comrat', 'Комрат', 'Comrat', 46.3, 28.66),
      c('ceadir-lunga', 'Чадыр-Лунга', 'Ceadîr-Lunga', 46.06, 28.83),
      c('vulcanesti', 'Вулканешты', 'Vulcănești', 45.68, 28.4),
    ],
  },
  {
    slug: 'anenii-noi',
    ru: 'Анений-Ной',
    ro: 'Anenii Noi',
    country: 'md',
    cities: [c('anenii-noi', 'Анений-Ной', 'Anenii Noi', 46.88, 29.23)],
  },
  {
    slug: 'basarabeasca',
    ru: 'Басарабяска',
    ro: 'Basarabeasca',
    country: 'md',
    cities: [c('basarabeasca', 'Басарабяска', 'Basarabeasca', 46.33, 28.96)],
  },
  {
    slug: 'briceni',
    ru: 'Бричаны',
    ro: 'Briceni',
    country: 'md',
    cities: [c('briceni', 'Бричаны', 'Briceni', 48.36, 27.08)],
  },
  {
    slug: 'cahul',
    ru: 'Кагул',
    ro: 'Cahul',
    country: 'md',
    cities: [c('cahul', 'Кагул', 'Cahul', 45.9, 28.19)],
  },
  {
    slug: 'cantemir',
    ru: 'Кантемир',
    ro: 'Cantemir',
    country: 'md',
    cities: [c('cantemir', 'Кантемир', 'Cantemir', 46.28, 28.2)],
  },
  {
    slug: 'calarasi',
    ru: 'Кэлэраш',
    ro: 'Călărași',
    country: 'md',
    cities: [c('calarasi', 'Кэлэраш', 'Călărași', 47.25, 28.31)],
  },
  {
    slug: 'causeni',
    ru: 'Каушаны',
    ro: 'Căușeni',
    country: 'md',
    cities: [c('causeni', 'Каушаны', 'Căușeni', 46.64, 29.41)],
  },
  {
    slug: 'cimislia',
    ru: 'Чимишлия',
    ro: 'Cimișlia',
    country: 'md',
    cities: [c('cimislia', 'Чимишлия', 'Cimișlia', 46.52, 28.78)],
  },
  {
    slug: 'criuleni',
    ru: 'Криуляны',
    ro: 'Criuleni',
    country: 'md',
    cities: [c('criuleni', 'Криуляны', 'Criuleni', 47.21, 29.16)],
  },
  {
    slug: 'donduseni',
    ru: 'Дондюшаны',
    ro: 'Dondușeni',
    country: 'md',
    cities: [c('donduseni', 'Дондюшаны', 'Dondușeni', 48.22, 27.59)],
  },
  {
    slug: 'drochia',
    ru: 'Дрокия',
    ro: 'Drochia',
    country: 'md',
    cities: [c('drochia', 'Дрокия', 'Drochia', 48.03, 27.81)],
  },
  { slug: 'dubasari-md', ru: 'Дубэсарь', ro: 'Dubăsari', country: 'md', cities: [] },
  {
    slug: 'edinet',
    ru: 'Единец',
    ro: 'Edineț',
    country: 'md',
    cities: [c('edinet', 'Единец', 'Edineț', 48.17, 27.31)],
  },
  {
    slug: 'falesti',
    ru: 'Фэлешты',
    ro: 'Fălești',
    country: 'md',
    cities: [c('falesti', 'Фэлешты', 'Fălești', 47.57, 27.71)],
  },
  {
    slug: 'floresti',
    ru: 'Флорешты',
    ro: 'Florești',
    country: 'md',
    cities: [c('floresti', 'Флорешты', 'Florești', 47.89, 28.3)],
  },
  {
    slug: 'glodeni',
    ru: 'Глодяны',
    ro: 'Glodeni',
    country: 'md',
    cities: [c('glodeni', 'Глодяны', 'Glodeni', 47.77, 27.51)],
  },
  {
    slug: 'hincesti',
    ru: 'Хынчешты',
    ro: 'Hîncești',
    country: 'md',
    cities: [c('hincesti', 'Хынчешты', 'Hîncești', 46.83, 28.59)],
  },
  {
    slug: 'ialoveni',
    ru: 'Яловены',
    ro: 'Ialoveni',
    country: 'md',
    cities: [c('ialoveni', 'Яловены', 'Ialoveni', 46.94, 28.78)],
  },
  {
    slug: 'leova',
    ru: 'Леова',
    ro: 'Leova',
    country: 'md',
    cities: [c('leova', 'Леова', 'Leova', 46.48, 28.26)],
  },
  {
    slug: 'nisporeni',
    ru: 'Ниспорены',
    ro: 'Nisporeni',
    country: 'md',
    cities: [c('nisporeni', 'Ниспорены', 'Nisporeni', 47.08, 28.18)],
  },
  {
    slug: 'ocnita',
    ru: 'Окница',
    ro: 'Ocnița',
    country: 'md',
    cities: [c('ocnita', 'Окница', 'Ocnița', 48.41, 27.44)],
  },
  {
    slug: 'orhei',
    ru: 'Орхей',
    ro: 'Orhei',
    country: 'md',
    cities: [c('orhei', 'Орхей', 'Orhei', 47.38, 28.82)],
  },
  {
    slug: 'rezina',
    ru: 'Резина',
    ro: 'Rezina',
    country: 'md',
    cities: [c('rezina', 'Резина', 'Rezina', 47.75, 28.96)],
  },
  {
    slug: 'riscani',
    ru: 'Рышканы',
    ro: 'Rîșcani',
    country: 'md',
    cities: [c('riscani', 'Рышканы', 'Rîșcani', 47.96, 27.55)],
  },
  {
    slug: 'singerei',
    ru: 'Сынжерей',
    ro: 'Sîngerei',
    country: 'md',
    cities: [c('singerei', 'Сынжерей', 'Sîngerei', 47.64, 28.14)],
  },
  {
    slug: 'soroca',
    ru: 'Сорока',
    ro: 'Soroca',
    country: 'md',
    cities: [c('soroca', 'Сорока', 'Soroca', 48.16, 28.3)],
  },
  {
    slug: 'straseni',
    ru: 'Стрэшены',
    ro: 'Strășeni',
    country: 'md',
    cities: [c('straseni', 'Стрэшены', 'Strășeni', 47.14, 28.61)],
  },
  {
    slug: 'soldanesti',
    ru: 'Шолдэнешты',
    ro: 'Șoldănești',
    country: 'md',
    cities: [c('soldanesti', 'Шолдэнешты', 'Șoldănești', 47.82, 28.8)],
  },
  {
    slug: 'stefan-voda',
    ru: 'Штефан-Водэ',
    ro: 'Ștefan Vodă',
    country: 'md',
    cities: [c('stefan-voda', 'Штефан-Водэ', 'Ștefan Vodă', 46.51, 29.66)],
  },
  {
    slug: 'taraclia',
    ru: 'Тараклия',
    ro: 'Taraclia',
    country: 'md',
    cities: [c('taraclia', 'Тараклия', 'Taraclia', 45.9, 28.67)],
  },
  {
    slug: 'telenesti',
    ru: 'Теленешты',
    ro: 'Telenești',
    country: 'md',
    cities: [c('telenesti', 'Теленешты', 'Telenești', 47.5, 28.37)],
  },
  {
    slug: 'ungheni',
    ru: 'Унгены',
    ro: 'Ungheni',
    country: 'md',
    cities: [c('ungheni', 'Унгены', 'Ungheni', 47.21, 27.8)],
  },
];

export interface AttributeSeed {
  key: string;
  type: 'number' | 'range' | 'enum' | 'multi_enum' | 'bool' | 'text';
  options?: string[];
  unit?: string;
  required?: boolean;
}

export interface CategorySeed {
  slug: string;
  ru: string;
  ro: string;
  attributes?: AttributeSeed[];
  children?: CategorySeed[];
}

const TIRE_ATTRS: AttributeSeed[] = [
  { key: 'width', type: 'number', unit: 'mm', required: true },
  { key: 'profile', type: 'number', unit: '%', required: true },
  { key: 'diameter', type: 'number', unit: 'in', required: true },
  { key: 'season', type: 'enum', options: ['summer', 'winter', 'all_season'], required: true },
  { key: 'studded', type: 'bool' },
  { key: 'quantity', type: 'number', required: true },
];

const DISK_ATTRS: AttributeSeed[] = [
  { key: 'disk_diameter', type: 'number', unit: 'in', required: true },
  { key: 'disk_width', type: 'number', unit: 'in' },
  { key: 'pcd', type: 'text' },
  { key: 'et', type: 'number', unit: 'mm' },
  { key: 'disk_type', type: 'enum', options: ['alloy', 'steel', 'forged'], required: true },
  { key: 'quantity', type: 'number', required: true },
];

export const GOODS_CATEGORIES: CategorySeed[] = [
  {
    slug: 'parts',
    ru: 'Запчасти',
    ro: 'Piese auto',
    attributes: [
      { key: 'oem', type: 'text' },
      { key: 'part_type', type: 'enum', options: ['original', 'analog'] },
    ],
    children: [
      { slug: 'engine', ru: 'Двигатель', ro: 'Motor' },
      { slug: 'transmission', ru: 'Трансмиссия', ro: 'Transmisie' },
      { slug: 'suspension', ru: 'Подвеска и рулевое', ro: 'Suspensie și direcție' },
      { slug: 'brakes', ru: 'Тормоза', ro: 'Frâne' },
      { slug: 'body', ru: 'Кузов', ro: 'Caroserie' },
      { slug: 'lighting', ru: 'Оптика', ro: 'Optică' },
      { slug: 'electrics', ru: 'Электрика', ro: 'Electrică' },
      { slug: 'interior', ru: 'Салон', ro: 'Salon' },
      { slug: 'cooling', ru: 'Охлаждение и отопление', ro: 'Răcire și încălzire' },
      { slug: 'exhaust', ru: 'Выхлопная система', ro: 'Sistem de evacuare' },
    ],
  },
  {
    slug: 'tires',
    ru: 'Шины',
    ro: 'Anvelope',
    attributes: TIRE_ATTRS,
    children: [
      { slug: 'tires-summer', ru: 'Летние', ro: 'De vară' },
      { slug: 'tires-winter', ru: 'Зимние', ro: 'De iarnă' },
      { slug: 'tires-all-season', ru: 'Всесезонные', ro: 'All season' },
    ],
  },
  {
    slug: 'disks',
    ru: 'Диски',
    ro: 'Jante',
    attributes: DISK_ATTRS,
    children: [
      { slug: 'disks-alloy', ru: 'Литые', ro: 'Aliaj' },
      { slug: 'disks-steel', ru: 'Штампованные', ro: 'Tablă' },
      { slug: 'disks-forged', ru: 'Кованые', ro: 'Forjate' },
    ],
  },
  {
    slug: 'wheels',
    ru: 'Шины в сборе с дисками',
    ro: 'Roți complete',
    attributes: [...TIRE_ATTRS.filter((a) => a.key !== 'quantity'), ...DISK_ATTRS],
  },
  {
    slug: 'electronics',
    ru: 'Аудио и электроника',
    ro: 'Audio și electronică',
    children: [
      { slug: 'head-units', ru: 'Магнитолы', ro: 'Radiouri auto' },
      { slug: 'speakers', ru: 'Акустика', ro: 'Boxe' },
      { slug: 'dashcams', ru: 'Видеорегистраторы', ro: 'Camere video auto' },
      { slug: 'navigators', ru: 'Навигаторы', ro: 'Navigatoare' },
      { slug: 'cameras', ru: 'Камеры', ro: 'Camere' },
      { slug: 'alarms', ru: 'Сигнализации', ro: 'Alarme' },
    ],
  },
  {
    slug: 'accessories',
    ru: 'Аксессуары',
    ro: 'Accesorii',
    children: [
      { slug: 'mats', ru: 'Коврики', ro: 'Covorașe' },
      { slug: 'covers', ru: 'Чехлы', ro: 'Huse' },
      { slug: 'roof-racks', ru: 'Багажники и боксы', ro: 'Portbagaje și cutii' },
      { slug: 'towbars', ru: 'Фаркопы', ro: 'Cârlige de remorcare' },
      { slug: 'accessories-other', ru: 'Прочее', ro: 'Altele' },
    ],
  },
  {
    slug: 'chemicals',
    ru: 'Масла и автохимия',
    ro: 'Uleiuri și chimicale auto',
    children: [
      { slug: 'engine-oils', ru: 'Моторные масла', ro: 'Uleiuri de motor' },
      { slug: 'gear-oils', ru: 'Трансмиссионные масла', ro: 'Uleiuri de transmisie' },
      { slug: 'fluids', ru: 'Жидкости', ro: 'Lichide' },
      { slug: 'car-care', ru: 'Автокосметика', ro: 'Cosmetică auto' },
    ],
  },
  {
    slug: 'tools',
    ru: 'Инструменты и оборудование',
    ro: 'Scule și echipamente',
    children: [
      { slug: 'jacks', ru: 'Домкраты', ro: 'Cricuri' },
      { slug: 'compressors', ru: 'Компрессоры', ro: 'Compresoare' },
      { slug: 'jump-starters', ru: 'Пуско-зарядные устройства', ro: 'Dispozitive de pornire' },
      { slug: 'tool-sets', ru: 'Наборы инструментов', ro: 'Truse de scule' },
    ],
  },
];

export const SERVICE_CATEGORIES: CategorySeed[] = [
  { slug: 'repair', ru: 'Ремонт и обслуживание (СТО)', ro: 'Reparații și service' },
  { slug: 'diagnostics', ru: 'Диагностика', ro: 'Diagnostică' },
  { slug: 'tire-service', ru: 'Шиномонтаж', ro: 'Vulcanizare' },
  { slug: 'body-repair', ru: 'Кузовной ремонт и покраска', ro: 'Tinichigerie și vopsitorie' },
  { slug: 'auto-electric', ru: 'Автоэлектрик', ro: 'Electrician auto' },
  { slug: 'detailing', ru: 'Мойка и детейлинг', ro: 'Spălătorie și detailing' },
  { slug: 'tow-truck', ru: 'Эвакуатор', ro: 'Evacuator' },
  { slug: 'car-selection', ru: 'Автоподбор', ro: 'Selecție auto' },
  { slug: 'services-other', ru: 'Прочее', ro: 'Altele' },
];
