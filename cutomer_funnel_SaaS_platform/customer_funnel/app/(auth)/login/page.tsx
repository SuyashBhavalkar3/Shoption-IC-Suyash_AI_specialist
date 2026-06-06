'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Laptop, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useApp } from '@/lib/context/app-context';
import { trackEvent } from '@/lib/analytics';

function LoginFormContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const redirectTo = searchParams.get('redirectTo') || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        showToast(error.message, 'error');
      } else {
        showToast('Logged in successfully!', 'success');
        if (data?.user?.id) {
          trackEvent('login', { user_id: data.user.id });
        } else {
          trackEvent('login');
        }
        router.push(redirectTo);
        router.refresh();
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
        <p className="text-sm text-slate-500">Sign in to your account to save products and checkout</p>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-600 text-rose-800 p-3 text-sm rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
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
            Password
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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded transition-colors text-sm cursor-pointer disabled:bg-indigo-400"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 border-t border-slate-200 pt-6 text-center text-sm">
        <span className="text-slate-500">New customer? </span>
        <Link href={`/signup?redirectTo=${encodeURIComponent(redirectTo)}`} className="text-indigo-600 hover:underline font-semibold">
          Create an account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={
        <div className="text-center p-8 bg-white border border-slate-200 rounded max-w-sm">
          <p className="text-slate-500 font-medium">Loading login form...</p>
        </div>
      }>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
