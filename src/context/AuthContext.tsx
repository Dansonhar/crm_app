import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type MemberStatus = 'active' | 'invited';

export interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarColor: string;
  initials: string;
  status: MemberStatus;
  username?: string;
  password?: string;
}

const STORAGE_KEY = 'agencyflow-members';
const SESSION_KEY = 'agencyflow-current-user';

export const DEMO_CREDENTIALS = { username: 'AGENCY', password: 'agency' };

const memberColors = [
  'bg-brand-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-indigo-500',
  'bg-pink-500',
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const seedMembers: Member[] = [
  {
    id: 'm-admin',
    name: 'Alicia Cross',
    email: 'alicia@agencyflow.com',
    role: 'Creative Director',
    avatarColor: 'bg-brand-500',
    initials: 'AC',
    status: 'active',
    username: DEMO_CREDENTIALS.username,
    password: DEMO_CREDENTIALS.password,
  },
  { id: 'm-2', name: 'Jordan Mills', email: 'jordan.mills@agencyflow.com', role: 'Lead Designer', avatarColor: 'bg-emerald-500', initials: 'JM', status: 'active' },
  { id: 'm-3', name: 'Tom Reyes', email: 'tom.reyes@agencyflow.com', role: 'Video Producer', avatarColor: 'bg-amber-500', initials: 'TR', status: 'active' },
  { id: 'm-4', name: 'Lena Park', email: 'lena.park@agencyflow.com', role: 'Marketing Strategist', avatarColor: 'bg-rose-500', initials: 'LP', status: 'active' },
  { id: 'm-5', name: 'Sophie Kim', email: 'sophie.kim@agencyflow.com', role: 'Account Manager', avatarColor: 'bg-sky-500', initials: 'SK', status: 'active' },
  { id: 'm-6', name: 'Ravi Watsa', email: 'ravi.watsa@agencyflow.com', role: 'Frontend Engineer', avatarColor: 'bg-violet-500', initials: 'RW', status: 'active' },
];

function loadMembers(): Member[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Member[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fall through to seed data
  }
  return seedMembers;
}

interface AuthContextValue {
  members: Member[];
  currentUser: Member | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  inviteMember: (data: { name: string; email: string; role: string }) => Member;
  removeMember: (id: string) => boolean;
  completeSignup: (memberId: string, username: string, password: string) => 'ok' | 'taken' | 'not-found';
  updateProfile: (updates: Partial<Pick<Member, 'name' | 'role' | 'email' | 'avatarColor'>>) => void;
  changePassword: (currentPassword: string, newPassword: string) => 'ok' | 'incorrect' | 'no-user';
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<Member[]>(loadMembers);
  const [currentUserId, setCurrentUserId] = useState<string | null>(() =>
    sessionStorage.getItem(SESSION_KEY),
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    if (currentUserId) sessionStorage.setItem(SESSION_KEY, currentUserId);
    else sessionStorage.removeItem(SESSION_KEY);
  }, [currentUserId]);

  const currentUser = members.find((m) => m.id === currentUserId) ?? null;

  function login(username: string, password: string) {
    const normalized = username.trim().toLowerCase();
    const match = members.find(
      (m) => m.status === 'active' && m.username?.toLowerCase() === normalized && m.password === password,
    );
    if (match) {
      setCurrentUserId(match.id);
      return true;
    }
    return false;
  }

  function logout() {
    setCurrentUserId(null);
  }

  function inviteMember(data: { name: string; email: string; role: string }) {
    const newMember: Member = {
      id: `m-${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role,
      avatarColor: memberColors[members.length % memberColors.length],
      initials: getInitials(data.name) || '??',
      status: 'invited',
    };
    setMembers((prev) => [...prev, newMember]);
    return newMember;
  }

  function removeMember(id: string) {
    if (id === currentUserId) return false;
    setMembers((prev) => prev.filter((m) => m.id !== id));
    return true;
  }

  function completeSignup(memberId: string, username: string, password: string) {
    const member = members.find((m) => m.id === memberId);
    if (!member) return 'not-found' as const;
    const normalized = username.trim().toLowerCase();
    const taken = members.some((m) => m.id !== memberId && m.username?.toLowerCase() === normalized);
    if (taken) return 'taken' as const;
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, username: username.trim(), password, status: 'active' } : m)),
    );
    setCurrentUserId(memberId);
    return 'ok' as const;
  }

  function updateProfile(updates: Partial<Pick<Member, 'name' | 'role' | 'email' | 'avatarColor'>>) {
    if (!currentUserId) return;
    setMembers((prev) => prev.map((m) => (m.id === currentUserId ? { ...m, ...updates } : m)));
  }

  function changePassword(currentPassword: string, newPassword: string) {
    if (!currentUserId) return 'no-user' as const;
    const user = members.find((m) => m.id === currentUserId);
    if (!user || user.password !== currentPassword) return 'incorrect' as const;
    setMembers((prev) =>
      prev.map((m) => (m.id === currentUserId ? { ...m, password: newPassword } : m)),
    );
    return 'ok' as const;
  }

  return (
    <AuthContext.Provider
      value={{
        members,
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        logout,
        inviteMember,
        removeMember,
        completeSignup,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
