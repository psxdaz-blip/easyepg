# EasyEPG — UI Ruleset & Low‑Fi Wireframes

> **Target user:** Non‑technical personal IPTV users.  
> **Visual constraint:** White background, oversized buttons, high contrast, zero chrome.  
> **Automation baked in:** Every screen defaults to auto‑apply — user opts *out*, never in.

---

## Table of Contents

1. [CSS Design Tokens](#1-css-design-tokens)
2. [Component Specs](#2-component-specs)
3. [Interaction & Automation Rules](#3-interaction--automation-rules)
4. [Wireframes](#4-wireframes)
5. [Accessibility](#5-accessibility)
6. [Mobile Behavior](#6-mobile-behavior)
7. [Onboarding Microcopy Script](#7-onboarding-microcopy-script)

---

## 1. CSS Design Tokens

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#FFFFFF` | Page background |
| `--bg-card` | `#F8F9FA` | Card / channel row background |
| `--bg-hover` | `#F0F1F3` | Hover state for cards |
| `--text-primary` | `#1A1A1A` | Headings, body text |
| `--text-secondary` | `#5F6368` | Labels, timestamps, secondary info |
| `--text-muted` | `#9AA0A6` | Placeholders, disabled text |
| `--accent` | `#2563EB` | Primary CTAs, active states, links |
| `--accent-hover` | `#1D4ED8` | CTA hover |
| `--accent-soft` | `#EFF6FF` | AI badge background, selected state |
| `--success` | `#16A34A` | Verified, auto‑applied, positive |
| `--warning` | `#D97706` | Pending, threshold near‑limit |
| `--danger` | `#DC2626` | Destructive actions, errors |
| `--border` | `#E5E7EB` | Card borders, dividers |
| `--focus-ring` | `#2563EB` | Keyboard focus outline (3 px) |

### Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `8 px` | Inline icon gaps, compact labels |
| `--space-sm` | `12 px` | Between label + value in cards |
| `--space-md` | `16 px` | Card inner padding |
| `--space-lg` | `24 px` | Between sections, page gutter (mobile) |
| `--space-xl` | `32 px` | Page gutter (desktop), between major blocks |
| `--space-2xl` | `48 px` | Hero section padding, between screens |

### Typography

| Token | Value | Weight | Usage |
|-------|-------|--------|-------|
| `--font-base` | `16 px` | `400` | Body text, card content |
| `--font-lg` | `18 px` | `400` | Large body, toast messages |
| `--font-h2` | `22 px` | `600` | Section headers |
| `--font-h1` | `32 px` (mobile), `36 px` (desktop) | `700` | Page titles, hero headline |
| `--font-cta` | `18 px` | `600` | Button labels |
| `--font-small` | `14 px` | `400` | Captions, timestamps, badges |
| `--font-tiny` | `12 px` | `500` | Badge text, AI confidence score |
| `--line-height` | `1.6` | — | Body text |
| `--font-family` | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` | — | System font stack |

### Sizing

| Token | Value | Usage |
|-------|-------|-------|
| `--btn-min-height` | `56 px` | All interactive elements |
| `--btn-min-width` | `56 px` | Icon buttons |
| `--btn-padding-x` | `32 px` | Horizontal padding for buttons |
| `--btn-border-radius` | `12 px` | Rounded corners on buttons |
| `--card-border-radius` | `16 px` | Card rounding |
| `--card-padding` | `16 px` | Inner card padding |
| `--page-max-width` | `640 px` | Content max‑width (desktop) |
| `--page-gutter` | `24 px` mobile / `32 px` desktop | Side margins |
| `--avatar-size` | `40 px` | Channel logo (card) |
| `--avatar-size-lg` | `80 px` | Channel logo (detail modal) |

---

## 2. Component Specs

### 2.1 BigButton

| Property | Value |
|----------|-------|
| Min height | `56 px` |
| Padding | `16 px 32 px` (top/bottom, left/right) |
| Border radius | `12 px` |
| Font | `18 px`, `600 weight`, `--text-primary` or `#FFFFFF` |
| Background | `--accent` (primary), `--bg-card` (secondary) |
| States | `default`, `hover` (darken 5%), `active` (darken 10%), `disabled` (opacity 0.4), `loading` (show spinner + "Working…") |
| Focus | 3 px `--focus-ring` offset 2 px |
| Transitions | background 150 ms ease, transform 100 ms ease (scale 0.97 on tap) |
| Aria | `role="button"`, `aria-label` required on all |

**Variants:**

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| Primary | `--accent` | `#FFFFFF` | None |
| Secondary | `--bg-card` | `--text-primary` | 1.5 px `--border` |
| Success | `--success` | `#FFFFFF` | None |
| Danger | `--danger` | `#FFFFFF` | None |
| Ghost | Transparent | `--text-secondary` | None |
| AI Auto | `--accent-soft` | `--accent` | None, shows 🤖 icon |

### 2.2 ChannelCard

```
┌─────────────────────────────────────────────────┐
│ [logo]  Channel Name               ⋮⋮ (drag)   │
│ 40×40   Next: 19:30 – Movie Title               │
│         Group: Entertainment  [AI ⚡ 0.92]       │
└─────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Width | `100%` of container |
| Height | `72 px` (compact), `88 px` (with AI badge) |
| Padding | `12 px 16 px` |
| Logo size | `40 × 40 px`, `border-radius: 8 px` |
| Background | `--bg-card` |
| Hover | `--bg-hover` |
| Drag handle | Right edge, 24 px wide grip icon, `cursor: grab` |
| Fields | Logo, Channel Name (--font-base, 600), Next program (--font-small, --text-secondary), Group label (--font-tiny, --text-muted), AI badge (optional) |
| Aria | `role="listitem"`, `aria-label="{name}, next: {program} at {time}"` |

### 2.3 AI Badge

```
 ┌─────────────┐
 │ 🤖 0.92     │  ← Green = auto‑applied
 └─────────────┘
 ┌─────────────┐
 │ 🤖 0.68     │  ← Yellow = pending review
 └─────────────┘
```

| Property | Value |
|----------|-------|
| Height | `24 px` |
| Padding | `4 px 10 px` |
| Border radius | `20 px` (pill) |
| Font | `12 px`, `500 weight`, caps? No, sentence case |
| Background | `--accent-soft` (auto), `--warning` at 15% opacity (pending) |
| Text | `--accent` (auto), `--warning` (pending) |
| Visibile | Always shown on AI‑matched content, hidden on manual |

### 2.4 CategoryPill

```
 ┌──────────────┐
 │ Entertainment │
 └──────────────┘
```

| Property | Value |
|----------|-------|
| Height | `32 px` |
| Padding | `6 px 16 px` |
| Border radius | `20 px` (pill) |
| Font | `14 px`, `500 weight` |
| Background | `--bg-card` (default), `--accent-soft` (selected) |
| Text | `--text-secondary` (default), `--accent` (selected) |
| States | `default`, `selected` (toggled), `hover` |
| Aria | `role="checkbox"`, `aria-checked` |

### 2.5 TwoPaneCopy

**Desktop layout (side‑by‑side):**

```
┌─────────────────────┐  ┌─────────────────────┐
│  Master Playlist    │  │  My Playlist        │
│  ┌─── 120 channels  │  │  ┌─── 45 channels   │
│  │ [ChannelCard]    │  │  │ [ChannelCard]    │
│  │ [ChannelCard]    │  │  │ [ChannelCard]    │
│  │ [ChannelCard]    │  │  │ [ChannelCard]    │
│  └───               │  │  └───               │
│                     │  │                     │
│  [Copy All] [Smart  │  │  [Remove All]       │
│   Suggest ▼]        │  │                     │
└─────────────────────┘  └─────────────────────┘
```

| Property | Value |
|----------|-------|
| Container | `display: grid; grid-template-columns: 1fr 1fr; gap: 24 px` |
| Each pane | `--bg-card`, `border-radius: 16 px`, `padding: 16 px` |
| Channel list | `max-height: 60 vh`, `overflow-y: auto` |
| Copy All button | BigButton Primary at bottom of left pane |
| Smart Suggest | BigButton AI Auto variant, dropdown arrow |
| Remove All | BigButton Danger at bottom of right pane |

### 2.6 Toast

| Property | Value |
|----------|-------|
| Position | Fixed bottom center, `32 px` from bottom |
| Padding | `16 px 24 px` |
| Border radius | `12 px` |
| Background | `#1A1A1A` (dark, over white bg) |
| Text | `#FFFFFF`, `18 px` |
| Duration | Auto‑dismiss after 4 s, or 8 s for undo |
| Undo | Inline secondary button "Undo" within toast |
| Enter animation | Slide up 20 px + fade in, 250 ms |
| Exit animation | Fade out + slide down, 200 ms |

---

## 3. Interaction & Automation Rules

### 3.1 Default Automation Table

| User Action | System Does | Asks? | Auto‑apply Condition |
|------------|-------------|-------|---------------------|
| Signs up | Detects language, region, timezone | No | Always |
| Onboarding step 2 | Sets AI threshold to 0.75 (default) | No | Always — can be toggled off in Settings |
| Clicks "Create My Playlist" | Copies Master Playlist, filters by region, orders by language | No | Always |
| Uploads a logo | AI‑matches to channel | No, shows badge | If confidence > 0.85 → auto‑apply + toast |
| Drags channel from Master to My Playlist | Copies channel | No | Always |
| Clicks "Copy All" | Copies all visible Master channels | No | Always |
| Clicks "Smart Suggest" | AI selects channels for region/language | Shows count + avg confidence | If avg confidence > 0.75 → auto‑apply |
| Adds custom domain | Generates CNAME line, starts DNS polling | No | Always — shows status |
| Custom domain DNS found | Marks verified, provisions SSL | No | Always |
| Destructive action (delete playlist) | Shows undo toast | Yes | Toast with 8 s undo window |

### 3.2 Confidence Threshold Strategy

| Threshold | Behavior | Default? |
|-----------|----------|----------|
| >= 0.85 | Auto‑apply silently. Show "🤖 Auto‑applied" badge. | Yes |
| 0.75 – 0.84 | Auto‑apply but show toast: "Channel suggestion auto‑applied. Tap to undo." | Yes (default threshold) |
| 0.50 – 0.74 | Queue for review. Show badge in "Suggestions" panel. | No |
| < 0.50 | Discard silently. Log for model improvement. | No |

### 3.3 Undo Pattern

Every destructive or bulk action triggers an undo toast:

```
 ┌────────────────────────────────────────────────────┐
 │ ✅ 45 channels copied to My Playlist    [Undo]    │
 └────────────────────────────────────────────────────┘
```

- Toast appears at bottom center
- "Undo" is a secondary BigButton (text only, `--font-cta`, accent color)
- Tap Undo → reverses the action (re‑enables channels, re‑adds removed items)
- After 8 s → toast dismisses, action is permanent

### 3.4 Logo Upload Flow

```
1. User taps big "+" button at channel card
2. OS file picker opens (accepts .png, .jpg, .webp)
3. On selection:
   ┌─────────────────────────────────────────────┐
   │  Uploading…                                  │
   │  ████████████░░░░░░░░░░  65%                 │
   └─────────────────────────────────────────────┘
4. AI matches → shows:
   ┌─────────────────────────────────────────────┐
   │  Matched: HBO (confidence 0.92)             │
   │  [Accept] [Try Another]                     │
   │  Auto‑applied ✓ (confidence > 0.85)         │
   └─────────────────────────────────────────────┘
5. If auto‑applied: toast "Logo set for HBO 🤖 [Undo]"
6. Logo appears in channel card immediately
```

---

## 4. Wireframes

### 4.1 Landing Page (Hero + Beta Signup)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   ┌─────────────────────────────────────────┐   │
│   │                                         │   │
│   │     easyepg                              │   │
│   │     Your channels, your EPG, one link    │   │
│   │                                         │   │
│   │     ┌───────────────────────────────┐   │   │
│   │     │  Enter your email             │   │   │
│   │     └───────────────────────────────┘   │   │
│   │                                         │   │
│   │     ┌───────────────────────────────┐   │   │
│   │     │  Send me the magic link       │   │   │
│   │     └───────────────────────────────┘   │   │
│   │                                         │   │
│   │     No password. No setup.              │   │
│   │     Works in any IPTV app.              │   │
│   └─────────────────────────────────────────┘   │
│                                                 │
│   ┌─────────────────────────────────────────┐   │
│   │  ✅  Works with TiviMate                │   │
│   │  ✅  Works with IPTV Smarters           │   │
│   │  ✅  Works with VLC, Plex, Jellyfin     │   │
│   └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

**CTAs:**
- Email input + "Send me the magic link" (BigButton Primary, full width)
- Footer text links: none on MVP

**Auto‑actions:**
- On focus/blur of email field → attempt to detect language from `Accept-Language` header (stored for onboarding pre‑fill)

**Microcopy:**
- Input placeholder: `"Enter your email"`
- Button: `"Send me the magic link"`
- Toast on send: `"✉️ Check your inbox. Link expires in 15 min."`

---

### 4.2 Dashboard (Big CTA + Quick Stats)

```
┌─────────────────────────────────────────────────┐
│  ☰  easyepg                        ⚙️ Settings   │
│                                                 │
│   ┌─────────────────────────────────────────┐   │
│   │                                         │   │
│   │  Welcome, dazzy@email.com               │   │
│   │                                         │   │
│   │  ┌─────────────────────────────────┐    │   │
│   │  │  Create My Playlist             │    │   │  ← BigButton Primary, full width
│   │  └─────────────────────────────────┘    │   │
│   │                                         │   │
│   │  Already have a playlist?               │   │
│   │  ┌─────────────────────────────────┐    │   │
│   │  │  Edit My Playlist         →     │    │   │  ← BigButton Secondary
│   │  └─────────────────────────────────┘    │   │
│   └─────────────────────────────────────────┘   │
│                                                 │
│   ┌──────────────┐  ┌──────────────┐            │
│   │  45 channels  │  │  95% EPG     │            │
│   │  in playlist  │  │  coverage    │            │
│   └──────────────┘  └──────────────┘            │
│                                                 │
│   ┌──────────────┐  ┌──────────────┐            │
│   │  ⚡ 12 AI     │  │  🌐 domain   │            │
│   │  suggestions  │  │  not set     │            │
│   └──────────────┘  └──────────────┘            │
│                                                 │
└─────────────────────────────────────────────────┘
```

**CTAs:**
- "Create My Playlist" (BigButton Primary) — first time only
- "Edit My Playlist →" (BigButton Secondary) — appears after creation
- Settings gear (top right, icon button, 56×56)

**Auto‑actions:**
- On first load: if no playlist exists, "Create My Playlist" is hero CTA
- After creation: "Edit My Playlist" replaces hero
- Stats cards auto‑populate from backend

**Microcopy:**
- Hero button: `"Create My Playlist"`
- Edit button: `"Edit My Playlist →"` (arrow indicates navigation)
- Stats format: `"{count} channels"`, `"{percent}% EPG coverage"`

---

### 4.3 Create My Playlist Flow (One‑Tap Result)

```
┌─────────────────────────────────────────────────┐
│  ← Back          easyepg                         │
│                                                 │
│   ✅ Playlist created!                           │
│                                                 │
│   ┌─────────────────────────────────────────┐   │
│   │  Your playlist is ready                  │   │
│   │                                         │   │
│   │  📺 45 channels                           │   │
│   │  📡 EPG loaded for next 7 days           │   │
│   │  🔗 easyepg.tv/dazzy/playlist.m3u       │   │
│   │                                         │   │
│   │  ┌─────────────────────────────────┐    │   │
│   │  │  Copy link to clipboard         │    │   │
│   │  └─────────────────────────────────┘    │   │
│   │                                         │   │
│   │  ┌─────────────────────────────────┐    │   │
│   │  │  Open in my IPTV app            │    │   │  ← Opens instructions modal
│   │  └─────────────────────────────────┘    │   │
│   │                                         │   │
│   │  ┌─────────────────────────────────┐    │   │
│   │  │  Edit playlist        →         │    │   │
│   │  └─────────────────────────────────┘    │   │
│   └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Auto‑actions:**
- System automatically copied Master, applied region filter, ordered by language
- EPG merge ran in background (no waiting)
- Playlist URL is live on Worker immediately

**Microcopy:**
- Success heading: `"✅ Playlist created!"`
- URL label: `"Your playlist link"`
- Button: `"Copy link to clipboard"`
- Toast on copy: `"🔗 Link copied! Paste it in your IPTV app."`

---

### 4.4 Master Playlist Editor (Full Width Channel List)

```
┌─────────────────────────────────────────────────┐
│  ← Back    Master Playlist (120 channels)        │
│                                                 │
│  🔍 ┌───────────────────────────────────────┐   │
│     │  Search channels...                   │   │
│     └───────────────────────────────────────┘   │
│                                                 │
│  [All] [Entertainment] [Sports] [News] [...]    │  ← CategoryPills, scrollable
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ [📺] HBO          ⋮ ⋮  🤖 0.92         │    │  ← ChannelCard
│  │      Next: 21:00 – The Last of Us       │    │
│  ├─────────────────────────────────────────┤    │
│  │ [📺] ESPN           ⋮ ⋮                │    │
│  │      Next: 19:30 – SportsCenter         │    │
│  ├─────────────────────────────────────────┤    │
│  │ [📺] CNN             ⋮ ⋮               │    │
│  │      Next: 20:00 – Anderson Cooper 360  │    │
│  ├─────────────────────────────────────────┤    │
│  │ (43 more channels…)                      │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  Copy to My Playlist        →           │    │  ← BigButton Primary, sticky bottom
│  └─────────────────────────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```

**CTAs:**
- Search input (auto‑focus, live filter)
- CategoryPills (horizontal scroll, no wrap)
- "Copy to My Playlist →" (sticky bottom, only appears when channels selected — or use Smart Suggest)

**Auto‑actions:**
- On first visit: AI pre‑selects channels matching user's region/language
- Selected count updates in real time: "45 of 120 selected"

**Microcopy:**
- Search placeholder: `"Search channels..."`
- Empty search: `"No channels match "{query}". Try a different name."`
- Copy button (dynamic): `"Copy {n} selected →"` or `"Copy All (120) →"`

---

### 4.5 Personal Playlist Editor (Two‑Pane Copy Flow)

**Desktop (side‑by‑side):**

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back    My Playlist                                      │
│                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │  Master (120)      🔍   │  │  My Playlist (45)       │   │
│  │                         │  │                         │   │
│  │ [HBO]              ⋮⋮  │  │ [HBO]              ⋮⋮  │   │
│  │ [ESPN]             ⋮⋮  │  │ [ESPN]             ⋮⋮  │   │
│  │ [CNN]              ⋮⋮  │  │ [Discovery]        ⋮⋮  │   │
│  │ [Discovery]        ⋮⋮  │  │ [NGC]              ⋮⋮  │   │
│  │ [NGC]              ⋮⋮  │  │ [Cartoon Network]  ⋮⋮  │   │
│  │ (115 more…)            │  │ (40 more…)             │   │
│  │                         │  │                         │   │
│  │ ┌──────────┐┌────────┐ │  │ ┌──────────────┐       │   │
│  │ │ Copy All ││ Smart  │ │  │ │ Remove All   │       │   │
│  │ │          ││ Suggest│ │  │ └──────────────┘       │   │
│  │ └──────────┘└────────┘ │  │                         │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  ✅ 45 channels · 95% EPG · 🔗 copy playlist link  │    │  ← Sticky footer bar
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Mobile (single‑column, modal copy):**

```
┌─────────────────────────────────────────────────┐
│  ← Back    My Playlist (45)                      │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ ⚡ Smart Suggest tapped                  │    │
│  │                                         │    │
│  │ AI suggests adding 12 channels:         │    │
│  │   • BBC One (0.92) ✅ auto              │    │
│  │   • ITV (0.88) ✅ auto                  │    │
│  │   • Channel 4 (0.72) ⏳ review          │    │
│  │   • (9 more…)                           │    │
│  │                                         │    │
│  │ ┌─────────────────────────────────┐     │    │
│  │ │  Copy 12 Selected               │     │    │  ← BigButton Primary
│  │ └─────────────────────────────────┘     │    │
│  │ ┌─────────────────────────────────┐     │    │
│  │ │  Dismiss                        │     │    │
│  │ └─────────────────────────────────┘     │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ [HBO]  Next: 21:00 – The Last of Us  ⋮⋮ │    │
│  │ [ESPN] Next: 19:30 – SportsCenter    ⋮⋮ │    │
│  │ (43 more…)                               │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```

**CTAs:**
- "Copy All" (BigButton Primary, left pane)
- "Smart Suggest" (BigButton AI Auto, left pane)
- "Remove All" (BigButton Danger, right pane)
- Individual channel drag handle (grab cursor, touch‑friendly)

**Auto‑actions:**
- Smart Suggest opens a modal showing AI‑selected channels with confidence scores
- Channels above 0.75 are pre‑checked with "auto" label
- "Copy 12 Selected" copies all checked channels

**Microcopy:**
- Smart Suggest heading: `"⚡ AI suggests adding {n} channels"`
- Auto label: `"✅ auto"` (green)
- Review label: `"⏳ review"` (yellow)
- Button: `"Copy {n} Selected"`

---

### 4.6 Channel Detail Modal

```
┌─────────────────────────────────────────────────┐
│  ✕ Close                                          │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │                                         │    │
│  │         ┌─────────────────────┐          │    │
│  │         │                     │          │    │
│  │         │     [📺 Logo]       │          │    │  ← 80×80 px oversized
│  │         │                     │          │    │
│  │         └─────────────────────┘          │    │
│  │                                         │    │
│  │           HBO                             │    │  ← H1 (32 px)
│  │           Entertainment · English         │    │  ← --font-base, --text-secondary
│  │                                         │    │
│  │  ┌─────────────────────────────────┐    │    │
│  │  │  Upload custom logo        +    │    │    │  ← BigButton Secondary
│  │  └─────────────────────────────────┘    │    │
│  │                                         │    │
│  │  Now:  The Last of Us                   │    │
│  │  Next:  21:00 – 22:30  House of the     │    │
│  │         Dragon                          │    │
│  │  Later: 23:00 – 00:30  The Penguin      │    │
│  │                                         │    │
│  │  ┌─────────────────────────────────┐    │    │
│  │  │  Remove from my playlist        │    │    │  ← BigButton Danger (ghost variant)
│  │  └─────────────────────────────────┘    │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Fields (oversized, tap‑friendly):**
- Logo: 80×80 px, rounded, tappable for upload
- Channel name: 32 px bold
- Meta: Group + language (--font-base, --text-secondary)
- Now / Next / Later: 3 rows, --font-lg, generous line height
- Upload button: full width, icon + text
- Remove: ghost danger button, centered

**Auto‑actions:**
- If user uploaded a logo that was AI‑matched, show match badge
- Auto‑accept if confidence > 0.85 (show "✅ Auto‑applied" badge on logo)
- EPG data auto‑loaded for next 7 days (user sees Now/Next/Later without scrolling)

**Microcopy:**
- Upload button: `"Upload custom logo  +"`
- AI match badge: `"🤖 Auto‑applied (0.92)"`
- Remove: `"Remove from my playlist"`
- Toast on remove: `"HBO removed  [Undo]"`

---

### 4.7 Branding & Domain Card

```
┌─────────────────────────────────────────────────┐
│  ← Back    Settings                              │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  🎨  Branding & Domain                  │    │
│  │                                         │    │
│  │  Your playlist link                      │    │
│  │  ┌─────────────────────────────────┐    │    │
│  │  │ 🔗 easyepg.tv/dazzy/playlist.m3u│    │    │
│  │  └─────────────────────────────────┘    │    │
│  │  ┌─────────────────────────────────┐    │    │
│  │  │  Copy link                       │    │    │  ← BigButton Secondary
│  │  └─────────────────────────────────┘    │    │
│  │                                         │    │
│  │  ─── Custom Domain ───                  │    │
│  │                                         │    │
│  │  Your own domain:                       │    │
│  │  ┌─────────────────────────────────┐    │    │
│  │  │  tv.yourname.com                 │    │    │  ← Input, --font-lg
│  │  └─────────────────────────────────┘    │    │
│  │                                         │    │
│  │  1. Add this DNS record:                │    │
│  │  ┌─────────────────────────────────┐    │    │
│  │  │ tv.yourname.com  CNAME  custom. │    │    │  ← Code block, selectable
│  │  │ easyepg.tv                      │    │    │
│  │  └─────────────────────────────────┘    │    │
│  │  ┌──────────────────────────────┐      │    │
│  │  │  Copy CNAME line              │      │    │  ← BigButton Secondary
│  │  └──────────────────────────────┘      │    │
│  │                                         │    │
│  │  ┌─────────────────────────────────┐    │    │
│  │  │  Verify domain                  │    │    │  ← BigButton Primary, green when verified
│  │  └─────────────────────────────────┘    │    │
│  │                                         │    │
│  │  ┌─────────────────────────────────┐    │    │
│  │  │  ⏳ Waiting for DNS…             │    │    │  ← Status badge (yellow dot)
│  │  │  Last checked: 30s ago          │    │    │
│  │  │  ┌─────────────────────────┐    │    │    │
│  │  │  │  Check again             │    │    │    │  ← Ghost button
│  │  │  └─────────────────────────┘    │    │    │
│  │  └─────────────────────────────────┘    │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```

**CTAs:**
- Copy link (BigButton Secondary)
- Domain input (auto‑validates, shows "Invalid domain" inline error)
- Copy CNAME line (BigButton Secondary)
- Verify domain (BigButton Primary, disabled while polling)

**Auto‑actions:**
- System generates CNAME line as user types domain
- "Verify domain" starts polling (Worker checks TXT record every 60 s)
- Polling status updates automatically: `"⏳ Waiting for DNS…"` → `"✅ Domain verified!"` → `"🔒 SSL provisioning…"` → `"✅ tv.yourname.com is live!"`
- On verification: toast `"✅ tv.yourname.com is live! Your playlist: https://tv.yourname.com/playlist.m3u"`

**Microcopy:**
- Section header: `"🎨 Branding & Domain"`
- Default link label: `"Your playlist link"`
- Custom domain label: `"Your own domain"`
- CNAME instruction: `"1. Add this DNS record:"`
- Button: `"Verify domain"`
- Status polling: `"⏳ Waiting for DNS…"`
- Verified: `"✅ {domain} verified. SSL active."`

---

## 5. Accessibility

### 5.1 ARIA Labels

| Element | `aria-label` Pattern | Example |
|---------|---------------------|---------|
| BigButton Primary | `"{action}"` | `"Create My Playlist"` |
| BigButton Icon | `"{action}"` | `"Open settings"` |
| ChannelCard | `"{name}, next: {program} at {time}"` | `"HBO, next: The Last of Us at 21:00"` |
| AI Badge | `"AI auto-applied, confidence {score}"` | `"AI auto-applied, confidence 0.92"` |
| CategoryPill | `"Filter by {category}", "selected"` | `"Filter by Sports, selected"` |
| Drag handle | `"Drag to reorder {name}"` | `"Drag to reorder HBO"` |
| Toast | `"Notification: {message}"` | `"Notification: Logo set for HBO"` |
| Search input | `"Search channels"` | — |
| Domain input | `"Enter your custom domain"` | — |
| Copy button | `"Copy {item} to clipboard"` | `"Copy playlist link to clipboard"` |
| Verify domain button | `"Verify domain {domain}"` | `"Verify domain tv.yourname.com"` |

### 5.2 Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move to next interactive element (visible focus ring) |
| `Shift+Tab` | Move to previous interactive element |
| `Enter` / `Space` | Activate button, toggle checkbox, select item |
| `Escape` | Close modal, dismiss toast |
| `Arrow Up/Down` | Navigate channel list |
| `Arrow Left/Right` | Navigate CategoryPills |
| `/` | Focus search input (global shortcut) |

### 5.3 Color Contrast

| Pair | Ratio | WCAG Level |
|------|-------|------------|
| `--text-primary` (#1A1A1A) on `--bg` (#FFFFFF) | 14.5:1 | AAA |
| `--text-secondary` (#5F6368) on `--bg` (#FFFFFF) | 4.8:1 | AA |
| `--text-muted` (#9AA0A6) on `--bg` (#FFFFFF) | 2.9:1 | AA only for large text |
| `--accent` (#2563EB) on `--bg` (#FFFFFF) | 5.8:1 | AAA |
| `#FFFFFF` on `--accent` (#2563EB) | 5.8:1 | AA |
| `--accent` (#2563EB) on `--accent-soft` (#EFF6FF) | 4.2:1 | AA |
| `--success` (#16A34A) on `--bg` (#FFFFFF) | 2.5:1 | AA only for large text — `--text-primary` preferred for success badges |
| `--danger` (#DC2626) on `--bg` (#FFFFFF) | 4.0:1 | AA |

### 5.4 Focus Indicators

- All interactive elements: 3 px solid `--focus-ring` outline, offset 2 px
- `border-radius` respected (outline follows border radius in modern browsers)
- Never remove `outline: none` without providing an alternative
- Focus trap inside modals (Tab cycles within modal, Escape closes)
- Skip‑to‑content link (hidden until focused, first tab stop)

---

## 6. Mobile Behavior

| Screen | Desktop | Mobile (< 768 px) |
|--------|---------|-------------------|
| Landing | Centered card, max 480 px | Full‑width, padded 24 px |
| Dashboard | 2×2 stat grid | 2×2 stat grid, stacked vertically |
| Master Playlist | Full‑width list | Full‑width list, search sticky top |
| Two‑Pane Editor | Side‑by‑side grid | Modal‑based: tap "Add Channels" → modal with Master list + "Copy Selected" button |
| Channel Detail | Centered modal, max 480 px | Full‑screen modal, slide up |
| Settings / Domain | Centered card, max 640 px | Full‑width, padded 24 px |
| Smart Suggest Modal | Overlay modal, 480 px | Bottom sheet, 85% height |

### Mobile‑Specific Rules

- All touch targets ≥ 56×56 px (including drag handles)
- CategoryPills: horizontal scroll with hidden scrollbar (swipeable)
- Search input: auto‑focus on mobile? No — show keyboard only on tap
- Two‑pane copy: replaced by bottom sheet modal with "Copy Selected" BigButton at bottom
- Sticky bottom bars: offset by safe area (`padding-bottom: env(safe-area-inset-bottom, 16 px)`)

### Mobile Two‑Pane Alternative

```
┌─────────────────────────────────────────────────┐
│  ← My Playlist                     Add Channels │  ← Tap → opens modal
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ [HBO]  Next: 21:00 – The Last of Us  ⋮⋮ │    │
│  │ [ESPN] Next: 19:30 – SportsCenter    ⋮⋮ │    │
│  │ (43 more…)                               │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  🔗 Copy playlist link                  │    │  ← Sticky bottom
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─── Add Channels Modal (bottom sheet) ────┐   │
│  │  🔍 ┌────────────────────────────┐        │   │
│  │     │ Search…                    │        │   │
│  │     └────────────────────────────┘        │   │
│  │                                           │   │
│  │  ☐ [HBO]  🤖 0.92                        │   │  ← Checkboxes (56 px tap)
│  │  ☐ [ESPN]                                 │   │
│  │  ☑ [BBC One]  🤖 0.88  ✅ auto           │   │  ← Pre‑checked by AI
│  │  (117 more…)                              │   │
│  │                                           │   │
│  │  ┌──────────────────────────────────┐     │   │
│  │  │  Copy 12 Selected               │     │   │  ← BigButton Primary, sticky
│  │  └──────────────────────────────────┘     │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 7. Onboarding Microcopy Script

### Screen 1: Magic Link (30–60 seconds total)

> **Screen shows:** Email input + big button.
>
> **Copy:**
> ```
> Welcome to EasyEPG
>
> Your channels, your EPG, one link.
>
> Enter your email and we'll send you a magic link.
> No password needed.
> ```
>
> **User types email → taps Send.**
>
> **Toast:** `"✉️ Sent! Check your inbox."`
>
> **Email body:**
> ```
> Subject: Your EasyEPG magic link
>
> Hi there,
>
> Tap the link below to sign in. It expires in 15 minutes.
>
> [Sign in to EasyEPG]
>
> Didn't request this? You can ignore this email.
>
> — EasyEPG
> ```

### Screen 2: Onboarding — Language & Region (~15 seconds)

> **Screen shows:** Two simple dropdowns with auto‑detected values pre‑selected. Oversized radio‑style pickers (56 px tall options).
>
> **Copy:**
> ```
> Let's set up your EPG
>
> What language do you prefer?
> ┌─────────────────────────────┐
> │ ● English                   │  ← Pre‑selected (from browser)
> │ ○ Español                   │
> │ ○ Français                  │
> │ ○ + Add more…               │
> └─────────────────────────────┘
>
> Where are you located?
> ┌─────────────────────────────┐
> │ ● 🇺🇸 United States          │  ← Pre‑selected (from IP)
> │ ○ 🇬🇧 United Kingdom         │
> │ ○ 🇨🇦 Canada                 │
> │ ○ + Add more…               │
> └─────────────────────────────┘
>
> ┌─────────────────────────────┐
> │  Continue                   │
> └─────────────────────────────┘
> ```
>
> **Micro‑explanations (below dropdowns):**
> ```
> Language = channel names and EPG descriptions.
> Region = which channels appear first.
> Don't worry, you can change both later.
> ```

### Screen 3: AI Preferences (~10 seconds)

> **Screen shows:** One toggle with default = ON.
>
> **Copy:**
> ```
> AI Assistance
>
> EasyEPG can automatically apply channel suggestions
> when it's confident (above 75%).
>
> ┌─────────────────────────────────────┐
> │  🤖 Auto‑apply suggestions    ● ON  │  ← Toggle, default ON
> └─────────────────────────────────────┘
>
> Manual suggestions will still appear for
> anything below the confidence threshold.
>
> ┌─────────────────────────────────────┐
> │  Let's go →                         │
> └─────────────────────────────────────┘
> ```

### Screen 4: Ready (auto‑redirects after 2 seconds)

> **Screen shows:** Confetti? No — clean success state with countdown.
>
> **Copy:**
> ```
> You're all set!
>
> Taking you to your dashboard…
> ```
>
> **Auto‑redirects to Dashboard after 2 seconds.**
>
> **On first dashboard load:**
> Hero card at top says:
> ```
> You don't have a playlist yet.
> ┌─────────────────────────────┐
> │  Create My Playlist         │  ← Starts flow immediately
> └─────────────────────────────┘
> It takes one tap.
> ```
>
> **After tapping Create:**
> No loading screen — system shows:
> ```
> ┌─────────────────────────────────────┐
> │  ✅ Building your playlist…         │
> │                                     │
> │  ████████████████████░░░  85%       │
> │                                     │
> │  We're picking channels for         │
> │  your region and setting up         │
> │  TV guide data.                     │
> └─────────────────────────────────────┘
> ```
> This takes < 3 seconds, then → success state (wireframe 4.3).

---

*End of UI spec — last updated 2026-06-04.*
