import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SkipLink } from '../ui/Accessibility';
import { useAnalyticsIdentify } from '../../analytics';
import { useAuth } from '../../context/AuthContext';
import { WelcomeModal } from '../onboarding/WelcomeModal';

export function Layout({ title = 'Dashboard' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, completeOnboarding } = useAuth();

  // Track whether to show the welcome modal
  const [showWelcome, setShowWelcome] = useState(true);
  const shouldShowWelcome = showWelcome && user && user.onboardingCompleted === false;

  // Sync user identity with analytics
  useAnalyticsIdentify();

  const handleOnboardingComplete = () => {
    setShowWelcome(false);
    completeOnboarding();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SkipLink targetId="main-content" />

      {/* Welcome Modal for new users */}
      <WelcomeModal
        isOpen={shouldShowWelcome}
        onComplete={handleOnboardingComplete}
        userRole={user?.role}
      />
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
