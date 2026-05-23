import { useState, useEffect } from 'react';

const HISTORY_KEY = 'moviezone_watch_history';

interface WatchItem {
  id: string;
  title: string;
  posterPath: string;
  mediaType: 'movie' | 'tv';
  watchedAt: string;
}

function getHistory(): WatchItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as WatchItem[]) : [];
  } catch {
    return [];
  }
}

export function useWatchHistory() {
  const [watchHistory, setWatchHistory] = useState<WatchItem[]>(() => getHistory());

  const addToWatchHistory = async (item: {
    id: number;
    title: string;
    poster_path: string;
    media_type: 'movie' | 'tv';
  }) => {
    const entry: WatchItem = {
      id: String(item.id),
      title: item.title,
      posterPath: item.poster_path,
      mediaType: item.media_type,
      watchedAt: new Date().toISOString(),
    };
    const history = getHistory().filter((h) => h.id !== entry.id);
    history.unshift(entry);
    // Keep last 100 items
    const trimmed = history.slice(0, 100);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    setWatchHistory(trimmed);
  };

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setWatchHistory([]);
  };

  useEffect(() => {
    const onStorage = () => setWatchHistory(getHistory());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return { watchHistory, loading: false, addToWatchHistory, clearHistory };
}
