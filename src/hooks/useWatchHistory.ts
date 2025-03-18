import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import type { WatchHistoryItem } from '../types/user';

export function useWatchHistory() {
  const { user } = useAuth();
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Retry mechanism for fetch operations
  const retryOperation = async (operation: () => Promise<any>, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error: any) {
        if (i === maxRetries - 1) throw error;
        if (error.code === 'failed-precondition' || error.code === 'offline') {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          continue;
        }
        throw error;
      }
    }
  };

  const fetchWatchHistory = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', user.id)
        .order('watched_at', { ascending: false });

      if (error) throw error;
      
      const formattedData: WatchHistoryItem[] = (data || []).map(item => ({
        id: item.media_id,
        title: item.title,
        posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        mediaType: item.media_type,
        watchedAt: item.watched_at
      }));

      setWatchHistory(formattedData);
    } catch (error) {
      console.error('Error fetching watch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchHistory = async (mediaItem: {
    id: number;
    title: string;
    poster_path: string;
    media_type: 'movie' | 'tv';
  }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('watch_history')
        .upsert({
          user_id: user.id,
          media_id: String(mediaItem.id),
          title: mediaItem.title,
          poster_path: mediaItem.poster_path,
          media_type: mediaItem.media_type,
          watched_at: new Date().toISOString()
        });

      if (error) throw error;
      await fetchWatchHistory();
    } catch (error) {
      console.error('Error adding to watch history:', error);
    }
  };

  const clearHistory = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('watch_history')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setWatchHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  // Clear watch history when user logs out
  useEffect(() => {
    if (!user) {
      setWatchHistory([]);
      setLoading(false);
    }
  }, [user]);

  // Refresh watch history when coming back online
  useEffect(() => {
    if (!isOffline && user) {
      fetchWatchHistory();
    }
  }, [isOffline, user]);

  // Sync pending updates when coming online
  useEffect(() => {
    if (navigator.onLine && user) {
      const syncPendingUpdates = async () => {
        const pendingUpdates = JSON.parse(localStorage.getItem('pendingWatchHistoryUpdates') || '[]');
        const userUpdates = pendingUpdates.filter((update: any) => update.userId === user.id);
        
        if (userUpdates.length > 0) {
          try {
            await retryOperation(() => 
              Promise.resolve(
                supabase
                  .from('watch_history')
                  .upsert(userUpdates)
              )
            );
            
            localStorage.setItem('pendingWatchHistoryUpdates', JSON.stringify(
              pendingUpdates.filter((update: any) => update.userId !== user.id)
            ));
          } catch (error) {
            console.error('Error syncing pending updates:', error);
          }
        }
      };

      syncPendingUpdates();
    }
  }, [isOffline, user]);

  return { 
    watchHistory, 
    loading, 
    addToWatchHistory,
    clearHistory,
    isOffline,
    refreshHistory: fetchWatchHistory 
  };
}
