# Changelog
### About Page Redesign

The `/about` page was rebuilt from a text-led layout into the approved
photographic structure:

```text
Hero (photo + overlay)
    ↓
Our Mission
    ↓
What We Stand For (five pillars)
    ↓
The Team | Our Story
    ↓
CTA banner (dark)
```

#### Structure

- The text-only hero was replaced with a full-bleed team photograph, a
  left-weighted dark overlay, the page title, and supporting copy.
- The mission blockquote became a mission statement card with a target icon.
- The three pillar cards were expanded to five borderless inline columns:
  Single Origin, Living Wage, Food Hygiene, Traceability, Specialty Quality —
  each with a one-line description.
- A new two-column split pairs a team photo card (**The Team**) with the
  **Our Story** narrative, ending in `Est. 2024 · Nandi Hills, Kenya`.
- The closing CTAs became a dark banner with a serif headline and three
  arrow links: Explore our teas, Visit Nandi Hills, Talk to our AI.

#### Hero readability

The initial overlay was too light against bright foliage. The final overlay
layers two gradients: a left wash holding `rgba(17,17,17,0.5)` through the
full text column before fading out at 80%, plus a faint bottom anchor across
the width. Both the title and paragraph carry a soft text shadow as insurance
over bright patches. The right side of the photograph stays essentially
untouched.

#### Width and image sharpness

- The page container was widened from `var(--max-width-content)` to a
  near-full-width `max-width: 1720px`, matching the wide-layout convention
  used on Origin. Body paragraphs remain individually capped for
  readability.
- The hero `next/image` `sizes` prop was corrected from `1200px` to
  `1720px`. The old value served a 1200px rendition that the browser
  upscaled, softening the photo on large screens.
- Hero and team images live in `public/images/about/`.

#### Dark CTA against the dark footer

The CTA banner and the site footer are both dark surfaces. They are now
deliberately one step apart — the banner uses
`--color-background-charcoal` against the near-black footer — and the page's
bottom padding was tightened so the banner sits close above the footer. The
page ends as one continuous dark gesture rather than two identical slabs
separated by a light gap. The banner headline cap was widened to 900px so it
fills the wide container instead of leaving two-thirds empty.

#### Spacing model

Section rhythm is owned by a single `gap` on the page root (flex column).
Individual sections carry no vertical margins; page edges are owned by the
root padding, and interior breathing room by each section's own padding.

#### Token migration

All legacy tokens were removed from the page (`--color-tea-green`,
`--color-earth-brown`, `--color-warm-cream`, `--font-sans`,
`--font-display` aliases). The page now uses only canonical design tokens
from `src/app/globals.css`.

---

### Chakan Tree Per-Level Downline Badges

Tree nodes previously showed a single badge counting only direct referrals.
Each node now shows its complete downline, one badge per generation, so a
participant's full network depth is visible at a glance.

For every node, `chakanTree.jsx` traverses that participant's own subtree and
counts descendants per relative generation:

```text
level 1 → direct referrals
level 2 → referrals of referrals
level 3 → third generation
level 4 → fourth generation
level 5 → fifth generation (deepest shown)
```

The five-level cap matches the reward cascade — generations that earn nothing
are not badged.

Levels are relative to each node, mirroring the reward cascade. Example:

```text
Issac invited Naomi and Josephine.
Naomi invited Njerry.
Njerry invited 2 people.

Issac's badges:   level 1 = 2, level 2 = 1, level 3 = 2
Naomi's badges:   level 1 = 1, level 2 = 2
Njerry's badges:  level 1 = 2
```

#### Visual treatment

- Badges are arranged on an arc around each circle, starting just right of
  the top and stepping clockwise (`BADGE_START_ANGLE = -80°`,
  `BADGE_ANGLE_STEP = 50°`).
- Level 1 uses the deepest green and each deeper generation fades lighter:

```text
Level 1   #3C5E2B   deepest green — direct referrals
Level 2   #5C9440
Level 3   #86A96F
Level 4   #B2CBA3
Level 5   #DCEFD2   lightest
```

- Levels with zero participants render no badge.
- Hovering a badge shows a tooltip: `Level N · X participants`.

#### Implementation

- `countDescendantsByLevel()` performs the per-node traversal, capped at
  `MAX_BADGE_LEVELS = 5`.
- `LevelBadges` renders the arc; badge colours come from the `LEVEL_SHADES`
  scale in `chakanTree.jsx`, not from CSS.
- The old single `.childBadge` style was removed from
  `chakanTree.module.css` and replaced by `.levelBadge`, which carries the
  shared shape while colour and position are set inline per badge.
- Only `chakanTree.jsx` and `chakanTree.module.css` changed.
  `ParticipantDashboard.jsx` passes the same `root` prop as before, and the
  participant-count chip in the dashboard header is unaffected.

Badge depth follows the data: nodes show as many generations as the backend
`referral_tree` supplies, up to five.

---

### Chakan Tree Multi-Generation Referral Network

The Chakan Tree now renders and pays out across five generations. Previously
only direct referrals appeared in the tree, and only the immediate referrer
earned on a purchase.

#### Reward cascade

Rewards flow upward from a purchase, halving at each generation:

```text
Level 1 (direct referrer)   5%
Level 2                     2.5%
Level 3                     1.25%
Level 4                     0.625%
Level 5                     0.3125%
Level 6+                    nothing
```

The cascade is relative, not absolute. Every member is level 1 to their direct
referrer, level 2 to the member above them, and so on. A single purchase
credits up to five distinct uplines at five distinct rates. A member six hops
below someone earns that person nothing.

#### Backend

`chakan_tree/services.py` gains two traversals, both capped at five hops:

- `build_referral_tree()` walks **down** the `Membership.referred_by` self-FK,
  returning nested dicts for the dashboard. One query per generation plus one
  bulk query for purchase activity, rather than one query per node.
- `get_upline_chain()` walks **up** from a purchaser, returning
  `(level, membership)` pairs for reward attribution. Inactive memberships are
  skipped but still consume a level, so a dormant member cannot compress the
  chain and inflate the rewards of those above them.

`process_referral_purchase()` now credits the full upline. Tier recalculation
stays limited to the direct referrer, since `active_referral_count` counts only
direct referrals — recalculating deeper uplines would query the database
without ever changing anything.

A `LevelEarning` model holds the per-generation breakdown, one row per
`(membership, level)`. `Reward` continues to hold the aggregate.

`Membership.display_name` centralises name resolution so the tree, the
serializer, and the dashboard all draw from one place.

`DashboardSerializer` exposes `referral_tree` and `level_earnings`. Without
these declared fields DRF silently dropped both keys from the response.

Indexes added on `Membership(referred_by, is_active)` and
`Referral(referred_user)` to support the traversal queries.

#### Corrected behaviour

`build_referral_tree()` ordered by `created_at`, which does not exist on
`Membership` — the field is `joined_at`. This raised `FieldError`, returning
500 from the dashboard endpoint.

Tree node names probed `get_full_name()`, `first_name`, and `username`, none of
which exist on `CustomUser`. Resolution silently fell through to the email
prefix. Node names now read the actual `name` field.

Tree nodes reported hardcoded zero purchases and generated value. Both are now
read from the `Referral` records in a single bulk query.

#### API client

`src/lib/api/chakanTree.js` constructed its dashboard return value from three
keys, discarding `referral_tree`, `level_earnings`, and `impact` before any
component could read them. No fallback chain in the component could recover a
key that never arrived.

`getDashboard()` now passes all three through. Tree nodes are normalised
recursively, since a flat map would drop every generation below the first.

#### Removed mock fallbacks

Every function in the API client wrapped its request in a silent `catch` that
returned fixed placeholder data — three invented referrals, invented earnings,
invented impact metrics. A failing endpoint was indistinguishable from a
working one, which is how the `FieldError` above went unnoticed.

Requests now propagate errors to the caller, and callers render an error state.

Invented defaults were removed alongside the mocks. Expressions such as
`raw.tier || 'seed'` and `raw.reward_rate || 0.05` asserted business rules the
frontend has no authority over. Absent values are now `null`, keeping "no data"
distinguishable from a real zero.

`normalizeImpact()` returns numeric values rather than pre-formatted currency
strings, so currency and locale are decided at render time.

#### Root node label

The tree root displayed the literal string **You**, hardcoded in
`buildReferralTree()` on both the backend-tree and flat-referral paths. The
root now resolves its name the same way every other node does.

---

### Chakan Tree Node Name Shortening

Long participant names in the visual Chakan Tree are now shortened for display
so node labels remain readable and never overflow their fixed width.

The tree label area is narrow (`max-width: 130px`), so long multi-part names
were previously cut off by the CSS ellipsis at an arbitrary character, which
read as broken rather than intentional.

`chakanTree.jsx` now formats every node name through `formatDisplayName()`:

```text
1 word           → shown as-is (character cap applies)
2 words          → shown as-is if under 16 characters,
                   otherwise "First L."
3 or more words  → always "First L."
any result       → hard 16-character cap with ellipsis
```

Examples:

```text
Issac                         → Issac
Josphine Kamau                → Josphine Kamau
Christopher Wamalwa           → Christopher W.
Josphine Wanjiru Kamau        → Josphine K.
Wickliffe Ondiek Omondi Ouma  → Wickliffe O.
```

The shortening is display-only:

- the complete name remains in the label's `title` attribute and appears on
  hover
- the complete name remains unchanged in the **People You've Invited** table
- no referral data is modified

The CSS `text-overflow: ellipsis` rule is kept as a last-resort visual guard.

---

### Home Hero Video Background

The home hero background was changed from a rotating photo slideshow to a
single looping fog video with an invisible loop point.

#### Slideshow Replacement

The previous `BackgroundAnimation` implementation rotated four Nandi Hills
photographs with timed crossfades, per-slide camera movements, and clickable
slide indicators.

The hero now plays one video:

```text
public/images/backgrounds/herovid.mp4
```

The following slideshow machinery was removed because a single continuous video
no longer needs it:

- the image array and preloading loop
- `currentIndex` / `previousIndex` crossfade state
- slide-advance and fade timers
- per-slide `CAMERA_MOVEMENTS` variants
- the slide indicator buttons

A still photograph is kept as the video `poster` so the hero never flashes
empty while the video loads.

---

#### Seamless Loop Fix

Resolved a visible hitch each time the hero video ended and restarted.

The problem had two causes:

1. The native `loop` attribute produces a hard cut back to frame 0, which is
   visible as a jump.
2. The camera drift used `linear` timing with `alternate`, so the drift
   reversed direction abruptly at each end of the animation.

The loop is now hidden using a double-buffered crossfade:

```text
video copy A (visible)
        ↓ ~2s before A ends
video copy B starts from 0
        ↓
2s opacity crossfade A → B
        ↓
A pauses, becomes standby
        ↓
repeat, alternating A ↔ B
```

Two `<video>` elements play the same file. A `timeupdate` listener on the
visible copy schedules the swap when roughly one crossfade-length of playback
remains. The restart always happens inside the dissolve, so no cut is visible.

Implementation details:

- The active/standby swap is driven through refs and direct DOM style writes,
  not React state, so no re-render occurs mid-fade.
- Both copies keep the native `loop` attribute as a fallback: if the standby
  copy fails to start, the active copy hard-loops instead of freezing on the
  last frame.
- The crossfade window is controlled by `LOOP_FADE_MS`.

---

#### Continuous Camera Drift

The pan-and-zoom camera drift was moved from the individual video elements to a
wrapper element containing both copies.

This means the drift does not reset or stutter when the videos swap during the
loop crossfade.

The drift timing was also changed from `linear` to `ease-in-out`, so each
direction change is gradual rather than a visible bounce.

The scroll parallax on the outer container and the `-5%` overscan inset are
unchanged from the slideshow implementation.

---

#### Motion and Loading Behaviour

- The video is `muted`, `playsInline`, and `autoPlay` so mobile browsers allow
  it to start automatically.
- `prefers-reduced-motion` now pauses the video through a `matchMedia` listener
  and disables the camera drift. The previous CSS-only approach could stop the
  drift but could not pause video playback.
- The existing colour grading filter (`saturate(0.88) contrast(1.04)
brightness(0.94)`) was kept so the hero tone matches the previous slideshow
  treatment.

---

### Chakan Tree MGM Referral Network

The Chakan Tree participant experience was expanded from a flat referral
dashboard into a visual MGM referral network while preserving the existing
referral details, rewards, impact information, and public join experience.

The route responsibilities remain intentionally separate:

```text
/chakan-tree
→ public/default Chakan Tree experience for non-members

/chakan-tree/join
→ activation and join flow

/chakan-tree/dashboard
→ authenticated active-member route wrapper
→ ParticipantDashboard
```

The public `/chakan-tree` page was not replaced.

Active Chakan Tree participants continue to enter the member experience through
`/chakan-tree/dashboard`.

---

#### Participant Dashboard Expansion

`src/components/chakan-tree/ParticipantDashboard.jsx` remains the main Chakan
Tree member dashboard.

The dashboard retains:

- referral code and share link
- overall rewards summary
- impact metrics
- existing **People You've Invited** referral table

The following MGM views were added:

- level earnings
- visual referral tree
- referral-tree participant count
- empty states for unavailable referral or earnings data

The three referral views intentionally serve different purposes:

| View           | Purpose                                             |
| -------------- | --------------------------------------------------- |
| Referral tree  | Shows who is connected to whom                      |
| Level earnings | Shows earnings by MGM generation                    |
| Referral table | Shows direct-referral purchases and generated value |

The detailed referral table remains available and was not replaced by the tree.

---

#### Chakan Tree Node Label Simplification

The visual MGM nodes were simplified to reduce unnecessary information inside
the tree.

The following changes were made:

- removed `Root`, `Level 1`, `Level 2`, and other generation labels from nodes
- removed referral codes from the visual tree
- removed the rounded label background beneath participant circles
- kept only the participant name as plain text beneath each node
- kept the Chakancha logo circle as the primary visual representation of each participant
- kept referral codes available through the existing referral-code and referral-detail areas of the dashboard

Generation is now communicated naturally through each participant's vertical
position in the tree rather than repeated text labels.

The resulting node treatment is:

```text
       ◯
      You
       │
       ◯
     issac
```

---

#### Chakan Tree Component Architecture

The final component relationship is:

```text
src/app/chakan-tree/dashboard/page.jsx
        ↓
ParticipantDashboard.jsx
        ↓
chakanTree.jsx
        ↓
chakanTree.module.css

```

The dashboard route is responsible for authentication and membership access.

`ParticipantDashboard.jsx` is responsible for the participant-facing dashboard.

`chakanTree.jsx` is responsible only for rendering the visual MGM network.

`chakanTree.module.css` is responsible only for visual-tree styling.

The tree stylesheet is imported directly by:

```jsx
import styles from "./chakanTree.module.css";
```

inside `chakanTree.jsx`.

The dashboard route does not import the tree CSS Module.

---

#### Recursive Dashboard Rendering Fix

Resolved an issue where the Chakan Tree page repeated vertically without ending.

The problem occurred because dashboard-route code had been placed inside the
component being imported as the visual tree.

This created the dependency:

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

and caused the dashboard to render itself recursively.

The implementation was corrected so:

```text
chakanTree.jsx
```

contains only the visual `ReferralTree` implementation.

It no longer imports or renders:

```jsx
<ParticipantDashboard />
```

The dashboard wrapper remains exclusively at:

```text
src/app/chakan-tree/dashboard/page.jsx
```

---

#### Referral Tree Import / Export Resolution

Resolved multiple production build warnings caused by the visual tree import
path and export style not matching the physical component file.

The actual component file is:

```text
src/components/chakan-tree/chakanTree.jsx
```

The final import used by `ParticipantDashboard.jsx` is:

```jsx
import ReferralTree from "./chakanTree";
```

and `chakanTree.jsx` provides:

```jsx
export default ReferralTree;
```

This replaces incorrect variants such as:

```jsx
import { ReferralTree } from "./ReferralTree";
```

and:

```jsx
import { ReferralTree } from "./chakanTree";
```

when no matching named export exists.

The filename casing and export type must match exactly for production builds.

---

#### React Hook Order Fix

Resolved React error `#310` in `ParticipantDashboard.jsx`.

The earlier implementation called `useMemo()` after the loading-state early
return.

That caused different Hook counts between renders:

```text
first render
loading = true
→ return before useMemo

next render
loading = false
→ useMemo executes
```

The unnecessary `useMemo()` was removed.

The referral tree is now calculated with:

```jsx
const referralTree = buildReferralTree(dashboard, membership);
```

This keeps Hook order stable across every render.

---

#### Hydration-Safe Dashboard Route

The Chakan Tree dashboard route was updated to handle persisted frontend
authentication and membership state more safely.

The route now uses:

```jsx
const [mounted, setMounted] = useState(false);
const [checked, setChecked] = useState(false);
```

Client mounting is established with:

```jsx
useEffect(() => {
  setMounted(true);
}, []);
```

Membership checks begin only after client mount.

The route then:

```text
mounts on client
        ↓
checks authentication
        ↓
refreshes membership
        ↓
sets membership check complete
        ↓
checks membership.isActive
        ↓
renders ParticipantDashboard
```

Redirects were moved out of the render phase and into `useEffect()`.

The old pattern:

```jsx
if (membership && !membership.isActive) {
  router.replace("/chakan-tree/join");
  return null;
}
```

was removed.

This avoids navigation side effects during rendering and gives the route a
stable loading / redirect state while membership is being resolved.

---

#### Chakan Tree Dashboard Header Alignment

The dashboard route was updated to match the current Chakancha identity.

Changes include:

- removed the generic `TreePine` heading icon
- added the official Chakancha `LogoMark`
- used `clickable={false}` for the decorative logo
- replaced legacy green / brown styling with canonical design tokens
- replaced the previous 700px layout restriction with:

```css
max-width: var(--max-width-content);
```

This gives wide referral trees enough horizontal room.

The dashboard header now uses:

```text
My Network
My Chakan Tree
```

with the official brand mark.

---

#### Tree Geometry and CSS Synchronisation

The JavaScript and CSS geometry were aligned so SVG connectors touch the visual
node boundaries correctly.

`chakanTree.jsx` currently defines:

```jsx
const ROOT_RADIUS = 43;
const NODE_RADIUS = 34;
```

The corresponding CSS dimensions remain:

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

The tree component positions nodes with:

```jsx
top: `${y - radius}px`;
```

Therefore `.member` now centres only horizontally:

```css
.member {
  transform: translateX(-50%);
}
```

The earlier:

```css
transform: translate(-50%, -50%);
```

was removed because it shifted nodes upward a second time and caused SVG
branches to miss their intended circle boundaries.

Mobile CSS no longer changes the physical circle diameter independently from
the JavaScript radii.

Horizontal scrolling is used instead for narrow screens.

---

#### Continuous Branch Geometry

The visual tree uses a shared SVG branch layer.

Each connector begins at:

```text
parent.y + parent.radius
```

and terminates at:

```text
child.y - child.radius
```

Branches first travel vertically away from the parent and then curve toward the
child using SVG paths.

This gives related child branches a common trunk-like origin and avoids visible
gaps between the parent circle and connection line.

Branch styling uses:

- dark olive for the main structure
- sand for a subtle branch highlight
- a low-opacity shadow beneath the line
- rounded stroke caps and joins

---

#### Tree Data Compatibility

The frontend is prepared to consume a real hierarchical MGM response from any
of:

```text
dashboard.referralTree
dashboard.referral_tree
dashboard.tree
```

Until the backend supplies nested descendants, the frontend safely converts:

```text
dashboard.referrals
```

into Level 1 children of the active participant.

This means current direct-referral data can already appear in the visual tree.

---

#### Zero-Referral Participant Behaviour

Active Chakan Tree participants are identified through:

```text
membership.isActive
```

not through referral count.

A participant with zero referrals still receives a tree root:

```text
      You
       ◯
```

and remains inside the participant dashboard.

Zero referrals do not redirect an active participant back to the join flow.

---

#### Level Earnings Compatibility

The participant dashboard supports generation-level earnings fields including:

```text
dashboard.levelEarnings
dashboard.level_earnings
dashboard.earningsByLevel
dashboard.earnings_by_level
```

The frontend supports array- and object-based level representations.

When no level-earnings information is returned, the dashboard displays an
informational empty state.

The frontend does not infer or manufacture MGM earnings.

---

#### Chakan Tree Brand Alignment

The tree uses the canonical Chakancha design tokens from:

```text
src/app/globals.css
```

The network uses:

- off-white and white surfaces
- charcoal text
- muted gold
- sand
- dark olive
- soft neutral borders

Generic tree and leaf symbols are avoided where the official Chakancha mark is
more appropriate.

Participant circles use the real `LogoMark`.

---

### Chakan Tree Error Fixes

#### Endless Page / Recursive Component Fix

Resolved the endlessly repeating `/chakan-tree/dashboard` page caused by
`chakanTree.jsx` rendering `ParticipantDashboard`, which itself imported
`chakanTree.jsx`.

The visual tree is now isolated from the route and dashboard components.

---

#### Chakan Tree Hook Order Error

Resolved React error `#310` by removing `useMemo()` from below the loading-state
early return in `ParticipantDashboard.jsx`.

Hooks now run in the same order on every render.

---

#### Chakan Tree Hydration Stability

Updated `/chakan-tree/dashboard` so client-dependent authentication and
membership checks wait until client mount.

Redirects now occur in effects rather than during rendering.

This reduces hydration instability caused by differences between initial
rendering and persisted browser state.

---

#### Chakan Tree Module Resolution

Resolved:

```text
Module not found: Can't resolve './ReferralTree'
```

by matching the import path to the actual file:

```jsx
import ReferralTree from "./chakanTree";
```

Also resolved:

```text
Attempted import error:
'ReferralTree' is not exported from './chakanTree'
```

by using the component's default export consistently.

---

#### Chakan Tree CSS Geometry Fix

Updated `.member` positioning from:

```css
transform: translate(-50%, -50%);
```

to:

```css
transform: translateX(-50%);
```

so JavaScript and CSS node positioning use the same vertical geometry.

The fixed node diameters remain synchronised with the JavaScript radii.

---

### Result

The Chakan Tree frontend now provides:

- a public non-member Chakan Tree experience
- a separate authenticated participant dashboard
- backend-refreshed membership validation
- effect-based participant redirects
- hydration-safe client mounting
- the official Chakancha mark in the dashboard header
- a realistic recursive MGM referral visualisation
- hollow Chakancha-logo participant nodes
- a clearly identifiable root participant
- continuous SVG parent-child branches
- generation labels
- direct-child count badges
- referral-code labels
- level earnings
- existing reward information
- existing impact information
- the existing direct-referral detail table
- Level 1 fallback rendering until the backend exposes nested MGM descendants
- stable zero-referral participant behavior
- synchronised CSS and SVG node geometry
- production-safe component import/export paths
- removal of the recursive infinite-page bug
- removal of the conditional Hook-order error

---

### Origin Page Redesign

The `/origin` page was rebuilt from a sparse information page into a complete
visual origin-story experience centred on Nandi Hills, Kenya.

The updated page now moves through:

```text
OriginHero
    ↓
THE LAND
    ↓
THE PEOPLE
    ↓
Where we are / MapView
```

#### Origin Hero Redesign

`OriginHero` was updated to use a real tea-field landscape image with a
left-weighted overlay and editorial text placement.

Changes include:

- replaced the previous flat/placeholder background treatment with Nandi Hills photography
- added a dark directional overlay for text readability
- moved the title and supporting copy to a left-aligned editorial composition
- added the Nandi Hills location/elevation eyebrow
- updated the headline to **From the Hills of Heaven**
- added more top clearance below the navbar
- refined mobile text placement so the content sits higher within the hero
- retained rounded hero framing and responsive image cropping

#### The Land Editorial Section

`EstateInfo` was redesigned from a compact estate-facts grid into a larger
storytelling block.

The section now presents:

```text
THE LAND
Where Heaven Meets Earth
```

with descriptive Nandi Hills copy and landscape photography.

The layout uses text on the left and imagery on the right on larger screens, and
stacks vertically on mobile.

#### The People Section

Added `PeopleSection` to bring the human side of tea production into the Origin
story.

The section presents:

```text
THE PEOPLE
Skilled Hands, Quiet Pride
```

with an image on the left and the story of Amina on the right. The layout
intentionally reverses the Land section to create alternating page rhythm.

The section also includes the editorial pull quote:

> "I can tell the quality before it leaves my hand."

#### Full-Width Origin Layout

The major Origin story sections were expanded beyond the previous narrow
content wrapper.

The final layout keeps only a small, even amount of whitespace at the left and
right viewport edges while allowing the images and text blocks to use almost the
full available width.

Desktop sections remain wide and horizontal; tablet spacing is reduced; mobile
sections stack vertically.

#### Interactive Nandi Hills Map

`MapView` was upgraded from a static placeholder to an embedded Google Maps
preview.

The previous version displayed only a location icon, location text, coordinates
and an external link inside an otherwise empty map surface.

The updated version includes:

- an embedded Google Maps iframe
- interactive zoom and navigation
- Nandi Hills as the displayed location
- a branded location information card
- a direct external Google Maps link
- responsive map dimensions
- rounded map framing consistent with the Origin page

#### Origin Component Import Fix

Resolved the production build error:

```text
Module not found: Can't resolve '@components/origin/PeopleSection'
```

The component import now uses the project's configured `@/` alias:

```jsx
import { PeopleSection } from "@/components/origin/PeopleSection";
```

This matches the existing Origin component imports and keeps filename/path
resolution production-safe.

#### Origin Page Result

The Origin route now provides:

- a photographic Nandi Hills hero
- a dedicated land/environment story
- a dedicated people/craft story
- real imagery throughout the page
- alternating editorial layouts
- near-full-width visual sections
- responsive desktop, tablet and mobile presentation
- an interactive Nandi Hills map
- direct Google Maps access
- consistent Origin component imports

The page now functions as a complete brand-origin experience rather than a
supporting information page.
