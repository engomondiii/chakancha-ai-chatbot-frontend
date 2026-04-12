/**
 * uiSlice.js
 * Zustand slice for global UI state.
 * Manages toast notifications, modals, and other cross-cutting UI concerns.
 */

import { nanoid } from 'nanoid';

export const createUISlice = (set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  notifications:    [],   // Toast notifications
  activeModal:      null, // Currently open modal ID
  modalData:        null, // Data passed to the modal
  isPageLoading:    false,
  chakanTreeSignal: null, // Chakan Tree readiness signal from aiSlice

  // ── Toast notifications ────────────────────────────────────────────────────

  /**
   * Show a toast notification.
   *
   * @param {string} message   - Notification message
   * @param {string} type      - 'success' | 'error' | 'warning' | 'info'
   * @param {number} duration  - Auto-dismiss after N ms (0 = persistent)
   */
  showNotification: (message, type = 'info', duration = 4000) => {
    const id = nanoid(8);
    const notification = { id, message, type, duration, createdAt: Date.now() };

    set((s) => ({ notifications: [...s.notifications, notification] }));

    if (duration > 0) {
      setTimeout(() => {
        get().dismissNotification(id);
      }, duration);
    }

    return id;
  },

  /**
   * Dismiss a specific notification by ID.
   */
  dismissNotification: (id) => {
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    }));
  },

  /**
   * Clear all notifications.
   */
  clearNotifications: () => set({ notifications: [] }),

  // Convenience wrappers
  showSuccess: (message, duration = 4000) =>
    get().showNotification(message, 'success', duration),

  showError: (message, duration = 6000) =>
    get().showNotification(message, 'error', duration),

  showWarning: (message, duration = 5000) =>
    get().showNotification(message, 'warning', duration),

  showInfo: (message, duration = 4000) =>
    get().showNotification(message, 'info', duration),

  // ── Modals ─────────────────────────────────────────────────────────────────

  /**
   * Open a modal by ID, optionally passing data.
   */
  openModal: (modalId, data = null) => set({ activeModal: modalId, modalData: data }),

  /**
   * Close the active modal.
   */
  closeModal: () => set({ activeModal: null, modalData: null }),

  // ── Page loading ───────────────────────────────────────────────────────────

  setPageLoading: (loading) => set({ isPageLoading: loading }),

  // ── Chakan Tree signal ─────────────────────────────────────────────────────

  /**
   * Set the Chakan Tree readiness signal from the AI slice.
   * Used to trigger Layer 2 invitation card in ConversationView.
   */
  setChakanTreeSignal: (signal) => set({ chakanTreeSignal: signal }),

  clearChakanTreeSignal: () => set({ chakanTreeSignal: null }),
});

export default createUISlice;