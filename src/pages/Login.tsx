import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, Lock, User, AlertCircle, Wand2, UserPlus } from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS } from '@/context/AuthContext';

export function Login() {
  const { login, members } = useAuth();
  const pendingInvites = members.filter((m) => m.status === 'invited').length;
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const success = login(username, password);
    if (success) {
      navigate(from, { replace: true });
    } else {
      setError(true);
    }
  }

  function fillDemoCredentials() {
    setUsername(DEMO_CREDENTIALS.username);
    setPassword(DEMO_CREDENTIALS.password);
    setError(false);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-50 px-4 dark:bg-surface-950">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[36rem] -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-brand-700/20 blur-3xl" />

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-lg shadow-brand-500/30">
            <Sparkles className="size-7" strokeWidth={2.25} />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            AgencyFlow CRM
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sign in to your agency workspace
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 card-shadow dark:border-white/[0.06] dark:bg-surface-900 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Username
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(false);
                  }}
                  placeholder="Enter your username"
                  autoComplete="username"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-surface-950 dark:text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-11 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-surface-950 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-600 dark:text-rose-400">
                <AlertCircle className="size-4 shrink-0" />
                Invalid username or password. Try the demo credentials below.
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 transition-colors hover:bg-brand-600"
            >
              Sign In
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Demo credentials — feel free to try it out
              </p>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                <Wand2 className="size-3.5" />
                Autofill
              </button>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              <span className="text-slate-400 dark:text-slate-500">
                Username <span className="font-mono font-semibold text-slate-400/80 dark:text-slate-500/80">{DEMO_CREDENTIALS.username}</span>
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                Password <span className="font-mono font-semibold text-slate-400/80 dark:text-slate-500/80">{DEMO_CREDENTIALS.password}</span>
              </span>
            </div>
          </div>
        </div>

        <Link
          to="/signup"
          className="mt-5 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 bg-white/50 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-500/5 hover:text-brand-600 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-300 dark:hover:text-brand-400"
        >
          <UserPlus className="size-4" />
          New team member? Set up your account
          {pendingInvites > 0 && (
            <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {pendingInvites} pending
            </span>
          )}
        </Link>

        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          &copy; 2026 AgencyFlow. Portfolio demo workspace.
        </p>
      </div>
    </div>
  );
}
