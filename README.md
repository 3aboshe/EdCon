# EdCon Backend API (Prisma + PostgreSQL)

Express + Prisma service that powers the multi‑school EdCon experience. The backend now targets PostgreSQL (Railway in production) and enforces access code + OTP onboarding flows.

## Prerequisites

- Node.js 18+
- PostgreSQL 15+ (local or hosted)
- npm 8+

## Local Setup

1. **Install dependencies**

	```bash
	cd server
	npm install
	```

2. **Configure environment** – create `server/.env`:

	```env
	PORT=5005
	JWT_SECRET=change-me
	DATABASE_URL="postgresql://postgres:postgres@localhost:5432/edcon?schema=public"
	DATABASE_PUBLIC_URL="postgresql://postgres:postgres@localhost:5432/edcon"
	SUPER_ADMIN_EMAIL=super@edcon.app
	SUPER_ADMIN_PASSWORD=SuperAdmin#2025
	```

3. **Apply migrations + generate Prisma client**

	```bash
	npx prisma migrate deploy
	npm run build
	```

4. **Seed demo data (creates super admin, school admin, teacher, parent, student)**

	```bash
	npm run seed
	```

5. **Run the API**

	```bash
	npm run dev   # or npm start for production profile
	```

Health check: `http://localhost:5005/api/health`

## Railway Deployment Checklist

1. **Environment variables (Railway dashboard → Variables)**
	- `DATABASE_URL` – use the *public* proxy string Railway provides (e.g. `postgresql://postgres:<password>@turntable.proxy.rlwy.net:32570/railway`). The internal host `postgres.railway.internal` is not reachable from this service plan.
	- `DATABASE_PUBLIC_URL` – same as above (optional, used by Prisma tooling).
	- `JWT_SECRET`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `PORT=8080` (or leave default if Railway injects it).

2. **Migrations + seed against Railway** (run locally once whenever schema changes):

	```bash
	cd server
	DATABASE_URL="postgresql://postgres:<password>@turntable.proxy.rlwy.net:32570/railway" \
	npx prisma migrate deploy

	DATABASE_URL="postgresql://postgres:<password>@turntable.proxy.rlwy.net:32570/railway" \
	npm run seed
	```

	> ⚠️ `npm run seed` is destructive—run it only on fresh environments.

3. **Deploy pipeline**
	- Railway install runs `npm install` and `npm run build` (already generates Prisma client).
	- Server start simply executes `npm start` → `node server.js`. Automatic `prisma db push` was removed; schema is expected to be up to date before deploy.

4. **Redeploy**
	- Commit your changes: `git commit -am "message" && git push origin main`.
	- Railway rebuilds automatically; watch the “Deploy Logs” for `✅ PostgreSQL connected successfully`.

5. **Verify**
	- `curl https://<railway-domain>/api/health`
	- Confirm login using the seeded credentials (access code + OTP workflow).

## Useful npm scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start Express server with nodemon |
| `npm start` | Start Express server (production) |
| `npm run build` | Generate Prisma client |
| `npm run seed` | Seed demo data (super admin, school admin, teacher, parent, student) |

## Notes

- Never run `prisma db push` in production; use `prisma migrate deploy` to preserve history.
- OTP credentials are printed to the console during `npm run seed`—store them securely.
- The frontend expects the API base URL via `VITE_API_URL`; update once Railway is live. 