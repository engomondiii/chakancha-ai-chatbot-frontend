/**
 * Accordion Component
 * Collapsible content panels
 */

'use client';

import React, { useState } from 'react';
import styles from './Accordion.module.css';

export function Accordion({ items, allowMultiple = false, className = '' }) {
  const [openItems, setOpenItems] = useState([]);

  const toggleItem = (index) => {
    if (allowMultiple) {
      setOpenItems((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
      );
    } else {
      setOpenItems((prev) =>
        prev.includes(index) ? [] : [index]
      );
    }
  };

  const isOpen = (index) => openItems.includes(index);

  return (
    <div className={`${styles.accordion} ${className}`}>
      {items.map((item, index) => (
        <div
          key={index}
          className={`${styles.item} ${isOpen(index) ? styles.itemOpen : ''}`}
        >
          <button
            className={styles.header}
            onClick={() => toggleItem(index)}
            type="button"
          >
            <span className={styles.title}>{item.title}</span>
            <span className={styles.icon}>
              {isOpen(index) ? '−' : '+'}
            </span>
          </button>
          
          {isOpen(index) && (
            <div className={styles.content}>
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Accordion;