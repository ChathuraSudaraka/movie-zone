import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../config/supabase";
import { AlertCircle, Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react";
import { validatePassword } from "../../utils/validation";
import toast from "react-hot-toast";

export function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [tokenError, setTokenError] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [validRecoveryFlow, setValidRecoveryFlow] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAccessValidity = async () => {
      const urlInfo = {
        fullUrl: window.location.href,
        hash: window.location.hash,
        search: window.location.search,
        pathname: window.location.pathname,
        referrer: document.referrer,
      };
      setDebugInfo(JSON.stringify(urlInfo, null, 2));
      console.log("Debug URL info:", urlInfo);

      // Check if there are any URL parameters indicating a password reset flow
      const hasSearchParams = location.search && location.search.length > 1;
      const hasHashParams = location.hash && location.hash.length > 1;

      // If no URL parameters, redirect to forgot password
      if (!hasSearchParams && !hasHashParams) {
        console.log("No URL parameters found, user trying to access page directly");
        navigate("/auth/forgot-password");
        return;
      }

      // Check for token_hash or type=recovery in search params
      const searchParams = new URLSearchParams(location.search);
      const tokenHash = searchParams.get("token_hash");
      const typeInSearch = searchParams.get("type");

      // Check for parameters in hash
      const hashParams = new URLSearchParams(location.hash.replace("#", ""));
      const accessToken = hashParams.get("access_token");
      const typeInHash = hashParams.get("type");

      // Valid parameters found
      if ((tokenHash && typeInSearch === "recovery") || 
          (accessToken) || 
          (typeInHash === "recovery")) {
        
        console.log("Valid reset parameters found in URL");
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("Auth state change event:", event);

          if (event === "PASSWORD_RECOVERY") {
            console.log("PASSWORD_RECOVERY event detected - valid recovery flow");
            setValidRecoveryFlow(true);
            setInitializing(false);
          } else if (session) {
            console.log("Existing session detected");
            setValidRecoveryFlow(true);
            setInitializing(false);
          }
        });
        
        // Check if we have a valid session
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          console.log("User has a valid session");
          setValidRecoveryFlow(true);
          setInitializing(false);
          return () => subscription.unsubscribe();
        }
        
        // Set timeout to check for event
        setTimeout(() => {
          if (initializing) {
            console.log("No valid recovery flow detected after timeout");
            setTokenError(true);
            setInitializing(false);
          }
        }, 2000);
        
        return () => subscription.unsubscribe();
      } else {
        // Invalid parameters
        console.log("URL parameters present but invalid");
        setTokenError(true);
        setInitializing(false);
      }
    };

    checkAccessValidity();
  }, [location, navigate]);

  const validateForm = () => {
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
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
      console.log("Attempting to update user password");

      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error("Password update error:", error);
        throw error;
      }

      console.log("Password reset successful:", data);
      setIsSuccess(true);
      toast.success("Password has been reset successfully!");

      setTimeout(() => {
        navigate("/auth/login");
      }, 3000);
    } catch (error: any) {
      console.error("Password reset error:", error);

      if (
        error.message.includes("Invalid") ||
        error.message.includes("expired") ||
        error.message.includes("token") ||
        error.message.includes("session")
      ) {
        setTokenError(true);
      } else {
        setError(error.message || "Failed to reset password");
      }
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141414] px-4 py-12">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto" />
          <h1 className="text-xl text-white">Loading...</h1>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141414] px-4 py-12">
        <div className="max-w-md w-full space-y-8 bg-zinc-900/80 p-8 rounded-lg border border-zinc-800">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-600/10 text-red-500">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Invalid Reset Link</h2>
              <p className="mt-4 text-gray-300">
                The password reset link is invalid or has expired.
              </p>
              <p className="mt-2 text-gray-400">
                Please request a new password reset link.
              </p>
            </div>

            {debugInfo && (
              <div className="mt-4 p-4 bg-black/50 rounded-md text-left">
                <details>
                  <summary className="text-gray-400 cursor-pointer text-sm">
                    Technical Details
                  </summary>
                  <pre className="text-xs text-gray-500 mt-2 overflow-auto">
                    {debugInfo}
                  </pre>
                </details>
              </div>
            )}

            <div className="flex justify-center space-x-4 mt-4">
              <Link
                to="/auth/forgot-password"
                className="inline-block px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
              >
                Request New Link
              </Link>
              <Link
                to="/auth/login"
                className="inline-block px-4 py-2 bg-zinc-700 text-white rounded-md hover:bg-zinc-600 transition"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141414] px-4 py-12">
        <div className="max-w-md w-full space-y-8 bg-zinc-900/80 p-8 rounded-lg border border-zinc-800">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-600/10 text-green-500">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Password Reset</h2>
              <p className="mt-4 text-gray-300">
                Your password has been reset successfully.
              </p>
              <p className="mt-2 text-gray-400">
                You will be redirected to login in a few seconds...
              </p>
            </div>
            <Link
              to="/auth/login"
              className="inline-block px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#141414] px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-zinc-900/80 p-8 rounded-lg border border-zinc-800">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Reset Password</h2>
          <p className="mt-2 text-sm text-gray-400">
            Enter your new password below
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-300"
              >
                New Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500"
                  placeholder="Enter new password"
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

            <div>
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-300"
              >
                Confirm Password
              </label>
              <div className="relative mt-1">
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500"
                  placeholder="Confirm new password"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="text-center">
          <p className="mt-2 text-sm text-gray-400">
            <Link
              to="/auth/login"
              className="font-medium text-red-500 hover:text-red-400"
            >
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
