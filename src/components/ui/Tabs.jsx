/**
 * Tabs.jsx
 * Accessible tab component.
 * Supports controlled and uncontrolled modes, with animated indicator.
 *
 * Usage (uncontrolled):
 *   <Tabs defaultTab="brewing">
 *     <TabList>
 *       <Tab id="brewing">Brewing</Tab>
 *       <Tab id="origin">Origin</Tab>
 *     </TabList>
 *     <TabPanel id="brewing"><BrewingGuide /></TabPanel>
 *     <TabPanel id="origin"><OriginStory /></TabPanel>
 *   </Tabs>
 *
 * Usage (controlled):
 *   <Tabs activeTab={tab} onChange={setTab}>…</Tabs>
 */

'use client';

import React, { createContext, useContext, useState, useRef, useLayoutEffect } from 'react';
import styles from './Tabs.module.css';

// ─── Context ──────────────────────────────────────────────────────────────────

const TabsContext = createContext(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tab/TabList/TabPanel must be used inside <Tabs>');
  return ctx;
}

// ─── Tabs (root) ──────────────────────────────────────────────────────────────

export function Tabs({
  children,
  defaultTab,
  activeTab: controlledTab,
  onChange,
  className = '',
}) {
  const isControlled = controlledTab !== undefined;
  const [internalTab, setInternalTab] = useState(defaultTab || null);

  const activeTab = isControlled ? controlledTab : internalTab;

  const setActiveTab = (id) => {
    if (!isControlled) setInternalTab(id);
    onChange?.(id);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`${styles.tabs} ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// ─── TabList ──────────────────────────────────────────────────────────────────

export function TabList({ children, className = '' }) {
  const listRef    = useRef(null);
  const { activeTab } = useTabsContext();

  // Animated sliding indicator
  useLayoutEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector('[data-active="true"]');
    const indicator = listRef.current.querySelector('.' + styles.indicator);
    if (!activeEl || !indicator) return;

    indicator.style.width  = `${activeEl.offsetWidth}px`;
    indicator.style.left   = `${activeEl.offsetLeft}px`;
  }, [activeTab]);

  return (
    <div
      ref={listRef}
      role="tablist"
      className={`${styles.tabList} ${className}`}
    >
      {children}
      {/* Sliding active indicator */}
      <span className={styles.indicator} aria-hidden="true" />
    </div>
  );
}

// ─── Tab ─────────────────────────────────────────────────────────────────────

export function Tab({ children, id, disabled = false, className = '' }) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === id;

  return (
    <button
      role="tab"
      id={`tab-${id}`}
      aria-controls={`tabpanel-${id}`}
      aria-selected={isActive}
      data-active={isActive}
      disabled={disabled}
      onClick={() => !disabled && setActiveTab(id)}
      className={[
        styles.tab,
        isActive   && styles.tabActive,
        disabled   && styles.tabDisabled,
        className,
      ].filter(Boolean).join(' ')}
      type="button"
    >
      {children}
    </button>
  );
}

// ─── TabPanel ─────────────────────────────────────────────────────────────────

export function TabPanel({ children, id, className = '' }) {
  const { activeTab } = useTabsContext();
  const isActive = activeTab === id;

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${id}`}
      aria-labelledby={`tab-${id}`}
      hidden={!isActive}
      className={`${styles.tabPanel} ${isActive ? styles.tabPanelActive : ''} ${className}`}
    >
      {isActive && children}
    </div>
  );
}

export default Tabs;