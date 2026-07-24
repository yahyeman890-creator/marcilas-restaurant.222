import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type ChangeHandler = (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void;

interface Options {
  /** Called on any INSERT / UPDATE / DELETE on the orders table */
  onChange: ChangeHandler;
  /** Supabase filter string, e.g. "driver_id=eq.abc123". Leave empty to listen to ALL orders. */
  filter?: string;
}

/**
 * Opens a single Supabase Realtime channel for the `orders` table.
 * Cleans up the channel when the component unmounts or dependencies change.
 */
export function useRealtimeOrders({ onChange, filter }: Options) {
  // Keep a stable ref to the latest callback so we don't re-subscribe on every render
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const filterRef = useRef(filter);
  useEffect(() => { filterRef.current = filter; }, [filter]);

  useEffect(() => {
    const channelName = `orders-${filter ?? 'all'}-${Math.random().toString(36).slice(2)}`;

    const channelConfig: Parameters<typeof supabase.channel>[1] = {
      config: { broadcast: { ack: false } },
    };

    const channel = supabase
      .channel(channelName, channelConfig)
      .on(
        'postgres_changes' as Parameters<ReturnType<typeof supabase.channel>['on']>[0],
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          ...(filter ? { filter } : {}),
        },
        (payload) => onChangeRef.current(payload as Parameters<ChangeHandler>[0]),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // Re-subscribe only when the filter string changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);
}

/**
 * Convenience hook that just re-runs a fetch callback whenever the `orders`
 * table changes, with an optional filter.
 */
export function useOrdersRealtime(refresh: () => void, filter?: string) {
  const refreshRef = useRef(refresh);
  useEffect(() => { refreshRef.current = refresh; }, [refresh]);

  useRealtimeOrders({
    filter,
    onChange: useCallback(() => refreshRef.current(), []),
  });
}
