import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Moon,
  Sun,
  Bell,
  Building2,
  User,
  Shield,
  CreditCard,
  UserPlus,
  Mail,
  KeyRound,
  Trash2,
  Copy,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';
import { useUrlState } from '@/lib/useUrlState';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'workspace', label: 'Workspace', icon: Building2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Shield },
];

const roleOptions = [
  'Creative Director',
  'Lead Designer',
  'Video Producer',
  'Marketing Strategist',
  'Account Manager',
  'Frontend Engineer',
  'Copywriter',
  'Project Manager',
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-900',
        checked ? 'bg-brand-500' : 'bg-slate-200 dark:bg-white/10',
      )}
    >
      <span
        className={cn(
          'absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-transform duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">{children}</label>;
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-surface-950 dark:text-slate-200';

const avatarCyclePalette = [
  'bg-brand-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
  'bg-sky-500', 'bg-violet-500', 'bg-teal-500', 'bg-orange-500', 'bg-indigo-500', 'bg-pink-500',
];

export function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { members, currentUser, inviteMember, removeMember, updateProfile, changePassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useUrlState('tab', 'profile');
  const [notifs, setNotifs] = useState({ email: true, push: false, weeklyDigest: true, invoiceReminders: true });

  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name ?? '',
    role: currentUser?.role ?? '',
    email: currentUser?.email ?? '',
  });

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: roleOptions[0] });
  const [removingMember, setRemovingMember] = useState<{ id: string; name: string } | null>(null);

  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');

  function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    updateProfile(profileForm);
    showToast('Profile updated successfully.', 'success');
  }

  function handleChangeAvatarColor() {
    if (!currentUser) return;
    const nextIndex = (avatarCyclePalette.indexOf(currentUser.avatarColor) + 1) % avatarCyclePalette.length;
    updateProfile({ avatarColor: avatarCyclePalette[nextIndex] });
    showToast('Avatar color updated.', 'success');
  }

  function handleInviteSubmit(e: FormEvent) {
    e.preventDefault();
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      showToast('Enter a name and email to add a member.', 'error');
      return;
    }
    if (members.some((m) => m.email.toLowerCase() === inviteForm.email.trim().toLowerCase())) {
      showToast('A member with that email already exists.', 'error');
      return;
    }
    inviteMember(inviteForm);
    showToast(`Invitation created for ${inviteForm.name}. They can set up their login from the sign-in page.`, 'success');
    setInviteForm({ name: '', email: '', role: roleOptions[0] });
    setInviteModalOpen(false);
  }

  function handleRemoveMember(id: string, name: string) {
    const success = removeMember(id);
    showToast(success ? `${name} was removed from the workspace.` : "You can't remove yourself.", success ? 'success' : 'error');
  }

  function handleCopyInviteLink(memberId: string, name: string) {
    const link = `${window.location.origin}/signup?memberId=${memberId}`;
    navigator.clipboard?.writeText(link).catch(() => {});
    showToast(`Invite link for ${name} copied to clipboard.`, 'info');
  }

  function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError('');
    if (passwordForm.next.length < 4) {
      setPasswordError('New password must be at least 4 characters.');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError('New passwords do not match.');
      return;
    }
    const result = changePassword(passwordForm.current, passwordForm.next);
    if (result === 'incorrect') {
      setPasswordError('Current password is incorrect.');
      return;
    }
    showToast('Password updated successfully.', 'success');
    setPasswordForm({ current: '', next: '', confirm: '' });
  }

  return (
    <div>
      <PageHeader title="Settings" description="Manage your workspace, profile, and preferences" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300'
                  : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5',
              )}
            >
              <tab.icon className="size-4" /> {tab.label}
            </button>
          ))}
        </nav>

        <div className="space-y-4">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <form onSubmit={handleSaveProfile}>
                <CardContent className="space-y-5">
                  <div className="flex items-center gap-4">
                    <Avatar name={currentUser?.name ?? 'You'} color={currentUser?.avatarColor} size="lg" />
                    <div>
                      <button
                        type="button"
                        onClick={handleChangeAvatarColor}
                        className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                      >
                        Change Avatar Color
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel>Full Name</FieldLabel>
                      <input
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <FieldLabel>Role</FieldLabel>
                      <input
                        value={profileForm.role}
                        onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <FieldLabel>Email</FieldLabel>
                      <input
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
                      Save Changes
                    </button>
                  </div>
                </CardContent>
              </form>
            </Card>
          )}

          {activeTab === 'workspace' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? <Moon className="size-5 text-brand-400" /> : <Sun className="size-5 text-amber-500" />}
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">Dark Mode</p>
                        <p className="text-xs text-slate-400">Toggle between light and dark workspace themes</p>
                      </div>
                    </div>
                    <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Workspace Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Agency Name</FieldLabel>
                    <input defaultValue="AgencyFlow Creative Studio" className={inputClass} />
                  </div>
                  <div>
                    <FieldLabel>Default Currency</FieldLabel>
                    <select className={inputClass} defaultValue="MYR">
                      <option>MYR</option>
                      <option>USD</option>
                      <option>EUR</option>
                      <option>GBP</option>
                    </select>
                  </div>
                  <div className="flex justify-end sm:col-span-2">
                    <button
                      onClick={() => showToast('Workspace details saved.', 'success')}
                      className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
                    >
                      Save Workspace Settings
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <button
                    onClick={() => setInviteModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-brand-500/30 transition-colors hover:bg-brand-600"
                  >
                    <UserPlus className="size-3.5" />
                    Add Member
                  </button>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {members.map((member) => {
                    const isYou = member.id === currentUser?.id;
                    return (
                      <div
                        key={member.id}
                        className="flex flex-col gap-2 rounded-xl px-2 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar name={member.name} color={member.avatarColor} size="sm" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{member.name}</p>
                              {isYou && (
                                <span className="rounded-full bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-600 dark:text-brand-400">
                                  YOU
                                </span>
                              )}
                              <span
                                className={cn(
                                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                                  member.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                                )}
                              >
                                {member.status === 'active' ? 'ACTIVE' : 'INVITED'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">{member.role} &middot; {member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 pl-12 sm:pl-0">
                          {member.status === 'invited' && (
                            <>
                              <button
                                onClick={() => navigate(`/signup?memberId=${member.id}`)}
                                className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                              >
                                <Mail className="size-3.5" /> Set Up Login
                              </button>
                              <button
                                onClick={() => handleCopyInviteLink(member.id, member.name)}
                                className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                              >
                                <Copy className="size-3.5" /> Copy Link
                              </button>
                            </>
                          )}
                          {!isYou && (
                            <button
                              onClick={() => setRemovingMember({ id: member.id, name: member.name })}
                              className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="size-3.5" /> Remove
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {[
                  { key: 'email' as const, label: 'Email Notifications', desc: 'Receive updates via email' },
                  { key: 'push' as const, label: 'Push Notifications', desc: 'Get notified in your browser' },
                  { key: 'weeklyDigest' as const, label: 'Weekly Digest', desc: 'Summary of activity every Monday' },
                  { key: 'invoiceReminders' as const, label: 'Invoice Reminders', desc: 'Alerts for pending & overdue invoices' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-xl px-2 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{item.label}</p>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                    <Toggle
                      checked={notifs[item.key]}
                      onChange={() => {
                        setNotifs((prev) => ({ ...prev, [item.key]: !prev[item.key] }));
                        showToast(`${item.label} ${notifs[item.key] ? 'disabled' : 'enabled'}.`, 'info');
                      }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === 'billing' && (
            <Card>
              <CardHeader>
                <CardTitle>Billing Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl bg-gradient-to-br from-brand-500/10 to-brand-700/10 p-5 dark:from-brand-500/15 dark:to-brand-900/20">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">Current Plan</p>
                  <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Agency Pro</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">RM149/month &middot; billed annually</p>
                  <button
                    onClick={() => showToast('This is a demo workspace — billing is not connected to a real payment processor.', 'info')}
                    className="mt-4 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
                  >
                    Manage Subscription
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
              </CardHeader>
              <form onSubmit={handleChangePassword}>
                <CardContent className="space-y-4">
                  <div>
                    <FieldLabel>Current Password</FieldLabel>
                    <input
                      type="password"
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                      placeholder="••••••••"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <FieldLabel>New Password</FieldLabel>
                    <input
                      type="password"
                      value={passwordForm.next}
                      onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
                      placeholder="••••••••"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <FieldLabel>Confirm New Password</FieldLabel>
                    <input
                      type="password"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      placeholder="••••••••"
                      className={inputClass}
                    />
                  </div>
                  {passwordError && (
                    <p className="flex items-center gap-1.5 text-sm text-rose-500">
                      <KeyRound className="size-4" /> {passwordError}
                    </p>
                  )}
                  <div className="flex justify-end">
                    <button type="submit" className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
                      Update Password
                    </button>
                  </div>
                </CardContent>
              </form>
            </Card>
          )}
        </div>
      </div>

      <Modal open={inviteModalOpen} onClose={() => setInviteModalOpen(false)} title="Add Team Member">
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            They'll be added as <strong className="text-slate-700 dark:text-slate-200">Invited</strong>. Once added, they can visit the
            login page, choose "Set up your account," and create their own username and password.
          </p>
          <div>
            <FieldLabel>Full Name</FieldLabel>
            <input
              value={inviteForm.name}
              onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
              placeholder="Jane Cooper"
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel>Email</FieldLabel>
            <input
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              placeholder="jane@agencyflow.com"
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel>Role</FieldLabel>
            <select
              value={inviteForm.role}
              onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
              className={inputClass}
            >
              {roleOptions.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setInviteModalOpen(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button type="submit" className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
              Add Member
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(removingMember)}
        onClose={() => setRemovingMember(null)}
        onConfirm={() => {
          if (!removingMember) return;
          handleRemoveMember(removingMember.id, removingMember.name);
        }}
        title="Remove this member?"
        description={`${removingMember?.name} will lose access to this workspace. This can't be undone.`}
        confirmLabel="Remove Member"
      />
    </div>
  );
}
