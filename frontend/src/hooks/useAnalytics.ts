/**
 * useAnalytics hook
 * ──────────────────
 * Fires analytics events to the backend silently (fire-and-forget).
 * Failures are swallowed — analytics should never break the UX.
 *
 * Session ID is generated once per browser tab and stored in sessionStorage.
 */
import { useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

type EventType = 'VIEW' | 'ADD_TO_CART' | 'PURCHASE';

function getSessionId(): string {
  const key = 'lx_session';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}

export function useAnalytics() {
  const { user } = useAuth();

  const track = useCallback(
    (eventType: EventType, productId: number) => {
      // Fire-and-forget — no await, no error surfacing
      api
        .post('/analytics/events', {
          event_type: eventType,
          product_id: productId,
          session_id: getSessionId(),
          user_id:    user?.id ?? null,
        })
        .catch(() => {/* swallow — analytics must never break the UI */});
    },
    [user],
  );

  const trackView      = useCallback((pid: number) => track('VIEW',        pid), [track]);
  const trackCartAdd   = useCallback((pid: number) => track('ADD_TO_CART', pid), [track]);
  const trackPurchase  = useCallback((pid: number) => track('PURCHASE',    pid), [track]);

  return { trackView, trackCartAdd, trackPurchase };
}
