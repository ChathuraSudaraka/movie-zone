import { useState, useEffect } from 'react';
import { doc, arrayUnion, getDoc, setDoc } from 'firebase/firestore';
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

  const fetchWatchHistory = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Load from localStorage first for instant display
      const cachedData = localStorage.getItem(`watchHistory-${user.uid}`);
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        setWatchHistory(cached);
        setLoading(false); // Set loading false immediately after cache load
      }

      // Then fetch fresh data in background
      const userDoc = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDoc);
      
      if (docSnap.exists()) {
        const data = docSnap.data().watchHistory || [];
        const sortedHistory = data.sort((a: WatchHistoryItem, b: WatchHistoryItem) => 
          new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime()
        );
        
        setWatchHistory(sortedHistory);
        localStorage.setItem(`watchHistory-${user.uid}`, JSON.stringify(sortedHistory));
      }
    } catch (error) {
      console.warn('Using cached data:', error);
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

    try {
      // Update local state and cache first
      setWatchHistory(prev => {
        const newHistory = [watchItem, ...prev.filter(item => item.id !== watchItem.id)];
        localStorage.setItem(`watchHistory-${user.uid}`, JSON.stringify(newHistory));
        return newHistory;
      });

      // Update Firestore
      const userDoc = doc(db, 'users', user.uid);
      await setDoc(userDoc, {
        watchHistory: arrayUnion(watchItem),
        lastUpdated: timestamp
      }, { merge: true });

    } catch (error) {
      console.error('Error adding to watch history:', error);
      // The local update is already done, so the user still sees their history
    }
  };

  const clearHistory = async () => {
    if (!user) return;
    
    try {
      // Clear local first for immediate feedback
      localStorage.removeItem(`watchHistory-${user.uid}`);
      setWatchHistory([]);
      
      // Then update Firestore
      const userDoc = doc(db, 'users', user.uid);
      await setDoc(userDoc, { watchHistory: [] }, { merge: true });
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
    clearHistory,
    isOffline,
    refreshHistory: fetchWatchHistory 
  };
}
