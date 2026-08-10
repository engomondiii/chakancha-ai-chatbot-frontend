# Chakancha Frontend

Next.js storefront for Chakancha — single-origin tea from the Nandi Hills, Kenya.
Serves the product catalogue, cart and checkout, account flows, Chakan Tree
participation, and a conversational assistant, backed by a Django API.

---

## Stack

| Layer         | Technology                                     |
| ------------- | ---------------------------------------------- |
| Framework     | Next.js (App Router)                           |
| UI            | React, CSS Modules                             |
| Images        | `next/image`                                   |
| Icons         | `lucide-react`                                 |
| API           | Django REST backend (hosted on Railway)        |
| Design tokens | CSS custom properties in `src/app/globals.css` |

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run build        # production build — run before every deploy
npm run start        # serve the production build locally
npm run lint
```

### Environment

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_API_URL=https://<your-backend-host>
NEXT_PUBLIC_SITE_URL=https://chakancha.com
```

`NEXT_PUBLIC_API_URL` resolves relative media paths returned by the Django API.
Without it, backend-hosted product images will not load.

`NEXT_PUBLIC_SITE_URL` is used for frontend referral links and other same-site
URLs. Where the application already provides a fallback, it defaults to
`https://chakancha.com`.

---

## Project structure

```text
src/
├── app/
│   ├── globals.css              # single source of truth for design tokens
│   ├── layout.jsx
│   ├── page.jsx                 # home / hero
│   ├── chat/
│   ├── products/
│   │   ├── page.jsx
│   │   └── [slug]/page.jsx
│   ├── chakan-tree/
│   │   ├── page.jsx             # public Chakan Tree page for non-members
│   │   ├── join/                # activation / join flow
│   │   └── dashboard/
│   │       └── page.jsx         # active-member route wrapper
│   ├── cart/
│   ├── checkout/
│   └── (auth)/                  # login, signup, forgot-password, verify-email
├── components/
│   ├── common/Logo.jsx          # LogoLockup, LogoMark
│   ├── layout/                  # Header, Footer
│   ├── chat/                    # ConversationView, MessageBubble, PromptInput, AIAvatar
│   ├── products/                # ProductGrid, ProductCard, ProductDetail,
│   │                            # ProductGallery, BrewingGuide
│   └── chakan-tree/
│       ├── ParticipantDashboard.jsx
│       ├── chakanTree.jsx       # recursive MGM referral tree
│       ├── chakanTree.module.css
│       ├── ReferralCode.jsx
│       ├── RewardsSummary.jsx
│       ├── ImpactTracker.jsx
│       ├── ExplainerFlow.jsx
│       ├── InvitationCard.jsx
│       └── InvitationCard.module.css
├── lib/
│   └── api/
│       ├── products.js          # product API + normalizeProduct()
│       └── chakanTree.js        # Chakan Tree API integration
└── stores/                      # application state

public/
├── brand/                       # lockups and marks
└── images/
    ├── icons/
    ├── products/
    └── origin/
```

---

## Design system

`src/app/globals.css` declares every design token under `:root`. It is loaded
once by the application.

### Rules

1. **Component CSS Modules must not import `globals.css`.** Custom properties
   inherit through the rendered document, so a Module in any folder can read
   them without importing anything.
2. **Use tokens, never hardcoded values.** New and refactored components should
   use the canonical design tokens.
3. **Only one global stylesheet may be loaded.** A second global file can
   override the Brand Manual palette silently.
4. **Compatibility aliases are temporary.** Legacy token aliases exist so older
   components keep working during migration. Do not use them in new code.

### Colour

| Token                         | Value     | Use                                |
| ----------------------------- | --------- | ---------------------------------- |
| `--color-background-main`     | `#FBFAF7` | Page background                    |
| `--color-background-soft`     | `#F7F4EE` | Recessed surfaces, chat input      |
| `--color-background-muted`    | `#ECE8E1` | Loading and disabled states        |
| `--color-background-dark`     | `#111111` | Primary buttons, AI avatar         |
| `--color-background-charcoal` | `#2B2B2B` | Footer, user message bubbles       |
| `--color-surface-card`        | `#FFFFFF` | Cards, focused inputs              |
| `--color-text-primary`        | `#111111` | Body copy, headings                |
| `--color-text-secondary`      | `#2B2B2B` | AI message text                    |
| `--color-text-muted`          | `#4A4A4A` | Supporting text, timestamps        |
| `--color-text-inverse`        | `#F7F4EE` | Text on dark surfaces              |
| `--color-accent-muted-gold`   | `#B9A777` | Interactive emphasis, focus rings  |
| `--color-accent-sand`         | `#D2C59A` | Softer hover states, links on dark |
| `--color-accent-dark-olive`   | `#3C4031` | Limited contextual accent          |
| `--color-border-soft`         | `#D6D0C5` | Borders and dividers               |

Additional tokens cover typography scale, an 8px spacing system, radii,
shadows, transitions, content widths, z-index levels, and semantic states.
Read `globals.css` for the full list.

---

## Component conventions

### Logo

Import the centralised component — never inline the SVG paths:

```jsx
import { LogoMark } from "@/components/common/Logo";
```

| Surface           | Asset      |
| ----------------- | ---------- |
| White / off-white | Dark mark  |
| Black / charcoal  | Light mark |

- Pass `clickable={false}` wherever the mark is decorative, or when it sits
  inside an existing link.
- Logo SVGs must have transparent backgrounds.
- Two colour treatments are sufficient.
- The import path is case-sensitive: `@/components/common/Logo`, not
  `@components/common/logo`.

### Images

- **Product artwork uses `object-fit: contain`.**
- **The `sizes` prop must match the actual rendered width.**
- Keep a consistent container aspect ratio across a product grid.
- Assets under `public/` are local paths (`/images/...`), not remote URLs.

---

## Product image pipeline

Product images are managed in Django Admin and normalised on the frontend.

```text
Django API
    ↓  raw.images[]
normalizeProduct()          src/lib/api/products.js
    ↓
same-site /images/...       → local Next.js public asset
primary image               → ProductCard
full images[]               → ProductDetail → ProductGallery
```

`normalizeProduct()`:

- preserves the full `raw.images` array for the detail gallery
- normalises `url`, `alt_text`, `is_primary`, and `sort_order`
- derives a primary image from `images[]` when needed
- rewrites same-origin absolute URLs such as
  `https://chakancha.com/images/...` to local `/images/...` paths
- strips accidental `/public` prefixes
- resolves relative backend media paths against `NEXT_PUBLIC_API_URL`
- leaves genuinely external URLs untouched

Catalogue cards show the primary package image only. The detail page uses the
complete gallery.

---

## Catalogue scope

The storefront presents two active products, **Nandi Gold** and **Nandi Black**,
in a fixed editorial order. The grid has no category filters or price sorting;
recipe and preparation imagery supports the wider product story.

Product data comes from the Django API through `useProducts()` and `useProduct()`.

---

## Chakan Tree / MGM referral network

Chakan Tree separates the public join experience from the authenticated member
dashboard.

```text
/chakan-tree
    ↓
public explanation + stats + join CTA
    ↓ active member
/chakan-tree/dashboard
    ↓
ParticipantDashboard
    ├── referral code
    ├── overall rewards
    ├── level earnings
    ├── visual referral tree
    ├── impact metrics
    └── existing "People You've Invited" table
```

### Route behaviour

- `/chakan-tree` remains the public/default page for people who have not joined.
- `/chakan-tree/join` contains the activation / join flow.
- Active Chakan Tree members are redirected to `/chakan-tree/dashboard`.
- The dashboard verifies authentication and refreshed membership state before
  rendering `ParticipantDashboard`.
- An active member with zero referrals still sees the dashboard and root node.

### Referral-tree visualisation

`src/components/chakan-tree/chakanTree.jsx` renders the MGM network recursively.

- The signed-in participant is the root node and is labelled **You**.
- Nodes are hollow circles containing the official Chakancha `LogoMark`.
- The root node is larger and uses muted-gold emphasis.
- Parent-child connectors are drawn in one SVG layer so lines remain continuous.
- Curved branches replace detached CSS line segments.
- Subtree width is based on descendant leaf count so large branches get more room.
- The tree scrolls horizontally when the network becomes wider than the viewport.
- `chakanTree.module.css` owns node, branch, canvas, responsive and focus styling.
- The CSS Module is imported by `chakanTree.jsx`, not by the dashboard route.

### Referral data fallback

The frontend can consume a true hierarchical MGM response from:

```text
dashboard.referralTree
dashboard.referral_tree
dashboard.tree
```

Until the backend supplies nested descendants, the dashboard can build a Level
1 tree from the existing `dashboard.referrals` array. The existing referral
table remains in place.

### Level earnings

The dashboard is prepared to normalise level-earnings data from:

```text
dashboard.levelEarnings
dashboard.level_earnings
dashboard.earningsByLevel
dashboard.earnings_by_level
```

If level-earnings data is not available yet, the interface shows an empty
informational state instead of inventing values.

| View | Purpose |
| ---- | ------- |
| Referral tree | Shows who is connected to whom |
| Level earnings | Shows earnings by MGM generation |
| Referral table | Shows direct-referral purchases and value generated |

---

## Conventions checklist

Before opening a pull request:

- [ ] `npm run build` passes
- [ ] No hardcoded colours, spacing, or radii in new/refactored components
- [ ] No CSS Module imports `globals.css`
- [ ] Logo imported from `@/components/common/Logo` with correct casing
- [ ] Decorative logos use `clickable={false}`
- [ ] Product images use `object-fit: contain`
- [ ] Every `next/image` `sizes` value matches its rendered width
- [ ] Decorative images use empty `alt` and `aria-hidden`
- [ ] Interactive elements have visible focus states
- [ ] `chakanTree.jsx` imports `./chakanTree.module.css` with exact casing
- [ ] The existing referral table remains when the visual tree is changed
- [ ] Active members with zero referrals still render the dashboard root node

---

## Troubleshooting

| Symptom | Cause and fix |
| ------- | ------------- |
| React hydration error #418 / #423 | Nested anchors — a clickable logo inside a nav link. Pass `clickable={false}`. |
| `Module not found: '@components/common/logo'` | Missing `/` after `@`, or lowercase filename. Use `@/components/common/Logo`. |
| Colours revert to green and brown | A second global stylesheet is loaded. Only `src/app/globals.css` may load. |
| Gallery thumbnails broken in production | Same-origin absolute image URL treated as remote. Check `normalizeProduct()`. |
| Product image looks soft | `sizes` understates the rendered width, or the source file is low resolution. |
| Product image cropped | `object-fit: cover` — product artwork must use `contain`. |
| Backend images do not load | `NEXT_PUBLIC_API_URL` missing from `.env.local`. |
| Chakan Tree only shows the root or direct referrals | The backend has not returned a nested `referralTree` yet; the frontend falls back to `dashboard.referrals`. |
| Chakan Tree styles do not load | Confirm `chakanTree.jsx` imports `./chakanTree.module.css` with matching filename case. |
| Active member is sent to join again | Refresh membership before redirecting and check `membership.isActive`, not referral count. |

---

## Change history

See [CHANGELOG.md](./CHANGELOG.md).
