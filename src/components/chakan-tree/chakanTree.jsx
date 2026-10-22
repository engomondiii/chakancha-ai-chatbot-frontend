"use client";

/* =============================================================================
   src/components/chakan-tree/chakanTree.jsx

   The Chakan Tree, drawn as an actual tea tree — the one from the Chakancha
   mural, with the root on the trunk and each generation a step further up.

   THIS IS A CHANGE OF DRAWING ONLY. Same component, same `root` prop, same
   data, same API, same per-generation downline badges, same name shortening
   with the full name on hover. Nothing about the referral programme, the
   rewards or the dashboard moved. The previous org-chart version — root at
   the top, circles stepping down — is kept verbatim in
   `archive/chakan-tree-v1-orgchart/`, with instructions for putting it back.

   HOW IT IS READ. Position carries the meaning, exactly as it did before:
   one row per generation, every parent centred over the people they
   introduced, a branch from a parent's leaf to each of theirs. Nobody has to
   be told how to read a family tree, which is why no legend is needed.

   WHY IT IS DETERMINISTIC. The wander in the bark, the bow in each limb and
   the scatter of the foliage are all seeded from the tree itself. The same
   network always grows the same tree — a participant refreshing their
   dashboard must not find their branches rearranged, and React re-rendering
   must not make the picture twitch.
   ========================================================================= */

import React, { useEffect, useMemo, useState } from "react";

import styles from "./chakanTree.module.css";
import {
  buildTrunk,
  foliageLeafPath,
  hashSeed,
  limbPath,
  makeRng,
  nameLeafPath,
  toRad,
} from "./treeGeometry";
import {
  DEFAULT_SPECIES,
  TREE_SPECIES,
  mix,
  speciesById,
} from "./treeSpecies";

/* =========================================================
   TREE DIMENSIONS
========================================================= */

const LEVEL_HEIGHT = 165;   /* one generation, one step up — unchanged from v1 */
const PLAQUE_HEIGHT = 44;
const COLUMN_GAP = 44;

const SIDE_PADDING = 110;
const TOP_PADDING = 118;
const TRUNK_HEIGHT = 152;
const BOTTOM_PADDING = 34;

/*
 * Which tree remembered per viewer. A convenience, not state anyone else
 * depends on, so a browser that refuses storage simply starts on tea.
 */
const SPECIES_KEY = "chakancha.tree.species";

/* =========================================================
   TREE HELPERS  (unchanged from v1)
========================================================= */

function getChildren(node) {
  return Array.isArray(node?.children) ? node.children : [];
}

function countLeaves(node) {
  const children = getChildren(node);

  if (children.length === 0) {
    return 1;
  }

  return children.reduce((total, child) => total + countLeaves(child), 0);
}

function getDepth(node) {
  const children = getChildren(node);

  if (children.length === 0) {
    return 0;
  }

  return 1 + Math.max(...children.map(getDepth));
}

/* =========================================================
   PER-LEVEL DOWNLINE BADGES   (unchanged from v1)

   Every node shows its complete downline, not only its
   direct referrals. For each participant we traverse
   their own subtree and count descendants per relative
   generation:

   level 1 → direct referrals
   level 2 → referrals of referrals
   ...
   level 5 → deepest MGM generation shown

   Level 1 uses the deepest green and every deeper level
   fades lighter.

   Example:

   Issac invited Naomi and Josephine.
   Naomi invited Njerry.
   Njerry invited 2 people.

   Issac's badges:   level 1 = 2, level 2 = 1, level 3 = 2
   Naomi's badges:   level 1 = 1, level 2 = 2
   Njerry's badges:  level 1 = 2
========================================================= */

const MAX_BADGE_LEVELS = 5;

const LEVEL_SHADES = [
  { bg: "#3C5E2B", fg: "#FFFFFF" }, /* level 1 — deepest green   */
  { bg: "#5C9440", fg: "#FFFFFF" }, /* level 2                   */
  { bg: "#86A96F", fg: "#FFFFFF" }, /* level 3                   */
  { bg: "#B2CBA3", fg: "#2F4A1E" }, /* level 4                   */
  { bg: "#DCEFD2", fg: "#4A7C2C" }, /* level 5 — lightest        */
];

const BADGE_RADIUS = 9.5;
const BADGE_GAP = 4;

function countDescendantsByLevel(node, maxLevels = MAX_BADGE_LEVELS) {
  const counts = new Array(maxLevels).fill(0);

  function traverse(current, level) {
    const children = getChildren(current);

    children.forEach((child) => {
      if (level < maxLevels) {
        counts[level] += 1;
        traverse(child, level + 1);
      }
    });
  }

  traverse(node, 0);

  return counts
    .map((count, index) => ({ level: index + 1, count }))
    .filter((entry) => entry.count > 0);
}

/* =========================================================
   NAME DISPLAY   (unchanged from v1)

   Node labels have very little horizontal room, so long
   names are shortened for display while the complete name
   remains available through the label's title attribute.
========================================================= */

const NAME_MAX_CHARS = 16;

function formatDisplayName(rawName) {
  const cleaned = String(rawName || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "Participant";
  }

  const words = cleaned.split(" ");

  let display;

  if (words.length >= 3) {
    const first = words[0];
    const lastInitial = words[words.length - 1].charAt(0).toUpperCase();

    display = `${first} ${lastInitial}.`;
  } else if (words.length === 2 && cleaned.length > NAME_MAX_CHARS) {
    const first = words[0];
    const lastInitial = words[1].charAt(0).toUpperCase();

    display = `${first} ${lastInitial}.`;
  } else {
    display = cleaned;
  }

  if (display.length > NAME_MAX_CHARS) {
    display = `${display.slice(0, NAME_MAX_CHARS - 1)}…`;
  }

  return display;
}

function fullNameOf(node) {
  return (
    node?.nickname ||
    node?.name ||
    node?.fullName ||
    node?.full_name ||
    "Participant"
  );
}

/* =========================================================
   GROWING THE TREE

   A tidy layout first — one row per generation, each
   parent centred over its own children — and then a tree
   drawn onto it. The arrangement is orderly; nothing
   about the drawing is.
========================================================= */

function growTree(root, species) {
  if (!root) {
    return null;
  }

  const rng = makeRng(hashSeed(fullNameOf(root) + countLeaves(root)));
  const rand = (a, b) => a + rng() * (b - a);

  /* ── 1. columns: a leaf takes the next one, a parent centres over its own ── */
  const nodes = [];
  let cursor = 0;

  function place(node, level, parent, path) {
    const children = getChildren(node);

    let slot;
    if (children.length === 0) {
      slot = cursor;
      cursor += 1;
    } else {
      const slots = children.map((child, index) =>
        place(child, level + 1, node, `${path}-${index}`));
      slot = (slots[0] + slots[slots.length - 1]) / 2;
    }

    const record = { node, level, slot, parent, path, isRoot: level === 0 };
    nodes.push(record);
    return slot;
  }

  place(root, 0, null, "root");

  const byNode = new Map(nodes.map((record) => [record.node, record]));
  nodes.forEach((record) => {
    record.parentRecord = record.parent ? byNode.get(record.parent) : null;
    record.displayName = formatDisplayName(fullNameOf(record.node));
    record.fullName = fullNameOf(record.node);
    record.badges = countDescendantsByLevel(record.node);
    //
    // The blade has to hold the name AND the badge row above it, and the
    // column width follows from the widest one — otherwise two names on the
    // same row collide and the row stops being readable.
    //
    const badgeWidth = record.badges.length
      ? record.badges.length * (BADGE_RADIUS * 2 + BADGE_GAP)
      : 0;
    record.width = Math.max(
      132,
      record.displayName.length * 9.6 + 56,
      badgeWidth + 36,
    ) * (record.isRoot ? 1.08 : 1);
    record.height = PLAQUE_HEIGHT * (record.isRoot ? 1.08 : 1);
  });

  const columnWidth = Math.max(...nodes.map((r) => r.width)) + COLUMN_GAP;
  const depth = getDepth(root);
  const columns = Math.max(cursor, 1);

  const width = Math.max(900, columns * columnWidth + SIDE_PADDING * 2);
  const height =
    TOP_PADDING + depth * LEVEL_HEIGHT + TRUNK_HEIGHT + BOTTOM_PADDING;

  const rootRecord = nodes.find((record) => record.isRoot);
  const rootY = height - BOTTOM_PADDING - TRUNK_HEIGHT;
  const centreX = width / 2;

  nodes.forEach((record) => {
    //
    // A little drift, so the rows are not mechanical — but only a little, or
    // they stop reading as rows, and the rows are what say "generation".
    //
    record.x =
      centreX + (record.slot - rootRecord.slot) * columnWidth +
      (record.isRoot ? 0 : rand(-7, 7));
    record.y =
      rootY - record.level * LEVEL_HEIGHT + (record.isRoot ? 0 : rand(-5, 5));
    record.tilt = record.isRoot ? 0 : rand(-1.2, 1.2);
  });

  /* ── 2. the trunk ────────────────────────────────────────────────────── */
  const trunk = buildTrunk({
    baseX: rootRecord.x,
    baseY: height - BOTTOM_PADDING,
    topX: rootRecord.x,
    topY: rootY + rootRecord.height / 2,
    baseWidth: species.trunk.baseWidth,
    topWidth: species.trunk.topWidth,
    flare: species.trunk.flare,
    taper: species.trunk.taper,
    rand,
  });

  /* ── 3. limbs, twigs and foliage ─────────────────────────────────────── */
  const limbs = [];
  const twigs = [];
  const clusters = [];

  const LIMB_WIDTH = species.limb.width;
  const WIDTH_DECAY = species.limb.decay;

  nodes.forEach((record) => {
    if (!record.parentRecord) {
      return;
    }
    const parent = record.parentRecord;

    // Out of the top of the parent's leaf and into the bottom of the child's —
    // the same two attachment points v1 used, which is why the branching still
    // reads the same way.
    const from = { x: parent.x, y: parent.y - parent.height / 2 };
    const to = { x: record.x, y: record.y + record.height / 2 };

    const w0 = Math.max(5, LIMB_WIDTH * Math.pow(WIDTH_DECAY, record.level - 1));
    const w1 = Math.max(4, LIMB_WIDTH * Math.pow(WIDTH_DECAY, record.level));

    //
    // The bow sends the limb up out of the parent before it leans across,
    // rather than cutting the corner. A straight diagonal between two nodes is
    // the clearest sign of a diagram.
    //
    const dx = to.x - from.x;
    const lean = Math.min(1, Math.abs(dx) / 240);

    const limb = {
      from,
      to,
      w0,
      w1,
      bow: (dx >= 0 ? -1 : 1) * (0.06 + 0.26 * lean),
      level: record.level,
      path: record.path,
    };
    limbs.push(limb);

    // Twigs that carry nobody. A tree with exactly one branch per member is a
    // skeleton; these are what the crown sits on.
    const dxLimb = to.x - from.x;
    const dyLimb = to.y - from.y;
    for (let i = 0; i < species.crown.twigs; i += 1) {
      const t = rand(0.18, 0.92);
      const origin = { x: from.x + dxLimb * t, y: from.y + dyLimb * t };
      const side = rng() > 0.5 ? 1 : -1;
      const angle = toRad(90 + side * rand(32, 78));
      const length = rand(26, 54);
      const end = {
        x: origin.x + Math.cos(angle) * length,
        y: origin.y - Math.sin(angle) * length,
      };
      twigs.push({
        from: origin,
        to: end,
        w0: Math.max(w0 * 0.26, 1.4),
        w1: 1,
        bow: side * rand(0.08, 0.28),
      });
      clusters.push({
        at: end,
        radius: rand(species.crown.radius[0] * 0.8, species.crown.radius[1] * 0.8),
        level: record.level,
      });
    }
  });

  // A clump behind every leaf, so a name sits in foliage rather than on a bare
  // stick. Tips — participants who have introduced nobody yet — get the fuller
  // one, which is where a real tree puts its new growth.
  nodes.forEach((record) => {
    const isTip = getChildren(record.node).length === 0;
    for (let i = 0; i < species.crown.clumps + (isTip ? 1 : 0); i += 1) {
      clusters.push({
        at: {
          x: record.x + rand(-record.width * 0.4, record.width * 0.4),
          y: record.y - rand(4, 34),
        },
        radius: rand(species.crown.radius[0], species.crown.radius[1]),
        level: record.level,
        density: isTip ? 1.2 : 0.9,
      });
    }
  });

  /* ── 4. clumps become leaves ─────────────────────────────────────────── */
  const foliage = [];
  clusters.forEach((cluster, index) => {
    const count = Math.round(species.crown.perClump * (cluster.density ?? 1));
    for (let i = 0; i < count; i += 1) {
      // Samples pulled towards the centre, so a clump has a ragged edge rather
      // than the hard rim of a disc.
      const r = cluster.radius * Math.sqrt(rng()) * rand(0.5, 0.94);
      const a = rng() * Math.PI * 2;
      foliage.push({
        key: `${index}-${i}`,
        x: cluster.at.x + Math.cos(a) * r,
        y: cluster.at.y + Math.sin(a) * r * species.crown.squash,
        size: rand(species.crown.size[0], species.crown.size[1]),
        angle: rand(0, 360),
        layer: rng() < 0.4 ? 0 : 1,
        level: cluster.level,
        tint: rng(),
      });
    }
  });
  foliage.sort((a, b) => a.layer - b.layer);

  return { width, height, nodes, limbs, twigs, foliage, trunk, depth };
}

/* ── colour helpers ───────────────────────────────────────────────────── */

function shadeOf(ramp, level) {
  return ramp[Math.min(level, ramp.length - 1)];
}

/*
 * Leaves at the back sit in shadow, leaves at the front catch the light, and
 * every one is nudged off that by its own tint — a field of one colour reads
 * as plastic however good the shapes are. The shadow and highlight are mixed
 * from the species' OWN deepest and palest tones, so an acacia greys off and
 * a cherry does not.
 */
function leafColour(ramp, level, layer, tint) {
  const base = shadeOf(ramp, level);
  const deep = mix(ramp[0], "#000000", 0.45);
  const pale = ramp[ramp.length - 1];
  const lit = layer === 0 ? mix(base, deep, 0.42) : mix(base, pale, 0.2);
  return mix(lit, tint > 0.5 ? "#FFFFFF" : deep, Math.abs(tint - 0.5) * 0.24);
}

/* =========================================================
   MEMBER LEAF

   The name is engraved on an ivory blade, the way the
   mural does it, with the downline badges in a row above.

   Ivory rather than the generation's own green on purpose:
   a pale green name on pale green foliage is the level
   being said twice and the name being lost once.
========================================================= */

function MemberLeaf({ record, ramp }) {
  const { x, y, width, height, tilt, isRoot, level, badges } = record;
  const vein = mix(shadeOf(ramp, level), "#000000", 0.52);

  const badgeRowWidth = badges.length * (BADGE_RADIUS * 2 + BADGE_GAP) - BADGE_GAP;
  const badgeY = -height / 2 - BADGE_RADIUS - 7;

  return (
    <g
      className={styles.leafGroup}
      transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${tilt.toFixed(1)})`}
    >
      <title>{record.fullName}</title>

      {/* A white halo outside the rim, so the blade separates from dark
          foliage as well as pale. */}
      <path
        d={nameLeafPath(width, height)}
        transform={`translate(${(-width / 2).toFixed(1)} 0)`}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="9"
        opacity="0.92"
      />
      <path
        className={styles.blade}
        d={nameLeafPath(width, height)}
        transform={`translate(${(-width / 2).toFixed(1)} 0)`}
        fill="url(#chakanIvory)"
        stroke={vein}
        strokeWidth={isRoot ? 3.4 : 2.6}
        strokeLinejoin="round"
      />
      {/* Midrib — every real leaf has one, and it stops the blade reading as
          a sticker. */}
      <path
        d={`M ${(-width / 2 + width * 0.08).toFixed(1)} 0 Q 0 ${(-height * 0.05).toFixed(1)} ${(width / 2 - width * 0.08).toFixed(1)} 0`}
        stroke={vein}
        strokeWidth="1.1"
        opacity="0.24"
        fill="none"
      />

      <text
        className={isRoot ? styles.rootLeafName : styles.leafName}
        x="0"
        y="1"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#1E2117"
      >
        {record.displayName}
      </text>

      {/* Per-generation downline badges — the same counts, the same colours
          and the same tooltips as v1, moved from an arc around the circle to
          a row above the leaf. */}
      {badges.map((entry, index) => {
        const shade = LEVEL_SHADES[entry.level - 1];
        const cx =
          -badgeRowWidth / 2 + BADGE_RADIUS +
          index * (BADGE_RADIUS * 2 + BADGE_GAP);
        return (
          <g key={entry.level} transform={`translate(${cx.toFixed(1)} ${badgeY.toFixed(1)})`}>
            <title>
              {`Level ${entry.level} · ${entry.count} participant${entry.count === 1 ? "" : "s"}`}
            </title>
            <circle
              r={BADGE_RADIUS}
              fill={shade.bg}
              stroke="#FBFAF7"
              strokeWidth="1.8"
            />
            <text
              className={styles.badgeText}
              y="0.5"
              textAnchor="middle"
              dominantBaseline="central"
              fill={shade.fg}
            >
              {entry.count}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/* =========================================================
   REFERRAL TREE
========================================================= */

function ReferralTree({ root }) {
  const [species, setSpecies] = useState(DEFAULT_SPECIES);

  //
  // Read the remembered choice after mount, never during render: this page is
  // server-rendered too, and reading localStorage up front makes the first
  // client paint disagree with the server's markup.
  //
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SPECIES_KEY);
      if (saved) setSpecies(speciesById(saved));
    } catch {
      /* private window, blocked storage — tea is a fine default */
    }
  }, []);

  function choose(id) {
    setSpecies(speciesById(id));
    try {
      window.localStorage.setItem(SPECIES_KEY, id);
    } catch {
      /* nothing to do: the choice still applies for this visit */
    }
  }

  const tree = useMemo(() => growTree(root, species), [root, species]);

  if (!root || !tree) {
    return (
      <div className={styles.empty}>Your Chakan Tree will appear here.</div>
    );
  }

  const BARK = species.bark.mid;
  const BARK_DARK = species.bark.dark;
  const BARK_LIGHT = species.bark.light;

  return (
    <div className={styles.viewport} style={{ "--tree-canvas": species.canvas }}>
      {/*
        Which tree. The arrangement, the badges and the data are identical in
        all four — only the drawing changes — so this is a view preference and
        nothing more.
      */}
      <div className={styles.speciesBar}>
        <label className={styles.speciesLabel} htmlFor="chakan-species">
          Tree
        </label>
        <select
          id="chakan-species"
          className={styles.speciesSelect}
          value={species.id}
          onChange={(event) => choose(event.target.value)}
        >
          {TREE_SPECIES.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        <span className={styles.speciesNote}>
          <em>{species.latin}</em> — {species.note}
        </span>
      </div>

      <div
        className={styles.canvas}
        style={{ width: `${tree.width}px`, height: `${tree.height}px` }}
      >
        <svg
          className={styles.treeLayer}
          width={tree.width}
          height={tree.height}
          viewBox={`0 0 ${tree.width} ${tree.height}`}
          role="img"
          aria-label="Your Chakan Tree referral network"
        >
          <defs>
            {/* Light from the upper left: lit edge, body, then the shaded
                side. Nothing in the drawing contradicts it. */}
            <linearGradient id="chakanTrunk" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={mix(BARK, BARK_DARK, 0.3)} />
              <stop offset="16%" stopColor={BARK_LIGHT} />
              <stop offset="44%" stopColor={BARK} />
              <stop offset="100%" stopColor={BARK_DARK} />
            </linearGradient>
            <linearGradient id="chakanLimb" x1="0" y1="0" x2="0.6" y2="1">
              <stop offset="0%" stopColor={mix(BARK, BARK_LIGHT, 0.6)} />
              <stop offset="50%" stopColor={BARK} />
              <stop offset="100%" stopColor={BARK_DARK} />
            </linearGradient>
            <linearGradient id="chakanIvory" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FEFCF5" />
              <stop offset="58%" stopColor="#F7F2E3" />
              <stop offset="100%" stopColor="#EBE4D1" />
            </linearGradient>
            <radialGradient id="chakanGround">
              <stop offset="0%" stopColor="rgba(44,33,20,0.30)" />
              <stop offset="100%" stopColor="rgba(44,33,20,0)" />
            </radialGradient>
            <filter id="chakanLeafShadow" x="-40%" y="-60%" width="180%" height="220%">
              <feDropShadow dx="1.4" dy="3" stdDeviation="3" floodColor="#241A10" floodOpacity="0.4" />
            </filter>
            <filter id="chakanCrownSoft" x="-12%" y="-12%" width="124%" height="124%">
              <feGaussianBlur stdDeviation="1.6" />
            </filter>
          </defs>

          {/* The ground it stands on. */}
          <ellipse
            cx={tree.nodes[0] ? tree.width / 2 : 0}
            cy={tree.height - BOTTOM_PADDING + 6}
            rx="170"
            ry="26"
            fill="url(#chakanGround)"
          />

          {/* Trunk */}
          <g>
            <path
              d={tree.trunk.outline}
              fill="url(#chakanTrunk)"
              stroke={BARK_DARK}
              strokeWidth="1"
              strokeLinejoin="round"
            />
            {tree.trunk.bark.map((d, index) => {
              const u = index / Math.max(tree.trunk.bark.length - 1, 1);
              return (
                <path
                  key={`bark-${index}`}
                  d={d}
                  fill="none"
                  stroke={u < 0.38 ? BARK_LIGHT : BARK_DARK}
                  strokeWidth={(0.6 + u * 1.1).toFixed(2)}
                  strokeLinecap="round"
                  opacity={(0.16 + u * 0.28).toFixed(2)}
                />
              );
            })}
          </g>

          {/*
            Crown back layer, then the twigs, then the branches, then the
            front foliage.

            The clumps are offset to the SIDE of each branch upstream, which is
            what lets the limbs stay inside the canopy where they belong. Drawn
            over the finished crown instead, they read as brown ribbon stuck on
            green.
          */}
          <g filter="url(#chakanCrownSoft)" opacity="0.95">
            {tree.foliage.filter((f) => f.layer === 0).map((f) => (
              <path
                key={`b-${f.key}`}
                d={foliageLeafPath(f.size, f.size * 0.4, species.leaf)}
                fill={leafColour(species.ramp, f.level, 0, f.tint)}
                transform={`translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(${f.angle.toFixed(0)})`}
              />
            ))}
          </g>

          <g>
            {tree.twigs.map((twig, index) => (
              <path
                key={`twig-${index}`}
                d={limbPath(twig)}
                fill={mix(BARK, BARK_DARK, 0.3)}
              />
            ))}
          </g>

          {/* The referral chain itself — thickest first, so a thin limb never
              disappears beneath the one it grew out of. */}
          <g>
            {[...tree.limbs]
              .sort((a, b) => b.w0 - a.w0)
              .map((limb) => (
                <g key={`limb-${limb.path}`}>
                  <path
                    d={limbPath({ ...limb, w0: limb.w0 + 2.4, w1: limb.w1 + 2 })}
                    fill="rgba(28,18,10,0.28)"
                  />
                  <path
                    d={limbPath(limb)}
                    fill="url(#chakanLimb)"
                    stroke={BARK_DARK}
                    strokeWidth="0.55"
                    strokeLinejoin="round"
                  />
                </g>
              ))}
          </g>

          <g>
            {tree.foliage.filter((f) => f.layer === 1).map((f) => (
              <path
                key={`f-${f.key}`}
                d={foliageLeafPath(f.size, f.size * 0.4, species.leaf)}
                fill={leafColour(species.ramp, f.level, 1, f.tint)}
                stroke={mix(shadeOf(species.ramp, f.level), "#000000", 0.5)}
                strokeWidth="0.4"
                transform={`translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(${f.angle.toFixed(0)})`}
              />
            ))}
          </g>

          {/* Named leaves last, on top of everything. */}
          <g filter="url(#chakanLeafShadow)">
            {tree.nodes.map((record) => (
              <MemberLeaf key={record.path} record={record} ramp={species.ramp} />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}

export default ReferralTree;
