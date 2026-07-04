import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { InsightBot } from '@/components/dashboard/InsightBot';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-surface-50 dark:bg-surface-950">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:w-[calc(100%-16rem)]">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
      <InsightBot />
    </div>
  );
}
