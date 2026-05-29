import { useState } from 'react';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import Navbar from '../components/Navbar';

type Tab = 'signin' | 'signup';

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>('signin');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F3FF] flex flex-col">
      <Navbar />

      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-300 blur-3xl opacity-20" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 pt-16">
        <div className="relative z-10 w-full max-w-sm">

          {/* Logo mark */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-600 mb-4 shadow-lg shadow-violet-200">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#1A1839]">
              {tab === 'signin' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-sm text-violet-500 mt-1">
              {tab === 'signin'
                ? 'Sign in to continue your story.'
                : 'Start your first immersive lesson.'}
            </p>
          </div>

          {/* Card */}
          <div className="lumio-card p-6 space-y-5">

            {/* Tab toggle */}
            <div className="flex bg-[#F5F3FF] rounded-xl p-1">
              {(['signin', 'signup'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setShowPassword(false); }}
                  className={clsx(
                    'flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer',
                    tab === t
                      ? 'bg-white text-violet-700 shadow-sm border border-[#E2DFFF]'
                      : 'text-violet-400 hover:text-violet-600'
                  )}
                >
                  {t === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            {/* Social buttons */}
            <div className="space-y-3">
              {/* Google */}
              <button
                type="button"
                disabled
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-[#E2DFFF] bg-white text-[#1A1839] text-sm font-medium hover:border-violet-300 transition-colors cursor-not-allowed opacity-70"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              {/* Apple */}
              <button
                type="button"
                disabled
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-[#1A1839] text-white text-sm font-medium hover:bg-[#2d2b47] transition-colors cursor-not-allowed opacity-70"
              >
                <AppleIcon />
                Continue with Apple
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#E2DFFF]" />
              <span className="text-xs text-violet-400">or continue with email</span>
              <div className="flex-1 h-px bg-[#E2DFFF]" />
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => e.preventDefault()}
              className="space-y-3"
            >
              {tab === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-violet-500 mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="your_username"
                    autoComplete="username"
                    className="w-full rounded-xl px-4 py-2.5 text-sm bg-[#F5F3FF] border border-[#E2DFFF] text-[#1A1839] placeholder:text-violet-300 focus:outline-none focus:border-violet-400 transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-violet-500 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-xl px-4 py-2.5 text-sm bg-[#F5F3FF] border border-[#E2DFFF] text-[#1A1839] placeholder:text-violet-300 focus:outline-none focus:border-violet-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-violet-500 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                    className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm bg-[#F5F3FF] border border-[#E2DFFF] text-[#1A1839] placeholder:text-violet-300 focus:outline-none focus:border-violet-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-300 hover:text-violet-500 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {tab === 'signin' && (
                <div className="text-right">
                  <button
                    type="button"
                    disabled
                    className="text-xs text-violet-400 hover:text-violet-600 transition-colors cursor-not-allowed"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled
                className="lumio-btn-primary w-full mt-1 opacity-70 cursor-not-allowed"
              >
                {tab === 'signin' ? 'Sign In' : 'Create account'}
              </button>
            </form>

            {/* Disclaimer */}
            <p className="text-center text-xs text-violet-300 pt-1">
              Authentication is not active yet — this form is a placeholder.
            </p>
          </div>

          {/* Toggle link */}
          <p className="text-center text-sm text-violet-500 mt-4">
            {tab === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setTab(tab === 'signin' ? 'signup' : 'signin')}
              className="text-violet-700 font-semibold hover:underline cursor-pointer"
            >
              {tab === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>

      {/* Footer spacing */}
      <div className="h-12" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 814 1000" fill="currentColor">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.6-49 192.5-49 30.8 0 108.2 2.6 168.6 80.1zm-198.4-86.4c-9.7-44.1-27.3-89.5-57.5-128.1C497.9 85.5 451.5 57 408.7 57c-1.9 0-3.9.2-5.8.3C403.3 57 403.3 57 403.3 57c0 1.9 0 3.9 0 5.8 0 44.1 17.5 91.8 46.4 124.5 31.3 35.8 82.1 62.2 127.5 62.2 1.9 0 3.9 0 5.8-.1-.1 0-.1-42.4-.1-42.4h5.8l-.6-37.5z" />
    </svg>
  );
}
