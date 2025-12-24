import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SkipLink } from '../ui/Accessibility';

export function Layout({ title = 'Dashboard' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <SkipLink targetId="main-content" />
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main id="main-content" className="p-6" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
