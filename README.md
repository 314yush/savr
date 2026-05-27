# Savr

Goal-based USDC savings on Base with Euler Finance yield.

## Stack

- **Frontend:** Next.js App Router (mobile-first), wagmi + RainbowKit, Tailwind, Framer Motion
- **Contracts:** Foundry (`GoalVault.sol`) — ERC-4626 Euler integration, yield-only fee
- **Backend:** Hono API on Railway — Postgres, Resend email reminders, cron endpoint

## Monorepo

```
apps/web       Next.js frontend
apps/api       Railway API + reminder cron target
packages/contracts  Foundry smart contracts
```

## Getting started

```bash
pnpm install

# Local Postgres (Docker)
docker compose up -d
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local

# Contracts
cd packages/contracts && forge test

# API
cd apps/api && pnpm db:migrate && pnpm dev

# Web (separate terminal)
cd apps/web && pnpm dev
```

Or from repo root: `pnpm dev` runs API + web in parallel (after DB is up).

## Local database

Start Postgres with Docker:

```bash
docker compose up -d
```

Connection string (default):

```text
postgresql://postgres:postgres@localhost:5432/savr
```

Run migrations:

```bash
cd apps/api && pnpm db:migrate
```

Stop Postgres: `docker compose down` (data persists in volume). Wipe data: `docker compose down -v`.

## Environment

Copy `.env.example` to `.env` and configure:

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — WalletConnect Cloud project ID
- `NEXT_PUBLIC_GOAL_VAULT_ADDRESS` — deployed GoalVault address
- `NEXT_PUBLIC_USDC_ADDRESS` — USDC on Base
- `DATABASE_URL` — Railway Postgres connection string
- `RESEND_API_KEY` — for email reminders
- `CRON_SECRET` — secures `POST /internal/reminders/run`

## Railway deployment

1. Create Postgres plugin
2. Deploy `apps/api` with `DATABASE_URL`, `RESEND_*`, `CRON_SECRET`, `RPC_URL`, `GOAL_VAULT_ADDRESS`
3. Deploy `apps/web` with `NEXT_PUBLIC_*` vars
4. Schedule Railway Cron: daily `POST /internal/reminders/run` with `Authorization: Bearer $CRON_SECRET`

## Contract deploy

```bash
cd packages/contracts
export USDC_ADDRESS=0x...
export EULER_VAULT_ADDRESS=0x...
export TREASURY_ADDRESS=0x...
forge script script/DeployGoalVault.s.sol --rpc-url $RPC_URL --broadcast
```
