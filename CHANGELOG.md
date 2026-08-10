**### Chakan Tree MGM Referral Network**

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

**#### Participant Dashboard Expansion**

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

**#### Realistic Chakan Tree Visualisation**

Added the visual tree implementation:

```text
src/components/chakan-tree/chakanTree.jsx
src/components/chakan-tree/chakanTree.module.css
```

The visual network uses:

- the current participant as the root
- the root label **You**
- hollow circular participant nodes
- the official Chakancha `LogoMark` inside every node
- muted-gold root emphasis
- recursive child rendering
- child-count badges
- generation / level labels
- referral-code labels where available
- descendant leaf counting for horizontal layout
- horizontal scrolling for wide networks
- responsive label treatment
- reduced-motion handling

All connectors are rendered inside one SVG layer.

Each parent-child path starts at the edge of the parent circle and terminates at
the edge of the child circle.

Curved SVG branches replace detached CSS line elements, giving the network a
continuous and more organic tree-like structure.

---

**#### Chakan Tree Component Architecture**

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

**#### Recursive Dashboard Rendering Fix**

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

**#### Referral Tree Import / Export Resolution**

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

**#### React Hook Order Fix**

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

**#### Hydration-Safe Dashboard Route**

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

**#### Chakan Tree Dashboard Header Alignment**

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

**#### Tree Geometry and CSS Synchronisation**

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

**#### Continuous Branch Geometry**

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

**#### Tree Data Compatibility**

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

**#### Zero-Referral Participant Behaviour**

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

**#### Level Earnings Compatibility**

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

**#### Chakan Tree Brand Alignment**

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

**### Chakan Tree Error Fixes**

**#### Endless Page / Recursive Component Fix**

Resolved the endlessly repeating `/chakan-tree/dashboard` page caused by
`chakanTree.jsx` rendering `ParticipantDashboard`, which itself imported
`chakanTree.jsx`.

The visual tree is now isolated from the route and dashboard components.

---

**#### Chakan Tree Hook Order Error**

Resolved React error `#310` by removing `useMemo()` from below the loading-state
early return in `ParticipantDashboard.jsx`.

Hooks now run in the same order on every render.

---

**#### Chakan Tree Hydration Stability**

Updated `/chakan-tree/dashboard` so client-dependent authentication and
membership checks wait until client mount.

Redirects now occur in effects rather than during rendering.

This reduces hydration instability caused by differences between initial
rendering and persisted browser state.

---

**#### Chakan Tree Module Resolution**

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

**#### Chakan Tree CSS Geometry Fix**

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

**### Result**

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
