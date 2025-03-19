import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const queryParams = new URLSearchParams(window.location.search);
        const token = queryParams.get('token');
        const email = queryParams.get('email');

        if (token && email) {
          // Update user status in profiles table
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ email_verified: true })
            .eq('id', token);

          if (updateError) throw updateError;

          // Send welcome email
          // await sendEmail({
          //   to: email,
          //   subject: 'Welcome to MovieZone',
          //   template: 'welcome',
          //   data: {
          //     name: email.split('@')[0],
          //     loginUrl: `${window.location.origin}/auth/login`
          //   }
          // });

          navigate('/auth/login?verified=true');
          return;
        }

        // Handle OAuth callbacks
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
          navigate('/', { replace: true });
          return;
        }

        navigate('/auth/login');
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/auth/login?error=verification_failed');
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
