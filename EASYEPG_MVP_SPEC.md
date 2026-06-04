# EasyEPG — 8‑Week MVP Specification

> **Target users:** Non‑technical personal IPTV users (no server knowledge required).  
> **Constraint:** White background, oversized buttons, zero‑friction UX.  
> **Platform mantra:** Automate everything the user would otherwise paste, configure, or debug.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Sprint Roadmap (4 × 2‑week sprints)](#2-sprint-roadmap-4--2-week-sprints)
3. [Prioritised Feature List](#3-prioritised-feature-list)
4. [Data Model](#4-data-model)
5. [API Endpoints](#5-api-endpoints)
6. [Security & Privacy](#6-security--privacy)
7. [Operations & Automation](#7-operations--automation)
8. [5 KPIs](#8-5-kpis)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (User)                        │
│    White‑background SPA — oversized tap targets          │
└──────────────┬──────────────────────────┬────────────────┘
               │  HTTPS                   │  HTTPS
               ▼                          ▼
┌─────────────────────────┐   ┌──────────────────────────────┐
│   Cloudflare Workers    │   │   Next.js App (Vercel/CF)    │
│   ─────────────────     │   │   ────────────────────       │
│   • Playlist router     │   │   • Auth (magic‑link)        │
│   • Logo CDN proxy      │   │   • Playlist manager         │
│   • CNAME verifier      │   │   • AI enrichment queue      │
│   • Rate limiter        │   │   • Admin dashboard          │
└──────────┬──────────────┘   └──────────┬───────────────────┘
           │                              │
           │          ┌───────────────────┤
           │          │                   │
           ▼          ▼                   ▼
┌──────────────────────────────────────────────────────────┐
│                    Data Layer                             │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │  SQLite   │  │   R2     │  │   AI Workers (Queues) │  │
│  │ (per‑user)│  │ (logos,  │  │   • Logo auto‑match   │  │
│  │           │  │  assets) │  │   • EPG merge/clean   │  │
│  │           │  │          │  │   • Confidence scoring │  │
│  └───────────┘  └──────────┘  └──────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 1.1 Cloudflare Integration Points

| Service | Role | Detail |
|---------|------|--------|
| **Workers** | Playlist serving | `https://{user}.easyepg.tv/playlist.m3u` — reads user's playlist from D1/R2, returns plain M3U |
| **Workers** | Logo proxy | `https://cdn.easyepg.tv/logos/{channel_id}.png` — serves from R2, caches at edge |
| **Workers** | CNAME verifier | Called by control‑plane to check `_easyepg-verify.{domain}` TXT record |
| **D1** | Per‑user SQLite | User prefs, playlist metadata, EPG data, domain mapping |
| **R2** | Blob store | Uploaded logos, EPG XML sources, user assets |
| **Queues** | AI job queue | Async logo matching, EPG merge, confidence scoring |
| **DNS** | Custom domains | Auto‑SSL for `*.easyepg.tv` subdomains; user must CNAME their own domain |

### 1.2 URL Scheme

| Pattern | Served by |
|---------|-----------|
| `https://easyepg.tv/*` | Next.js app (Vercel / CF Pages) |
| `https://{user}.easyepg.tv/playlist.m3u` | Worker — user's personal playlist endpoint |
| `https://{user}.easyepg.tv/epg.xml` | Worker — user's personal EPG XML |
| `https://cdn.easyepg.tv/logos/{id}.png` | Worker → R2 — logo CDN |
| `https://{user}.easyepg.tv/*` | Worker — future: catch‑all for user routes |

---

## 2. Sprint Roadmap (4 × 2‑week sprints)

### Sprint 1 — Foundation & Auth (Weeks 1–2)

**Goal:** User can sign up with magic link, land on a white‑background dashboard with oversized buttons, and see their region/timezone auto‑detected.

#### Deliverables

| Item | Type | Notes |
|------|------|-------|
| Magic‑link auth (Resend / Courier) | Feature | No password, no social login — email only |
| Onboarding: language + region picker | Feature | Exactly 2 questions. Auto‑detect via `Accept-Language` & IP geo |
| Timezone auto‑detect | Feature | From `Intl.DateTimeFormat` on client; stored in user profile |
| White‑background layout + oversized buttons | UI | CSS reset, large tap targets (min 56 px), high contrast |
| User profile table | Data | `user_id`, `email`, `lang`, `region`, `tz`, `created_at` |
| Master Playlist table | Data | Shared read‑only list maintained by platform |
| Session / token management | Security | JWTs with refresh rotation |

#### Acceptance Criteria

- [ ] User enters email → receives magic link in < 5 s → clicks → logged in
- [ ] New user sees exactly 2 onboarding screens: language + region
- [ ] Timezone appears pre‑selected correctly (verified via VPN test in 3 timezones)
- [ ] Dashboard loads with white background, every button ≥ 56 × 56 px
- [ ] User can view the Master Playlist (read‑only)
- [ ] Session persists across browser close for 30 days

---

### Sprint 2 — Playlists & EPG Merge (Weeks 3–4)

**Goal:** User can create a personal playlist from the Master with one click. EPG data is merged automatically. AI pre‑processing runs in the background.

#### Deliverables

| Item | Type | Notes |
|------|------|-------|
| "Create My Playlist" button | Feature | One tap — copies Master Playlist, applies user's region filter, creates `playlist.m3u` |
| Smart defaults per region | Feature | Region‑specific channel mapping, language filtering, order |
| Playlist editor (basic) | Feature | Toggle channels on/off, reorder (drag handle) |
| EPG source ingestion | Feature | Platform ingests XMLTV, stores in D1 per‑user after merge |
| EPG auto‑merge | Feature | System overlays user's channel list with EPG data automatically |
| AI enrichment queue | Background | Async job: logo matching, EPG gap fill, conflict resolution |
| Confidence‑threshold auto‑apply | Background | Default 0.85 — AI edits applied without user review; below‑threshold queued for manual review |
| Playlist served via Worker | Infra | `https://{user}.easyepg.tv/playlist.m3u` returns live M3U |

#### Acceptance Criteria

- [ ] User clicks "Create My Playlist" → playlist appears in < 3 s → serves at the Worker URL
- [ ] Region filter is applied automatically (Indian user sees Indian channels first)
- [ ] Toggling a channel off updates the served playlist within 30 s
- [ ] EPG data appears next to channels in the UI (program name, time)
- [ ] AI enrichment runs silently — user sees no prompts for ≥ 0.85 confidence
- [ ] Below‑threshold items appear in a "Suggestions" panel with Accept/Dismiss
- [ ] Worker returns valid M3U with `EXTINF` tags including EPG metadata

---

### Sprint 3 — Logos, CDN & Custom Domains (Weeks 5–6)

**Goal:** User uploads logos, AI auto‑matches them, logos are hosted on CF CDN. Custom domain support with CNAME instruction and automatic verification.

#### Deliverables

| Item | Type | Notes |
|------|------|-------|
| Logo upload | Feature | Drag‑and‑drop or file picker; oversized upload button |
| AI auto‑match logos | AI | Uploaded image → CLIP/embedding → match to known channel → store in R2 |
| Logo CDN via Worker | Infra | `https://cdn.easyepg.tv/logos/{channel_id}.png` |
| Custom domain request UI | Feature | User types domain → system shows exact CNAME line |
| Cloudflare DNS verification | Automation | Worker polls `_easyepg-verify.{domain}` TXT record every 60 s |
| Auto‑SSL (CF managed) | Infra | Workers automatically provision SSL for `*.easyepg.tv` subdomains |
| Custom domain listing | Feature | User sees their domains with status: Pending / Verified / Active |

#### Acceptance Criteria

- [ ] User uploads a PNG logo → AI suggests channel match within 10 s
- [ ] Accepted match → logo is accessible at CDN URL within 30 s globally
- [ ] User clicks "Add Custom Domain" → sees: `CNAME yourdomain.com → custom.easyepg.tv.`
- [ ] System auto‑detects when DNS propagates (verified via Worker) → marks domain Active
- [ ] Custom domain serves playlist at `https://{domain}/playlist.m3u` with auto‑SSL
- [ ] Logo appears in playlist `tvg-logo` attribute in served M3U

---

### Sprint 4 — Automation, CI/CD & Polish (Weeks 7–8)

**Goal:** Full automation loop — platform commits playlist/EPG changes to Git, CI deploys, AI queue runs confidently. Owner never touches a terminal.

#### Deliverables

| Item | Type | Notes |
|------|------|-------|
| Automated Git commits | Automation | Platform pushes playlist/asset changes to a `deploy` branch |
| CI pipeline (GitHub Actions) | Infra | On push to `deploy` → build → deploy Workers + static assets |
| Zero‑downtime Worker deploys | Infra | Staged rollouts via `wrangler deploy --keep-vars` |
| AI queue with threshold config | Feature | Admin can adjust confidence threshold (default 0.85) |
| User‑facing status page | UI | "System health" — shows playlist status, CDN status, last EPG update |
| Rate limiter per user | Security | Worker enforces per‑user rate limits stored in D1 |
| Email notifications | Feature | Brief plain‑text email when playlist is ready, domain verified, or AI suggestions waiting |
| Final UX polish | UI | All buttons oversized, consistent white background, loading skeletons, error recovery |

#### Acceptance Criteria

- [ ] Any platform change (playlist edit, logo upload, EPG update) triggers an automated Git commit within 60 s
- [ ] CI pipeline completes in < 3 min → Workers are updated
- [ ] User receives email: "Your playlist is ready" with one link
- [ ] Custom domain verification email sent on success
- [ ] Rate limiter blocks > 100 requests/min per user with clear 429 response
- [ ] Status page shows green checkmarks for all services
- [ ] Admin dashboard shows queue depth, confidence distribution, auto‑apply rate

---

## 3. Prioritised Feature List

| Priority | Feature | Sprint | Dependencies |
|----------|---------|--------|--------------|
| P0 | Magic‑link auth | S1 | — |
| P0 | Onboarding (language + region) | S1 | Auth |
| P0 | One‑tap "Create My Playlist" | S2 | Master Playlist, region filter |
| P0 | Playlist served at Worker URL | S2 | D1, Worker |
| P0 | EPG auto‑merge | S2 | EPG ingestion |
| P0 | Logo upload & CDN | S3 | R2 bucket |
| P1 | AI auto‑match logos | S3 | Logo upload, vector embeddings |
| P1 | Custom domain (CNAME + verify) | S3 | Worker, CF DNS API |
| P1 | Auto‑SSL for custom domains | S3 | CF managed |
| P1 | AI enrichment confidence queue | S2 | AI worker |
| P2 | Automated Git commits + CI | S4 | GitHub integration |
| P2 | Rate limiting | S4 | Worker |
| P2 | Email notifications | S4 | Resend / Courier |
| P2 | Status page | S4 | Health checks |
| P2 | Admin threshold config | S4 | Admin panel |

---

## 4. Data Model

### 4.1 `users`

```sql
CREATE TABLE users (
    id            TEXT PRIMARY KEY,            -- ulid
    email         TEXT NOT NULL UNIQUE,
    language      TEXT NOT NULL DEFAULT 'en',  -- ISO 639-1
    region        TEXT,                        -- ISO 3166-1 alpha-2
    timezone      TEXT NOT NULL DEFAULT 'UTC',
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 4.2 `sessions`

```sql
CREATE TABLE sessions (
    id            TEXT PRIMARY KEY,            -- ulid
    user_id       TEXT NOT NULL REFERENCES users(id),
    token_hash    TEXT NOT NULL UNIQUE,        -- sha256 of JWT
    expires_at    TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 4.3 `master_playlists`

```sql
CREATE TABLE master_playlists (
    id            TEXT PRIMARY KEY,            -- ulid
    name          TEXT NOT NULL,
    description   TEXT,
    version       INTEGER NOT NULL DEFAULT 1,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 4.4 `master_channels`

```sql
CREATE TABLE master_channels (
    id              TEXT PRIMARY KEY,          -- ulid
    playlist_id     TEXT NOT NULL REFERENCES master_playlists(id),
    channel_number  INTEGER,
    name            TEXT NOT NULL,
    tvg_id          TEXT,                      -- EPG identifier
    tvg_name        TEXT,
    tvg_logo        TEXT,                      -- URL (may be CDN)
    stream_url      TEXT NOT NULL,
    group_title     TEXT,
    region          TEXT,                      -- ISO 3166-1 alpha-2
    language        TEXT,                      -- ISO 639-1
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 4.5 `user_playlists`

```sql
CREATE TABLE user_playlists (
    id                TEXT PRIMARY KEY,        -- ulid
    user_id           TEXT NOT NULL REFERENCES users(id),
    name              TEXT NOT NULL DEFAULT 'My Playlist',
    slug              TEXT NOT NULL UNIQUE,    -- used in subdomain
    is_active         INTEGER NOT NULL DEFAULT 1,
    custom_domain     TEXT,                    -- verified custom domain
    domain_verified   INTEGER NOT NULL DEFAULT 0,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 4.6 `playlist_channels`

```sql
CREATE TABLE playlist_channels (
    id                TEXT PRIMARY KEY,        -- ulid
    playlist_id       TEXT NOT NULL REFERENCES user_playlists(id),
    master_channel_id TEXT NOT NULL REFERENCES master_channels(id),
    channel_number    INTEGER,
    enabled           INTEGER NOT NULL DEFAULT 1,
    custom_logo_key   TEXT,                    -- R2 object key if user uploaded custom
    created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 4.7 `epg_data`

```sql
CREATE TABLE epg_data (
    id              TEXT PRIMARY KEY,          -- ulid
    channel_id      TEXT NOT NULL,             -- references tvg_id from channels
    start_time      TEXT NOT NULL,             -- ISO 8601
    stop_time       TEXT NOT NULL,             -- ISO 8601
    title           TEXT NOT NULL,
    subtitle        TEXT,
    description     TEXT,
    category        TEXT,
    icon            TEXT,
    source          TEXT NOT NULL DEFAULT 'xmltv',
    ai_confidence   REAL,                      -- 0.0 - 1.0, null if ingested from source
    ai_auto_applied INTEGER NOT NULL DEFAULT 1, -- 1 = applied silently, 0 = queued for review
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_epg_channel_time ON epg_data(channel_id, start_time);
```

### 4.8 `logo_assets`

```sql
CREATE TABLE logo_assets (
    id              TEXT PRIMARY KEY,          -- ulid
    user_id         TEXT NOT NULL REFERENCES users(id),
    channel_id      TEXT NOT NULL,             -- matched channel id
    original_name   TEXT NOT NULL,
    r2_key          TEXT NOT NULL,             -- R2 object key
    content_type    TEXT NOT NULL DEFAULT 'image/png',
    width           INTEGER,
    height          INTEGER,
    ai_match_score  REAL,                      -- 0.0 - 1.0
    ai_auto_applied INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 4.9 `ai_jobs`

```sql
CREATE TABLE ai_jobs (
    id              TEXT PRIMARY KEY,          -- ulid
    job_type        TEXT NOT NULL,             -- 'logo_match' | 'epg_merge' | 'epg_gap_fill'
    payload         TEXT NOT NULL,             -- JSON
    confidence      REAL,                      -- output: 0.0 - 1.0
    status          TEXT NOT NULL DEFAULT 'queued',  -- queued | processing | done | failed
    auto_applied    INTEGER,                   -- 1 if applied automatically
    error           TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at    TEXT
);
```

### 4.10 `custom_domains`

```sql
CREATE TABLE custom_domains (
    id              TEXT PRIMARY KEY,          -- ulid
    user_id         TEXT NOT NULL REFERENCES users(id),
    domain          TEXT NOT NULL UNIQUE,
    verification_token TEXT NOT NULL,          -- stored in TXT record
    verified_at     TEXT,                      -- null until verified
    cname_record    TEXT NOT NULL,             -- what we told user to create
    ssl_status      TEXT NOT NULL DEFAULT 'pending',  -- pending | active | failed
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 4.11 `rate_limits` (used by Worker for per‑user enforcement)

```sql
CREATE TABLE rate_limits (
    user_id         TEXT NOT NULL,
    window_start    TEXT NOT NULL,             -- ISO 8601, truncated to minute
    request_count   INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, window_start)
);
```

---

## 5. API Endpoints

All endpoints prefixed with `/api/v1` unless noted. Authenticated via Bearer JWT (magic‑link session).

### 5.1 Auth

| Method | Path | Request | Response | Notes |
|--------|------|---------|----------|-------|
| `POST` | `/auth/send-magic-link` | `{ "email": "..." }` | `{ "ok": true }` | Sends email with one‑time code |
| `POST` | `/auth/verify-magic-link` | `{ "email": "...", "code": "..." }` | `{ "token": "...", "user": {...} }` | Returns JWT + user profile |
| `GET` | `/auth/me` | — | `{ "user": {...} }` | Current user info |

### 5.2 Onboarding

| Method | Path | Request | Response | Notes |
|--------|------|---------|----------|-------|
| `PUT` | `/onboarding/preferences` | `{ "language": "en", "region": "US" }` | `{ "ok": true }` | Sets user prefs |
| `GET` | `/onboarding/auto-detect` | — | `{ "language": "en", "region": "US", "timezone": "..." }` | Based on request headers + IP |

### 5.3 Playlists

| Method | Path | Request | Response | Notes |
|--------|------|---------|----------|-------|
| `GET` | `/playlists/master` | — | `{ "channels": [...] }` | Master Playlist (read‑only) |
| `POST` | `/playlists/create-from-master` | `{ "name": "My Playlist" }` | `{ "playlist": {...} }` | Copies Master, applies region filter |
| `GET` | `/playlists/mine` | — | `{ "playlists": [...] }` | User's playlists |
| `GET` | `/playlists/{id}` | — | `{ "playlist": {...}, "channels": [...] }` | Full playlist with channels |
| `PATCH` | `/playlists/{id}/channels/{channelId}` | `{ "enabled": false }` | `{ "ok": true }` | Toggle channel on/off |
| `PUT` | `/playlists/{id}/channels/reorder` | `{ "order": ["id1","id2",...] }` | `{ "ok": true }` | Reorder channels |

### 5.4 EPG

| Method | Path | Request | Response | Notes |
|--------|------|---------|----------|-------|
| `GET` | `/playlists/{id}/epg` | `?date=2026-06-04` | `{ "epg": [...] }` | EPG for user's playlist |
| `GET` | `/epg/suggestions` | — | `{ "suggestions": [...] }` | AI items below confidence threshold |

### 5.5 Logos

| Method | Path | Request | Response | Notes |
|--------|------|---------|----------|-------|
| `POST` | `/logos/upload` | `multipart: file + channel_id` | `{ "logo": {...}, "ai_suggestion": {...} }` | Upload + AI auto‑match |
| `GET` | `/logos/suggestions` | — | `{ "suggestions": [...] }` | AI matches below threshold |
| `POST` | `/logos/accept/{id}` | — | `{ "ok": true }` | Accept AI suggestion |

### 5.6 Custom Domains

| Method | Path | Request | Response | Notes |
|--------|------|---------|----------|-------|
| `POST` | `/domains/request` | `{ "domain": "..." }` | `{ "domain": {...}, "cname_instruction": "CNAME yourdomain.com → custom.easyepg.tv.", "verification_token": "..." }` | Returns exact CNAME line |
| `GET` | `/domains` | — | `{ "domains": [...] }` | User's domains with status |
| `POST` | `/domains/{id}/verify` | — | `{ "status": "verified" | "pending" }` | Triggers re‑check |

### 5.7 Admin

| Method | Path | Request | Response | Notes |
|--------|------|---------|----------|-------|
| `GET` | `/admin/queue` | — | `{ "jobs": [...], "depth": 42 }` | AI queue depth + items |
| `PUT` | `/admin/settings` | `{ "ai_confidence_threshold": 0.85 }` | `{ "ok": true }` | Update threshold |
| `GET` | `/admin/stats` | — | `{ "users": 123, "playlists": 456, "domains": 7, ... }` | Dashboard stats |

### 5.8 Worker Routes (no auth — public M3U/XML endpoints)

| Method | Path | Served by | Notes |
|--------|------|-----------|-------|
| `GET` | `/playlist.m3u` | Worker `playlist-router` | Reads user by subdomain, returns M3U |
| `GET` | `/epg.xml` | Worker `playlist-router` | Returns XMLTV for user's playlist |
| `GET` | `/logos/{channel_id}.png` | Worker `logo-cdn` | Serves from R2, caches at edge |
| `GET` | `/_verify` | Worker `cname-verifier` | Internal — called by control plane to check TXT record |

---

## 6. Security & Privacy

### 6.1 Per‑User Isolation

- **Database:** Each user's playlist, EPG, and logo data is scoped by `user_id` in D1. All queries include `WHERE user_id = ?`.
- **Playlist URL:** `https://{user}.easyepg.tv/playlist.m3u` uses a slug (not user ID) but the slug is a random 8‑character string — no sequential IDs or email hashes.
- **Worker auth:** The playlist‑serving Worker verifies the subdomain slug matches an active playlist. No JWT required for M3U access (it's a playlist, not a secret), but slug is unguessable.

### 6.2 Rate Limiting

| Scope | Limit | Enforced by |
|-------|-------|-------------|
| Per‑user (API) | 100 requests/min | Worker (D1 rate_limits table) |
| Per‑IP (auth) | 5 magic‑link requests/min | Worker (KV or in‑memory with region) |
| Per‑user (Worker playlist) | 1000 requests/min | Worker — burst protection |
| Global (logo upload) | 10 MB / upload, 50 MB / day | API middleware |

### 6.3 SSL & Encryption

- **`*.easyepg.tv` subdomains:** Auto‑provisioned by Cloudflare (edge certificates).
- **Custom domains:** Cloudflare‑managed SSL — user does nothing. If user's domain is on CF, it's instant; if external, CF provisions a universal certificate.
- **Data in transit:** All endpoints are HTTPS-only. HSTS header set on Workers.
- **Secrets:** Magic‑link tokens and JWTs are single‑use, short‑lived (15 min for link, 30 days for session JWT). JWT secrets stored in Workers Secrets, never in code.

### 6.4 Data Privacy

- No password storage (magic‑link only).
- Email addresses stored only for auth + notifications. Never shared, never sold.
- EPG source data cached per user — no cross‑user leakage.
- User can request account deletion (deletes all rows + R2 objects).

---

## 7. Operations & Automation

### 7.1 Automated Git Commits & CI Flow

```
Platform Action (e.g., user uploads logo)
        │
        ▼
Control plane calls GitHub API → creates commit on `deploy` branch
        │
        ▼
        ├── File changed: /data/playlists/{slug}.json
        ├── File changed: /assets/logos/{id}.png
        └── Commit message: "auto: update logo for {channel_name}"
        │
        ▼
GitHub Action (`.github/workflows/deploy.yml`)
        │
        ├── 1. Checkout `deploy` branch
        ├── 2. Install deps
        ├── 3. Run wrangler deploy --keep-vars
        └── 4. Notify control plane via webhook → mark deployment as live
```

**Key decisions:**

- The platform holds a **GitHub App installation token** (or a fine‑grained PAT scoped to a single repo). It can create commits and PRs without human intervention.
- The `deploy` branch is **protected** but the platform's token bypasses PR requirements for auto‑commits (or uses a `[auto]` commit convention).
- CI does **not** rebuild the Next.js app — only the Workers that serve playlists, EPG, and logos. The web app deploys separately via Vercel/CF Pages on merge to `main`.

**Commit convention:**

```
auto: update playlist channels for {user_slug}
auto: add logo match for {channel_name} (confidence {score})
auto: update EPG merge for {user_slug}
auto: verify custom domain {domain}
manual: bump Master Playlist definition
```

### 7.2 CNAME Auto‑Verification via Cloudflare API

```
1. User submits domain "watch.example.com"
2. System generates verification token: "easyepg-verify=abc123def"
3. UI shows:
   ┌──────────────────────────────────────────────┐
   │  Add this CNAME record at your DNS provider: │
   │                                              │
   │  watch.example.com  CNAME  custom.easyepg.tv │
   │  _easyepg-verify.watch.example.com           │
   │     TXT  "easyepg-verify=abc123def"          │
   └──────────────────────────────────────────────┘
4. System starts a Worker cron (every 60 seconds) that:
   a. Queries TXT record for _easyepg-verify.{domain}
   b. If token matches → marks domain as verified, creates CF route
   c. If no match after 72 hours → sends reminder email, then expires
5. On verification:
   a. Worker route added: `{domain}/* → playlist-router`
   b. Auto‑SSL kicks in (CF edge cert)
   c. User gets email: "✅ watch.example.com is live!"
```

**Why two records:** The CNAME alone proves domain ownership for routing. The TXT record is a fast check that doesn't require DNS changes to the apex — some users can only add CNAME, some can only add TXT. Accept either as proof.

### 7.3 AI Job Queue with Confidence Thresholds

```
                     ┌──────────────┐
                     │  AI Job      │
                     │  Submitted   │
                     └──────┬───────┘
                            ▼
                   ┌────────────────┐
                   │  Queue (CF     │
                   │  Queues)       │
                   └──────┬────────┘
                            ▼
                   ┌────────────────┐
                   │  AI Worker     │
                   │  Processes job │
                   │  → scores [0,1]│
                   └──────┬────────┘
                            ▼
               ┌────────────────────────┐
               │  confidence >=         │
               │  threshold (default    │
               │  0.85)?                │
               └───────┬────────┬───────┘
                   YES │        │ NO
                       ▼        ▼
              ┌────────────┐  ┌────────────────────┐
              │ Auto-apply │  │ Queue for review    │
              │ - Update   │  │ - Insert suggestion │
              │   DB/EPG   │  │ - Notify user via   │
              │ - Silent   │  │   email/in-app badge│
              └────────────┘  └────────────────────┘
```

**Job types and their confidence models:**

| Job Type | What it does | Confidence model |
|----------|-------------|-----------------|
| `logo_match` | Match uploaded image → known channel ID | CLIP embedding cosine similarity → score |
| `epg_merge` | Merge XMLTV source into user's EPG table | Overlap ratio + source reliability score |
| `epg_gap_fill` | Fill missing EPG slots from secondary sources | Historical fill rate + source trust score |

**Admin controls:**

- Confidence threshold adjustable in admin panel (range: 0.50–0.99, step 0.05)
- Per‑job‑type override: `{ "logo_match": 0.80, "epg_merge": 0.85, "epg_gap_fill": 0.90 }`
- Manual review queue shows: job type, payload preview, confidence score, and Accept/Dismiss buttons

### 7.4 Owner‑Friction‑Free Deployment

| Action | How it happens | Owner effort |
|--------|---------------|--------------|
| Playlist update | Platform commits to `deploy` → CI deploys Workers | **Zero** |
| Logo upload | Stored in R2, served by Worker, CDN caches | **Zero** |
| Custom domain verify | Worker cron + CF API | **Zero** (user adds DNS) |
| Master Playlist change | Manual edit → commit to `main` → CI deploys | 1 commit message |
| AI threshold change | Admin panel UI → auto‑commits config → CI | **Zero** |
| EPG source update | Platform ingests → stored in D1 → auto‑merged | **Zero** |
| New Worker version | Push to `main` → CI → staged rollout | 1 `git push` (or auto‑PR merge) |

### 7.5 Stack Summary

| Component | Technology | Deployed via |
|-----------|-----------|-------------|
| Web app | Next.js (React, TypeScript) | Vercel / CF Pages |
| API | Next.js API routes (or Hono) | Same as web app |
| Worker (playlist) | Hono + hono/jsx (lightweight) | `wrangler deploy` via CI |
| Worker (logo CDN) | Hono + R2 binding | `wrangler deploy` via CI |
| Worker (CNAME verify) | Scheduled cron + Cloudflare API | `wrangler deploy` via CI |
| Database | Cloudflare D1 (SQLite) | Managed by CF |
| Blob store | Cloudflare R2 | Managed by CF |
| AI queue | Cloudflare Queues | Managed by CF |
| Auth emails | Resend / Courier | API key in Workers Secrets |
| Git automation | GitHub API (App token) | PAT scoped to repo |
| CI/CD | GitHub Actions | GitHub-managed |

---

## 8. 5 KPIs

| # | KPI | Why | Target (Month 1) | How to Measure |
|---|-----|-----|------------------|----------------|
| 1 | **Playlist creation rate** | Core funnel: email received → playlist created | ≥ 60% of signed‑up users | Count `create-from-master` events / total users |
| 2 | **Time‑to‑first‑playlist** | Zero‑friction test: how fast can a new user get a working playlist? | ≤ 90 s from magic‑link click | Median of `created_at` minus `auth_verified_at` |
| 3 | **AI auto‑apply rate** | Are our confidence thresholds working? Silent automation vs. user review | ≥ 80% of AI jobs auto‑applied | `auto_applied = 1` jobs / total AI jobs |
| 4 | **Custom domain activation rate** | How many users set up a custom domain? | ≥ 15% of active users | `domain_verified = 1` playlists / active playlists |
| 5 | **Playlist serving uptime** | Reliability of the Worker endpoints | ≥ 99.9% | Worker metrics (CF dashboard) — exclude planned deploys |

### Secondary KPIs (track but not primary)

| KPI | Why |
|-----|-----|
| Logo upload completion rate | Funnel: upload → AI match → accept |
| EPG coverage % | % of channels in user's playlist that have EPG data for next 7 days |
| Average suggestion review time | How fast users act on below‑threshold AI suggestions |
| Worker p95 response time | Latency for M3U/XML serving |
| Custom domain verification time | Median time from DNS add → verified ✓ |

---

## Appendix A: UI Mockup Notes

- **Color scheme:** White (`#FFFFFF`) background, dark text (`#1A1A1A`), accent blue (`#2563EB`) for primary buttons.
- **Button sizing:** All interactive elements minimum 56 × 56 px. Primary CTA buttons: full‑width on mobile, 320 px max on desktop.
- **Layout:** Single‑column, centered, max-width 480 px. No sidebar. No hamburger menu on MVP.
- **Typography:** System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`), 16 px base, comfortable line-height (1.6).
- **Feedback:** Every action shows immediate feedback — skeleton loaders, toast notifications, inline success/error messages. No blank states without explanation.

## Appendix B: Error Handling Strategy

| Error type | User sees | System action |
|-----------|-----------|---------------|
| Magic link expired | "That link expired. Tap here to get a new one." | Log + rotate token |
| Playlist not found | "We couldn't find that playlist. It may have been deleted." | 404, log user_id |
| DNS verification timeout | "We're still waiting for your DNS to update. Check the CNAME line above." | Retry every 60 min for 72 h, then expire |
| AI job failed | Nothing (silent) | Log error, retry once, then flag for admin |
| Rate limit exceeded | "You're moving a bit fast! Wait a moment and try again." | 429 with `Retry-After` header |
| Upload too large | "That file is too big. Max 10 MB." | Reject before processing |

---

*End of spec — last updated 2026-06-04.*
