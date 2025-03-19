import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { supabase } from "../../config/supabase";
import { Mail, Eye, EyeOff } from "lucide-react";
import {
  validateEmail,
  validatePassword,
  validateName,
} from "../../utils/validation";

export function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

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
      setEmailSending(true);

      // Generate a verification token
      const verificationToken = crypto.randomUUID();

      // First, create the user with email verification disabled
      const { data: userData, error: userError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            verification_token: verificationToken,
          },
          emailRedirectTo: null,
          // Disable Supabase's built-in email verification
          emailConfirm: false,
        },
      });

      if (userError) throw userError;

      if (!userData?.user) {
        throw new Error("Failed to create user account");
      }

      // Create profile record
      await supabase.from("profiles").insert({
        id: userData.user.id,
        full_name: name,
        email: email,
        email_verified: false,
        auth_provider: "email",
        verification_token: verificationToken,
        updated_at: new Date().toISOString(),
      });

      // Send the custom verification email
      const { error: functionError } = await supabase.functions.invoke(
        "mail-sender",
        {
          method: "POST",
          body: {
            to: email,
            subject: "Verify your MovieZone account",
            template:
              "https://yqggxjuqaplmklqpcwsx.supabase.co/storage/v1/object/public/email-template//ConfirmEmailTemplate.html",
            options: {
              name: name,
              verificationUrl: `${
                window.location.origin
              }/auth/verify?token=${verificationToken}&email=${encodeURIComponent(
                email
              )}`,
            },
          },
        }
      );

      if (functionError) {
        throw new Error(
          `Failed to send verification email: ${functionError.message}`
        );
      }

      setIsEmailSent(true);
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(error.message || "Failed to create account");
    } finally {
      setLoading(false);
      setEmailSending(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      setError("Failed to sign up with Google");
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmationEmail = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No user found");

      const { error: functionError } = await supabase.functions.invoke(
        "mail-sender",
        {
          body: {
            to: email,
            subject: "Verify your MovieZone account",
            data: {
              name: name,
              verificationUrl: `${window.location.origin}/auth/verify?user_id=${
                user.id
              }&email=${encodeURIComponent(email)}`,
            },
          },
        }
      );

      if (functionError) throw functionError;

      setError("Verification email has been resent!");
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
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="mt-8 space-y-6">
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
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition"
              disabled={loading}
            >
              {loading
                ? emailSending
                  ? "Sending verification email..."
                  : "Creating account..."
                : "Create account"}
            </button>

            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md border border-zinc-700 transition"
              disabled={loading}
            >
              <FcGoogle className="w-5 h-5" />
              {loading ? "Signing up..." : "Sign up with Google"}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link to="/auth/login" className="text-red-500 hover:text-red-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
