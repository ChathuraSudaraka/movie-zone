import { useState, useEffect, useCallback } from 'react';

const HISTORY_KEY = 'moviezone_watch_history';

interface WatchItem {
  id: string;
  title: string;
  posterPath: string;
  mediaType: 'movie' | 'tv';
  watchedAt: string;
}

let cachedHistory: WatchItem[] | null = null;
const historyListeners = new Set<() => void>();

function getHistory(): WatchItem[] {
  if (cachedHistory !== null) return cachedHistory;
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    cachedHistory = raw ? (JSON.parse(raw) as WatchItem[]) : [];
  } catch {
    cachedHistory = [];
  }
  return cachedHistory;
}

function notifyHistoryListeners() {
  historyListeners.forEach((fn) => fn());
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === HISTORY_KEY || e.key === null) {
      cachedHistory = null;
      notifyHistoryListeners();
    }
  });
}

export async function addToWatchHistory(item: {
  id: number;
  title: string;
  poster_path: string;
  media_type: 'movie' | 'tv';
}): Promise<void> {
  const entry: WatchItem = {
    id: String(item.id),
    title: item.title,
    posterPath: item.poster_path,
    mediaType: item.media_type,
    watchedAt: new Date().toISOString(),
  };
  const history = getHistory().filter((h) => h.id !== entry.id);
  history.unshift(entry);
  const trimmed = history.slice(0, 100);
  cachedHistory = trimmed;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage errors
  }
  notifyHistoryListeners();
}

export function useWatchHistory() {
  const [watchHistory, setWatchHistory] = useState<WatchItem[]>(() => getHistory());

  useEffect(() => {
    const listener = () => setWatchHistory(getHistory());
    historyListeners.add(listener);
    return () => {
      historyListeners.delete(listener);
    };
  }, []);

  const clearHistory = useCallback(() => {
    cachedHistory = [];
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // Ignore storage errors
    }
    notifyHistoryListeners();
  }, []);

  return { watchHistory, loading: false, addToWatchHistory, clearHistory };
}
