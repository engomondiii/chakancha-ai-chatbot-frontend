# Chakancha Frontend

Next.js storefront for Chakancha — single-origin tea from the Nandi Hills, Kenya.
Serves the product catalogue, cart and checkout, account flows, Chakan Tree
participation, and a conversational assistant, backed by a Django API.

---

## Stack

| Layer         | Technology                                     |
| ------------- | ---------------------------------------------- |
| Framework     | Next.js 14 App Router                          |
| UI            | React, CSS Modules                             |
| Images        | `next/image`                                   |
| Icons         | `lucide-react`                                 |
| API           | Django REST backend hosted on Railway          |
| Design tokens | CSS custom properties in `src/app/globals.css` |

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run build        # production build — run before every deploy
npm run start        # serve the production build locally
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
│   ├── origin/
│   │   └── page.jsx             # Nandi Hills origin story
│   ├── chat/
│   ├── products/
│   │   ├── page.jsx
│   │   └── [slug]/page.jsx
│   ├── chakan-tree/
│   │   ├── page.jsx             # public Chakan Tree page for non-members
│   │   ├── join/                # activation / join flow
│   │   └── dashboard/
│   │       └── page.jsx         # authenticated active-member route wrapper
│   ├── cart/
│   ├── checkout/
│   └── (auth)/                  # login, signup, forgot-password, verify-email
├── components/
│   ├── common/
│   │   └── Logo.jsx             # LogoLockup, LogoMark
│   ├── layout/                  # Header, Footer
│   ├── chat/                    # ConversationView, MessageBubble,
│   │                            # PromptInput, AIAvatar
│   ├── products/                # ProductGrid, ProductCard, ProductDetail,
│   │                            # ProductGallery, BrewingGuide
│   ├── origin/                  # OriginHero, EstateInfo, PeopleSection, MapView
│   └── chakan-tree/
│       ├── ParticipantDashboard.jsx
│       ├── chakanTree.jsx       # actual recursive MGM tree visualisation
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

`src/app/globals.css` declares the frontend design tokens under `:root`. It is
loaded once by the application.

### Rules

1. **Component CSS Modules must not import `globals.css`.** Custom properties
   inherit through the rendered document, so a Module in any folder can use
   them without importing the global stylesheet.
2. **Use canonical tokens in new and refactored code.**
3. **Only one global stylesheet should control the design system.**
4. **Compatibility aliases are temporary.** Older components may still use
   legacy aliases while migration continues.

### Colour

| Token                         | Value     | Use                                |
| ----------------------------- | --------- | ---------------------------------- |
| `--color-background-main`     | `#FBFAF7` | Page background                    |
| `--color-background-soft`     | `#F7F4EE` | Recessed surfaces, chat input      |
| `--color-background-muted`    | `#ECE8E1` | Loading and disabled states        |
| `--color-background-dark`     | `#111111` | Primary buttons, AI avatar         |
| `--color-background-charcoal` | `#2B2B2B` | Footer, user message bubbles       |
| `--color-surface-card`        | `#FFFFFF` | Cards, focused inputs              |
| `--color-text-primary`        | `#111111` | Body copy, headings                |
| `--color-text-secondary`      | `#2B2B2B` | Secondary dark text                |
| `--color-text-muted`          | `#4A4A4A` | Supporting text, timestamps        |
| `--color-text-inverse`        | `#F7F4EE` | Text on dark surfaces              |
| `--color-accent-muted-gold`   | `#B9A777` | Interactive emphasis, focus rings  |
| `--color-accent-sand`         | `#D2C59A` | Softer hover states, links on dark |
| `--color-accent-dark-olive`   | `#3C4031` | Limited contextual accent          |
| `--color-border-soft`         | `#D6D0C5` | Borders and dividers               |

Additional tokens cover typography, an 8px spacing system, radii, shadows,
transitions, content widths, z-index levels, and semantic states.

---

## Component conventions

### Logo

Import the centralised component rather than duplicating SVG markup:

```jsx
import { LogoMark } from "@/components/common/Logo";
```

| Surface           | Asset treatment |
| ----------------- | --------------- |
| White / off-white | Dark mark       |
| Black / charcoal  | Light mark      |

Use:

```jsx
<LogoMark tone="dark" size="sm" clickable={false} />
```

when the logo is decorative.

Important:

- Logo SVGs use transparent backgrounds.
- Background colours belong to CSS, not the SVG asset.
- Avoid nested links by setting `clickable={false}` when a logo already sits
  inside another link.
- The import path is case-sensitive:

```jsx
@/components/common/Logo
```

not:

```jsx
@components/common/logo
```

---

## Product images

- Product artwork uses `object-fit: contain`.
- The `sizes` prop must match the actual rendered width.
- Keep a consistent image-container aspect ratio in product grids.
- Assets under `public/` are local paths such as `/images/...`.

---

## Product image pipeline

Product images are managed through Django Admin and normalised by the frontend.

```text
Django API
    ↓
raw.images[]
    ↓
normalizeProduct()
src/lib/api/products.js
    ↓
same-site /images/...       → local Next.js public asset
primary image               → ProductCard
full images[]               → ProductDetail → ProductGallery
```

`normalizeProduct()`:

- preserves the complete `raw.images` array
- normalises `url`, `alt_text`, `is_primary`, and `sort_order`
- derives a primary image from `images[]` when required
- converts same-origin absolute URLs such as:

```text
https://chakancha.com/images/products/NandiGoldLeaves.png
```

to:

```text
/images/products/NandiGoldLeaves.png
```

- strips accidental `/public` prefixes
- resolves relative backend media paths against `NEXT_PUBLIC_API_URL`
- leaves genuinely external URLs unchanged

Catalogue cards show the primary package image. Product-detail pages use the
complete gallery.

---

## Catalogue scope

The storefront currently focuses on two active products:

- **Nandi Gold**
- **Nandi Black**

They appear in a fixed editorial order.

The catalogue does not currently use marketplace-style category filtering or
price sorting.

Product data is loaded through the Django API using `useProducts()` and
`useProduct()`.

---

## Origin page

`/origin` is the editorial brand-origin route for Chakancha. It tells the story
of Nandi Hills through landscape imagery, the tea-growing environment, the
people behind the tea, and an embedded map of the region.

### Component structure

```text
src/app/origin/page.jsx
        ↓
src/components/origin/
├── OriginHero.jsx
├── EstateInfo.jsx
├── PeopleSection.jsx
└── MapView.jsx
```

The page is composed in this order:

```text
OriginHero
    ↓
THE LAND — EstateInfo
    ↓
THE PEOPLE — PeopleSection
    ↓
Where we are — MapView
```

### Origin hero

`OriginHero` now uses a real Nandi Hills tea-field photograph instead of a flat
background treatment.

The hero includes:

- a photographic tea-field background
- a left-weighted dark overlay for readable white text
- the Nandi Hills location/elevation eyebrow
- the headline **From the Hills of Heaven**
- supporting origin-story copy
- rounded landscape framing
- navbar clearance through top spacing
- responsive text positioning for tablet and mobile

On mobile, the copy is moved higher within the image so the title, location and
supporting text remain balanced inside the shorter viewport.

### The Land

`EstateInfo` was changed from a small fact-card grid into a large editorial
section built around the heading:

```text
THE LAND
Where Heaven Meets Earth
```

The section uses text on the left and landscape photography on the right. It
explains the Nandi Hills growing environment, including elevation, highland
climate, volcanic soil, rainfall and the conditions that support slow-growing,
flavour-rich tea.

The section is intentionally near full width, leaving only a small, even amount
of whitespace at the viewport edges.

### The People

`PeopleSection` adds the human side of the origin story and reverses the previous
layout so the image sits on the left and the copy sits on the right.

It presents:

```text
THE PEOPLE
Skilled Hands, Quiet Pride
```

The section tells the story of Amina, an experienced selective tea plucker, and
frames plucking as skilled craft rather than anonymous labour. The pull quote is
kept as a quieter editorial element beneath the main copy.

Alternating the Land and People layouts creates a clearer visual rhythm down the
page:

```text
THE LAND     text  → image
THE PEOPLE   image → text
```

### Where we are / map

`MapView` now embeds an interactive Google Maps view of Nandi Hills instead of
showing only a static location placeholder.

The map includes:

- an embedded Google Maps iframe
- Nandi Hills as the displayed location
- interactive map navigation and zoom
- a branded location card
- a direct external Google Maps link
- responsive sizing for desktop and mobile

The location card identifies Nandi Hills in western Kenya and is positioned so
it does not unnecessarily compete with Google's own map controls.

### Width and responsive layout

The major Origin content blocks are designed to use almost the full viewport
width with consistent edge whitespace. Desktop sections stay wide and
photographic; tablet layouts reduce gaps and image heights; mobile layouts stack
content vertically.

Do not reintroduce narrow `max-width` wrappers around the major Origin story
sections unless the visual design is intentionally changed.

### Origin imports

Origin components use the project's configured `@/` alias:

```jsx
import { PeopleSection } from "@/components/origin/PeopleSection";
```

Do not use:

```jsx
import { PeopleSection } from "@components/origin/PeopleSection";
```

unless an `@components` alias is explicitly configured. Filename casing must
also match exactly in production builds.

---

# Chakan Tree / MGM referral network

Chakan Tree separates the public participation experience from the active-member
dashboard.

```text
/chakan-tree
        ↓
public explanation
stats
how it works
join CTA
        ↓
active participant
        ↓
/chakan-tree/dashboard
        ↓
ParticipantDashboard
```

---

## Chakan Tree route responsibilities

### `/chakan-tree`

This remains the public/default Chakan Tree experience.

It is used for people who have not yet joined Chakan Tree.

The public page is not replaced by the member tree visualisation.

### `/chakan-tree/join`

Handles joining / activation.

### `/chakan-tree/dashboard`

This is a route wrapper for active participants.

It is responsible for:

```text
client mount
    ↓
authentication check
    ↓
refresh membership from backend
    ↓
check membership.isActive
    ↓
render ParticipantDashboard
```

The actual dashboard content does not live in the route wrapper.

---

## Hydration-safe Chakan Tree route

The Chakan Tree dashboard reads authentication and membership data from the
frontend store.

Persisted client state may not be available during the first render, so the
route uses an explicit client-mount state before performing membership checks.

The dashboard route uses:

```jsx
const [mounted, setMounted] = useState(false);
const [checked, setChecked] = useState(false);
```

and:

```jsx
useEffect(() => {
  setMounted(true);
}, []);
```

Membership is refreshed only after the component is mounted.

Redirects are performed in `useEffect()` rather than directly during render.

Do not use:

```jsx
if (membership && !membership.isActive) {
  router.replace("/chakan-tree/join");
}
```

inside the render phase.

Use effect-based navigation instead.

This helps keep the initial server/client render stable and avoids redirect
side effects during rendering.

---

## Participant dashboard

`src/components/chakan-tree/ParticipantDashboard.jsx` is the actual Chakan Tree
member dashboard.

It currently contains:

```text
ParticipantDashboard
│
├── ReferralCode
│
├── RewardsSummary
│
├── Level Earnings
│
├── ReferralTree
│
├── ImpactTracker
│
└── People You've Invited table
```

The existing direct-referral table remains intentionally available.

The visual tree does not replace the table.

---

## Referral tree component

The actual visual tree component is:

```text
src/components/chakan-tree/chakanTree.jsx
```

It is imported by `ParticipantDashboard.jsx` as:

```jsx
import ReferralTree from "./chakanTree";
```

The file exports the component using a default export:

```jsx
export default ReferralTree;
```

The physical filename and import path must match exactly.

Do not use:

```jsx
import { ReferralTree } from "./ReferralTree";
```

unless the file is actually renamed and exports a matching named export.

---

## Preventing recursive dashboard rendering

`chakanTree.jsx` must contain only the visual referral-tree component.

It must never import:

```jsx
import { ParticipantDashboard } from "@/components/chakan-tree/ParticipantDashboard";
```

and must never render:

```jsx
<ParticipantDashboard />
```

Otherwise the dependency becomes:

```text
ParticipantDashboard
        ↓
chakanTree
        ↓
ParticipantDashboard
        ↓
chakanTree
        ↓
...
```

which causes the page to repeat indefinitely.

The correct relationship is:

```text
src/app/chakan-tree/dashboard/page.jsx
        ↓
ParticipantDashboard.jsx
        ↓
chakanTree.jsx
        ↓
chakanTree.module.css
```

---

## Referral-tree visualisation

`chakanTree.jsx` renders the MGM network recursively.

The current implementation uses:

- the active participant as the root
- the label **You** for the root
- hollow circular nodes
- the official Chakancha `LogoMark` inside each node
- a larger muted-gold root node
- SVG-based parent-child connections
- recursive child rendering
- descendant leaf counting for horizontal layout
- horizontal scrolling for wide trees
- plain participant names beneath each node
- no generation labels inside the tree; generation is communicated by position
- no referral codes inside tree nodes; referral codes remain available elsewhere in the dashboard
- direct-child count badges

All branch connectors are drawn in one SVG layer.

This avoids disconnected CSS line fragments and allows branch paths to remain
continuous.

---

## Tree branch geometry

The visual tree JavaScript and CSS dimensions must stay synchronised.

`chakanTree.jsx` currently uses:

```jsx
const ROOT_RADIUS = 43;
const NODE_RADIUS = 34;
```

Therefore the CSS must use:

```css
.circle {
  width: 68px;
  height: 68px;
}

.rootCircle {
  width: 86px;
  height: 86px;
}
```

The branch paths use the JavaScript radii to calculate the exact edge of each
circle.

Do not resize the circle dimensions independently in mobile CSS unless the
JavaScript radii are also updated.

Horizontal scrolling is preferred for narrow screens.

---

## Tree node positioning

`chakanTree.jsx` positions each member with:

```jsx
top: `${y - radius}px`;
```

Because the vertical position is already corrected using the circle radius,
the CSS should centre only horizontally:

```css
.member {
  transform: translateX(-50%);
}
```

Do not use:

```css
transform: translate(-50%, -50%);
```

with the current layout calculation, because it shifts the complete node upward
again and causes the SVG connector geometry to miss the circles.

---

## Tree stylesheet ownership

The tree stylesheet is:

```text
src/components/chakan-tree/chakanTree.module.css
```

and is imported only inside:

```text
src/components/chakan-tree/chakanTree.jsx
```

using:

```jsx
import styles from "./chakanTree.module.css";
```

The dashboard route does not import this stylesheet.

---

## Tree data compatibility

`ParticipantDashboard.jsx` can consume a hierarchical referral structure from:

```text
dashboard.referralTree
dashboard.referral_tree
dashboard.tree
```

Until the backend exposes nested MGM descendants, the dashboard builds a safe
Level 1 tree from:

```text
dashboard.referrals
```

This allows current referral data to appear immediately.

An active member with no referrals still receives a valid root:

```text
      You
       ◯
```

Referral count is not used to determine whether a participant belongs to Chakan
Tree.

The access criterion remains:

```text
membership.isActive
```

---

## Level earnings

The participant dashboard includes an MGM level-earnings area.

Supported frontend field shapes include:

```text
dashboard.levelEarnings
dashboard.level_earnings
dashboard.earningsByLevel
dashboard.earnings_by_level
```

Level earnings are displayed only from backend-provided data.

The frontend does not invent commission values.

When the backend has not yet returned level earnings, an informational empty
state is displayed.

---

## Referral views

| View           | Purpose                                             |
| -------------- | --------------------------------------------------- |
| Referral tree  | Shows who is connected to whom                      |
| Level earnings | Shows earnings by MGM generation                    |
| Referral table | Shows direct-referral purchases and generated value |

---

## React hook rule for Chakan Tree

Hooks must execute in the same order on every render.

Do not place a Hook after:

```jsx
if (loading) {
  return ...
}
```

For example, avoid:

```jsx
if (loading) {
  return <Loading />;
}

const referralTree = useMemo(...);
```

because the first render skips `useMemo()` and the next render executes it.

For the current referral-tree calculation, a normal function call is used:

```jsx
const referralTree = buildReferralTree(dashboard, membership);
```

This avoids an unnecessary Hook and keeps the render order stable.

---

## Conventions checklist

Before opening a pull request:

- [ ] `npm run build` passes without Chakan Tree import warnings
- [ ] No CSS Module imports `globals.css`
- [ ] Logo imports use `@/components/common/Logo`
- [ ] Decorative logos use `clickable={false}`
- [ ] Product images use `object-fit: contain`
- [ ] `next/image` `sizes` matches rendered dimensions
- [ ] Interactive controls have visible focus states
- [ ] `ParticipantDashboard.jsx` imports `ReferralTree` from `./chakanTree`
- [ ] `chakanTree.jsx` exports `ReferralTree` as default
- [ ] `chakanTree.jsx` does not import or render `ParticipantDashboard`
- [ ] `chakanTree.jsx` imports `./chakanTree.module.css`
- [ ] `.member` uses `translateX(-50%)`
- [ ] CSS node dimensions match `NODE_RADIUS` and `ROOT_RADIUS`
- [ ] Tree nodes are not resized independently on mobile
- [ ] Redirects in `/chakan-tree/dashboard` happen inside effects
- [ ] The route waits for client mount before membership checks
- [ ] The existing direct-referral table remains available
- [ ] Active participants with zero referrals still see their root node
- [ ] Origin sections keep consistent viewport-edge whitespace
- [ ] Origin component imports use `@/components/origin/...`
- [ ] Hero text remains readable against the photographic overlay on mobile
- [ ] Embedded map retains an accessible `title` and external Google Maps link

---

## Troubleshooting

| Symptom                                              | Cause and fix                                                                                                                                                                                 |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React hydration error `#418` / `#423`                | Check for unstable server/client initial rendering, persisted client state, nested anchors, or render-time redirects. Chakan Tree dashboard membership checks should wait until client mount. |
| React error `#310`                                   | A Hook was called only on some renders. Keep Hooks before early returns or remove unnecessary `useMemo` usage.                                                                                |
| Chakan Tree page repeats forever                     | `chakanTree.jsx` is rendering `ParticipantDashboard`, causing recursive component rendering. Tree component must contain only the visual tree.                                                |
| `Can't resolve './ReferralTree'`                     | The actual file is `chakanTree.jsx`. Import from `./chakanTree`.                                                                                                                              |
| `'ReferralTree' is not exported from './chakanTree'` | Match the import to the export. Current implementation uses `export default ReferralTree` and `import ReferralTree from "./chakanTree"`.                                                      |
| Tree branch misses a node vertically                 | `.member` is using `translate(-50%, -50%)`. Use `translateX(-50%)` with the current `top: y - radius` positioning.                                                                            |
| Tree branch misses nodes on mobile                   | CSS node size differs from `NODE_RADIUS` / `ROOT_RADIUS`. Keep 68px and 86px sizes or update both JS and CSS together.                                                                        |
| Chakan Tree only shows the root or direct referrals  | Backend has not yet returned nested `referralTree`; frontend is using `dashboard.referrals` as Level 1 fallback.                                                                              |
| Active participant is sent back to join              | Refresh membership and check `membership.isActive`; do not use referral count for access.                                                                                                     |
| Chakan Tree styles do not load                       | Confirm `chakanTree.jsx` imports `./chakanTree.module.css` with exact filename case.                                                                                                          |
| React hydration error from logo navigation           | Avoid clickable logo inside another link; use `clickable={false}`.                                                                                                                            |
| `Module not found: '@components/common/logo'`        | Use `@/components/common/Logo`.                                                                                                                                                               |
| Colours revert to green and brown                    | Ensure only `src/app/globals.css` controls global design tokens.                                                                                                                              |
| Gallery thumbnails fail in production                | Check same-origin `/images/...` normalisation in `normalizeProduct()`.                                                                                                                        |
| Product artwork is cropped                           | Use `object-fit: contain`.                                                                                                                                                                    |
| Backend images do not load                           | Check `NEXT_PUBLIC_API_URL`.                                                                                                                                                                  |

---

## Change history

See [CHANGELOG.md](./CHANGELOG.md).
