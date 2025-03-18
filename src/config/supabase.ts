import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const signInWithGoogle = async () => {
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  });
}

export const signOut = async () => {
  return await supabase.auth.signOut();
}

export const getUser = () => supabase.auth.getUser()

export const uploadAvatar = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop();
  const filePath = `avatars/${userId}.${fileExt}`;

  // Upload file
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  // Get URL
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

export const updateUserProfile = async (userId: string, updates: { avatar_url?: string }) => {
  const { error } = await supabase
    .from('profiles')
    .upsert({ 
      id: userId, 
      ...updates,
      updated_at: new Date().toISOString()
    });

  if (error) throw error;
};

export const handleAuthCallback = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

export const initializeUserProfile = async (userId: string, userData: any) => {
  try {
    // First check if profile exists
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId);
      
    if (profileError) throw profileError;
      
    // Create profile if it doesn't exist
    if (!profileData || profileData.length === 0) {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: userData?.full_name || userData?.email?.split('@')[0] || 'User',
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
    }
    
    // Create user preferences if they don't exist
    const { data: preferencesData, error: preferencesError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId);
      
    if (preferencesError) throw preferencesError;
      
    if (!preferencesData || preferencesData.length === 0) {
      const { error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          activities: [],
          preferences: {
            emailNotifications: true,
            pushNotifications: true,
            newReleaseAlerts: true,
            watchlistUpdates: true,
            recommendationEmails: true,
            language: "en",
            autoplayTrailers: true,
            defaultPlaybackQuality: "auto",
          }
        });
        
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing user profile:', error);
    return false;
  }
};
