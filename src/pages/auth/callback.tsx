import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if this is an email confirmation
        const queryParams = new URLSearchParams(window.location.search);
        const type = queryParams.get('type');

        if (type === 'email_confirmation') {
          // Handle email confirmation
          await supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN') {
              navigate('/', { replace: true });
            }
          });
        }

        // Try to get session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Already have a session, redirect to home
          navigate('/', { replace: true });
          return;
        }

        // Get parameters from URL (both hash and search params)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const urlQueryParams = new URLSearchParams(window.location.search);

        // Check for error in query parameters
        if (queryParams.get('error')) {
          throw new Error(queryParams.get('error_description') || 'Authentication failed');
        }

        // Get tokens from either hash or query parameters
        const access_token = hashParams.get('access_token') || urlQueryParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token') || urlQueryParams.get('refresh_token');

        if (!access_token) {
          // No tokens found, let Supabase handle the exchange
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) throw error;
          navigate('/', { replace: true });
          return;
        }

        // Set the session if we have tokens
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token: refresh_token || '',
        });

        if (error) throw error;
        navigate('/', { replace: true });

      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/auth/login', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#141414] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-white text-lg">Authenticating...</p>
      </div>
    </div>
  );
}
