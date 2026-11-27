/**
 * src/hooks/useSavedItems.ts
 *
 * Live set of the signed-in researcher's bookmarks plus a toggle helper.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { saveWork, unsaveWork, subscribeSavedItems } from '@/services/saved.service';
import type { ResearchWork } from '@/types/research.types';
import type { SavedItem } from '@/types/network.types';

export function useSavedItems() {
  const { userProfile } = useAuth();
  const uid = userProfile?.approvalStatus === 'approved' ? userProfile.uid : '';

  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const toast = useToast();

  useEffect(() => {
    if (!uid) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeSavedItems(
      uid,
      (list) => {
        setItems(list);
        setLoading(false);
        setError(false);
      },
      () => {
        setLoading(false);
        setError(true);
      },
    );
  }, [uid, retryKey]);

  /** Re-open the listener (error state "Retry"). */
  const retry = useCallback(() => setRetryKey((k) => k + 1), []);

  const savedIds = useMemo(() => new Set(items.map((i) => i.workId)), [items]);

  const isSaved = useCallback((workId: string) => savedIds.has(workId), [savedIds]);

  /** Unsave. `silent` skips the toast (the Saved screen shows its own Undo bar). */
  const remove = useCallback(
    async (workId: string, options?: { silent?: boolean }): Promise<boolean> => {
      if (!uid) return false;
      try {
        await unsaveWork(uid, workId);
        if (!options?.silent) toast.show('Removed from Saved Items', 'info');
        return true;
      } catch {
        toast.show('Could not remove this saved item', 'error');
        return false;
      }
    },
    [uid, toast],
  );

  /** Save again (Undo). Needs the live post — the rules validate the snapshot. */
  const restore = useCallback(
    async (work: ResearchWork) => {
      if (!uid) return;
      try {
        await saveWork(uid, work);
        toast.show('Restored to Saved Items');
      } catch {
        toast.show('Could not restore this item', 'error');
      }
    },
    [uid, toast],
  );

  const toggleSave = useCallback(
    async (work: ResearchWork) => {
      if (!uid) return;
      try {
        if (savedIds.has(work.id)) {
          await unsaveWork(uid, work.id);
          toast.show('Removed from Saved Items', 'info');
        } else {
          await saveWork(uid, work);
          toast.show('Saved to your library');
        }
      } catch {
        toast.show('Could not update your saved items', 'error');
      }
    },
    [savedIds, uid, toast],
  );

  return { items, loading, error, retry, isSaved, toggleSave, remove, restore };
}
