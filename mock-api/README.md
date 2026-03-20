# Flowcase mock API

This folder contains editable JSON source files plus a thin compatibility server that exposes Flowcase-like endpoints.

## Scripts

- `bun run mock:api` starts the compatibility server on `http://localhost:3001`
- `bun run mock:api:build` rebuilds `mock-api/db.json` from the source files in `mock-api/data`
- `bun run mock:api:raw` starts plain `json-server` on `http://localhost:3002` against `mock-api/db.json`

## Source of truth

Edit these files directly:

- `mock-api/data/countries.json`
- `mock-api/data/offices.json`
- `mock-api/data/consultant-profiles.json`
- `mock-api/data/technology-categories.json`
- `mock-api/data/technology-tags.json`

`users` and `cvs` are generated automatically from `consultant-profiles.json` when you run `bun run mock:api:build` or start the mock server.

## Mock data profile

- Country: Norway
- Offices: Oslo and Trondheim
- Consultants: 8 total, split across Consultant and Senior Consultant
- Radar categories: 9 frontend-oriented categories with Norwegian labels
- Skill scale: integer `1-5` per category and per keyword
- Every consultant has all categories plus searchable keyword-level skills

## Flowcase-style endpoints

- `GET /api/v1/countries`
- `GET /api/v1/countries/:countryId`
- `GET /api/v1/countries/:countryId/offices`
- `GET /api/v1/countries/:countryId/offices/:officeId`
- `GET /api/v1/users`
- `GET /api/v1/users/:userId`
- `GET /api/v1/users/find?email=...`
- `GET /api/v2/users/search?office_ids[]=...&title=Senior%20Consultant&keyword=react&offset=0&limit=20`
- `GET /api/v2/compare/search?comparison=consultant&keyword=react&keyword=sanity`
- `GET /api/v2/compare/search?comparison=office&keyword=sanity`
- `GET /api/v3/cvs/:userId/:cvId`
- `GET /api/v3/cvs/:userId/:cvId/metadata`
- `GET /api/v3/cvs/:userId/:cvId/technologies`
- `GET /api/v1/masterdata/technologies/category`
- `GET /api/v1/masterdata/technologies/tags?name=wcag`

## Search filters

Supported query patterns on `/api/v2/users/search` and `/api/v2/compare/search`:

- `office_ids[]`
- `city` / `cities[]`
- `title` / `titles[]`
- `keyword` / `keywords[]`
- `category` / `categories[]`
- `min_category_score`
- `min_keyword_score`
- `name`
- `offset`
- `limit`

Keyword search matches slugs, labels, aliases, and related category slugs.

## Raw debug endpoints

The compatibility server also exposes raw collection dumps:

- `GET /_json`
- `GET /_json/users`
- `GET /_json/cvs/:id`
