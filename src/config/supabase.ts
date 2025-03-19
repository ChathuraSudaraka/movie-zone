import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const signInWithGoogle = async () => {
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      redirectTo: `${window.location.origin}/auth/callback`,
    }
  });
};

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
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    
    // If user successfully authenticated, initialize their profile
    if (session?.user) {
      console.log('User authenticated, metadata:', session.user.user_metadata);
      
      // For Google auth, the picture is in user_metadata
      const userData = {
        ...session.user.user_metadata,
        email: session.user.email,
        provider: session.user.app_metadata?.provider,
        app_metadata: session.user.app_metadata
      };
      
      await initializeUserProfile(session.user.id, userData);
    }
    
    return session;
  } catch (error) {
    console.error('Error in auth callback:', error);
    throw error;
  }
};

export const initializeUserProfile = async (userId: string, userData: any) => {
  try {
    console.log('Initializing user profile with data:', userData);
    
    // First check if profile exists
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId);
      
    if (profileError) throw profileError;
    
    // For Google users, get their profile picture
    const provider = userData?.provider || userData?.app_metadata?.provider;
    const isGoogleUser = provider === 'google';
    const avatarUrl = isGoogleUser ? userData.picture : null;
    
    console.log('User profile data:', { isGoogleUser, avatarUrl, provider });
    
    // Create profile if it doesn't exist
    if (!profileData || profileData.length === 0) {
      console.log('Creating new profile for user:', userId);
      
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: userData?.full_name || userData?.name || userData?.email?.split('@')[0] || 'User',
          avatar_url: avatarUrl, // Store Google profile picture in avatar_url
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        console.error('Error creating profile:', error);
        throw error;
      }
    } 
    // If profile exists but doesn't have avatar_url and this is a Google user with a picture
    else if (isGoogleUser && userData.picture && profileData[0] && !profileData[0].avatar_url) {
      console.log('Updating existing profile with Google avatar for user:', userId);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: userData.picture,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (error) {
        console.error('Error updating profile with avatar:', error);
        throw error;
      }
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

export const initializeProfile = async (userId: string, userData: { email: string }) => {
  try {
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      email: userData.email,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error initializing profile:', error);
    return false;
  }
};

export const deleteUserAccount = async (userId: string) => {
  try {
    // First delete all related data
    // 1. Delete watch history
    await supabase
      .from('watch_history')
      .delete()
      .eq('user_id', userId);

    // 2. Delete user lists (watchlist)
    await supabase
      .from('user_lists')
      .delete()
      .eq('user_id', userId);

    // 3. Delete user preferences
    await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', userId);

    // 4. Delete user activities (if the table exists)
    try {
      await supabase
        .from('user_activities')
        .delete()
        .eq('user_id', userId);
    } catch (e) {
      console.log("Could not delete user activities, may not exist:", e);
    }

    // 5. Delete contact messages
    await supabase
      .from('contact_messages')
      .delete()
      .eq('email', userId);

    // 6. Delete user profile
    await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
      
    // 7. Delete avatar from storage
    try {
      await supabase
        .storage
        .from('avatars')
        .remove([`avatars/${userId}.jpg`, `avatars/${userId}.png`, `avatars/${userId}.jpeg`, `avatars/${userId}.gif`]);
    } catch (storageErr) {
      console.log("Storage operation failed, continuing:", storageErr);
    }

    // 8. Call the RPC function to delete the user from auth system
    // No need to attempt admin API which will fail with 403
    const { error } = await supabase.rpc('delete_user');
    
    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw error;
  }
};
