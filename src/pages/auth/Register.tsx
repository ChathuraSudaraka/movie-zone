import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../../context/AuthContext';
import { supabase } from "../../config/supabase";
import { Mail } from 'lucide-react';

export function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const navigate = useNavigate();
  const { } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) throw error;

      if (data.user && data.user.identities?.length === 0) {
        setError("This email is already registered. Please sign in instead.");
        return;
      }
      
      if (data.user) {
        // Create profile entry
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: name,
          email: email,
          updated_at: new Date().toISOString(),
        });

        setIsEmailSent(true);
      }
    } catch (error: any) {
      setError(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setError('');
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      setError('Failed to sign up with Google');
      console.error('Sign up error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmationEmail = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;
      
      // Show success message
      setError("Confirmation email has been resent!");
    } catch (error: any) {
      setError(error.message || "Failed to resend confirmation email");
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
              <h2 className="text-3xl font-bold text-white">Check your email</h2>
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
                {loading ? 'Sending...' : 'Resend confirmation email'}
              </button>
              <button
                onClick={() => setIsEmailSent(false)}
                className="block w-full text-gray-400 hover:text-white text-sm"
              >
                Use a different email address
              </button>
            </div>
            {error && (
              <div className="text-sm text-red-500">
                {error}
              </div>
            )}
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

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium text-gray-300">
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
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500"
                placeholder="Create a password"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>

            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md border border-zinc-700 transition"
              disabled={loading}
            >
              <FcGoogle className="w-5 h-5" />
              {loading ? 'Signing up...' : 'Sign up with Google'}
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
