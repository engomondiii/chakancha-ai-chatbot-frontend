/**
 * src/components/hero/HeroSection.jsx — Integration Phase 2
 *
 * What changed from previous version:
 *  - When search results appear, the hero expands to fill the full viewport
 *    height and becomes scrollable — the footer is pushed far below and
 *    never appears while the user is browsing results
 *  - The hero switches from overflow:hidden + fixed height to
 *    min-height:100vh + overflow-y:auto when results are present
 *  - A scroll container wraps the content so the background stays fixed
 *    while only the content scrolls
 *  - All other logic (search, chat mode, background, chips) unchanged
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BackgroundAnimation } from './BackgroundAnimation';
import { PromptInput } from './PromptInput';
import { PromptChips } from './PromptChips';
import { SearchResultsPanel } from './SearchResultsPanel';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import styles from './HeroSection.module.css';

export function HeroSection() {
  const router = useRouter();
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [heroMode,      setHeroMode]      = useState('chat');
  const resultsRef = useRef(null);

  const hasResults = heroMode === 'search' && (searchResults || searchLoading);

  // Scroll to results smoothly when they appear
  useEffect(() => {
    if (searchResults && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchResults]);

  const handlePromptSubmit = async (prompt) => {
    if (!prompt?.trim()) return;
    const trimmed = prompt.trim();

    if (heroMode === 'chat') {
      router.push(`/chat?q=${encodeURIComponent(trimmed)}`);
      return;
    }

    setSearchQuery(trimmed);
    setSearchLoading(true);
    setSearchResults(null);

    try {
      const data = await api.post(ENDPOINTS.SEARCH.QUERY, {
        query: trimmed,
        mode:  'both',
      });
      setSearchResults(data);
    } catch (err) {
      router.push(`/chat?q=${encodeURIComponent(trimmed)}`);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleChatMode = () => {
    setHeroMode('chat');
    setSearchResults(null);
  };

  const handleSearchMode = () => {
    setHeroMode('search');
  };

  const handleOpenChat = (query) => {
    router.push(`/chat?q=${encodeURIComponent(query || searchQuery)}`);
  };

  return (
    <section className={`${styles.hero} ${hasResults ? styles.heroExpanded : ''}`}>
      {/* Background stays fixed behind everything */}
      <BackgroundAnimation />
      <div className={styles.overlay} />

      {/* Scrollable content wrapper */}
      <div className={`${styles.scrollWrapper} ${hasResults ? styles.scrollWrapperActive : ''}`}>

        {/* The initial viewport-filling content */}
        <div className={styles.viewportContent}>
          <div className={styles.contentInner}>

            <p className={styles.eyebrow}>Single-origin · Nandi Hills, Kenya</p>

            <h1 className={styles.headline}>
              From the tea fields of<br />
              <span className={styles.headlineAccent}>Nandi Hills</span>{' '}
              to your cup.
            </h1>
            <p className={styles.subheadline}>Ask anything.</p>

            {/* Mode toggle */}
            <div className={styles.modeToggle}>
              <button
                className={`${styles.modeBtn} ${heroMode === 'chat' ? styles.modeBtnActive : ''}`}
                onClick={handleChatMode}
                type="button"
              >
                AI Chat
              </button>
              <button
                className={`${styles.modeBtn} ${heroMode === 'search' ? styles.modeBtnActive : ''}`}
                onClick={handleSearchMode}
                type="button"
              >
                Search
              </button>
            </div>

            <div className={styles.promptWrapper}>
              <PromptInput
                onSubmit={handlePromptSubmit}
                isLoading={searchLoading}
                placeholder={
                  heroMode === 'search'
                    ? 'Search teas, origin, impact, brewing…'
                    : 'What makes Chakancha different?'
                }
              />
            </div>

            <div className={styles.chipsWrapper}>
              <PromptChips onClick={handlePromptSubmit} />
            </div>

          </div>
        </div>

        {/* Search results — rendered BELOW the viewport content and scrollable */}
        {hasResults && (
          <div className={styles.resultsContainer} ref={resultsRef}>
            <SearchResultsPanel
              results={searchResults?.results || []}
              aiResponse={searchResults?.ai_response}
              isLoading={searchLoading}
              query={searchQuery}
              onOpenChat={handleOpenChat}
            />
          </div>
        )}

      </div>

      {/* Scroll indicator — only shown when no results */}
      {!hasResults && (
        <div className={styles.scrollIndicator}>
          <div className={styles.scrollLine} />
        </div>
      )}
    </section>
  );
}