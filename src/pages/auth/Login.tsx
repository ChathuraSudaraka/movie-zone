import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { supabase } from "../../config/supabase";
import { validateEmail } from "../../utils/validation";
import toast from 'react-hot-toast';

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const emailError = validateEmail(email);
    
    if (emailError) {
      setError(emailError);
      return false;
    }
    
    if (!password) {
      setError("Password is required");
      return false;
    }
    
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setError("");
      setShowResendVerification(false);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Check if the error is due to email not being verified
        if (error.message.includes("Email not confirmed")) {
          setError("Please verify your email before logging in.");
          setShowResendVerification(true);
          return;
        }
        throw error;
      }

      // Check if user has a profile
      const { error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      // Create profile if it doesn't exist
      if (profileError && profileError.code === 'PGRST116') {
        await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: data.user.user_metadata.full_name || '',
          email_verified: true,
          updated_at: new Date().toISOString(),
        });
      }

      navigate("/");
      toast.success('Successfully logged in');
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || "Failed to sign in");
      
      // Check for common errors and provide user-friendly messages
      if (error.message.includes("Invalid login credentials")) {
        setError("Incorrect email or password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError("");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Google sign in error:", error);
      setError("Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) throw error;
      
      toast.success("Verification email sent. Please check your inbox.");
    } catch (error: any) {
      console.error("Error sending verification email:", error);
      setError(error.message || "Failed to send verification email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#141414] px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-zinc-900/80 p-8 rounded-lg border border-zinc-800">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-400">
            Sign in to continue to MovieZone
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p>{error}</p>
              {showResendVerification && (
                <button 
                  onClick={handleResendVerification}
                  className="text-sm text-red-400 hover:text-red-300 mt-2 underline"
                >
                  Resend verification email
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link
              to="/auth/forgot-password"
              className="text-sm text-red-500 hover:text-red-400"
            >
              Forgot password?
            </Link>
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md border border-zinc-700 transition"
              disabled={loading}
            >
              <FcGoogle className="w-5 h-5" />
              {loading ? "Signing in..." : "Sign in with Google"}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-400">
          Don't have an account?{" "}
          <Link to="/auth/register" className="text-red-500 hover:text-red-400">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
