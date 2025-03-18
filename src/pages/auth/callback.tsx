import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get hash parameters from URL
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1) // Remove the # symbol
        );

        // If we have an access token in the URL
        if (hashParams.get("access_token")) {
          const access_token = hashParams.get("access_token");
          const refresh_token = hashParams.get("refresh_token");

          if (!access_token || !refresh_token) {
            throw new Error("Missing access token or refresh token");
          }

          const session = {
            access_token,
            refresh_token,
            expires_in: parseInt(hashParams.get("expires_in") || "0", 10),
            provider_token: hashParams.get("provider_token") || undefined,
            provider_refresh_token:
              hashParams.get("provider_refresh_token") || undefined,
          };

          // Set the session in Supabase
          const { error } = await supabase.auth.setSession(session);

          if (error) throw error;

          // Successfully authenticated, redirect to home
          navigate("/", { replace: true });
        } else {
          // No access token found
          throw new Error("No access token found in URL");
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        navigate("/auth/login", { replace: true });
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
