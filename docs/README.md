# Документация ClickAuto

ClickAuto — веб-платформа (mobile-first сайт) для покупки и продажи автомобилей, товаров для авто и услуг в ПМР и Молдове.

## Аналитика

| Документ | О чём |
| --- | --- |
| [Обзор проекта](analytics/01-overview.md) | Суть продукта, рынок, аудитория, ценность |
| [Анализ конкурентов](analytics/02-competitors.md) | Авто.ру, Дром, Auto.uz: что берём и чего избегаем |
| [Функциональные требования](analytics/03-requirements.md) | Модули продукта, MVP и следующие этапы |
| [Пользовательские сценарии](analytics/04-user-flows.md) | Навигация, вход и регистрация, размещение и покупка |
| [Справочник фильтров](analytics/05-filters.md) | Параметры авто, товаров и услуг для фильтров, поиска и карточек |
| [Метрики](analytics/06-metrics.md) | North Star, воронки, KPI и события аналитики |
| [Справочники](analytics/08-dictionaries.md) | Значения коробки, привода, кузова, цвета, причины жалоб, регионы |
| [Открытые вопросы и риски](analytics/07-open-questions.md) | Что ещё нужно решить и чем рискуем |

## Backend

| Документ | О чём |
| --- | --- |
| [Стек](backend/01-stack.md) | NestJS, PostgreSQL, Meilisearch, Redis, S3 и др. |
| [Архитектура](backend/02-architecture.md) | Модульный монолит, модули, потоки данных, импорт, чат |
| [Доменная модель](backend/03-domain-model.md) | Сущности, связи, статусы, инварианты |
| [Гайдлайны API](backend/04-api-guidelines.md) | REST, ошибки, пагинация, WebSocket |
| [Стайлгайд](backend/05-styleguide.md) | Код, БД, очереди, логи, тесты |

## Frontend

| Документ | О чём |
| --- | --- |
| [Стек](frontend/01-stack.md) | Next.js, Tailwind, TanStack Query, next-intl и др. |
| [Архитектура](frontend/02-architecture.md) | Структура, маршруты, данные, фильтры, i18n, SEO |
| [Доменная модель на фронте](frontend/03-domain-model.md) | Типы из OpenAPI, UI-модели, форматирование |
| [Стайлгайд кода](frontend/04-code-styleguide.md) | Компоненты, состояние, формы, тесты |
| [Дизайн-система](frontend/05-design-system.md) | Токены, темы, сетка, компоненты |
| [API-клиент](frontend/06-api-client.md) | orval + TanStack Query: генерация, запросы, кэш, SSR |
| [Админка](frontend/07-admin.md) | Модерация, импорт, справочники, курсы, сотрудники |

Работа с ветками — [gitflow](gitflow.md). Правила для AI-агентов, которые работают в репозитории, — в [AGENTS.md](../AGENTS.md).

Источник research: [Figma — ClickAuto](https://www.figma.com/design/xvASQmqPFIaoo2XYknDkLC/ClickAuto?node-id=0-1).
