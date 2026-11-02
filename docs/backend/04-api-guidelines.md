# Гайдлайны API

Публичное API — REST поверх HTTPS с JSON, описанное в OpenAPI 3.1. Чат — WebSocket (Socket.IO). Клиент для фронта генерирует orval из OpenAPI ([API-клиент](../frontend/06-api-client.md)).

## OpenAPI-контракт

- Спецификация собирается из декораторов `@nestjs/swagger` командой `pnpm --filter api api:openapi` и коммитится в `packages/api-contract/openapi.json`.
- У каждой операции есть `operationId` в camelCase: `getListing`, `listListings`, `createListing`, `addFavorite`. Из него orval строит имена хуков (`useGetListing`), поэтому `operationId` не меняется без причины.
- Теги — по модулям (`listings`, `auth`, `chat`, `catalog`): orval кладёт каждый тег в отдельный файл.
- У всех ответов, включая ошибки, описаны схемы. Без схемы хук получит тип `unknown`.
- Изменение API и перегенерированный фронт-клиент идут в одном PR. CI проверяет, что спецификация и клиент актуальны.

## Адреса и ресурсы

- Префикс версии: `/api/v1`.
- Ресурсы во множественном числе, kebab-case: `/api/v1/listings`, `/api/v1/exchange-rates`.
- Вложенность не глубже одного уровня: `/api/v1/listings/{id}/photos`.
- Действия, которые не укладываются в CRUD, — подресурс-глагол: `POST /api/v1/listings/{id}/hide`, `POST /api/v1/listings/{id}/publish`.
- Текущий пользователь — `/api/v1/me`, `/api/v1/me/listings`, `/api/v1/me/favorites`.

## Формат данных

| Правило | Пример |
| --- | --- |
| Поля в JSON — camelCase | `priceAmount`, `createdAt` |
| Даты — ISO 8601 в UTC | `2026-11-02T10:15:00Z` |
| Деньги — объект с целой суммой в минимальных единицах | `{"amount": 1250000, "currency": "USD"}` = 12 500,00 USD |
| Идентификаторы — строки UUID | `"0193f6b2-…"` |
| Enum — строки в snake_case | `needs_repair` |
| Пустое значение — `null`, а не отсутствие поля | |
| Локализованные справочники отдаются на языке из `Accept-Language` (`ru` / `ro`) | |

## Списки, фильтры, пагинация

- Пагинация курсором: `?limit=20&cursor=...`, ответ `{ "items": [...], "nextCursor": "..." | null }`. `limit` — до 50.
- Фильтры — плоские query-параметры: `?type=car&brand=toyota&model=camry&yearFrom=2015&priceFrom=5000&priceTo=15000&priceCurrency=USD&region=chisinau`.
- Мультивыбор — повтор параметра: `?fuel=petrol&fuel=hybrid`.
- Пары «марка + модель» — `?car=toyota:camry&car=kia:optima`, до 5 пар.
- Атрибуты категорий — с префиксом `attr.`: `?category=tires&attr.diameter=17&attr.season=winter`.
- Сортировка: `?sort=price_asc` (`date_desc` по умолчанию, `price_asc`, `price_desc`, `mileage_asc`, `year_desc`).
- Фасеты (число объявлений по значениям) — `?facets=bodyType,fuel` в том же ответе: `"facets": {"bodyType": {"sedan": 120}}`.

## Ошибки

Формат — RFC 9457 (Problem Details):

```json
{
  "type": "https://<домен>/errors/validation",
  "title": "Validation failed",
  "status": 422,
  "code": "validation_failed",
  "detail": "Некоторые поля заполнены неверно",
  "errors": [{ "field": "username", "code": "taken" }]
}
```

| HTTP | Когда |
| --- | --- |
| 400 | Синтаксически неверный запрос |
| 401 | Нет сессии |
| 403 | Нет прав (чужое объявление, блокировка) |
| 404 | Не найдено или скрыто от этого пользователя |
| 409 | Конфликт (ник занят, дубль) |
| 422 | Ошибка валидации |
| 429 | Превышен лимит, заголовок `Retry-After` |
| 500 | Ошибка сервера, в ответе `traceId` |

`code` — стабильный машинный код. По нему фронт выбирает переведённый текст. `detail` — только для отладки.

## Аутентификация

- Сессия в httpOnly cookie. Токенов в `localStorage` нет.
- Эндпоинты: `POST /auth/email/start`, `POST /auth/email/verify`, `GET /auth/google/start`, `GET /auth/google/callback`, `POST /auth/complete-profile`, `POST /auth/logout`.
- Изменяющие запросы требуют корректный `Origin`.

## API админки

- Префикс `/api/v1/admin`, теги OpenAPI с префиксом `admin-` (`admin-users`, `admin-listings`, `admin-reports`, `admin-import`, `admin-catalog`, `admin-rates`, `admin-staff`, `admin-audit`). Сайт и админка генерируют клиентов только по своим тегам.
- Доступ — роль `moderator` или `admin`, иначе 403. Требуемая роль указывается в описании операции.
- Действия — глаголы-подресурсы с обязательной причиной: `POST /admin/users/{id}/ban {reason, until}`, `POST /admin/listings/{id}/block {reason}`, `POST /admin/reports/{id}/resolve {resolution, comment}`, `POST /admin/import/sources/{code}/runs`.
- Списки админки поддерживают пагинацию по страницам (`?page=&pageSize=`) и сортировку по любой колонке таблицы: сотрудникам нужен переход на конкретную страницу.

## Идемпотентность и конкурентность

- Создание объявления и сообщения принимает заголовок `Idempotency-Key`: повтор с тем же ключом возвращает тот же результат.
- Обновление объявления — с `If-Match: <version>`, при расхождении — 409.

## WebSocket (чат)

- Подключение: `wss://<host>/ws` с cookie сессии.
- События клиента: `conversation:join {conversationId}`, `message:send {conversationId, body, clientId}`, `message:read {conversationId, messageId}`.
- События сервера: `message:new`, `message:read`, `conversation:updated`, `error {code}`.
- Историю сообщений клиент получает через REST: `GET /api/v1/conversations/{id}/messages?cursor=`.

## Версионирование

- Ломающие изменения — только в новой версии `/api/v2`.
- Добавление полей и эндпоинтов не ломает: клиент игнорирует неизвестные поля.
- Устаревшие поля помечаются `deprecated` в OpenAPI и живут минимум один релиз.
