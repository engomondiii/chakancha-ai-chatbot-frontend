"use client";

import React from "react";

import { LogoMark } from "@/components/common/Logo";

import styles from "./chakanTree.module.css";

/* =========================================================
   TREE DIMENSIONS
========================================================= */

const LEAF_WIDTH = 160;
const LEVEL_HEIGHT = 165;

const SIDE_PADDING = 110;
const TOP_PADDING = 100;

const ROOT_RADIUS = 43;
const NODE_RADIUS = 34;

/* =========================================================
   TREE HELPERS
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
   PER-LEVEL DOWNLINE BADGES

   Every node shows its complete downline, not only its
   direct referrals. For each participant we traverse
   their own subtree and count descendants per relative
   generation:

   level 1 → direct referrals
   level 2 → referrals of referrals
   ...
   level 5 → deepest MGM generation shown

   Each level renders as a small badge arranged on an arc
   around the circle. Level 1 uses the deepest green and
   every deeper level fades lighter.

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

/*
 * Arc placement around the circle, in degrees.
 * 0° points right; positive angles sweep clockwise
 * because screen y grows downward.
 *
 * -80° starts just right of the top and each badge
 * steps 50° clockwise, wrapping down the right side —
 * matching the design reference.
 */
const BADGE_START_ANGLE = -80;
const BADGE_ANGLE_STEP = 50;

const BADGE_SIZE = 22;

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

function LevelBadges({ node, circleRadius }) {
  const levels = countDescendantsByLevel(node);

  if (levels.length === 0) {
    return null;
  }

  /*
   * Badge centres sit just outside the circle edge
   * so each badge slightly overlaps the ring.
   */
  const distance = circleRadius + 3;

  const center = circleRadius;

  return (
    <>
      {levels.map((entry, index) => {
        const angleDeg = BADGE_START_ANGLE + index * BADGE_ANGLE_STEP;
        const angleRad = (angleDeg * Math.PI) / 180;

        const x = center + distance * Math.cos(angleRad) - BADGE_SIZE / 2;
        const y = center + distance * Math.sin(angleRad) - BADGE_SIZE / 2;

        const shade = LEVEL_SHADES[entry.level - 1];

        return (
          <span
            key={entry.level}
            className={styles.levelBadge}
            title={`Level ${entry.level} · ${entry.count} participant${
              entry.count === 1 ? "" : "s"
            }`}
            style={{
              left: `${x}px`,
              top: `${y}px`,

              backgroundColor: shade.bg,
              color: shade.fg,
            }}
          >
            {entry.count}
          </span>
        );
      })}
    </>
  );
}

/* =========================================================
   NAME DISPLAY

   Node labels have very little horizontal room, so long
   names are shortened for display while the complete name
   remains available through the label's title attribute.

   Rules:

   1 word            → shown as-is (character cap applies)
   2 words           → shown as-is if short enough,
                       otherwise "First L."
   3 or more words   → always "First L."
   any result        → hard character cap with ellipsis
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

/* =========================================================
   TREE LAYOUT
========================================================= */

function createTreeLayout(root) {
  if (!root) {
    return null;
  }

  const leafCount = Math.max(countLeaves(root), 1);

  const depth = getDepth(root);

  const width = Math.max(900, leafCount * LEAF_WIDTH + SIDE_PADDING * 2);

  const height = Math.max(480, TOP_PADDING * 2 + depth * LEVEL_HEIGHT + 160);

  const nodes = [];
  const edges = [];

  function walk(node, left, right, level, parentLayout = null, path = "root") {
    const isRoot = level === 0;

    const radius = isRoot ? ROOT_RADIUS : NODE_RADIUS;

    const x = (left + right) / 2;

    const y = TOP_PADDING + level * LEVEL_HEIGHT;

    const layoutNode = {
      node,
      x,
      y,
      level,
      radius,
      path,
    };

    nodes.push(layoutNode);

    if (parentLayout) {
      edges.push({
        from: parentLayout,
        to: layoutNode,
      });
    }

    const children = getChildren(node);

    if (children.length === 0) {
      return;
    }

    const totalLeaves = children.reduce(
      (total, child) => total + countLeaves(child),
      0,
    );

    const availableWidth = right - left;

    let cursor = left;

    children.forEach((child, index) => {
      const childLeaves = countLeaves(child);

      const childWidth = availableWidth * (childLeaves / totalLeaves);

      walk(
        child,
        cursor,
        cursor + childWidth,
        level + 1,
        layoutNode,
        `${path}-${index}`,
      );

      cursor += childWidth;
    });
  }

  walk(root, SIDE_PADDING, width - SIDE_PADDING, 0);

  return {
    width,
    height,
    nodes,
    edges,
  };
}

/* =========================================================
   BRANCH
========================================================= */

function Branch({ from, to }) {
  /*
   * Start exactly at the bottom
   * edge of the parent circle.
   */
  const startX = from.x;

  const startY = from.y + from.radius;

  /*
   * Finish exactly at the top
   * edge of the child circle.
   */
  const endX = to.x;

  const endY = to.y - to.radius;

  const verticalDistance = endY - startY;

  /*
   * All children initially travel
   * vertically from the parent.
   *
   * This creates the common trunk
   * before the branch curves outward.
   */
  const splitY = startY + verticalDistance * 0.32;

  const curveY = splitY + verticalDistance * 0.28;

  const path = `
    M ${startX} ${startY}
    L ${startX} ${splitY}
    C
      ${startX} ${curveY},
      ${endX} ${curveY},
      ${endX} ${endY}
  `;

  return (
    <g>
      {/* Soft branch shadow */}
      <path d={path} className={styles.branchShadow} strokeWidth="8" />

      {/* Main branch */}
      <path d={path} className={styles.branch} strokeWidth="4.5" />

      {/* Subtle branch highlight */}
      <path d={path} className={styles.branchHighlight} strokeWidth="1.2" />
    </g>
  );
}

/* =========================================================
   MEMBER NODE
========================================================= */

function MemberNode({ layout }) {
  const { node, x, y, level, radius } = layout;

  const isRoot = level === 0;

  const fullName =
    node?.nickname ||
    node?.name ||
    node?.fullName ||
    node?.full_name ||
    "Participant";

  const displayName = formatDisplayName(fullName);

  return (
    <div
      className={[styles.member, isRoot ? styles.rootMember : ""]
        .filter(Boolean)
        .join(" ")}
      style={{
        left: `${x}px`,
        top: `${y - radius}px`,
      }}
    >
      <div
        className={[styles.circle, isRoot ? styles.rootCircle : ""]
          .filter(Boolean)
          .join(" ")}
      >
        <LogoMark tone="dark" size={isRoot ? "md" : "sm"} clickable={false} />

        {/*
         * Per-level downline badges. Level 1 (deepest
         * green) is the direct referrals; each deeper
         * generation fades lighter.
         */}
        <LevelBadges node={node} circleRadius={radius} />
      </div>

      <div className={styles.label}>
        {/*
         * The title attribute keeps the complete
         * name available on hover when the display
         * name has been shortened.
         */}
        <span className={styles.name} title={fullName}>
          {displayName}
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   REFERRAL TREE
========================================================= */

function ReferralTree({ root }) {
  const layout = createTreeLayout(root);

  if (!root || !layout) {
    return (
      <div className={styles.empty}>Your Chakan Tree will appear here.</div>
    );
  }

  return (
    <div className={styles.viewport}>
      <div
        className={styles.canvas}
        style={{
          width: `${layout.width}px`,

          height: `${layout.height}px`,
        }}
      >
        {/* ===============================================
            CONTINUOUS SVG BRANCH LAYER
        =============================================== */}

        <svg
          className={styles.branchLayer}
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          aria-hidden="true"
        >
          <defs>
            <filter
              id="branchBlur"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feGaussianBlur stdDeviation="2" />
            </filter>
          </defs>

          {layout.edges.map((edge, index) => (
            <Branch key={`branch-${index}`} from={edge.from} to={edge.to} />
          ))}
        </svg>

        {/* ===============================================
            MEMBER NODES
        =============================================== */}

        {layout.nodes.map((layoutNode) => (
          <MemberNode key={layoutNode.path} layout={layoutNode} />
        ))}
      </div>
    </div>
  );
}

export default ReferralTree;