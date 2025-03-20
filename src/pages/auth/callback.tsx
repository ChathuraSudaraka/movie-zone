import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function Callback() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth callback error:', error);
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/auth/login'), 3000);
        return;
      }
      
      if (!data.session) {
        // Check if this is a email confirmation callback
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');
        
        if (type === 'email_confirmation') {
          toast.success('Email verified successfully!');
          setTimeout(() => navigate('/auth/login'), 2000);
          return;
        }
        
        setError('No session found. Please try logging in again.');
        setTimeout(() => navigate('/auth/login'), 3000);
        return;
      }
      
      // Handle user profile creation
      try {
        const user = data.session.user;
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        // Create profile if it doesn't exist
        if (profileError && profileError.code === 'PGRST116') {
          await supabase.from('profiles').insert({
            id: user.id,
            full_name: user.user_metadata.full_name || user.user_metadata.name || '',
            avatar_url: user.user_metadata.avatar_url,
            email_verified: true,
            updated_at: new Date().toISOString(),
          });
        } else if (profileData) {
          // Update profile if it exists but needs updating
          await supabase.from('profiles').update({
            full_name: user.user_metadata.full_name || user.user_metadata.name || profileData.full_name,
            avatar_url: user.user_metadata.avatar_url || profileData.avatar_url,
            email_verified: true,
            updated_at: new Date().toISOString(),
          }).eq('id', user.id);
        }
        
        // Redirect to home page
        toast.success('Signed in successfully!');
        navigate('/');
      } catch (profileError) {
        console.error('Profile setup error:', profileError);
        // Continue to home page even if profile creation fails
        navigate('/');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#141414] px-4">
      {error ? (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-6 py-4 rounded-lg max-w-md w-full text-center">
          <p className="font-medium mb-2">Error</p>
          <p>{error}</p>
          <p className="text-sm mt-4">Redirecting to login page...</p>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto" />
          <h1 className="text-xl text-white font-medium">Setting up your account...</h1>
          <p className="text-gray-400">Please wait while we complete the process.</p>
        </div>
      )}
    </div>
  );
}
