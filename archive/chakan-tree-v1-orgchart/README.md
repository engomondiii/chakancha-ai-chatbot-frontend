# Chakan Tree — v1, the org-chart visualisation

**The tree that was live on chakancha.com until 22 October 2026.** Kept because
we may want it back.

Taken from commit `1266e3f` ("Feat: Show per-level downline badges on Chakan
Tree nodes", 20 Aug 2026), which is also where git holds it — this copy exists
only because nobody goes looking in git history for a design they remember
seeing.

## What it looked like

Root at the **top**, generations stepping **down**. Each participant is a
circle carrying the Chakancha logo mark, with their name on a pill beneath it
and a ring of small green badges around the circle counting their downline per
generation. Branches leave the bottom edge of a parent, run vertically for 32%
of the gap, then curve across to the top edge of the child.

## Why it was replaced

Only the drawing changed — it is now a tea tree, root at the bottom, matching
the Chakancha mural. **No behaviour, no data and no API changed.** The
replacement keeps every piece of information this one showed:

| v1 | v2 |
| --- | --- |
| root at top, generations descend | root on the trunk, generations climb |
| circle + logo mark per member | named leaf per member |
| per-generation downline badges | the same badges, same colours, at the leaf stalk |
| name shortening + full name on hover | unchanged, same helper |
| `<ReferralTree root={…} />` | unchanged — same prop, same export |

## Restoring it

```bash
cp archive/chakan-tree-v1-orgchart/chakanTree.jsx \
   archive/chakan-tree-v1-orgchart/chakanTree.module.css \
   src/components/chakan-tree/
```

Nothing else has to change. `ParticipantDashboard.jsx` imports
`./chakanTree` and passes `root`; both versions honour that contract, so the
swap works in either direction with no other edit.

Or from git:

```bash
git checkout 1266e3f -- src/components/chakan-tree/chakanTree.jsx \
                        src/components/chakan-tree/chakanTree.module.css
```

## Files

| | |
| --- | --- |
| `chakanTree.jsx` | the component — layout, branches, member nodes, level badges |
| `chakanTree.module.css` | its styles |
| `.source-commit` | the commit this was taken from |
