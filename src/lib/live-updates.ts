import { useEffect } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { booksKey } from "@/lib/books";
import { borrowRecordsKey } from "@/lib/lending";
import { notificationsKey } from "@/lib/notifications";
import { readingGoalsKey, readingProgressKey, readingStreakKey } from "@/lib/reading";

/**
 * Tables whose changes should show up on every open device without a reload.
 * Each table maps to the cached queries that read it.
 */
const LIVE_TABLES: { table: string; keys: QueryKey[] }[] = [
  { table: "books", keys: [booksKey] },
  { table: "borrow_records", keys: [borrowRecordsKey] },
  { table: "reading_goals", keys: [readingGoalsKey] },
  { table: "reading_progress", keys: [readingProgressKey] },
  { table: "reading_streaks", keys: [readingStreakKey] },
  { table: "notifications", keys: [notificationsKey] },
];

/** Bursts of changes (like a bulk import) are collapsed into one refresh. */
const BATCH_MS = 400;

/**
 * Keeps the signed-in user's data in step across devices. Supabase Realtime
 * sends a change only if the signed-in user can read that row, so no other
 * user's data reaches this page.
 */
export function useLiveUpdates(userId: string) {
  const qc = useQueryClient();

  useEffect(() => {
    const pending = new Map<string, QueryKey>();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const flush = () => {
      timer = undefined;
      for (const key of pending.values()) {
        void qc.invalidateQueries({ queryKey: key });
      }
      pending.clear();
    };

    const queue = (keys: QueryKey[]) => {
      for (const key of keys) pending.set(JSON.stringify(key), key);
      if (timer === undefined) timer = setTimeout(flush, BATCH_MS);
    };

    let channel = supabase.channel(`live-${userId}`);
    for (const { table, keys } of LIVE_TABLES) {
      channel = channel.on("postgres_changes", { event: "*", schema: "public", table }, () =>
        queue(keys),
      );
    }
    channel.subscribe();

    return () => {
      if (timer !== undefined) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [qc, userId]);
}
