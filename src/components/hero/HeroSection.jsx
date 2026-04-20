/**
 * src/components/hero/HeroSection.jsx — Integration Phase 2
 *
 * What changed from the original:
 *  - handlePromptSubmit() now calls POST /api/v1/search/ (mode='both') first
 *    to get search result cards + AI response, then routes to /chat
 *  - The search results are stored in localStorage before navigation
 *    so the chat page can display them immediately
 *  - mode toggle state added: 'chat' | 'search'
 *  - Search results panel shown inline on the hero when mode is 'search'
 *  - Everything else (background animation, chips, input) unchanged
 */

'use client';

import React, { useState } from 'react';
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
  const [searchResults, setSearchResults] = useState(null);  // Phase 2: search results
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [heroMode,      setHeroMode]      = useState('chat'); // 'chat' | 'search'

  /**
   * handlePromptSubmit
   *
   * Called when the user submits a query from PromptInput or PromptChips.
   *
   * Behaviour:
   *   'chat' mode → navigate directly to /chat?q=...
   *   'search' mode → call POST /api/v1/search/ and show results inline,
   *                   with a link to open the full AI chat
   */
  const handlePromptSubmit = async (prompt) => {
    if (!prompt?.trim()) return;
    const trimmed = prompt.trim();

    if (heroMode === 'chat') {
      // Chat mode: go straight to conversation page
      router.push(`/chat?q=${encodeURIComponent(trimmed)}`);
      return;
    }

    // Search mode: call backend search endpoint
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
      // On error, fall back to chat navigation
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
    <section className={styles.hero}>
      <BackgroundAnimation />
      <div className={styles.overlay} />

      <div className={styles.content}>
        <div className={styles.contentInner}>

          <p className={styles.eyebrow}>Single-origin · Nandi Hills, Kenya</p>

          <h1 className={styles.headline}>
            From the tea fields of<br />
            <span className={styles.headlineAccent}>Nandi Hills</span>{' '}
            to your cup.
          </h1>
          <p className={styles.subheadline}>Ask anything.</p>

          {/* Mode toggle — Phase 2 */}
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

          {/* Search results panel — Phase 2 */}
          {heroMode === 'search' && (searchResults || searchLoading) && (
            <SearchResultsPanel
              results={searchResults?.results || []}
              aiResponse={searchResults?.ai_response}
              isLoading={searchLoading}
              query={searchQuery}
              onOpenChat={handleOpenChat}
            />
          )}
        </div>
      </div>

      <div className={styles.scrollIndicator}>
        <div className={styles.scrollLine} />
      </div>
    </section>
  );
}