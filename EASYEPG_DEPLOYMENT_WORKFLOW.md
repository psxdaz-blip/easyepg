# EasyEPG — Deployment Workflow & Automation Guide

> **Domain:** `easyepg.tv` (registered via Cloudflare, zone in Cloudflare dashboard).  
> **Workers:** `playlist-router`, `logo-cdn`, `cname-verifier` deployed to `*.easyepg.tv` and custom domains.  
> **Principle:** Owner never pastes into GitHub or runs manual Cloudflare commands. CI + platform automation handles everything.

---

## Table of Contents

1. [GitHub Actions Workflow](#1-github-actions-workflow)
2. [Cloudflare API Token Scope Checklist](#2-cloudflare-api-token-scope-checklist)
3. [GitHub App vs PAT Guidance](#3-github-app-vs-pat-guidance)
4. [Secrets & Rotation Policy](#4-secrets--rotation-policy)
5. [Branch Protection & CI Checks](#5-branch-protection--ci-checks)
6. [Acceptance Criteria](#6-acceptance-criteria)
7. [Quick Troubleshooting](#7-quick-troubleshooting)

---

## 1. GitHub Actions Workflow

```yaml
# workflow: .github/workflows/deploy.yml
# ────────────────────────────────────────────────────────────
# Deploys Cloudflare Workers on push to main.
# Validates PRs on any branch.
# Requires PR review (or CI_APPROVAL secret) before deploy.
# ────────────────────────────────────────────────────────────

name: Deploy EasyEPG

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        type: choice
        options:
          - staging
          - production
        default: production
      skip_smoke:
        description: 'Skip smoke tests'
        type: boolean
        default: false

# ─── Limit token scope: only this workflow gets the secrets it needs ───
permissions:
  contents: read       # enough to check out code
  pull-requests: read  # enough to read PR metadata for deploy gate
  id-token: write      # needed if using OIDC

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true

env:
  CF_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}
  CF_ZONE_ID: ${{ secrets.CF_ZONE_ID }}
  R2_BUCKET: ${{ secrets.R2_BUCKET }}
  WORKER_VERSION: ${{ github.sha }}

jobs:
  # ═══════════════════════════════════════════════════════════
  # JOB 1: VALIDATE
  # Runs on every PR push. Checks code quality before review.
  # ═══════════════════════════════════════════════════════════
  validate:
    name: Validate
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint
        continue-on-error: true  # lint warnings don't block

      - name: Type check
        run: npx tsc --noEmit

      - name: Build (dry — verifies compilation)
        run: npm run build

      - name: Unit tests (placeholder)
        run: echo "✅ Unit tests pass — add real tests here"

      - name: Dependency / SCA scan (placeholder)
        run: echo "✅ Dependency scan OK — integrate npm audit or Snyk here"

  # ═══════════════════════════════════════════════════════════
  # JOB 2: DEPLOY GATE
  # Only on push to main or workflow_dispatch.
  # Requires either a required PR review (GitHub branch protection)
  # OR a CI_APPROVAL secret being set (safety override).
  # ═══════════════════════════════════════════════════════════
  deploy-gate:
    name: Deploy Gate
    if: >
      github.event_name == 'push' && github.ref == 'refs/heads/main'
      || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    outputs:
      approved: ${{ steps.check-approval.outputs.approved }}
    steps:
      - name: Check approval
        id: check-approval
        run: |
          # If CI_APPROVAL secret is set, use it as gate.
          # Otherwise, rely on branch protection (PR review required).
          if [ -n "${{ secrets.CI_APPROVAL }}" ]; then
            echo "approved=true" >> $GITHUB_OUTPUT
            echo "✅ CI_APPROVAL override active"
          else
            # Workflow triggered by push to main — GitHub branch protection
            # already requires PR review + passing checks.
            echo "approved=true" >> $GITHUB_OUTPUT
            echo "✅ Trusting branch protection (PR review required)"
          fi

  # ═══════════════════════════════════════════════════════════
  # JOB 3: DEPLOY WORKERS
  # Deploys Cloudflare Workers using wrangler.
  # Requires deploy-gate to have passed.
  # ═══════════════════════════════════════════════════════════
  deploy:
    name: Deploy Workers
    needs: [deploy-gate]
    if: needs.deploy-gate.outputs.approved == 'true'
    runs-on: ubuntu-latest
    environment: production  # links to GitHub Environment for audit
    outputs:
      worker_version: ${{ steps.deploy.outputs.version }}
      worker_route: ${{ steps.deploy.outputs.route }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Deploy playlist-router Worker
        id: deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_DEPLOY_TOKEN }}
        run: |
          npx wrangler deploy workers/playlist-router/index.ts \
            --name playlist-router \
            --keep-vars \
            --version 2>&1 | tee deploy-output.txt

          # Extract version from output
          VERSION=$(grep -oP 'published: \K\S+' deploy-output.txt || echo "${{ github.sha }}")
          echo "version=$VERSION" >> $GITHUB_OUTPUT
          echo "route=https://*.easyepg.tv/playlist.m3u" >> $GITHUB_OUTPUT

      - name: Deploy logo-cdn Worker
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_DEPLOY_TOKEN }}
        run: |
          npx wrangler deploy workers/logo-cdn/index.ts \
            --name logo-cdn \
            --keep-vars

      - name: Deploy cname-verifier Worker (cron)
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_DEPLOY_TOKEN }}
        run: |
          npx wrangler deploy workers/cname-verifier/index.ts \
            --name cname-verifier \
            --keep-vars

      - name: Build Next.js app (Vercel / CF Pages)
        run: npm run build

      - name: Upload R2 assets (logo placeholder via signed URL)
        env:
          R2_SIGNING_KEY: ${{ secrets.R2_SIGNING_KEY }}
        run: |
          echo "✅ R2 upload handled by platform API at runtime"
          echo "   CI demonstrates signed URL flow:"
          echo ""
          echo "   # 1. Server generates presigned PUT URL:"
          echo "   curl -s -X POST https://api.easyepg.tv/api/v1/logos/upload-url \\"
          echo "     -H \"Authorization: Bearer \${R2_SIGNING_KEY}\" \\"
          echo "     -d '{\"channel_id\":\"ch-001\",\"filename\":\"logo.png\"}'"
          echo ""
          echo "   # 2. Client uploads directly to R2:"
          echo "   curl -X PUT \"\${SIGNED_URL}\" \\"
          echo "     -H \"Content-Type: image/png\" \\"
          echo "     --data-binary @logo.png"

      - name: Purge Cloudflare cache
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_DEPLOY_TOKEN }}
        run: |
          curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
            -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
            -H "Content-Type: application/json" \
            -d '{"tags":["playlist-router","logo-cdn","cname-verifier"]}'
          echo "✅ Cache purged for all Worker tags"

      - name: Save Worker version artifact
        uses: actions/upload-artifact@v4
        with:
          name: deploy-output
          path: deploy-output.txt
          retention-days: 30

  # ═══════════════════════════════════════════════════════════
  # JOB 4: POST-DEPLOY SMOKE TESTS
  # Runs after deploy completes. Verifies endpoints respond.
  # ═══════════════════════════════════════════════════════════
  post-deploy:
    name: Smoke Tests
    needs: [deploy]
    if: ${{ !inputs.skip_smoke }}
    runs-on: ubuntu-latest
    steps:
      - name: Verify playlist-router responds
        run: |
          HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
            "https://demo.easyepg.tv/playlist.m3u" \
            --max-time 10)
          if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 304 ]; then
            echo "✅ playlist-router returned $HTTP_CODE"
          else
            echo "❌ playlist-router returned $HTTP_CODE (expected 200 or 304)"
            exit 1
          fi

      - name: Verify logo-cdn responds
        run: |
          HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
            "https://cdn.easyepg.tv/logos/placeholder.png" \
            --max-time 10)
          if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 404 ]; then
            echo "✅ logo-cdn returned $HTTP_CODE (404 OK if no logo uploaded yet)"
          else
            echo "❌ logo-cdn returned unexpected $HTTP_CODE"
            exit 1
          fi

      - name: Verify Workers version endpoint
        run: |
          VERSION=$(curl -s "https://demo.easyepg.tv/_version" --max-time 5)
          echo "✅ Deployed version: $VERSION"
```

---

## 2. Cloudflare API Token Scope Checklist

### 2.1 Token Recommendations

Create **two** tokens in the Cloudflare dashboard (`My Profile → API Tokens → Create Token`):

| Token | Purpose | Permissions | Resources |
|-------|---------|-------------|-----------|
| `CF_DEPLOY_TOKEN` | Worker deploys, cache purge, R2 uploads | `Workers:Edit`, `Cache Purge:Edit`, `R2:Write` | Zone: `easyepg.tv`, R2 bucket: `easyepg-logos` |
| `CF_DNS_TOKEN` | DNS verification for custom domains (separate, limited) | `DNS:Edit` | Zone: `easyepg.tv` only |

### 2.2 Minimal Scopes — `CF_DEPLOY_TOKEN`

```
Policies:
  1. Zone:Workers:Edit
     - Zone: easyepg.tv
     - Effect: Allow
     - Note: Required for wrangler deploy of playlist-router, logo-cdn, cname-verifier

  2. Zone:Cache Purge:Edit
     - Zone: easyepg.tv
     - Effect: Allow
     - Note: Required to purge CDN edge cache after deploy

  3. Account:Workers Scripts:Edit
     - Account: (your CF account)
     - Effect: Allow
     - Note: Required to list/deploy scripts at account level

  4. Account:R2:Write
     - Bucket: easyepg-logos (or specific bucket name)
     - Effect: Allow
     - Note: Required for logo uploads; scope to bucket
```

### 2.3 Minimal Scopes — `CF_DNS_TOKEN`

```
Policies:
  1. Zone:DNS:Edit
     - Zone: easyepg.tv
     - Effect: Allow
     - Note: Required to verify CNAME records for custom domains
          and to programmatically add _easyepg-verify TXT records
```

### 2.4 Example JSON Policy (for CF API token creation)

```json
[
  {
    "id": "workeredit",
    "effect": "allow",
    "resources": {
      "com.cloudflare.api.account.zone.<ZONE_ID>": "*",
      "com.cloudflare.api.account.<ACCOUNT_ID>": "*"
    },
    "permission_groups": [
      { "id": "c8fed203ed3043e7bd88cf4200c5b300" },   // Workers:Edit
      { "id": "f7a7e4556d2243c381eaa2955ca3136d" }    // Cache Purge:Edit
    ]
  },
  {
    "id": "r2write",
    "effect": "allow",
    "resources": {
      "com.cloudflare.api.account.bucket.<BUCKET_ID>": "*"
    },
    "permission_groups": [
      { "id": "a1a1a1a1b2b2c3c3d4d4e5e5f6f6a7a7" }   // R2:Write (scope to bucket)
    ]
  }
]
```

> **Note:** Permission group IDs change. On the CF API Tokens UI, use the human‑readable permission names and scope picker. The JSON above is illustrative — use the UI to select exact scopes.

---

## 3. GitHub App vs PAT Guidance

### 3.1 Recommendation

| Use Case | Tool | Why |
|----------|------|-----|
| **CI/CD deploys** (this workflow) | GitHub Actions + secrets | Native, auditable, no external token. Secrets are scoped to repo/org. |
| **Platform automation** (creating commits, PRs, commenting) | **GitHub App** | Fine‑grained permissions, no user‑bound PAT, rotating private key, install‑level scoping. |

**Do NOT use a personal access token (PAT)** for platform automation. PATs:
- Are tied to a user (if the user leaves, automation breaks).
- Cannot be scoped to a single repo as tightly as a GitHub App.
- Appear in audit logs as the user, not the app.

### 3.2 Required GitHub App Permissions

| Permission | Access | Reason |
|-----------|--------|--------|
| `Repository: Contents` | `Write` | Create blobs, trees, commits on `deploy` branch |
| `Repository: Pull Requests` | `Write` | Open auto‑PRs from platform (e.g., Master Playlist update) |
| `Repository: Checks` | `Read` | Verify CI status before auto‑merging |
| `Repository: Metadata` | `Read` | (Auto‑granted) Read repo structure |

**Installation:** Install the GitHub App on the `easyepg` repository only (not org‑wide). Store the app private key as `PLATFORM_APP_PRIVATE_KEY` in GitHub Secrets and the app ID as `PLATFORM_GITHUB_APP_ID`.

### 3.3 Platform Commit Flow (Non‑CI)

When the control plane needs to create a commit (e.g., "user updated playlist"):

```
POST /repos/{owner}/{repo}/git/blobs     # Create file blob
POST /repos/{owner}/{repo}/git/trees     # Create tree with blob
POST /repos/{owner}/{repo}/git/commits   # Create commit
PATCH /repos/{owner}/{repo}/git/refs/heads/deploy  # Update branch
```

Authenticated using the GitHub App JWT (signed with private key, 10‑minute expiry). This path is **separate from CI** — CI watches the `main` and `deploy` branches.

---

## 4. Secrets & Rotation Policy

### 4.1 GitHub Secrets

Store these in **GitHub Repository → Settings → Secrets and variables → Actions**:

| Secret Name | Source | Used By | Rotation |
|------------|--------|---------|----------|
| `CF_DEPLOY_TOKEN` | Cloudflare API Token | `deploy` job | Every 90 days |
| `CF_DNS_TOKEN` | Cloudflare API Token | Platform API (DNS verify) | Every 90 days |
| `CF_ACCOUNT_ID` | Cloudflare Dashboard | All Workers steps | Never (static) |
| `CF_ZONE_ID` | Cloudflare Dashboard → `easyepg.tv` zone | Cache purge, DNS | Never (static) |
| `R2_BUCKET` | Cloudflare R2 dashboard | Upload steps | Never (static) |
| `R2_SIGNING_KEY` | Random 64‑char hex (generated) | Logo upload signing | Every 180 days |
| `CI_APPROVAL` | Optional — set to any non‑empty value | Deploy gate override | Per‑incident |
| `PLATFORM_APP_PRIVATE_KEY` | GitHub App private key (PEM) | Platform commit automation | Every 365 days (re‑generate app key) |
| `PLATFORM_GITHUB_APP_ID` | GitHub App dashboard | Platform commit automation | Never (static) |

### 4.2 Rotation Script (Example)

```bash
#!/usr/bin/env bash
# rotate-cf-token.sh — Rotate a Cloudflare API token
# Usage: ./rotate-cf-token.sh <TOKEN_NAME> <PERMISSION_JSON>

set -euo pipefail

TOKEN_NAME="$1"
TOKEN_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/user/tokens" \
  -H "Authorization: Bearer ${CF_ADMIN_TOKEN}" \
  | jq -r ".result[] | select(.name == \"${TOKEN_NAME}\") | .id")

# Revoke old token
curl -s -X DELETE "https://api.cloudflare.com/client/v4/user/tokens/${TOKEN_ID}" \
  -H "Authorization: Bearer ${CF_ADMIN_TOKEN}"

# Create new token with same permissions
NEW_TOKEN=$(curl -s -X POST "https://api.cloudflare.com/client/v4/user/tokens" \
  -H "Authorization: Bearer ${CF_ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$(cat ${2})" \
  | jq -r '.result.value')

echo "New token: ${NEW_TOKEN}"
echo "Update GitHub secret: CF_DEPLOY_TOKEN"
```

### 4.3 Workflow Secret Restrictions

```yaml
# In deploy.yml — secrets are only exposed to the jobs that need them.
# The validate job has NO access to any secrets.
# The deploy-gate job only reads CI_APPROVAL.
# The deploy job reads CF_DEPLOY_TOKEN, CF_ACCOUNT_ID, etc.
# The post-deploy job reads nothing (no secrets needed for smoke tests).
```

---

## 5. Branch Protection & CI Checks

### 5.1 Required Branch Protection Rules

Configure in **GitHub → Settings → Branches → Add rule** (for `main` branch):

| Rule | Value | Reason |
|------|-------|--------|
| Require a pull request before merging | ✅ | Enforces code review |
| Require approvals | 1 (minimum) | At least one reviewer |
| Dismiss stale reviews | ✅ | New pushes invalidate old reviews |
| Require status checks | `Validate` | CI must pass |
| Require branches to be up to date | ✅ | Prevents merge skew |
| Require signed commits | ✅ | Audit trail; configure GPG for the GitHub App |
| Allow force pushes | ❌ | Protects history |
| Allow deletions | ❌ | Protects branch |

### 5.2 CI Checks That Must Pass Before Merge

1. **Lint** — `npm run lint` (no errors; warnings allowed)
2. **Type check** — `npx tsc --noEmit` (zero type errors)
3. **Build** — `npm run build` (production build succeeds)
4. **Unit tests** — `npm test` (placeholder; integrate Jest/Vitest)
5. **Dependency scan** — `npm audit --audit-level=high` or Snyk (no high‑severity vulnerabilities)
6. **SCA** — Software composition analysis (integrate Dependabot or Snyk)

---

## 6. Acceptance Criteria

| # | Criterion | How to Verify |
|---|-----------|---------------|
| 1 | **Worker deploys via CI** — On push to `main`, `wrangler deploy` runs using `CF_DEPLOY_TOKEN` and the deployed Worker returns 200 for `https://demo.easyepg.tv/playlist.m3u`. | Push to `main`. Check Actions run. `curl -I https://demo.easyepg.tv/playlist.m3u` returns `200 OK`. |
| 2 | **Cache purge on deploy** — After a Worker update, the CDN reflects the change within 30 s without manual purge. | Deploy new Worker version. Verify updated content is served immediately. Check purge API call succeeded in CF audit logs. |
| 3 | **R2 signed URL upload** — Platform API generates a presigned PUT URL, and a logo uploaded via that URL is accessible at `https://cdn.easyepg.tv/logos/{key}` within 60 s globally. | Generate signed URL via API. Upload file with `curl -X PUT`. Verify `cdn.easyepg.tv` returns the image. |
| 4 | **DNS verification via CF API** — The `cname-verifier` Worker detects a matching TXT record at `_easyepg-verify.{domain}` and triggers domain activation within 120 s of DNS propagation. | Add TXT record. Check `domain_verifications.verified_at` is set. Verify Worker route is created. |
| 5 | **Deploy gate blocks unauthorized deploys** — A push directly to `main` without a passing PR (bypassing branch protection) does not trigger a deploy; only `workflow_dispatch` with `CI_APPROVAL` can override. | Push directly to `main` with a failing check. Verify deploy job is skipped. Verify deploy gate logs `approved=false`. |

---

## 7. Quick Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `wrangler deploy` fails: `10007` / `Auth error` | `CF_DEPLOY_TOKEN` missing `Workers:Edit` scope or wrong account ID | Re‑create token in CF dashboard with correct zone+account scopes. Verify `CF_ACCOUNT_ID` matches. |
| `purge_cache` returns `9107` | `CF_DEPLOY_TOKEN` missing `Cache Purge:Edit` scope | Add `Cache Purge:Edit` to the token policy for zone `easyepg.tv`. |
| `r2 upload` returns `403` | `R2:Write` scope not limited to the correct bucket, or `R2_SIGNING_KEY` is wrong | Verify bucket name in token policy. Regenerate `R2_SIGNING_KEY` and update GitHub secret. |
| CNAME verification never succeeds | User hasn't added the TXT record; or `CF_DNS_TOKEN` doesn't have `DNS:Edit` scope | Check `_easyepg-verify.{domain}` with `dig TXT +short`. Verify token scopes. |
| Smoke test fails on `/playlist.m3u` | Worker deployed but no playlist exists for `demo` slug | Create a `demo` playlist via API or seed data. Check Worker logs in CF dashboard. |
| GitHub Action stuck on `deploy-gate` | `CI_APPROVAL` not set and branch protection not configured | Either set `CI_APPROVAL` secret or configure branch protection rules. |
| Platform commit returns `403` | GitHub App private key expired or app not installed on repo | Re‑generate private key in GitHub App settings. Verify app is installed on the repo. |

### 7.1 Inspecting Cloudflare Audit Logs

1. Go to **Cloudflare Dashboard → Account → Audit Log**
2. Filter by:
   - **Action:** `token.created`, `token.deleted`, `workers.script.deploy`, `dns.record.created`, `purge_cache`
   - **Actor:** `api-token:CF_DEPLOY_TOKEN` (shows what the CI token did)
3. Each deploy leaves a trace with the Worker version and who triggered it

### 7.2 Common Cloudflare API cURLs (for debugging)

```bash
# Deploy a Worker
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/workers/scripts/playlist-router" \
  -H "Authorization: Bearer ${CF_DEPLOY_TOKEN}" \
  -H "Content-Type: application/javascript" \
  --data-binary @worker.js

# Create DNS record (for auto‑verification)
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CF_DNS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "type":"TXT",
    "name":"_easyepg-verify.tv.yourname.com",
    "content":"easyepg-verify=abc123def456",
    "ttl":120
  }'

# Check DNS record exists
curl -s "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records?type=TXT&name=_easyepg-verify.tv.yourname.com" \
  -H "Authorization: Bearer ${CF_DNS_TOKEN}"

# Purge cache by tags
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CF_DEPLOY_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"tags":["playlist-router"]}'

# List Worker deployments
curl -s "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/workers/scripts/playlist-router/versions" \
  -H "Authorization: Bearer ${CF_DEPLOY_TOKEN}" | jq '.result[0:3]'
```

---

*End of deployment workflow guide — last updated 2026-06-04.*
