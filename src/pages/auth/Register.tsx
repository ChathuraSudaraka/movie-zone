import React, { useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { supabase } from "../../config/supabase";
import { Mail, Eye, EyeOff, AlertCircle } from "lucide-react";
import {
  validateEmail,
  validatePassword,
  validateName,
} from "../../utils/validation";
import { Link } from "react-router-dom";

export function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.title = "Register - MovieZone";
  }, []);

  const validateForm = () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const nameError = validateName(name);

    setError("");
    if (emailError) setError(emailError);
    else if (passwordError) setError(passwordError);
    else if (nameError) setError(nameError);

    return !emailError && !passwordError && !nameError;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError("");

      // Use Supabase's built-in auth system with email confirmation
      const { data: userData, error: userError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
          // Enable built-in email verification
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (userError) throw userError;
      if (!userData?.user) throw new Error("Failed to create user account");

      // Create the profile in the database after signup
      try {
        await supabase.from("profiles").insert({
          id: userData.user.id,
          full_name: name,
          email_verified: false,
          updated_at: new Date().toISOString(),
        });
      } catch (profileError) {
        console.error("Profile creation error:", profileError);
        // Continue even if profile creation fails
      }

      // Show email verification screen
      setIsEmailSent(true);
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.message.includes("already registered")) {
        setError("This email is already registered. Please sign in instead.");
      } else {
        setError(error.message || "Failed to create account");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      setError("");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Google sign up error:", error);
      setError(error.message || "Failed to sign up with Google");
    } finally {
      setLoading(false);
    }
  };

  // Handles resending the verification email using Supabase's built-in method
  const resendConfirmationEmail = async () => {
    try {
      setLoading(true);
      setError("");

      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) throw error;

      // Show success message
      setError("Verification email has been resent! Please check your inbox.");
    } catch (error: any) {
      setError(error.message || "Failed to resend verification email");
    } finally {
      setLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141414] px-4 py-12">
        <div className="max-w-md w-full space-y-8 bg-zinc-900/80 p-8 rounded-lg border border-zinc-800">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-600/10 text-red-500">
              <Mail className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">
                Check your email
              </h2>
              <p className="mt-2 text-gray-400">
                We've sent a confirmation link to:
              </p>
              <p className="mt-1 text-xl font-medium text-white">{email}</p>
            </div>
            <div className="text-sm text-gray-400 space-y-2">
              <p>Click the link in the email to verify your address.</p>
              <p>If you don't see the email, check your spam folder.</p>
            </div>
            <div className="space-y-4">
              <button
                onClick={resendConfirmationEmail}
                disabled={loading}
                className="text-red-500 hover:text-red-400 text-sm"
              >
                {loading ? "Sending..." : "Resend confirmation email"}
              </button>
              <button
                onClick={() => setIsEmailSent(false)}
                className="block w-full text-gray-400 hover:text-white text-sm"
              >
                Use a different email address
              </button>
            </div>
            {error && <div className="text-sm text-red-500">{error}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#141414] px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-zinc-900/80 p-8 rounded-lg border border-zinc-800">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Create your account</h2>
          <p className="mt-2 text-sm text-gray-400">
            Join MovieZone to get started.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Google Sign Up Button */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md border border-zinc-700 transition"
          disabled={loading}
        >
          <FcGoogle className="w-5 h-5" />
          {loading ? "Processing..." : "Continue with Google"}
        </button>

        {/* Form divider */}
        <div className="flex items-center my-4">
          <hr className="flex-grow border-zinc-800" />
          <span className="px-4 text-sm text-gray-400">OR</span>
          <hr className="flex-grow border-zinc-800" />
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="text-sm font-medium text-gray-300"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500"
                placeholder="Enter your full name"
                required
              />
            </div>
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
            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-300"
              >
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500"
                  placeholder="Create a password"
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

          <div className="space-y-4">
            <button
              type="submit"
              className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition font-medium"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link
            to="/auth/login"
            className="text-red-500 hover:text-red-400 font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
