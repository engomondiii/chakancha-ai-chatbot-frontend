/**
 * src/components/hero/SearchResultsPanel.jsx — Integration Phase 2 (NEW FILE)
 *
 * Renders the search results panel inside HeroSection when mode='search'.
 * Shows an AI summary + result cards (products, brewing guides, origin, web articles).
 * Includes an "Open in AI Chat" button to transition to the full conversation.
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Leaf, BookOpen, Globe, MapPin, Zap, ArrowRight, MessageCircle
} from 'lucide-react';

const TYPE_CONFIG = {
  product:       { icon: Leaf,       label: 'Tea',           color: '#2D5016' },
  brewing_guide: { icon: BookOpen,   label: 'Brewing',       color: '#D4A574' },
  origin:        { icon: MapPin,     label: 'Origin',        color: '#6B5544' },
  impact:        { icon: Zap,        label: 'Impact',        color: '#D63031' },
  tea_picker:    { icon: Leaf,       label: 'Tea Picker',    color: '#4A7C2C' },
  faq:           { icon: MessageCircle, label: 'FAQ',        color: '#8B8C5A' },
  web_article:   { icon: Globe,      label: 'Web',           color: '#B8C5D6' },
};

function ResultCard({ result }) {
  const router = useRouter();
  const config = TYPE_CONFIG[result.type] || TYPE_CONFIG.faq;
  const Icon   = config.icon;

  const handleClick = () => {
    if (result.url) {
      if (result.url.startsWith('http')) {
        window.open(result.url, '_blank', 'noopener,noreferrer');
      } else {
        router.push(result.url);
      }
    } else if (result.slug) {
      router.push(`/products/${result.slug}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        background:    'rgba(255,255,255,0.85)',
        backdropFilter:'blur(8px)',
        border:        '1px solid rgba(255,255,255,0.4)',
        borderRadius:  12,
        padding:       '12px 14px',
        cursor:        result.url || result.slug ? 'pointer' : 'default',
        display:       'flex',
        gap:           10,
        alignItems:    'flex-start',
        transition:    'background 150ms ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.95)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; }}
    >
      {/* Type icon */}
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: `${config.color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={15} style={{ color: config.color }} />
      </div>

      <div style={{ minWidth: 0 }}>
        {/* Type label */}
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
          color: config.color, textTransform: 'uppercase',
        }}>
          {config.label}
          {result.price && ` · $${result.price}`}
        </span>

        {/* Title */}
        <p style={{
          margin: '2px 0', fontSize: 14, fontWeight: 500,
          color: '#2D2D2D', lineHeight: 1.4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {result.title}
        </p>

        {/* Snippet */}
        {result.snippet && (
          <p style={{
            margin: 0, fontSize: 12, color: '#666', lineHeight: 1.5,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {result.snippet}
          </p>
        )}
      </div>

      {/* Arrow */}
      {(result.url || result.slug) && (
        <ArrowRight size={14} style={{ color: '#B8C5D6', flexShrink: 0, marginTop: 4 }} />
      )}
    </div>
  );
}

export function SearchResultsPanel({ results, aiResponse, isLoading, query, onOpenChat }) {
  if (isLoading) {
    return (
      <div style={{
        marginTop: 24,
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.4)',
        borderRadius: 16,
        padding: '20px 24px',
        maxWidth: 640,
        width: '100%',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#2D5016', fontSize: 14 }}>
          <Leaf size={16} style={{ animation: 'spin 1s linear infinite' }} />
          Searching Chakancha…
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: 24,
      maxWidth: 640,
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      {/* AI summary */}
      {aiResponse && (
        <div style={{
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(45,80,22,0.2)',
          borderRadius: 16,
          padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: '#2D5016',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Leaf size={11} style={{ color: 'white' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#2D5016', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              AI Summary
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: '#2D2D2D', lineHeight: 1.65 }}>
            {aiResponse}
          </p>
        </div>
      )}

      {/* Result cards */}
      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {results.slice(0, 4).map((result, i) => (
            <ResultCard key={i} result={result} />
          ))}
        </div>
      )}

      {/* Open in AI Chat button */}
      <button
        onClick={() => onOpenChat(query)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: '#2D5016', color: 'white',
          border: 'none', borderRadius: 12,
          padding: '12px 20px',
          fontSize: 14, fontWeight: 500,
          cursor: 'pointer',
          transition: 'opacity 150ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        type="button"
      >
        <MessageCircle size={15} />
        Continue in AI Chat
        <ArrowRight size={14} />
      </button>
    </div>
  );
}

export default SearchResultsPanel;