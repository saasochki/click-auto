# Справочники

Фиксированные значения для фильтров, формы объявления, карточки и админки. Утверждены командой 2026-11-03. Код значения — enum в `packages/shared`, подписи — ключи i18n в `ru.json` и `ro.json`.

Списки авто взяты с оглядкой на 999.md — главный источник импорта: чем ближе наши значения к его спискам, тем меньше ручного сопоставления. Значение источника, которого нет у нас, импорт отправляет в очередь ручной проверки, а не угадывает.

Марки и модели, категории товаров и услуг — не здесь: их ведут в админке ([модель](../backend/03-domain-model.md#справочники-авто)).

## Авто

### Коробка передач — `transmission`

| Код | RU | RO |
| --- | --- | --- |
| `manual` | Механика | Manuală |
| `automatic` | Автомат | Automată |
| `robot` | Робот | Robotizată |
| `cvt` | Вариатор | Variator |

### Привод — `drive`

| Код | RU | RO |
| --- | --- | --- |
| `fwd` | Передний | Față |
| `rwd` | Задний | Spate |
| `awd` | Полный | Integrală |

### Тип кузова — `body_type`

| Код | RU | RO |
| --- | --- | --- |
| `sedan` | Седан | Sedan |
| `hatchback` | Хэтчбек | Hatchback |
| `wagon` | Универсал | Break |
| `liftback` | Лифтбек | Liftback |
| `coupe` | Купе | Coupé |
| `convertible` | Кабриолет | Cabriolet |
| `suv` | Внедорожник | SUV |
| `crossover` | Кроссовер | Crossover |
| `minivan` | Минивэн | Monovolum |
| `pickup` | Пикап | Pickup |
| `van` | Фургон | Furgon |
| `minibus` | Микроавтобус | Microbuz |

### Цвет — `color`

| Код | RU | RO |
| --- | --- | --- |
| `white` | Белый | Alb |
| `black` | Чёрный | Negru |
| `gray` | Серый | Gri |
| `silver` | Серебристый | Argintiu |
| `blue` | Синий | Albastru |
| `light_blue` | Голубой | Albastru deschis |
| `red` | Красный | Roșu |
| `burgundy` | Бордовый | Vișiniu |
| `green` | Зелёный | Verde |
| `beige` | Бежевый | Bej |
| `brown` | Коричневый | Maro |
| `yellow` | Жёлтый | Galben |
| `orange` | Оранжевый | Portocaliu |
| `purple` | Фиолетовый | Violet |
| `gold` | Золотистый | Auriu |
| `other` | Другой | Altă culoare |

Топливо, руль, учёт и состояние уже перечислены в [фильтрах](05-filters.md).

## Причины жалобы — `Report.reason`

Список зависит от `target_type`. При `other` комментарий обязателен.

| `target_type` | Код | RU | RO |
| --- | --- | --- | --- |
| `listing` | `fraud` | Мошенничество | Fraudă |
| `listing` | `wrong_info` | Неверная цена или описание | Preț sau descriere greșită |
| `listing` | `sold` | Уже продано | Deja vândut |
| `listing` | `photos_mismatch` | Фото не соответствуют | Fotografiile nu corespund |
| `listing` | `duplicate` | Дубль | Duplicat |
| `listing` | `other` | Другое | Altceva |
| `message` | `spam` | Спам | Spam |
| `message` | `fraud` | Мошенничество | Fraudă |
| `message` | `abuse` | Оскорбления | Insulte |
| `message` | `other` | Другое | Altceva |
| `user` | `impersonation` | Выдаёт себя за другого | Se dă drept altcineva |
| `user` | `spam` | Спам | Spam |
| `user` | `fraud` | Мошенничество | Fraudă |
| `user` | `other` | Другое | Altceva |

## Регионы

Административное деление: для Молдовы — муниципии, районы и АТО Гагаузия, для ПМР — города республиканского значения и районы. Бендеры относим к ПМР, чтобы город не появлялся дважды. Регион — запись `Region` с полем `country`.

В фильтре можно выбрать регион целиком или отдельный город. В объявлении город обязателен (`Listing.city_id`).

### ПМР — `country = pmr`

| RU | RO |
| --- | --- |
| Тирасполь | Tiraspol |
| Бендеры | Bender |
| Каменский район | Camenca |
| Рыбницкий район | Rîbnița |
| Дубоссарский район | Dubăsari (stânga Nistrului) |
| Григориопольский район | Grigoriopol |
| Слободзейский район | Slobozia |

### Молдова — `country = md`

| RU | RO |
| --- | --- |
| Кишинёв | Chișinău |
| Бельцы | Bălți |
| АТО Гагаузия | UTA Găgăuzia |
| Анений-Ной | Anenii Noi |
| Басарабяска | Basarabeasca |
| Бричаны | Briceni |
| Кагул | Cahul |
| Кантемир | Cantemir |
| Кэлэраш | Călărași |
| Каушаны | Căușeni |
| Чимишлия | Cimișlia |
| Криуляны | Criuleni |
| Дондюшаны | Dondușeni |
| Дрокия | Drochia |
| Дубэсарь | Dubăsari |
| Единец | Edineț |
| Фэлешты | Fălești |
| Флорешты | Florești |
| Глодяны | Glodeni |
| Хынчешты | Hîncești |
| Яловены | Ialoveni |
| Леова | Leova |
| Ниспорены | Nisporeni |
| Окница | Ocnița |
| Орхей | Orhei |
| Резина | Rezina |
| Рышканы | Rîșcani |
| Сынжерей | Sîngerei |
| Сорока | Soroca |
| Стрэшены | Strășeni |
| Шолдэнешты | Șoldănești |
| Штефан-Водэ | Ștefan Vodă |
| Тараклия | Taraclia |
| Теленешты | Telenești |
| Унгены | Ungheni |

### Города

Города внутри регионов — все населённые пункты со статусом города: для Молдовы — по классификатору административно-территориальных единиц (CUATM), для ПМР — по официальному списку городов. Список загружается сидом вместе с координатами центра для геолокации. Сёла в первой версии не добавляем. Если появятся объявления из сёл, добавим их через админку.
