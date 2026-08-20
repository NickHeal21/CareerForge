import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Desktop Sidebar (fixed, 256px wide) */}
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-col min-h-screen pb-20 md:pb-0 sidebar-offset">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 w-full max-w-[1200px] mx-auto px-5 md:px-8 py-8 md:py-16 animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
