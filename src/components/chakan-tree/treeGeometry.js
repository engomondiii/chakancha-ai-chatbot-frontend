/* =============================================================================
   src/components/chakan-tree/treeGeometry.js

   The shapes a Chakan Tree is drawn from — pure geometry, no React.

   Split out of chakanTree.jsx because it is a different kind of thing: none of
   it knows about participants, props or the DOM. It takes a laid-out tree and
   returns paths.

   Everything here is DETERMINISTIC. The randomness is seeded from the tree
   itself, so a given network always grows the same tree — refreshing the
   dashboard must not reshuffle somebody's branches, and React re-rendering it
   must not make it twitch.
   ========================================================================== */

/** xorshift32 — small, fast, and repeatable from a seed. */
export function makeRng(seed) {
  let s = (seed >>> 0) || 1;
  return function rng() {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
}

export function hashSeed(text) {
  let h = 2166136261;
  const value = String(text || "chakancha");
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const toRad = (deg) => (deg * Math.PI) / 180;

/* ── bark ────────────────────────────────────────────────────────────────── */

/**
 * A limb, drawn as a filled outline rather than a stroke.
 *
 * A constant-width stroke reads as wiring however organic the angles are. This
 * tapers from parent to child and is widened at the base, which is the branch
 * collar every real tree has where a limb leaves its parent.
 */
export function limbPath({ from, to, w0, w1, bow }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  const mx = (from.x + to.x) / 2 + nx * bow * len;
  const my = (from.y + to.y) / 2 + ny * bow * len;

  const base = w0 * 1.24;

  const a = { x: from.x + (nx * base) / 2, y: from.y + (ny * base) / 2 };
  const b = { x: to.x + (nx * w1) / 2, y: to.y + (ny * w1) / 2 };
  const c = { x: to.x - (nx * w1) / 2, y: to.y - (ny * w1) / 2 };
  const d = { x: from.x - (nx * base) / 2, y: from.y - (ny * base) / 2 };
  const c1 = { x: mx + (nx * (base + w1)) / 4, y: my + (ny * (base + w1)) / 4 };
  const c2 = { x: mx - (nx * (base + w1)) / 4, y: my - (ny * (base + w1)) / 4 };

  return [
    `M ${a.x.toFixed(1)} ${a.y.toFixed(1)}`,
    `Q ${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`,
    `L ${c.x.toFixed(1)} ${c.y.toFixed(1)}`,
    `Q ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${d.x.toFixed(1)} ${d.y.toFixed(1)} Z`,
  ].join(" ");
}

/**
 * The trunk: a closed outline whose two sides wander, splaying into buttress
 * roots at the soil.
 *
 * A symmetrical taper is the clearest sign of a generated tree, so each side
 * is perturbed independently and the base widens hard over the last fifth.
 */
export function buildTrunk({ baseX, baseY, topX, topY, baseWidth, topWidth,
                             flare = 2.1, taper = 0.72, rand }) {
  const STEPS = 16;
  const left = [];
  const right = [];

  for (let i = 0; i <= STEPS; i += 1) {
    const t = i / STEPS;
    const y = baseY + (topY - baseY) * t;
    const x = baseX + (topX - baseX) * t;

    /*
     * The exponent is the difference between a cone and a bottle. A tea trunk
     * sheds its width steadily; a baobab holds nearly all of it until just
     * under the crown, which is the thing anyone recognises it by.
     */
    let w = baseWidth + (topWidth - baseWidth) * Math.pow(t, taper);
    if (t < 0.22) {
      const f = (0.22 - t) / 0.22;
      w *= 1 + (flare - 1) * f * f;
    }

    const wobble = (1 - t * 0.5) * 3.2;
    left.push({ x: x - w / 2 + rand(-wobble, wobble), y });
    right.push({ x: x + w / 2 + rand(-wobble, wobble), y });
  }

  //
  // Note the copy. `reverse()` mutates, and the bark lines below read `right`
  // again — reversing in place pairs each left-hand point with the right-hand
  // point from the opposite end of the trunk, and the grain then splays out
  // through the silhouette near the base.
  //
  const outline = [`M ${left[0].x.toFixed(1)} ${left[0].y.toFixed(1)}`];
  left.slice(1).forEach((p) => outline.push(`L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`));
  [...right].reverse().forEach((p) => outline.push(`L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`));
  outline.push("Z");

  const bark = [];
  const LINES = 18;
  for (let i = 0; i < LINES; i += 1) {
    const u = i / (LINES - 1);
    const points = [];
    for (let s = 0; s <= 8; s += 1) {
      const t = s / 8;
      const k = Math.round(t * STEPS);
      const l = left[k];
      const r = right[k];
      // Kept clear of the outline and bunched towards the shaded side, so the
      // trunk reads as a cylinder rather than a plank.
      const bias = 0.06 + Math.pow(u, 1.35) * 0.88;
      points.push({ x: l.x + (r.x - l.x) * (bias + rand(-0.02, 0.02)), y: l.y });
    }
    bark.push(points
      .map((p, k) => `${k ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" "));
  }

  return { outline: outline.join(" "), bark };
}

/* ── leaves ──────────────────────────────────────────────────────────────── */

/**
 * The shape of one leaf in the crown.
 *
 * This does more work than it looks. Crown density, colour and silhouette get
 * a viewer most of the way to recognising a species, but a tea leaf and an
 * acacia leaflet are different OBJECTS — one is a toothed blade, the other a
 * scatter of specks — and at any zoom where individual leaves are visible,
 * one outline for all four gives the game away.
 */
export function foliageLeafPath(length, width, shape) {
  switch (shape) {
    case "leaflet": return leafletPath(length, width);
    case "palmate": return palmatePath(length, width);
    case "blossom": return blossomPath(length);
    default:        return toothedPath(length, width);
  }
}

/** Acacia. One leaflet off a pinnate frond: tiny, blunt, smooth-edged. */
function leafletPath(length, width) {
  const h = width / 2;
  return [
    "M 0 0",
    `C ${(length * 0.08).toFixed(1)} ${(-h * 1.35).toFixed(1)}`,
    `  ${(length * 0.92).toFixed(1)} ${(-h * 1.2).toFixed(1)}`,
    `  ${length.toFixed(1)} 0`,
    `C ${(length * 0.92).toFixed(1)} ${(h * 1.2).toFixed(1)}`,
    `  ${(length * 0.08).toFixed(1)} ${(h * 1.35).toFixed(1)}`,
    "  0 0 Z",
  ].join(" ");
}

/** Baobab. Digitate — five broad leaflets radiating from one point. */
function palmatePath(length, width) {
  const SPAN = [0.76, 0.92, 1, 0.92, 0.76];
  const parts = [];
  for (let i = 0; i < 5; i += 1) {
    const a = toRad(-52 + i * 26);
    const len = length * SPAN[i];
    const tx = Math.cos(a) * len;
    const ty = Math.sin(a) * len;
    // Broad: a baobab leaflet is a fat teardrop. Narrow ones turn the whole
    // crown into pine needles.
    const hw = width * 0.36;
    const nx = -Math.sin(a) * hw;
    const ny = Math.cos(a) * hw;
    parts.push(
      `M 0 0 Q ${(tx * 0.45 + nx).toFixed(1)} ${(ty * 0.45 + ny).toFixed(1)} ` +
      `${tx.toFixed(1)} ${ty.toFixed(1)} ` +
      `Q ${(tx * 0.45 - nx).toFixed(1)} ${(ty * 0.45 - ny).toFixed(1)} 0 0 Z`);
  }
  return parts.join(" ");
}

/** Cherry. Five rounded petals — what you actually see on the tree. */
function blossomPath(size) {
  const r = size * 0.27;
  const ring = size * 0.26;
  const parts = [];
  for (let i = 0; i < 5; i += 1) {
    const a = toRad(i * 72 - 90);
    const cx = Math.cos(a) * ring;
    const cy = Math.sin(a) * ring;
    parts.push(
      `M ${(cx - r).toFixed(1)} ${cy.toFixed(1)} ` +
      `a ${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(r * 2).toFixed(1)} 0 ` +
      `a ${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-r * 2).toFixed(1)} 0 Z`);
  }
  return parts.join(" ");
}

/**
 * Tea. Lanceolate, widest about a third along, and finely SERRATED. The
 * toothed margin is the most recognisable thing about Camellia sinensis, and
 * a smooth almond outline reads as generic foliage.
 */
function toothedPath(length, width) {
  const TEETH = 11;
  const TOOTH = 0.92;
  const half = (t) => (width / 2) * Math.sin(Math.PI * Math.pow(t, 0.78));
  const up = [];
  const down = [];

  for (let i = 1; i <= TEETH; i += 1) {
    const t = i / (TEETH + 1);
    up.push(`L ${(length * t).toFixed(1)} ${(-half(t) * (i % 2 ? 1 : TOOTH)).toFixed(1)}`);
  }
  for (let i = TEETH; i >= 1; i -= 1) {
    const t = i / (TEETH + 1);
    down.push(`L ${(length * t).toFixed(1)} ${(half(t) * (i % 2 ? 1 : TOOTH)).toFixed(1)}`);
  }
  return `M 0 0 ${up.join(" ")} L ${length.toFixed(1)} 0 ${down.join(" ")} Z`;
}

/**
 * The blade a participant's name is engraved on.
 *
 * Smooth and full-shouldered, not serrated. Teeth on a shape stretched long
 * enough to carry a name turn into a row of spikes, and a true lanceolate
 * blade tapers to a point at both ends — where the text would sit.
 */
export function nameLeafPath(length, width) {
  const w = width / 2;
  return [
    "M 0 0",
    `C ${(length * 0.06).toFixed(1)} ${(-w * 1.15).toFixed(1)}`,
    `  ${(length * 0.94).toFixed(1)} ${(-w * 1.15).toFixed(1)}`,
    `  ${length.toFixed(1)} 0`,
    `C ${(length * 0.94).toFixed(1)} ${(w * 1.15).toFixed(1)}`,
    `  ${(length * 0.06).toFixed(1)} ${(w * 1.15).toFixed(1)}`,
    "  0 0 Z",
  ].join(" ");
}

export { toRad };
