import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabase";
import { Mail, AlertCircle, ArrowLeft } from "lucide-react";
import { validateEmail } from "../../utils/validation";
import toast from "react-hot-toast";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const emailError = validateEmail(email);
    
    if (emailError) {
      setError(emailError);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError("");
    
    try {
      // Simplify by redirecting directly to login page with code
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/login`,
      });
      
      if (error) throw error;
      
      setIsEmailSent(true);
      toast.success("Password reset instructions sent to your email");
    } catch (error: any) {
      console.error("Password reset error:", error);
      setError(error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  // Email sent confirmation screen
  if (isEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141414] px-4 py-12">
        <div className="max-w-md w-full space-y-8 bg-zinc-900/80 p-8 rounded-lg border border-zinc-800">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-600/10 text-red-500">
              <Mail className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Check your email</h2>
              <p className="mt-2 text-gray-400">
                We've sent password reset instructions to:
              </p>
              <p className="mt-1 text-xl font-medium text-white">{email}</p>
            </div>
            <div className="text-sm text-gray-400 space-y-2">
              <p>Click the link in the email to reset your password.</p>
              <p>If you don't see the email, check your spam folder.</p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => setIsEmailSent(false)}
                className="flex items-center justify-center gap-2 text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Use a different email</span>
              </button>
              <button
                onClick={() => navigate("/auth/login")}
                className="text-red-500 hover:text-red-400 text-sm"
              >
                Return to login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Initial form
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#141414] px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-zinc-900/80 p-8 rounded-lg border border-zinc-800">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Forgot Password</h2>
          <p className="mt-2 text-sm text-gray-400">
            Enter your email to reset your password
          </p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-300"
            >
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

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        
        <div className="text-center">
          <p className="mt-2 text-sm text-gray-400">
            Remembered your password?{" "}
            <Link
              to="/auth/login"
              className="font-medium text-red-500 hover:text-red-400"
            >
              Sign In
            </Link>
          </p>

          <p className="mt-2 text-sm text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/auth/register"
              className="font-medium text-red-500 hover:text-red-400"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
