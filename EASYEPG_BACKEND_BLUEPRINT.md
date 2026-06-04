# EasyEPG — Backend Blueprint & SQL Schema

> **Architecture:** Cloudflare‑native SaaS with PostgreSQL, Workers edge serving, automated CI/CD.  
> **Automation first:** platform creates commits, verifies DNS, hosts logos, serves playlists — owner never touches a terminal.

---

## Table of Contents

1. [SQL Schema](#1-sql-schema)
2. [REST API Endpoints](#2-rest-api-endpoints)
3. [Cloudflare Integration](#3-cloudflare-integration)
4. [Automation & CI](#4-automation--ci)
5. [Security & Scaling](#5-security--scaling)
6. [Acceptance Criteria](#6-acceptance-criteria)

---

## 1. SQL Schema

All tables use `UUID v7` for primary keys (time‑sortable, no sequence leaks). Timestamps in UTC with timezone.

### 1.1 `users`

```sql
-- Purpose: Core user identity. Magic‑link auth only — no password hash.
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT NOT NULL UNIQUE,
    language        TEXT NOT NULL DEFAULT 'en',              -- ISO 639-1
    region          TEXT,                                    -- ISO 3166-1 alpha-2
    timezone        TEXT NOT NULL DEFAULT 'UTC',
    ai_threshold    NUMERIC(3,2) NOT NULL DEFAULT 0.75,     -- auto‑apply threshold
    ai_auto_apply   BOOLEAN NOT NULL DEFAULT TRUE,           -- master toggle
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_region ON users(region);
```

### 1.2 `categories`

```sql
-- Purpose: Normalized channel groups (Sports, News, Entertainment…).
CREATE TABLE categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL UNIQUE,                    -- display name
    slug            TEXT NOT NULL UNIQUE,                    -- URL‑safe key
    display_order   INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_slug ON categories(slug);
```

### 1.3 `channels`

```sql
-- Purpose: Master channel catalogue. Platform‑maintained; users reference via playlist_channels.
CREATE TABLE channels (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id     UUID REFERENCES categories(id),
    channel_number  INTEGER,
    name            TEXT NOT NULL,
    tvg_id          TEXT,                                    -- EPG identifier (e.g. "hbo.us")
    tvg_name        TEXT,                                    -- display name in EPG
    tvg_logo_url    TEXT,                                    -- platform‑hosted CDN URL
    stream_url      TEXT NOT NULL,
    stream_format   TEXT NOT NULL DEFAULT 'hls',             -- hls | mpegts | rtmp
    region          TEXT,                                    -- ISO 3166-1 alpha-2
    language        TEXT NOT NULL DEFAULT 'en',              -- ISO 639-1
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    metadata        JSONB DEFAULT '{}',                      -- extensible: group, source, etc.
    checksum        TEXT,                                    -- SHA256 of key fields for change detection
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_channels_tvg_id ON channels(tvg_id);
CREATE INDEX idx_channels_region ON channels(region);
CREATE INDEX idx_channels_category ON channels(category_id);
CREATE INDEX idx_channels_active ON channels(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_channels_checksum ON channels(checksum);
```

### 1.4 `playlists`

```sql
-- Purpose: Per‑user playlist. Each user has exactly one active playlist on MVP.
CREATE TABLE playlists (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL DEFAULT 'My Playlist',
    slug            TEXT NOT NULL UNIQUE,                    -- used in subdomain URL
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    custom_domain   TEXT,                                    -- verified custom domain (denormalized)
    domain_verified BOOLEAN NOT NULL DEFAULT FALSE,
    epg_source_url  TEXT,                                    -- optional user‑supplied XMLTV URL
    published_at    TIMESTAMPTZ,                             -- last publish timestamp
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_playlists_user ON playlists(user_id);
CREATE INDEX idx_playlists_slug ON playlists(slug);
CREATE INDEX idx_playlists_active ON playlists(is_active) WHERE is_active = TRUE;
```

### 1.5 `playlist_channels`

```sql
-- Purpose: Join table — which channels a user has in their playlist, with per‑user overrides.
CREATE TABLE playlist_channels (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id     UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    channel_id      UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    channel_number  INTEGER,                                 -- user‑specific renumbering
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    custom_logo_key TEXT,                                    -- R2 key if user uploaded custom logo
    added_by        TEXT NOT NULL DEFAULT 'master_copy',     -- master_copy | user_manual | ai_suggest
    added_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (playlist_id, channel_id)
);

CREATE INDEX idx_pc_playlist ON playlist_channels(playlist_id);
CREATE INDEX idx_pc_playlist_enabled ON playlist_channels(playlist_id, enabled)
    WHERE enabled = TRUE;
```

### 1.6 `epg_entries`

```sql
-- Purpose: Programme schedule data. Per‑channel, time‑range indexed for fast lookup.
CREATE TABLE epg_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_tvg_id  TEXT NOT NULL,                           -- joins to channels.tvg_id
    start_time      TIMESTAMPTZ NOT NULL,
    stop_time       TIMESTAMPTZ NOT NULL,
    title           TEXT NOT NULL,
    subtitle        TEXT,
    description     TEXT,
    category        TEXT,                                    -- EPG category (may differ from channel category)
    icon_url        TEXT,
    season_number   INTEGER,
    episode_number  INTEGER,
    source          TEXT NOT NULL DEFAULT 'xmltv',           -- xmltv | ai_generated | manual
    ai_confidence   NUMERIC(3,2),                            -- 0.00–1.00, NULL if from trusted source
    ai_auto_applied BOOLEAN NOT NULL DEFAULT TRUE,
    checksum        TEXT,                                    -- dedup hash
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
)
PARTITION BY RANGE (start_time);

-- Default partition covers current month; child tables created monthly via cron
CREATE TABLE epg_entries_default PARTITION OF epg_entries
    FOR VALUES FROM ('2026-01-01') TO ('2026-07-01');

CREATE INDEX idx_epg_channel_time ON epg_entries(channel_tvg_id, start_time);
CREATE INDEX idx_epg_start_time ON epg_entries(start_time);
CREATE INDEX idx_epg_channel ON epg_entries(channel_tvg_id);
CREATE INDEX idx_epg_checksum ON epg_entries(checksum);
```

### 1.7 `logos`

```sql
-- Purpose: User‑uploaded channel logos. Stored in R2; metadata tracked here.
CREATE TABLE logos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel_id      UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    original_name   TEXT NOT NULL,
    r2_key          TEXT NOT NULL UNIQUE,                    -- R2 object key
    content_type    TEXT NOT NULL DEFAULT 'image/png',
    file_size_bytes INTEGER NOT NULL,
    width           INTEGER,
    height          INTEGER,
    ai_match_score  NUMERIC(3,2),                            -- 0.00–1.00
    ai_auto_applied BOOLEAN NOT NULL DEFAULT TRUE,
    status          TEXT NOT NULL DEFAULT 'active',          -- active | pending_review | rejected
    cdn_url         TEXT,                                    -- populated after upload: https://cdn.easyepg.tv/logos/{r2_key}
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_logos_user ON logos(user_id);
CREATE INDEX idx_logos_channel ON logos(channel_id);
CREATE INDEX idx_logos_status ON logos(status);
```

### 1.8 `ai_suggestions`

```sql
-- Purpose: Queue of AI‑generated suggestions pending user review (below threshold).
CREATE TABLE ai_suggestions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    suggestion_type TEXT NOT NULL,                           -- logo_match | epg_merge | epg_gap_fill | channel_suggest
    payload         JSONB NOT NULL,                          -- full suggestion payload
    confidence      NUMERIC(3,2) NOT NULL,                   -- 0.00–1.00
    status          TEXT NOT NULL DEFAULT 'pending',         -- pending | accepted | rejected | auto_applied
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_suggestions_user ON ai_suggestions(user_id, status);
CREATE INDEX idx_ai_suggestions_status ON ai_suggestions(status);
```

### 1.9 `domain_verifications`

```sql
-- Purpose: Track custom domain registration and CNAME verification state via Cloudflare API.
CREATE TABLE domain_verifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    playlist_id         UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    domain              TEXT NOT NULL UNIQUE,
    verification_token  TEXT NOT NULL,                       -- "easyepg-verify=<random_hex>"
    cname_target        TEXT NOT NULL,                       -- "custom.easyepg.tv"
    verification_method TEXT NOT NULL DEFAULT 'txt_record',  -- txt_record | cname_only
    verified_at         TIMESTAMPTZ,                         -- NULL until verified
    ssl_status          TEXT NOT NULL DEFAULT 'pending',     -- pending | provisioning | active | failed
    last_checked_at     TIMESTAMPTZ,
    check_count         INTEGER NOT NULL DEFAULT 0,
    expires_at          TIMESTAMPTZ NOT NULL,                -- 72h after creation
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dv_user ON domain_verifications(user_id);
CREATE INDEX idx_dv_domain ON domain_verifications(domain);
CREATE INDEX idx_dv_status ON domain_verifications(verified_at) WHERE verified_at IS NULL;
```

### 1.10 `jobs_queue`

```sql
-- Purpose: Async job queue for AI tasks, EPG ingestion, Git commits, and deploys.
CREATE TYPE job_status AS ENUM ('queued', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE job_type AS ENUM (
    'logo_match', 'epg_ingest', 'epg_merge', 'epg_gap_fill',
    'git_commit', 'deploy_worker', 'verify_domain', 'publish_playlist'
);

CREATE TABLE jobs_queue (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type        job_type NOT NULL,
    user_id         UUID REFERENCES users(id),               -- NULL for system jobs
    payload         JSONB NOT NULL,
    priority        INTEGER NOT NULL DEFAULT 0,              -- higher = more urgent
    status          job_status NOT NULL DEFAULT 'queued',
    confidence      NUMERIC(3,2),                            -- populated on completion for AI jobs
    auto_applied    BOOLEAN,                                 -- TRUE if auto‑applied
    error_message   TEXT,
    retry_count     INTEGER NOT NULL DEFAULT 0,
    max_retries     INTEGER NOT NULL DEFAULT 3,
    scheduled_for   TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_status ON jobs_queue(status, priority, scheduled_for)
    WHERE status = 'queued';
CREATE INDEX idx_jobs_user ON jobs_queue(user_id);
CREATE INDEX idx_jobs_type ON jobs_queue(job_type);
```

### 1.11 `audit_logs`

```sql
-- Purpose: Immutable audit trail for all user‑facing mutations. Append‑only.
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    action          TEXT NOT NULL,                           -- e.g. 'playlist.created', 'domain.verified'
    entity_type     TEXT NOT NULL,                           -- 'playlist' | 'channel' | 'domain' | etc.
    entity_id       UUID,
    metadata        JSONB DEFAULT '{}',
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
```

---

## 2. REST API Endpoints

All endpoints under `/api/v1`. Authenticated via Bearer JWT (magic‑link session).  
Rate limit: 100 req/min per user. Playlist M3U endpoints are public (no auth — unguessable slug).

### 2.1 Create Playlist

```
POST /api/v1/playlists
```

**Request:**
```json
{
  "name": "My Playlist"
}
```

**Response (201):**
```json
{
  "id": "0194f1e2-...",
  "name": "My Playlist",
  "slug": "a1b2c3d4",
  "channel_count": 0,
  "url": "https://a1b2c3d4.easyepg.tv/playlist.m3u",
  "created_at": "2026-06-04T12:00:00Z"
}
```

**Notes:** Slug is a random 8‑char base62 string (unguessable). User subdomain is this slug. A `playlist.created` audit log entry is written immediately.

### 2.2 Copy from Master

```
POST /api/v1/playlists/:id/copy-from-master
```

**Request:**
```json
{
  "mode": "smart",
  "categories": ["Sports", "News"]
}
```

`mode` values:

| Mode | Behavior |
|------|----------|
| `all` | Copy every active channel from master |
| `category` | Copy channels matching `categories[]` only |
| `smart` | AI selects subset based on user region + language; returns suggestions with confidence scores; auto‑applies channels where confidence ≥ user's threshold (default 0.75) |

**Response (200):**
```json
{
  "mode": "smart",
  "copied": 45,
  "auto_applied": 42,
  "pending_review": 3,
  "pending_suggestions": [
    {
      "channel_id": "uuid",
      "name": "BBC One",
      "confidence": 0.62,
      "reason": "region mismatch"
    }
  ],
  "url": "https://a1b2c3d4.easyepg.tv/playlist.m3u"
}
```

**Notes:** The system creates `playlist_channels` rows. Channels above confidence threshold are inserted with `added_by = 'master_copy'`. Below‑threshold items go into `ai_suggestions` with `status = 'pending'`. A `jobs_queue` entry (`git_commit`) is created to trigger CI.

### 2.3 Add Channel to Playlist

```
POST /api/v1/playlists/:id/channels
```

**Request:**
```json
{
  "channel_id": "0194f1e2-...",
  "added_by": "user_manual"
}
```

**Response (201):**
```json
{
  "id": "0194f1e3-...",
  "channel_id": "0194f1e2-...",
  "channel_number": 46,
  "enabled": true,
  "custom_logo_key": null
}
```

**Errors:** `409 Conflict` if channel already in playlist. `404` if playlist or channel not found.

### 2.4 Upload Logo

```
POST /api/v1/logos/upload
```

Content‑Type: `multipart/form-data`

**Request (form fields):**
```
channel_id: "0194f1e2-..."
file: <binary image, max 10MB, accepted: image/png, image/jpeg, image/webp>
```

**Response (201):**
```json
{
  "id": "0194f1e4-...",
  "cdn_url": "https://cdn.easyepg.tv/logos/a1b2c3d4_hbo.png",
  "ai_match": {
    "matched": true,
    "channel_name": "HBO",
    "confidence": 0.94,
    "auto_applied": true
  }
}
```

**Server flow:**

1. Generate signed upload URL (R2 presigned POST, 5 min expiry)
2. Client uploads directly to R2 (optional: proxy through API for < 1 MB)
3. API creates `logos` row with `status = 'pending_review'`
4. Enqueue `logo_match` job in `jobs_queue`
5. AI Worker processes: CLIP embedding → cosine similarity against known channels
6. If confidence ≥ user's threshold (default 0.75): update `logos.status = 'active'`, set `tvg_logo_url` on `playlist_channels`, mark `ai_auto_applied = TRUE`
7. If below threshold: leave as `pending_review`, insert `ai_suggestions` row

**CDN URL format:** `https://cdn.easyepg.tv/logos/{r2_key}`

### 2.5 Fetch EPG Slice

```
GET /api/v1/playlists/:id/epg?from=2026-06-04T00:00:00Z&to=2026-06-11T00:00:00Z
```

**Response (200):**
```json
{
  "playlist_id": "0194f1e2-...",
  "from": "2026-06-04T00:00:00Z",
  "to": "2026-06-11T00:00:00Z",
  "channels": [
    {
      "tvg_id": "hbo.us",
      "name": "HBO",
      "entries": [
        {
          "start": "2026-06-04T21:00:00Z",
          "stop": "2026-06-04T22:30:00Z",
          "title": "The Last of Us",
          "description": "Ellie and Joel face new dangers.",
          "category": "Drama"
        }
      ]
    }
  ],
  "coverage_pct": 95.2
}
```

**Notes:** Queries only channels in the user's playlist (`playlist_channels`). Time‑range bounded. Returns `coverage_pct` — percentage of time slots in range that have EPG data.

### 2.6 Register Custom Domain

```
POST /api/v1/domains/register
```

**Request:**
```json
{
  "domain": "tv.yourname.com",
  "playlist_id": "0194f1e2-..."
}
```

**Response (201):**
```json
{
  "id": "0194f1e5-...",
  "domain": "tv.yourname.com",
  "cname_instruction": "CNAME tv.yourname.com → custom.easyepg.tv.",
  "verification_token": "easyepg-verify=a1b2c3d4e5f6",
  "txt_record_instruction": "_easyepg-verify.tv.yourname.com  TXT  \"easyepg-verify=a1b2c3d4e5f6\"",
  "status": "pending",
  "auto_verify": true
}
```

**Server flow:**

1. Validate domain format + not already registered
2. Generate verification token (`easyepg-verify=<random_hex>`)
3. Insert `domain_verifications` row with `expires_at = now() + 72h`
4. Enqueue `verify_domain` job in `jobs_queue` (recurring every 60 s)
5. Worker queries Cloudflare DNS API for TXT record at `_easyepg-verify.{domain}`
6. On match: set `verified_at`, enqueue `deploy_worker` job to add route
7. Cloudflare auto‑provisions SSL edge certificate for the domain
8. On expiry (72h no match): mark as failed, send notification

### 2.7 Playlist Publish Webhook

```
POST /api/v1/webhooks/playlist-published
```

Internal endpoint called by the Worker after a successful deploy.

**Request:**
```json
{
  "playlist_id": "0194f1e2-...",
  "slug": "a1b2c3d4",
  "custom_domain": "tv.yourname.com",
  "published_at": "2026-06-04T12:05:00Z",
  "worker_version": "2026-06-04-001"
}
```

**Response (200):**
```json
{
  "ok": true,
  "cache_invalidated": true
}
```

**Notes:** Triggers cache invalidation for the playlist's CDN edge. Updates `playlists.published_at`. Writes to `audit_logs`.

### 2.8 Accept/Reject AI Suggestions (Bulk)

```
POST /api/v1/ai-suggestions/review
```

**Request:**
```json
{
  "action": "accept",
  "ids": ["0194f1e4-...", "0194f1e5-..."],
  "apply_all_above": 0.85
}
```

`action` values: `accept` | `reject`.

If `apply_all_above` is set, the system also auto‑accepts any pending suggestions for this user with confidence ≥ that value (silent bulk).

**Response (200):**
```json
{
  "accepted": 2,
  "rejected": 0,
  "auto_accepted": 12,
  "remaining_pending": 1
}
```

---

## 3. Cloudflare Integration

### 3.1 Playlist Serving — Worker Router

```
┌───────────────────────────────────────────────────────────┐
│                    Cloudflare Edge                         │
│                                                           │
│  Request: GET https://{slug}.easyepg.tv/playlist.m3u      │
│              ─ or ─                                       │
│  Request: GET https://custom.domain/playlist.m3u          │
│                                                           │
│                      ▼                                    │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Playlist Router Worker                            │   │
│  │                                                    │   │
│  │  1. Extract subdomain from hostname                │   │
│  │     OR look up custom domain → playlist slug       │   │
│  │  2. Query D1: SELECT pc.*, c.* FROM playlist_     │   │
│  │     channels pc JOIN channels c ON ...             │   │
│  │     WHERE pc.playlist_id = ? AND pc.enabled = TRUE │   │
│  │  3. Generate M3U with EXTINF tags:                │   │
│  │     #EXTINF:-1 tvg-id="..." tvg-logo="..." ...,   │   │
│  │     Channel Name                                   │   │
│  │  4. Return Content-Type: audio/x-mpegurl           │   │
│  │     Cache: public, max-age=60 (1 min)              │   │
│  └────────────────────────────────────────────────────┘   │
│                                                           │
│  Custom domain → slug mapping:                           │
│  D1 table: custom_domain_routes                          │
│  │ domain           │ playlist_slug │ ssl_status │       │
│  │ tv.yourname.com  │ a1b2c3d4      │ active     │       │
│                                                           │
│  On domain verify: system creates CF route via API:      │
│  Pattern: tv.yourname.com/* → playlist-router Worker     │
│  CF auto‑provisions SSL (edge cert, includes custom      │
│  domains that are on CF or external).                    │
└───────────────────────────────────────────────────────────┘
```

**Key details:**

- Worker reads from D1 directly (single‑digit ms latency at edge).
- M3U response cached for 60 s at edge (ETag for conditional requests).
- Each user's data is isolated by `playlist_id` — Worker parameterizes all queries.
- Custom domain routes are managed via Cloudflare API: `POST /zones/{zone}/workers/routes`.
- SSL is Cloudflare‑managed edge certificates — zero user config.

### 3.2 Logo Upload & CDN

```
┌──────────┐   POST /api/v1/logos/upload   ┌──────────┐
│  Browser │  ──────────────────────────→   │   API    │
│          │                                │          │
│          │  1. API validates file + auth   │          │
│          │  2. Generate presigned POST URL │          │
│          │  3. Return URL + fields         │          │
│          │                                │          │
│          │  ─── alternative for < 1MB ──→  │          │
│          │  API proxies upload directly    │          │
└──────────┘                                └────┬─────┘
                                                 │
                        ┌────────────────────────┘
                        ▼
              ┌──────────────────┐
              │   Cloudflare R2   │
              │   (S3‑compatible) │
              │                  │
              │  Bucket: logos   │
              │  Key: {user_id}/ │
              │       {channel_id}│
              │       _{hash}.png │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │  Logo CDN Worker │
              │                  │
              │  URL pattern:    │
              │  cdn.easyepg.tv/ │
              │  logos/{r2_key}  │
              │                  │
              │  • Reads from R2 │
              │  • Caches at edge│
              │    (public, 7d)  │
              │  • Returns 304   │
              │    on ETag match │
              └──────────────────┘
```

**Presigned URL flow (for large uploads > 1 MB):**

```
GET /api/v1/logos/upload-url?channel_id=...&filename=logo.png

Response:
{
  "upload_url": "https://r2-bucket...s3.amazonaws.com/...",
  "upload_fields": {
    "key": "logos/user_abc/...",
    "Content-Type": "image/png",
    "x-amz-signature": "..."
  },
  "cdn_url": "https://cdn.easyepg.tv/logos/user_abc_...png"
}
```

Client then `POST`s the file directly to R2 with the presigned fields. On success, calls `POST /api/v1/logos/confirm` with the `r2_key` to trigger AI matching.

### 3.3 Auto‑Verify CNAME via Cloudflare API

**Step‑by‑step:**

1. **User submits domain** → API creates `domain_verifications` row with `verification_token = "easyepg-verify=<crypto_random_hex>"`

2. **Start polling** → Enqueue recurring `verify_domain` job. Worker runs every 60 s for this domain.

3. **DNS check** → Worker calls Cloudflare DNS API:
   ```
   GET https://api.cloudflare.com/client/v4/zones/{zone}/dns_records
       ?type=TXT&name=_easyepg-verify.{domain}
   ```
   Alternatively, fallback to public DNS:
   ```
   dig TXT _easyepg-verify.{domain} +short
   ```

4. **Match?** → If response contains `"easyepg-verify=<token>"`:
   - Set `domain_verifications.verified_at = now()`
   - Create CF Worker route: `POST /zones/{zone}/workers/routes` with pattern `{domain}/*`
   - Update `playlists.custom_domain` and `playlists.domain_verified`
   - Cloudflare auto‑provisions SSL (edge certificate, usually < 60 s)
   - Send email: "✅ tv.yourname.com is live!"

5. **No match?** → Increment `check_count`. If `check_count > 72` (72 × 60 s = 72 h), expire the request and send failure notification.

6. **CNAME‑only verification** (fallback): If user cannot add TXT record, system checks that a CNAME to `custom.easyepg.tv` exists for the domain. This is weaker (only proves routing intent, not ownership), but acceptable for MVP.

### 3.4 Edge AI Enrichment via Workers

**Two patterns:**

| Pattern | Use case | Detail |
|---------|----------|--------|
| **Worker‑side (low latency)** | EPG enrichment at request time | Worker calls `@cf/meta/m2m-100-1.2b` (AI Gateway) to translate EPG titles. Runs only when cached EPG is served and TTL > 5 min — avoids blocking. |
| **Queued (async, high latency)** | Logo matching, EPG gap fill, merge | Enqueue `jobs_queue` → Cloudflare Queues consumer (AI Worker) → writes results to D1 → triggers cache invalidation |

**Worker EPG enrichment example (pseudocode):**

```js
// Inside playlist-router Worker
async function enrichEpgEntry(entry) {
  if (entry.language !== user.language && entry.title) {
    // Proxy to Cloudflare AI via AI Gateway
    const translation = await ai.run('@cf/meta/m2m-100-1.2b', {
      text: entry.title,
      source_lang: detectLang(entry.language),
      target_lang: user.language,
    });
    entry.title = translation.result;
    entry.ai_enriched = true;
  }
  return entry;
}
```

**Logo matching (async queue):**

```
1. User uploads logo → enqueue logo_match job
2. AI Worker picks up job
3. Loads image from R2, generates embedding via CLIP model
4. Compares against known channel embeddings (stored in D1 vector extension or external vector DB)
5. Scores similarity 0.0–1.0
6. If >= user.threshold (default 0.75): auto‑update, mark auto_applied
7. If < threshold: insert ai_suggestions row
```

---

## 4. Automation & CI

### 4.1 Automated Git Commits & Deployment

```
┌──────────────┐     GitHub API      ┌─────────────────────┐
│  EasyEPG     │  ───────────────→   │  GitHub Repository  │
│  Control     │                     │                     │
│  Plane       │  POST /repos/{owner}│  ├── deploy/        │
│              │  /{repo}/git/blobs  │  │   ├── wrangler.toml│
│              │                     │  │   ├── workers/    │
│              │  Creates commit on  │  │   │   ├── playlist-│
│              │  `deploy` branch    │  │   │   │   router.ts│
│              │                     │  │   │   ├── logo-cdn/│
│              │  Auto‑commit msg:   │  │   │   │   index.ts │
│              │  "auto: update      │  │   │   └── cname-   │
│              │   playlist {slug}"  │  │   │       verify.ts│
│              │                     │  │   ├── data/       │
│              │                     │  │   │   └── playlist-│
│              │                     │  │   │       {slug}.json│
│              └─────────────────────┘  └────────┬────────────┘
                                                 │
                                                 ▼
                                        ┌─────────────────┐
                                        │  GitHub Actions  │
                                        │  (deploy.yml)    │
                                        │                  │
                                        │  On: push to     │
                                        │  deploy branch   │
                                        │                  │
                                        │  1. npm ci       │
                                        │  2. wrangler     │
                                        │     deploy --     │
                                        │     keep-vars    │
                                        │  3. Call webhook │
                                        │     → control    │
                                        │     plane        │
                                        └─────────────────┘
```

**Required GitHub permissions (GitHub App or fine‑grained PAT):**

| Permission | Scope | Reason |
|-----------|-------|--------|
| `contents: write` | Repository | Create blobs, trees, commits on `deploy` branch |
| `pull_requests: write` | Repository | Open auto‑PRs for review (optional) |
| `workflows: write` | Repository | Trigger workflow_dispatch |
| `checks: read` | Repository | Verify CI status after push |

**Safety checks before auto‑commit:**

1. `deploy` branch must exist and be in a clean state (no merge conflicts)
2. Commit diff must be non‑empty (skip if nothing changed)
3. Commit message prefixed with `auto:` — CI treats these as non‑critical (no Slack notification)
4. CI pipeline must complete within 5 min; if it fails, rollback via `git revert` and notify admin

**What triggers an auto‑commit:**

| Trigger | Commit message | Files changed |
|---------|---------------|---------------|
| Playlist channels changed | `auto: update playlist {slug}` | `data/playlists/{slug}.json` |
| Logo uploaded + matched | `auto: add logo for {channel}` | `assets/logos/{r2_key}` |
| EPG merged | `auto: update EPG {user_slug}` | `data/epg/{slug}.json` |
| Domain verified | `auto: verify domain {domain}` | `data/domains/{slug}.json` |
| AI threshold changed (admin) | `auto: update ai config` | `.easyepg/config.json` |

### 4.2 Job Queueing for AI Tasks

```
                    ┌──────────────┐
                    │  jobs_queue  │
                    │  (PostgreSQL)│
                    └──────┬───────┘
                           │
             Poll every 5 s by dequeuer service
                           │
                           ▼
              ┌────────────────────────┐
              │   Job Dequeuer         │
              │   (Node.js worker)     │
              │                        │
              │  SELECT * FROM         │
              │  jobs_queue WHERE      │
              │  status = 'queued'     │
              │  ORDER BY priority     │
              │  DESC, scheduled_for   │
              │  ASC LIMIT 10          │
              └───────┬────────────────┘
                      │
          ┌───────────┼───────────────┐
          ▼           ▼               ▼
   ┌──────────┐ ┌──────────┐ ┌──────────────┐
   │  Logo    │ │  EPG     │ │  Git Commit  │
   │  Match   │ │  Ingest  │ │  Worker      │
   └──────────┘ └──────────┘ └──────────────┘
          │           │               │
          ▼           ▼               ▼
   ┌──────────────────────────────────────┐
   │        Confidence Check              │
   │                                      │
   │  IF confidence >= user.ai_threshold  │
   │    (default 0.75):                   │
   │    → auto_apply = TRUE               │
   │    → update DB directly              │
   │    → log audit entry                 │
   │                                      │
   │  ELSE:                               │
   │    → insert ai_suggestions row       │
   │    → status = 'pending'              │
   │    → (optional) push notification    │
   └──────────────────────────────────────┘
```

**Confidence threshold logic (deterministic, no ambiguity):**

```
auto_apply = (
  job.confidence >= user.ai_threshold
  AND user.ai_auto_apply = TRUE
)
```

- If TRUE: update is applied, `jobs_queue.auto_applied = TRUE`, `jobs_queue.status = 'completed'`
- If FALSE: `ai_suggestions` row created, `jobs_queue.status = 'completed'` (job itself succeeded, just didn't auto‑apply)
- On error: `jobs_queue.status = 'failed'`, `retry_count++`, re‑queued if `retry_count < max_retries`

---

## 5. Security & Scaling

### 5.1 Per‑User Data Isolation

| Layer | Mechanism |
|-------|-----------|
| Database | All queries include `WHERE user_id = ?`. Row‑level security (RLS) enforced on PostgreSQL: `CREATE POLICY user_isolation ON playlists USING (user_id = current_user_id())`. |
| D1 (Workers) | Worker reads `playlist_id` from slug/domain lookup — never exposes data from other users. |
| R2 | Logo keys prefixed with `{user_id}/`. Presigned URLs scoped to single object, 5 min expiry. |
| Audit | `audit_logs.user_id` always populated. Admin can view across users; API returns only own logs. |

### 5.2 Rate Limiting

| Endpoint | Limit | Window | Enforced by |
|----------|-------|--------|-------------|
| All `/api/v1/*` | 100 req | 1 min | API middleware (PostgreSQL counter or Upstash Redis) |
| `POST /auth/*` | 5 req | 1 min | IP‑based, in‑memory |
| `POST /logos/upload` | 10 MB per file, 50 MB per day | 1 day | API middleware |
| Playlist M3U (Worker) | 1000 req | 1 min | Worker (D1 `rate_limits` table) |

**Rate limit response (429):**
```json
{
  "error": "rate_limit_exceeded",
  "retry_after": 45,
  "message": "You're moving a bit fast! Wait a moment and try again."
}
```

### 5.3 API Keys (Admin)

Internal admin endpoints use a static API key (`x-api-key` header), stored as `API_ADMIN_KEY` in Workers Secrets. Future: per‑user API keys for programmatic access.

### 5.4 Signed Playlist URLs (Future)

For private playlists (post‑MVP): append `?token={hmac_signature}` to M3U URLs. Worker verifies HMAC-SHA256 before serving. Token expires with configurable TTL. Not required for MVP (unguessable slug is sufficient for non‑technical users).

### 5.5 Caching Strategy

| Layer | Cache | TTL | Invalidation |
|-------|-------|-----|-------------|
| CDN (Cloudflare) | M3U playlist response | 60 s | Purge by URL tag on publish |
| CDN (Cloudflare) | Logo images | 7 days | Purge on re‑upload |
| CDN (Cloudflare) | EPG XML | 5 min | Purge on EPG merge complete |
| API (Redis / Upstash) | User profile, channel list | 5 min | Invalidate on write |
| API (Redis / Upstash) | EPG slices | 2 min | Invalidate on EPG update |
| Browser | Static assets (Next.js) | 1 year | Hash‑based cache busting |

**Cache invalidation flow (on publish):**

```
1. User edits playlist → triggers deploy
2. Deploy completes → webhook to control plane
3. Control plane calls Cloudflare API:
   POST /zones/{zone}/purge_cache
   { "tags": ["playlist:{slug}", "epg:{slug}"] }
4. Edge purged → next request fetches fresh data from Worker
```

### 5.6 Scaling EPG Ingestion

| Strategy | Detail |
|----------|--------|
| **Sharding** | `epg_entries` partitioned by month. New partition created on 1st of each month via cron. |
| **Incremental updates** | Ingest EPG source, compute checksum of each entry, `INSERT ON CONFLICT (checksum) DO NOTHING`. Only new/changed entries written. |
| **Per‑client merge** | EPG data is ingested once per source, then merged per user via `playlist_channels` join. No per‑user EPG duplication. |
| **Cache invalidation** | On EPG merge complete → purge CDN cache for EPG tag. Individual channel updates do not trigger cache purge (EPG is always queried live from D1). |
| **Compression** | EPG XML sources gzip‑compressed in R2 for raw storage. Text fields in PostgreSQL use default compression. |

---

## 6. Acceptance Criteria

| # | Criterion | How to Verify |
|---|-----------|---------------|
| 1 | **Copy from Master** — `POST /api/v1/playlists/:id/copy-from-master?mode=all` creates `playlist_channels` rows referencing all active `channels`. Response time < 300 ms for 300‑channel master under 95th percentile. | Load test with 300‑channel master. Measure p95 response time. Verify row count in `playlist_channels`. |
| 2 | **Playlist M3U serving** — `GET https://{slug}.easyepg.tv/playlist.m3u` returns valid M3U with `#EXTINF` tags containing `tvg-id`, `tvg-logo`, `tvg-name`, and channel name for every enabled channel in the playlist. | Hit Worker URL. Parse M3U output. Verify every channel appears with correct tags. |
| 3 | **Logo upload + AI match** — Upload a PNG of a known channel → AI matches with confidence ≥ 0.85 → `logos.status = 'active'` and `cdn_url` returns the image within 30 s globally. | Upload logo. Poll `logos` table. Verify `cdn_url` returns image via CDN Worker. |
| 4 | **Custom domain auto‑verify** — Add TXT record `_easyepg-verify.{domain}` with token → Worker detects within 120 s → `domain_verifications.verified_at` is set → Worker route created → SSL status = `active` within 5 min. | Add TXT record. Poll `domain_verifications` table. Verify CF Worker route exists. Verify HTTPS on `https://{domain}/playlist.m3u`. |
| 5 | **AI suggestion auto‑apply** — User with `ai_threshold = 0.75` receives an AI suggestion with confidence 0.82 → suggestion is auto‑applied (`ai_suggestions.status = 'auto_applied'`). Same user with confidence 0.60 → suggestion is `pending`. | Submit two AI suggestions (one above, one below threshold). Verify status values. |
| 6 | **Automated Git commit + CI** — After a playlist channel toggle, a commit appears on `deploy` branch within 60 s with message `auto: update playlist {slug}`. CI pipeline completes within 3 min. Workers are updated. | Toggle channel. Check GitHub API for new commit on `deploy`. Check Actions run. Verify Worker returns updated playlist. |

---

*End of backend blueprint — last updated 2026-06-04.*
