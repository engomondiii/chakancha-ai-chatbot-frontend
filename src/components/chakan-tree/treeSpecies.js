/* =============================================================================
   src/components/chakan-tree/treeSpecies.js

   Four trees, one network.

   The same referral data and the same layout, drawn as four different trees.
   Nothing about how the picture is READ changes between them: the root is
   still on the trunk, every generation is still one step up, every parent is
   still centred over the people they introduced, and the downline badges are
   untouched. Only the tree changes.

   A species is NOT a palette swap. Each sets its own trunk mass and how fast
   it sheds it, how quickly limbs taper, how dense and how flat its crown is,
   what shape one leaf is, and the light it stands in. A baobab and an acacia
   built from the same numbers in different colours would fool nobody.

   Three of the four mean something to Chakancha: the tea bush of the mural,
   the acacia of the Kenyan savanna the tea grows beside, and the cherry of
   Korea, where the business is registered.

   A NOTE ON CONTRAST. Three pairs have to stay apart in every species — bark
   against sky, foliage against sky, and the name plaque against the crown.
   The third is solved once, in chakanTree.jsx: plaques are ivory in every
   species and never compete. The other two are why the barks here are darker
   than life and no ramp runs to near-white at its pale end.
   ========================================================================== */

function mix(hex, towards, t) {
  const a = [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16));
  const b = [1, 3, 5].map((i) => parseInt(towards.substr(i, 2), 16));
  return `#${a
    .map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0"))
    .join("")}`;
}

/**
 * Six generation colours between two endpoints.
 *
 * Generated rather than hand-picked, so every species is guaranteed the same
 * amount of travel from the root to the outermost generation. Hand-mixing is
 * how a ramp ends up as six near-identical greens that tell a reader nothing.
 */
function ramp(deep, light) {
  const out = [];
  for (let i = 0; i < 6; i += 1) out.push(mix(deep, light, i / 5));
  return out;
}

export const TREE_SPECIES = [
  {
    id: "tea",
    name: "Tea",
    latin: "Camellia sinensis",
    note: "The tree of the Chakancha mural.",
    bark: { mid: "#8A5A3E", dark: "#3C210F", light: "#C79069" },
    ramp: ramp("#1C4A29", "#C7D857"),
    leaf: "toothed",
    canvas: "rgba(185, 167, 119, 0.10)",
    trunk: { baseWidth: 132, topWidth: 52, flare: 2.1, taper: 0.72 },
    limb: { width: 34, decay: 0.78 },
    crown: { twigs: 5, clumps: 3, perClump: 22, radius: [36, 60], size: [18, 33], squash: 0.86 },
  },
  {
    id: "acacia",
    name: "Acacia",
    latin: "Vachellia tortilis",
    note: "The flat-topped thorn of the Kenyan savanna.",
    // Darkened hard off the photographic grey: against savanna light a
    // true-to-life acacia bark and the ground behind it are the same value,
    // and the trunk disappears.
    bark: { mid: "#6E6454", dark: "#302A20", light: "#A4967F" },
    ramp: ramp("#24421F", "#A3BE63"),
    leaf: "leaflet",
    canvas: "rgba(205, 180, 120, 0.16)",
    trunk: { baseWidth: 112, topWidth: 44, flare: 1.9, taper: 0.66 },
    limb: { width: 30, decay: 0.85 },
    // squash flattens a clump and radius spreads it — the umbrella is made
    // here, not by squashing the whole drawing.
    crown: { twigs: 8, clumps: 4, perClump: 30, radius: [48, 76], size: [11, 20], squash: 0.36 },
  },
  {
    id: "baobab",
    name: "Baobab",
    latin: "Adansonia digitata",
    note: "Enormous trunk, stubby limbs, a thin crown.",
    bark: { mid: "#7A6B55", dark: "#352B1E", light: "#B3A188" },
    ramp: ramp("#1D3A22", "#8CB25D"),
    leaf: "palmate",
    canvas: "rgba(190, 170, 130, 0.18)",
    // The whole tree is the trunk, and it holds its width almost to the top.
    trunk: { baseWidth: 210, topWidth: 64, flare: 1.4, taper: 1.9 },
    limb: { width: 44, decay: 0.62 },
    crown: { twigs: 3, clumps: 2, perClump: 13, radius: [30, 50], size: [20, 34], squash: 0.9 },
  },
  {
    id: "cherry",
    name: "Cherry blossom",
    latin: "Prunus serrulata",
    note: "Dark bark under pale blossom — Korea, where Chakancha is registered.",
    bark: { mid: "#60463D", dark: "#241915", light: "#977A6F" },
    ramp: ramp("#73244A", "#EC9DBF"),
    leaf: "blossom",
    canvas: "rgba(190, 150, 170, 0.16)",
    trunk: { baseWidth: 122, topWidth: 48, flare: 1.8, taper: 0.7 },
    limb: { width: 32, decay: 0.79 },
    crown: { twigs: 7, clumps: 4, perClump: 26, radius: [38, 62], size: [13, 25], squash: 0.9 },
  },
];

export const DEFAULT_SPECIES = TREE_SPECIES[0];

export function speciesById(id) {
  return TREE_SPECIES.find((s) => s.id === id) || DEFAULT_SPECIES;
}

export { mix };
