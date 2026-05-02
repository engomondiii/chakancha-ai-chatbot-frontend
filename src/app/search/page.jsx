'use client';

/**
 * src/app/search/page.jsx
 * Unified search page — Phase 9.
 *
 * Reads ?q= from the URL (set by the search input in Header or HeroSection).
 * Calls POST /api/v1/search/ → returns { ai_response, results[], result_count }
 * Displays AI summary + typed result cards (product, content, web_article).
 *
 * Route: /search?q=what+tea+is+good+for+evenings
 */

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams }            from 'next/navigation';
import { Search, Loader2, ArrowRight, Leaf, ExternalLink } from 'lucide-react';
import api          from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import siteConfig   from '@/config/site';

// ─── Result card components ───────────────────────────────────────────────────

function ProductCard({ result }) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(`/products/${result.slug}`)}
      style={{
        display:         'flex',
        gap:             'var(--spacing-md)',
        padding:         'var(--spacing-md)',
        backgroundColor: 'white',
        border:          '1px solid var(--color-border)',
        borderRadius:    'var(--radius-lg)',
        cursor:          'pointer',
        transition:      'border-color 150ms ease, box-shadow 150ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-tea-green)';
        e.currentTarget.style.boxShadow   = '0 2px 8px rgba(45,80,22,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.boxShadow   = 'none';
      }}
    >
      {result.image && (
        <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0, backgroundColor: 'var(--color-warm-cream)' }}>
          <img src={result.image} alt={result.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {result.title}
        </p>
        {result.price && (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-tea-green)', fontWeight: 600, margin: '0 0 4px' }}>
            ${result.price}
          </p>
        )}
        {result.snippet && (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {result.snippet}
          </p>
        )}
      </div>
      <ArrowRight size={16} color="var(--color-mist-gray)" style={{ flexShrink: 0, alignSelf: 'center' }} />
    </div>
  );
}

function ContentCard({ result }) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(result.url || '/origin')}
      style={{
        padding:         'var(--spacing-md)',
        backgroundColor: 'var(--color-warm-cream)',
        border:          '1px solid var(--color-border)',
        borderRadius:    'var(--radius-lg)',
        cursor:          'pointer',
        transition:      'border-color 150ms ease',
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-tea-green)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <Leaf size={13} color="var(--color-tea-green)" />
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-muted-olive)' }}>
          {result.type === 'brewing_guide' ? 'Brewing Guide' : result.type === 'origin' ? 'Origin Story' : 'Content'}
        </span>
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 4px' }}>
        {result.title}
      </p>
      {result.snippet && (
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
          {result.snippet}
        </p>
      )}
    </div>
  );
}

function WebArticleCard({ result }) {
  return (
    <a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display:         'block',
        padding:         'var(--spacing-md)',
        backgroundColor: 'white',
        border:          '1px solid var(--color-border)',
        borderRadius:    'var(--radius-lg)',
        textDecoration:  'none',
        transition:      'border-color 150ms ease',
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-tea-green)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-muted-olive)', margin: '0 0 4px' }}>
            Web Article
          </p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 4px' }}>
            {result.title}
          </p>
          {result.snippet && (
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {result.snippet}
            </p>
          )}
        </div>
        <ExternalLink size={14} color="var(--color-mist-gray)" style={{ flexShrink: 0, marginTop: 2 }} />
      </div>
    </a>
  );
}

function ResultCard({ result }) {
  switch (result.type) {
    case 'product':       return <ProductCard     result={result} />;
    case 'brewing_guide':
    case 'origin':
    case 'content':       return <ContentCard     result={result} />;
    case 'web_article':   return <WebArticleCard  result={result} />;
    default:              return <ContentCard     result={result} />;
  }
}

// ─── Search form ──────────────────────────────────────────────────────────────

function SearchForm({ initialQuery, onSearch }) {
  const [value, setValue] = useState(initialQuery || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-2xl)' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <Search size={16} color="var(--color-text-secondary)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search teas, origin, impact, brewing…"
          style={{
            width:           '100%',
            paddingLeft:     40,
            paddingRight:    16,
            paddingTop:      12,
            paddingBottom:   12,
            fontFamily:      'var(--font-sans)',
            fontSize:        15,
            color:           'var(--color-text-primary)',
            backgroundColor: 'white',
            border:          '1.5px solid var(--color-border)',
            borderRadius:    'var(--radius-md)',
            outline:         'none',
            boxSizing:       'border-box',
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--color-tea-green)'}
          onBlur={(e)  => e.target.style.borderColor = 'var(--color-border)'}
          autoFocus
        />
      </div>
      <button
        type="submit"
        disabled={!value.trim()}
        style={{
          backgroundColor: 'var(--color-tea-green)',
          color:           'white',
          border:          'none',
          borderRadius:    'var(--radius-md)',
          padding:         '12px 24px',
          fontFamily:      'var(--font-sans)',
          fontSize:        14,
          fontWeight:      600,
          cursor:          value.trim() ? 'pointer' : 'not-allowed',
          opacity:         value.trim() ? 1 : 0.5,
          whiteSpace:      'nowrap',
        }}
      >
        Search
      </button>
    </form>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────

function SearchPageContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const query        = searchParams?.get('q') || '';

  const [results,     setResults]     = useState(null);
  const [aiResponse,  setAiResponse]  = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  // Run search whenever the ?q= param changes
  useEffect(() => {
    if (!query.trim()) return;
    runSearch(query);
  }, [query]);

  const runSearch = async (q) => {
    setLoading(true);
    setError('');
    setResults(null);
    setAiResponse('');

    try {
      const data = await api.post(ENDPOINTS.SEARCH.QUERY, {
        query: q,
        mode:  'both',  // returns both ai_response and results[]
      });
      setAiResponse(data.ai_response || '');
      setResults(data.results || []);
    } catch (err) {
      setError(err.message || 'Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = (newQuery) => {
    router.push(`/search?q=${encodeURIComponent(newQuery)}`);
  };

  // Group results by type for display
  const products   = (results || []).filter((r) => r.type === 'product');
  const content    = (results || []).filter((r) => ['brewing_guide', 'origin', 'content'].includes(r.type));
  const webArticles = (results || []).filter((r) => r.type === 'web_article');

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 'calc(72px + var(--spacing-2xl)) var(--spacing-lg) var(--spacing-3xl)', minHeight: '100vh' }}>

      {/* Page title */}
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-h2)', fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 var(--spacing-xl)' }}>
        Search Chakancha
      </h1>

      {/* Search form */}
      <SearchForm initialQuery={query} onSearch={handleNewSearch} />

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'var(--spacing-2xl)', justifyContent: 'center' }}>
          <Loader2 size={20} color="var(--color-tea-green)" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text-secondary)' }}>
            Searching across teas, stories, and the web…
          </span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div style={{ padding: 'var(--spacing-lg)', backgroundColor: 'rgba(214,48,49,0.06)', border: '1px solid rgba(214,48,49,0.2)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-error)' }}>
          {error}
        </div>
      )}

      {/* Empty query — prompt */}
      {!query && !loading && (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl)', color: 'var(--color-text-secondary)' }}>
          <Search size={40} color="var(--color-mist-gray)" style={{ margin: '0 auto var(--spacing-md)', display: 'block' }} />
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, margin: 0 }}>
            Search for teas, origin stories, brewing guides, and more.
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && results !== null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xl)' }}>

          {/* AI summary */}
          {aiResponse && (
            <div style={{ padding: 'var(--spacing-lg)', backgroundColor: 'rgba(45,80,22,0.04)', border: '1.5px solid rgba(45,80,22,0.12)', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Leaf size={14} color="var(--color-tea-green)" />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-tea-green)' }}>
                  AI Summary
                </span>
              </div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.7 }}>
                {aiResponse}
              </p>
            </div>
          )}

          {/* No results */}
          {results.length === 0 && (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 15 }}>
              No results found for <strong>"{query}"</strong>. Try a different search.
            </div>
          )}

          {/* Products */}
          {products.length > 0 && (
            <section>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 var(--spacing-md)' }}>
                Teas
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {products.map((r, i) => <ResultCard key={i} result={r} />)}
              </div>
            </section>
          )}

          {/* Content */}
          {content.length > 0 && (
            <section>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 var(--spacing-md)' }}>
                Stories & Guides
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {content.map((r, i) => <ResultCard key={i} result={r} />)}
              </div>
            </section>
          )}

          {/* Web articles */}
          {webArticles.length > 0 && (
            <section>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 var(--spacing-md)' }}>
                From the Web
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {webArticles.map((r, i) => <ResultCard key={i} result={r} />)}
              </div>
            </section>
          )}

          {/* Continue in chat */}
          {results.length > 0 && (
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-lg)', display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => router.push(`/chat?q=${encodeURIComponent(query)}`)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'var(--color-tea-green)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 20px', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                <Leaf size={14} />
                Continue this in AI Chat
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Suspense boundary required because useSearchParams() needs it in Next.js 14
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'calc(72px + var(--spacing-2xl)) var(--spacing-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={24} color="var(--color-tea-green)" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}