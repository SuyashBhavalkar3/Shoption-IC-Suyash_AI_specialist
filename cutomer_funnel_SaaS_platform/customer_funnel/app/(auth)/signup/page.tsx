'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Laptop, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useApp } from '@/lib/context/app-context';

function SignupFormContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const redirectTo = searchParams.get('redirectTo') || '/';

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      showToast('Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      showToast('Password is too short', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (error) {
        setError(error.message);
        showToast(error.message, 'error');
      } else {
        // Try to automatically log the user in immediately
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!loginError && loginData.session) {
          showToast('Account created and logged in successfully!', 'success');
          router.push(redirectTo);
          router.refresh();
        } else {
          // If login fails (or if verification is required), check if session exists from signup
          if (data.session) {
            showToast('Account created and logged in!', 'success');
            router.push(redirectTo);
            router.refresh();
          } else {
            showToast('Account created! Please check your email for confirmation link or sign in.', 'info');
            router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
          }
        }
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
      showToast('An unexpected error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-slate-200 rounded p-8 shadow-sm">
      <div className="flex flex-col items-center mb-6">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 mb-2">
          <Laptop className="w-6 h-6 text-indigo-600" />
          <span>TECHSTORE</span>
        </Link>
        <p className="text-sm text-slate-500">Create a customer account to begin testing funnels</p>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-600 text-rose-800 p-3 text-sm rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1" htmlFor="password">
            Password (min 6 chars)
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded transition-colors text-sm cursor-pointer disabled:bg-indigo-400"
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 border-t border-slate-200 pt-6 text-center text-sm">
        <span className="text-slate-500">Already have an account? </span>
        <Link href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`} className="text-indigo-600 hover:underline font-semibold">
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={
        <div className="text-center p-8 bg-white border border-slate-200 rounded max-w-sm">
          <p className="text-slate-500 font-medium">Loading signup form...</p>
        </div>
      }>
        <SignupFormContent />
      </Suspense>
    </div>
  );
}
