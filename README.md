# ToolHub

A QR code utility and multi-purpose file tools platform: a web app (PWA) with companion mobile apps that brings everyday utilities into one place, including link shortening, QR code generation, QR/barcode scanning, document scanning, image compression, PDF compression, and extended file tools.

> Status: project scaffold only, no features implemented yet.

## Tech Stack and Libraries

| Component | Technology | Version |
| --- | --- | --- |
| Runtime | Node.js, npm | Node 22 LTS, npm 10 |
| Frontend | Next.js (App Router), React | 16.4.3, 19.3.0 |
| | TypeScript | 5.x |
| | Tailwind CSS | 4.x (via `@tailwindcss/turbopack`) |
| | ESLint, `eslint-config-next` | 9.x, 16.4.3 |
| Backend | NestJS (`@nestjs/common`, `core`, `platform-express`) | 11.x |
| | `@nestjs/config` | 4.x |
| | TypeScript | 5.7+ |
| | Jest, `ts-jest`, Supertest | 30.x, 29.x, 7.x |
| | ESLint (`typescript-eslint`), Prettier | 9.x, 3.x |

Note: `@nestjs/config` is pinned to 4.x because the latest release (12.x) is ESM-only and cannot be used with the CommonJS backend.

## Project Structure

```
ekila-toolhub/
├── frontend/                  Next.js app
│   ├── src/
│   │   └── app/               App Router: layout.tsx, page.tsx, globals.css
│   ├── public/                Static assets
│   ├── next.config.ts
│   ├── eslint.config.mjs
│   ├── tsconfig.json          Import alias: @/* -> src/*
│   ├── .env.example
│   └── package.json
├── backend/                   NestJS API
│   ├── src/
│   │   ├── main.ts            Entry point: global prefix, CORS, port
│   │   └── app.module.ts      Root module (global ConfigModule)
│   ├── test/                  e2e config (jest-e2e.json)
│   ├── nest-cli.json
│   ├── eslint.config.mjs
│   ├── .prettierrc
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   ├── .env.example
│   └── package.json
├── package.json               Convenience scripts from the repository root
├── .nvmrc                     Node version
├── .editorconfig
└── .gitignore
```

The frontend and backend are two independent packages, each with its own `node_modules` and `package-lock.json`. The repository root does not use workspaces.

## Project Configuration

### Backend

- Global prefix: `api/v1`, so every route lives under `/api/v1`.
- CORS: only the origin in `FRONTEND_URL` is allowed, with `credentials` enabled.
- Default port: `4000`.
- Environment variables are loaded with `ConfigModule.forRoot({ isGlobal: true })` from the `.env` file in `backend/`.
- Prettier: `singleQuote`, `trailingComma: all`.

### Frontend

- App Router with a `src/` directory; the `@/*` alias maps to `src/*`.
- `next.config.ts` enables `cacheComponents` and `partialPrefetching`.
- Tailwind CSS 4 is configured in `src/app/globals.css`.
- Geist and Geist Mono fonts via `next/font`; the default page language is `vi`.
- Environment variables go in `frontend/.env.local`; variables needed in the browser must be prefixed with `NEXT_PUBLIC_`.

### Environment Variables

| Variable | Used by | Default | Description |
| --- | --- | --- | --- |
| `PORT` | backend | `4000` | API port |
| `FRONTEND_URL` | backend | `http://localhost:3000` | Origin allowed to call the API (CORS) |
| `NEXT_PUBLIC_API_URL` | frontend | `http://localhost:4000/api/v1` | Base URL of the API |

`.env` and `.env.local` are ignored by git; only `.env.example` is committed.

## Running Locally

### Requirements

- Node.js 22 LTS or later (`nvm use` picks up the version from `.nvmrc`)
- npm 10 or later

### Steps

```bash
nvm use
npm run install:all

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Open two terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

| Service | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend | http://localhost:4000 (API at `/api/v1`) |

The backend has no routes yet, so requests currently return 404.

## Scripts

### From the repository root

| Command | Description |
| --- | --- |
| `npm run install:all` | Install dependencies for frontend and backend |
| `npm run dev:frontend` | Run the frontend in dev mode |
| `npm run dev:backend` | Run the backend in watch mode |
| `npm run build` | Build the backend, then the frontend |
| `npm run build:frontend` / `build:backend` | Build each part separately |
| `npm run lint` | Lint backend and frontend |
| `npm run lint:frontend` / `lint:backend` | Lint each part separately |
| `npm run test:backend` | Run backend unit tests |

### Inside `frontend/`

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the built app |
| `npm run lint` | Lint |

### Inside `backend/`

| Command | Description |
| --- | --- |
| `npm run start:dev` | Run in watch mode |
| `npm run start:debug` | Run in debug and watch mode |
| `npm run build` | Build to `dist/` |
| `npm run start:prod` | Run `dist/main` |
| `npm run lint` | Lint with auto-fix |
| `npm run format` | Format with Prettier |
| `npm run test` | Unit tests |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:cov` | Unit tests with coverage |
| `npm run test:e2e` | e2e tests |

## Working Conventions

- No comments in source code.
- Run `npm run lint` before opening a PR.
- No database, Docker, or CI/CD configured yet; add them once the design is finalized.
