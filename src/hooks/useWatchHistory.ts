import { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
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

  useEffect(() => {
    fetchWatchHistory();
  }, [user]);

  const fetchWatchHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Always use cached data first
      const cachedHistory = localStorage.getItem(`watchHistory-${user.uid}`);
      if (cachedHistory) {
        setWatchHistory(JSON.parse(cachedHistory));
        setLoading(false);
      }

      // Then try to fetch fresh data
      const userDoc = doc(db, 'users', user.uid);
      const docSnap = await retryOperation(() => getDoc(userDoc));
      
      if (docSnap.exists()) {
        const history = docSnap.data().watchHistory || [];
        setWatchHistory(history);
        localStorage.setItem(`watchHistory-${user.uid}`, JSON.stringify(history));
      }
    } catch (error) {
      console.warn('Using cached data due to connection error:', error);
      // Continue using cached data if available
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

    const timestamp = new Date().toISOString();
    const watchItem: WatchHistoryItem = {
      id: String(mediaItem.id),
      title: mediaItem.title || 'Untitled',
      posterPath: mediaItem.poster_path 
        ? `https://image.tmdb.org/t/p/w500${mediaItem.poster_path}`
        : '',
      mediaType: mediaItem.media_type,
      watchedAt: timestamp
    };

    // Update local state immediately for instant UI feedback
    setWatchHistory(prev => {
      const newHistory = [watchItem, ...prev];
      // Update localStorage cache
      localStorage.setItem(`watchHistory-${user.uid}`, JSON.stringify(newHistory));
      return newHistory;
    });

    // Queue update for background processing
    queueMicrotask(async () => {
      try {
        const userDoc = doc(db, 'users', user.uid);
        await setDoc(userDoc, {
          watchHistory: arrayUnion(watchItem),
          lastUpdated: timestamp
        }, { merge: true });
      } catch (error) {
        console.error('Background sync failed:', error);
        // Add to pending updates for later sync
        const pendingUpdates = JSON.parse(
          localStorage.getItem('pendingWatchHistoryUpdates') || '[]'
        );
        pendingUpdates.push({ userId: user.uid, watchItem });
        localStorage.setItem(
          'pendingWatchHistoryUpdates', 
          JSON.stringify(pendingUpdates)
        );
      }
    });
  };

  // Sync pending updates when coming online
  useEffect(() => {
    if (navigator.onLine && user) {
      const syncPendingUpdates = async () => {
        const pendingUpdates = JSON.parse(localStorage.getItem('pendingWatchHistoryUpdates') || '[]');
        const userUpdates = pendingUpdates.filter((update: any) => update.userId === user.uid);
        
        if (userUpdates.length > 0) {
          try {
            const userDoc = doc(db, 'users', user.uid);
            await retryOperation(() => 
              setDoc(userDoc, {
                watchHistory: watchHistory,
                lastUpdated: new Date().toISOString()
              }, { merge: true })
            );
            
            localStorage.setItem('pendingWatchHistoryUpdates', JSON.stringify(
              pendingUpdates.filter((update: any) => update.userId !== user.uid)
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
    isOffline 
  };
}
