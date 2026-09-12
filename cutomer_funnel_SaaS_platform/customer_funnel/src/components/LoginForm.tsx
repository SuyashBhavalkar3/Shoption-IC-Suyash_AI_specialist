import React, { useState } from "react";
const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type LoginResponse = {
  access_token: string;
  token_type: string;
};

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  function validate() {
    let ok = true;
    setEmailError(null);
    setPasswordError(null);
    setError(null);

    if (!email.trim()) {
      setEmailError("Email is required");
      ok = false;
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setEmailError("Enter a valid email address");
      ok = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      ok = false;
    }

    return ok;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${VITE_API_BASE_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      if (!res.ok) {
        if (res.status === 401) {
          setError("Invalid email or password");
        } else {
          setError("Server error. Please try again later.");
        }

        setLoading(false);
        return;
      }

      const data = (await res.json()) as LoginResponse;
      const token = data.access_token;

      if (remember) {
        localStorage.setItem("token", token);
      } else {
        sessionStorage.setItem("token", token);
      }

      try {
        const me = await fetch(
          `${VITE_API_BASE_URL}/api/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (me.ok) {
          const user = await me.json();

          localStorage.setItem(
            "user",
            JSON.stringify(user)
          );
        }
      } catch (err) {
        console.error(err);
      }

      window.location.assign("/dashboard");
    } catch (err) {
      setError(
        "Network error. Please check your connection."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="login form">
      <div>
        <h3 className="text-3xl font-semibold text-[#3E362E]">Welcome Back</h3>
        <p className="mt-1 text-sm text-[#6F665E]">Sign in to your account</p>
      </div>

      {error && (
        <div className="rounded-3xl border border-[#F1D2CB] bg-[#FBEFEA] px-4 py-3 text-sm text-[#8A4236]">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[#3E362E]">
          Email Address
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-3xl border border-[#DDD3C6] bg-[#F8F4ED] px-4 py-3 text-[#3E362E] placeholder:text-[#9B8F7E] focus:border-[#B89B72] focus:ring-2 focus:ring-[#B89B72]/20"
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "email-error" : undefined}
          />
        </div>
        {emailError && <p id="email-error" className="mt-1 text-sm text-[#B97A6A]">{emailError}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-[#3E362E]">
          Password
        </label>
        <div className="mt-1 relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-3xl border border-[#DDD3C6] bg-[#F8F4ED] px-4 py-3 text-[#3E362E] placeholder:text-[#9B8F7E] focus:border-[#B89B72] focus:ring-2 focus:ring-[#B89B72]/20"
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? "password-error" : undefined}
          />

          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B8F7E]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3l18 18" stroke="#9B8F7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10.58 10.58a3 3 0 104.24 4.24" stroke="#9B8F7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="#9B8F7E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" stroke="#9B8F7E" strokeWidth="1.5" />
              </svg>
            )}
          </button>
        </div>
        {passwordError && <p id="password-error" className="mt-1 text-sm text-[#B97A6A]">{passwordError}</p>}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-[#6F665E]">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border border-[#DDD3C6] bg-[#FFFDF9] text-[#B89B72] focus:ring-[#B89B72]"
          />
          Remember me
        </label>

        <a href="#" className="text-sm font-semibold text-[#7A9E7E] hover:text-[#5B7B61]">
          Forgot Password?
        </a>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-3xl bg-[#B89B72] px-4 py-3 text-sm font-semibold text-white shadow-button hover:bg-[#A88A61] disabled:opacity-60"
        >
          {loading && (
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          )}
          Sign In
        </button>
      </div>
    </form>
  );
}
