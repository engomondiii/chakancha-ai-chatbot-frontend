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

  const name = isRoot
    ? "You"
    : node?.nickname ||
      node?.name ||
      node?.fullName ||
      node?.full_name ||
      "Participant";

  const referralCode = node?.referralCode || node?.referral_code || null;

  const children = getChildren(node);

  const childCount = children.length;

  return (
    <div
      className={[styles.member, isRoot ? styles.rootMember : ""]
        .filter(Boolean)
        .join(" ")}
      style={{
        left: `${x}px`,

        /*
         * y represents the centre
         * of the circle.
         */
        top: `${y - radius}px`,
      }}
    >
      <div
        className={[styles.circle, isRoot ? styles.rootCircle : ""]
          .filter(Boolean)
          .join(" ")}
      >
        <LogoMark tone="dark" size={isRoot ? "md" : "sm"} clickable={false} />

        {childCount > 0 && (
          <span className={styles.childBadge}>{childCount}</span>
        )}
      </div>

      <div className={styles.label}>
        <span className={styles.name} title={name}>
          {name}
        </span>

        <span className={styles.level}>
          {isRoot ? "Root" : `Level ${level}`}
        </span>

        {referralCode && <span className={styles.code}>{referralCode}</span>}
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
