# Deploying FitOps to the internet

The goal is a public HTTPS URL where the UI works. Three pieces:

```
  browser
     |
     v
  Vercel project "fitops"        <- the React UI (this repo's root)
     |  /api/* is proxied onward, so the browser
     |  only ever talks to this one domain
     v
  Vercel project "fitops-api"    <- the Express API (the server/ folder)
     |
     v
  MongoDB Atlas M0               <- the database (free forever)
```

You need accounts on **Vercel** and **MongoDB Atlas**. Both are free and both
let you sign in with GitHub.

> **This file is committed to a public repository. Never put real secrets in
> it.** Every credential below is a placeholder. The real values belong in
> Vercel's environment variable settings and nowhere else — not here, not in
> the frontend, not in a commit message.
>
> Generate secrets with:
> ```bash
> openssl rand -hex 32   # JWT_SECRET
> openssl rand -base64 18 | tr -d '/+=@:'   # database password
> ```

---

## 1. Database — MongoDB Atlas

1. At <https://cloud.mongodb.com>, create a **free M0 cluster**.
2. **Database Access** -> Add New Database User. Give it a username and a long
   random password, with the **Read and write to any database** role.
3. **Network Access** -> Add IP Address -> **Allow access from anywhere**
   (`0.0.0.0/0`).

   Vercel's functions have no fixed outbound IPs on the free tier, so there is
   nothing narrower that reliably works. This makes the database user's
   password the real security boundary — make it long and random, and do not
   reuse it. Do not accept Atlas's *temporary* 6-hour entry; it would silently
   break the deployed API when it lapses.
4. **Connect** -> **Drivers** -> copy the connection string, then **add the
   database name** `fitops` before the `?`:

   ```
   mongodb+srv://USER:PASSWORD@YOUR-CLUSTER.mongodb.net/fitops?retryWrites=true&w=majority
   ```

   Without `/fitops` Mongoose connects to a database called `test` instead —
   everything appears to work, but the app reads from the wrong place.

---

## 2. API — Vercel project #1

1. Vercel -> **Add New Project** -> import this repo.
2. Name it **`fitops-api`**.
3. Set **Root Directory** to `server`. This is the important one — it makes
   Vercel treat the backend folder as the whole project, with its own
   `package.json`.
4. Add **Environment Variables**, and make sure they apply to **Production**,
   not only Preview:

   | Name | Value |
   |---|---|
   | `MONGODB_URI` | your Atlas string from step 1 |
   | `JWT_SECRET` | a random string, **at least 16 characters** |
   | `JWT_EXPIRES_IN` | `8h` |
   | `NODE_ENV` | `production` |

5. **Deploy**, and note the resulting domain.
6. Check `https://<that-domain>/api/health` — it should return
   `{"status":"ok"}`.

Environment variable changes do **not** apply to an existing deployment. After
editing them you must redeploy.

---

## 3. UI — Vercel project #2

1. **Add New Project** -> import the same repo again.
2. Name it **`fitops`**. Leave Root Directory as the repo root.
3. No environment variables needed — `vercel.json` pins `VITE_API_URL=/api` at
   build time.
4. Edit **`vercel.json`** and replace `REPLACE-WITH-API-DOMAIN.vercel.app` with
   the API domain from step 2. Commit and push; Vercel redeploys automatically.
5. **Deploy**.

That rewrite is what keeps the API private: the browser only ever requests
`https://<ui-domain>/api/...` and Vercel forwards it server-side. The backend's
domain never appears in the UI, and because it is all one origin there is no
CORS to configure.

---

## 4. Seed the demo data

The database is empty until seeded. Run this once from your own machine — it
talks to Atlas directly, so nothing needs to be deployed first. Substitute your
real values; do not paste them into a file.

```bash
cd server
MONGODB_URI="<atlas string>" \
JWT_SECRET="<your jwt secret>" \
SEED_ADMIN_PASSWORD="<choose one>" \
SEED_STAFF_PASSWORD="<choose one>" \
npm run seed
```

This creates `admin@fitops.lk` (Administrator) and `staff@fitops.lk` (Staff)
with the passwords you supply. Omitting the `SEED_*` variables falls back to
the well-known demo passwords, which are published in this repo — always set
them for anything reachable from the internet.

The seeder **wipes every collection** before inserting. Safe on a fresh
cluster; destructive once there is data you care about.

---

## Before sharing the URL

- **`src/pages/Login.tsx` prints demo credentials on the login screen.** They
  say `admin123`, which no longer works once you seed with `SEED_*` values — so
  the screen is both wrong and advertising the account emails. Worth deleting.
- **`helmet` and `express-rate-limit` are installed but not wired up** in
  `server/src/app.ts`. Nothing throttles `/api/auth/login`, so it can be
  brute-forced. Serverless makes in-memory rate limiting unreliable; this wants
  Vercel's platform-level protection or a store-backed limiter.

## If something breaks

| symptom | cause |
|---|---|
| UI loads, every request 404s | `vercel.json` still has the placeholder domain |
| `500 CONFIG_INVALID` | a missing env var — the response body names it |
| `503 DB_UNAVAILABLE` | API cannot reach Atlas; check the URI and Network Access |
| `FUNCTION_INVOCATION_FAILED` | env vars set on Preview but not Production, or no redeploy after adding them |
| Login rejects a correct password | seeder not run, or run with different `SEED_*` values |
| UI works but shows no data | connection string missing `/fitops`, so it hit the `test` database |
