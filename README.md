# CodePulse — Repo Health Intelligence

> See your codebase's vitals in real time. Index every module, surface hotspots, watch health signals pulse with every commit.

CodePulse is a full-stack hackathon project that indexes a GitHub repository with tree-sitter, derives structural health signals from the resulting graph, and surfaces the files most likely to break production. Built on top of an earlier PR-review platform ("LGTM"), trimmed down to a focused repo-health experience with a cyberpunk-meets-Greptile visual identity.

---

## Features

- **GitHub App + OAuth** sign-in flow.
- **Connect any GitHub repo** the installation can see. Indexed asynchronously via a BullMQ worker.
- **Tree-sitter indexing** across 12+ languages — extracts files, definitions, and import edges into MongoDB.
- **Repo Health dashboard** with:
  - Composite health score (gauge) updated on every push
  - Coupling (Gini of PageRank), churn risk, debt, and confidence signals
  - 90-day trend chart
  - Hotspot file list (high centrality × high churn)
  - Commit timeline with score-delta deep links
- **Commit Diff** viewer with side-by-side file tree + unified diff and a per-commit Score Δ banner.
- **Complexity Analysis** dashboard (mock data) with:
  - Overall score · complex file count · avg complexity · highest-risk module
  - Complexity-over-commits line chart
  - Top-10 most complex files bar chart
  - File-risk heatmap (compound risk score per tile)
  - Risk distribution donut
  - Sortable / searchable risky-files table
  - Per-file inspection modal with weighted risk breakdown + contextual explanations
- **Settings** page for the signed-in identity.

---

## Tech stack

**Client** — Vite · React 19 · TypeScript · React Router · Tailwind 4 · Recharts · Socket.IO client · `react-force-graph-2d` (legacy, no longer wired)

**Server** — Node + Express · TypeScript (`ts-node-dev`) · MongoDB (Mongoose) · Redis + BullMQ · Socket.IO · `@octokit/rest` · `tree-sitter` (multi-language parsers) · Sentry

**Design system** — custom CSS tokens (cream + dark navy palette), Space Grotesk + JetBrains Mono, hexagonal CTA buttons, lub-dub heartbeat animations on the landing hero.

---

## Quickstart

```bash
# 1. Clone
git clone https://github.com/ashutoshsharma1309/decode2deploy.git
cd decode2deploy

# 2. Install
(cd server && npm install)
(cd client && npm install)

# 3. Configure env (see "Environment variables" below)
cp server/.env.example server/.env
cp client/.env.example client/.env
# fill in MONGODB_URI, JWT_*, GITHUB_*, REDIS_URL, CLIENT_URL, API_URL

# 4. Run
(cd server && npm run dev)   # http://localhost:3000
(cd client && npm run dev)   # http://localhost:5173
```

Open <http://localhost:5173>, click **Sign up**, complete the GitHub OAuth handshake, and connect a repo from the modal.

---

## Environment variables

### Server (`server/.env`)

| Variable                  | Purpose                                                              |
| ------------------------- | -------------------------------------------------------------------- |
| `PORT`                    | API port (default `3000`).                                           |
| `MONGODB_URI`             | Mongo Atlas connection string.                                       |
| `JWT_SECRET`              | Random 48-byte secret for access tokens.                             |
| `JWT_REFRESH_SECRET`      | Random 48-byte secret for refresh tokens.                            |
| `GITHUB_APP_ID`           | GitHub App ID.                                                       |
| `GITHUB_APP_PRIVATE_KEY`  | PEM contents (newlines escaped as `\n`).                             |
| `GITHUB_CLIENT_ID`        | OAuth client ID.                                                     |
| `GITHUB_CLIENT_SECRET`    | OAuth client secret.                                                 |
| `GITHUB_WEBHOOK_SECRET`   | HMAC secret for `/webhooks/github`.                                  |
| `GITHUB_APP_SLUG`         | App slug used in install URLs.                                       |
| `REDIS_URL`               | Redis connection for BullMQ.                                         |
| `CLIENT_URL`              | Deployed frontend origin (used for CORS + post-OAuth redirect).      |
| `API_URL`                 | Deployed API origin (used to build the GitHub OAuth `redirect_uri`). |
| `WEBHOOK_BASE_URL`        | Public URL GitHub posts webhooks to.                                 |
| `SENTRY_DSN` *(optional)* | Server-side error reporting.                                         |

### Client (`client/.env`)

| Variable          | Purpose                                            |
| ----------------- | -------------------------------------------------- |
| `VITE_API_URL`    | Where the client calls the API (build-time inlined). |
| `VITE_SOCKET_URL` | Socket.IO origin.                                  |
| `VITE_SENTRY_DSN` *(optional)* | Client-side error reporting.          |

`VITE_*` values are baked into the JS bundle at `vite build`. If you change them after deploy, you must rebuild and redeploy the client.

`.env` files are gitignored at every level (root, `server/`, `client/`). Only `.env.example` files are tracked.

---

## Project structure

```
.
├── client/                       # Vite + React + Tailwind 4
│   ├── public/
│   ├── src/
│   │   ├── api/                  # axios instance with refresh-token interceptor
│   │   ├── components/
│   │   │   ├── complexity/       # Complexity Analysis sub-components
│   │   │   ├── health/           # ScoreGauge, SignalCard, charts, hotspots
│   │   │   └── ui/               # DashboardLayout, ProtectedRoute, etc.
│   │   ├── context/              # AuthContext
│   │   ├── hooks/                # useSocket
│   │   ├── lib/                  # complexity.ts (types + risk utils + mock data)
│   │   ├── pages/                # Landing, Login, Repos, RepoHealth, CommitDiff,
│   │   │                         #   Complexity, Settings, OAuthCallback
│   │   ├── App.tsx               # React Router config
│   │   ├── index.css             # Design tokens, hex buttons, animations
│   │   └── main.tsx
│   └── package.json
└── server/                       # Express + MongoDB + BullMQ
    ├── src/
    │   ├── agents/context/       # Tree-sitter indexer, pattern/history extractors
    │   ├── config/               # db, redis, socket
    │   ├── controllers/          # auth, repo, webhook, health
    │   ├── jobs/                 # BullMQ queue + context worker
    │   ├── lib/                  # llm-pool
    │   ├── middlewares/          # auth (JWT)
    │   ├── models/               # User, Repo, RepoContext, FilePushHistory,
    │   │                         #   RepoHealthSnapshot
    │   ├── routes/               # auth, repo, webhook, health
    │   ├── services/             # healthScore, ai
    │   ├── utils/                # github, encryption
    │   ├── app.ts                # Express app wiring
    │   └── index.ts              # Boot: DB → workers → http listen
    └── package.json
```

---

## How indexing works

1. User connects a repo via the dashboard. The server records it in MongoDB.
2. The user (or a push webhook) triggers `POST /repos/:id/index`. The server enqueues a `context-index` BullMQ job.
3. The context worker fetches the repo tree from GitHub, runs tree-sitter parsers over each supported file, extracts definitions and import edges, and computes per-file PageRank.
4. Results land in the `RepoContext` document and snapshots flow to `RepoHealthSnapshot` on each push.
5. The dashboard fetches `/health/:repoId/latest` and `/history` to render the score, signal cards, and charts.

The Complexity Analysis dashboard currently runs on a 30-file mock dataset in `client/src/lib/complexity.ts`. Wiring it to a real backend is a one-line swap of `fetchRepoComplexity()`.

---

## Design notes

- **Landing** uses a cream surface with a dotted-grid background; the hero contains a halftone heart graphic that pulses on a 60-bpm lub-dub rhythm with a continuously sweeping EKG trace.
- **Dashboard** shares the same cream/ink palette as the landing, with `card-light` panels, eyebrow labels in JetBrains Mono, and hexagonal CTAs.
- **Commit diff** uses the dark "how it works" surface from the landing for contrast.
- Risk colors are consistent across the app: green for healthy, amber for moderate, red for risky.

---

## Scripts

| Location | Command           | What it does                                            |
| -------- | ----------------- | ------------------------------------------------------- |
| `server` | `npm run dev`     | `ts-node-dev` with respawn — runs API + context worker. |
| `server` | `npm run build`   | Compile TS + copy tree-sitter `.scm` queries.           |
| `server` | `npm start`       | Run the compiled `dist/index.js`.                       |
| `server` | `npm test`        | `vitest run`.                                           |
| `client` | `npm run dev`     | Vite dev server on `:5173`.                             |
| `client` | `npm run build`   | Production build.                                       |
| `client` | `npm run preview` | Serve the production build.                             |

---

## Deployment

Both `render.yaml` and `vercel.json` are kept in the repo. The intended split is:

- **Client** → Vercel (or any static host) — make sure `VITE_API_URL` is set to the deployed server URL *before* the build runs.
- **Server** → Render (or Fly.io / Railway) — set every variable from the table above. The GitHub OAuth App's "Authorization callback URL" must include `<API_URL>/auth/github/callback`.

If the deployed login flow ever sends you back to `localhost`, one of `VITE_API_URL`, `API_URL`, or `CLIENT_URL` is missing or stale.

---

## License

MIT.
