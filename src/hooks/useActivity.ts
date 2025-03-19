import { useState } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { ActivityItem } from '../types/user';

interface TrackActivityProps {
  type: ActivityItem['type'];
  title: string;
  media_id?: string;
  media_type?: string;
  metadata?: ActivityItem['metadata'];
}

export function useActivity() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackActivity = async ({
    type,
    title,
    media_id,
    media_type,
    metadata = {}
  }: TrackActivityProps): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      // Check if user_activities table exists
      const { error: tableCheckError } = await supabase
        .from('user_activities')
        .select('id', { count: 'exact', head: true })
        .limit(1);
        
      if (tableCheckError && tableCheckError.code === '42P01') {
        // Table doesn't exist, fallback to just updating watch history for 'watch' activities
        if (type === 'watch' && media_id && media_type) {
          const { error: watchError } = await supabase
            .from('watch_history')
            .upsert({
              user_id: user.id,
              media_id,
              title,
              media_type,
              watched_at: new Date().toISOString()
            });
            
          if (watchError) throw watchError;
          return true;
        }
        
        // For non-watch activities when table doesn't exist, just succeed silently
        return true;
      }
      
      // Table exists, insert activity
      const { error: insertError } = await supabase
        .from('user_activities')
        .insert({
          user_id: user.id,
          type,
          title,
          media_id,
          media_type,
          timestamp: new Date().toISOString(),
          metadata
        });
        
      if (insertError) throw insertError;
      
      // If it's a watch activity, also update watch_history for compatibility
      if (type === 'watch' && media_id && media_type) {
        await supabase
          .from('watch_history')
          .upsert({
            user_id: user.id,
            media_id,
            title,
            media_type,
            watched_at: new Date().toISOString()
          });
      }
      
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Error tracking activity:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    trackActivity,
    loading,
    error
  };
}
