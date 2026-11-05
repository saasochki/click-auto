# ClickAuto

Mobile-first сайт для покупки и продажи авто, товаров для авто и услуг в ПМР и Молдове. Документация — в [docs/](docs/README.md), правила для AI-агентов — в [AGENTS.md](AGENTS.md).

## Структура

| Путь                    | Что это                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `apps/web`              | Сайт: Next.js 15, App Router, RU/RO, светлая и тёмная темы |
| `apps/admin`            | Админка: Vite + React, TanStack Router                     |
| `apps/api`              | REST API и WebSocket: NestJS 11                            |
| `apps/worker`           | Фоновые задачи: индексация, курсы, импорт, письма          |
| `packages/shared`       | Enum'ы, Zod-схемы и константы, общие для фронта и бэка     |
| `packages/db`           | Prisma-схема, миграции, сиды справочников                  |
| `packages/ui`           | Токены дизайна и компоненты                                |
| `packages/api-contract` | `openapi.json`, из которого orval генерирует клиентов      |
| `packages/config`       | Общие настройки TypeScript и ESLint                        |

## Запуск локально

Нужны Node.js 22, pnpm 10 (`corepack enable`) и Docker.

```bash
cp .env.example .env
docker compose up -d              # PostgreSQL, Redis, Meilisearch, RustFS, imgproxy, Mailpit
pnpm install
pnpm db:generate
pnpm db:migrate                   # применить миграции к локальной базе
pnpm db:seed                      # регионы, города, категории, источники импорта
pnpm --filter @clickauto/db seed:dev   # только локально: марки, тестовые пользователи @example.com и выдуманные объявления
pnpm --filter worker search:reindex    # собрать индекс поиска из базы
pnpm --filter worker rates:refresh     # загрузить курсы НБМ и ПРБ
pnpm dev
```

| Сервис           | Адрес                                                        |
| ---------------- | ------------------------------------------------------------ |
| Сайт             | http://localhost:3000                                        |
| Админка          | http://localhost:5173                                        |
| API и Swagger    | http://localhost:4000/api/v1, http://localhost:4000/api/docs |
| Письма (Mailpit) | http://localhost:8025                                        |

## Проверки

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

E2E-тесты API ходят в настоящие PostgreSQL, Redis и S3 и создают данные. Запускайте их на отдельной базе, не на рабочей локальной:

```bash
docker compose exec postgres createdb -U clickauto clickauto_test   # один раз
export DATABASE_URL=postgresql://clickauto:clickauto@localhost:5432/clickauto_test
pnpm --filter @clickauto/db migrate:deploy && pnpm --filter @clickauto/db seed
E2E=1 REDIS_URL=redis://localhost:6379/15 pnpm --filter api test
```

Изменили API — обновите контракт и клиентов в том же PR:

```bash
pnpm --filter api api:openapi
pnpm --filter web api:generate
pnpm --filter admin api:generate
```
