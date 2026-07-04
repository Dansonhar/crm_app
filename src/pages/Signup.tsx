import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, Lock, User, AlertCircle, ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Avatar } from '@/components/ui/Avatar';

export function Signup() {
  const { members, completeSignup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const pendingInvites = members.filter((m) => m.status === 'invited');
  const preselected = searchParams.get('memberId');

  const [memberId, setMemberId] = useState(
    preselected && pendingInvites.some((m) => m.id === preselected) ? preselected : pendingInvites[0]?.id ?? '',
  );
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const selectedMember = pendingInvites.find((m) => m.id === memberId);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!memberId) {
      setError('Select which invitation this account belongs to.');
      return;
    }
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const result = completeSignup(memberId, username, password);
    if (result === 'taken') {
      setError('That username is already in use. Try another.');
      return;
    }
    if (result === 'not-found') {
      setError('This invitation is no longer available.');
      return;
    }

    showToast(`Welcome to AgencyFlow, ${selectedMember?.name.split(' ')[0]}!`, 'success');
    navigate('/', { replace: true });
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
            Set Up Your Account
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            You've been invited to join AgencyFlow CRM
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 card-shadow dark:border-white/[0.06] dark:bg-surface-900 sm:p-8">
          {pendingInvites.length === 0 ? (
            <div className="py-4 text-center">
              <Mail className="mx-auto size-8 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                No pending invitations
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Ask your workspace admin to add you as a member from Settings &rarr; Workspace, then come back here.
              </p>
              <Link
                to="/login"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                <ArrowLeft className="size-4" /> Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  That's me...
                </label>
                <div className="space-y-2">
                  {pendingInvites.map((invite) => (
                    <label
                      key={invite.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                        memberId === invite.id
                          ? 'border-brand-400 bg-brand-500/5'
                          : 'border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5'
                      }`}
                    >
                      <input
                        type="radio"
                        name="member"
                        value={invite.id}
                        checked={memberId === invite.id}
                        onChange={() => setMemberId(invite.id)}
                        className="sr-only"
                      />
                      <Avatar name={invite.name} color={invite.avatarColor} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{invite.name}</p>
                        <p className="truncate text-xs text-slate-400">{invite.email} &middot; {invite.role}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Choose a Username
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. jmills"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-surface-950 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Choose a Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 4 characters"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-11 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-surface-950 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-surface-950 dark:text-slate-200"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-600 dark:text-rose-400">
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 transition-colors hover:bg-brand-600"
              >
                Create Account &amp; Sign In
              </button>
            </form>
          )}
        </div>

        <Link
          to="/login"
          className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
        >
          <ArrowLeft className="size-3.5" /> Back to login
        </Link>
      </div>
    </div>
  );
}
