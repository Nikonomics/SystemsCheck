import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  Building2,
  Brain,
  Users,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { authApi } from '../../api/auth';

// Role-specific welcome content
const roleContent = {
  clinical_resource: {
    title: 'Welcome to SystemsCheck!',
    subtitle: 'Your Clinical Audit Companion',
    description: 'Your job is to complete monthly clinical audits for your assigned facilities. Track scores across 7 clinical systems and help maintain quality care.',
    tips: [
      { icon: ClipboardCheck, text: 'Start from Scorecards to see your pending audits' },
      { icon: Building2, text: 'Or browse Facilities to view your assignments' },
    ],
    primaryAction: { label: 'Go to Scorecards', path: '/scorecards' },
  },
  facility_leader: {
    title: 'Welcome to SystemsCheck!',
    subtitle: 'Facility Oversight Dashboard',
    description: "See your facility's health at a glance. Track audit completion, monitor scores, and stay ahead of survey risk.",
    tips: [
      { icon: Building2, text: 'Your Dashboard shows facility status and trends' },
      { icon: Brain, text: 'Use Survey Intelligence for risk insights' },
    ],
    primaryAction: { label: 'View Dashboard', path: '/dashboard' },
  },
  team_leader: {
    title: 'Welcome to SystemsCheck!',
    subtitle: 'Team Performance Hub',
    description: 'Monitor multiple facilities across your team. Compare performance, identify gaps, and use data-driven insights to prioritize attention.',
    tips: [
      { icon: Users, text: 'Dashboard shows team-wide metrics and trends' },
      { icon: Brain, text: 'Survey Intelligence highlights facilities at risk' },
    ],
    primaryAction: { label: 'View Dashboard', path: '/dashboard' },
  },
  company_leader: {
    title: 'Welcome to SystemsCheck!',
    subtitle: 'Company Analytics Center',
    description: 'Get a bird\'s-eye view of clinical performance across all teams. Track company-wide trends and identify top performers.',
    tips: [
      { icon: Users, text: 'Compare team performance from your Dashboard' },
      { icon: Brain, text: 'Survey Intelligence provides risk analytics' },
    ],
    primaryAction: { label: 'View Dashboard', path: '/dashboard' },
  },
  corporate: {
    title: 'Welcome to SystemsCheck!',
    subtitle: 'Enterprise Analytics',
    description: 'Access comprehensive analytics across all companies, teams, and facilities. Monitor organization-wide clinical quality.',
    tips: [
      { icon: Users, text: 'Dashboard shows company-level comparisons' },
      { icon: Brain, text: 'Use Survey Intelligence for portfolio-wide insights' },
    ],
    primaryAction: { label: 'View Dashboard', path: '/dashboard' },
  },
  admin: {
    title: 'Welcome to SystemsCheck!',
    subtitle: 'System Administration',
    description: 'Full access to all features including user management, audit templates, and historical data imports.',
    tips: [
      { icon: Users, text: 'Manage users and permissions in Admin section' },
      { icon: ClipboardCheck, text: 'Configure audit templates and import history' },
    ],
    primaryAction: { label: 'View Dashboard', path: '/dashboard' },
  },
};

// Default content for unknown roles
const defaultContent = {
  title: 'Welcome to SystemsCheck!',
  subtitle: 'Clinical Audit Platform',
  description: 'Track clinical quality across skilled nursing facilities with comprehensive audit scorecards and analytics.',
  tips: [
    { icon: ClipboardCheck, text: 'View and complete clinical audits' },
    { icon: Building2, text: 'Monitor facility performance' },
  ],
  primaryAction: { label: 'Get Started', path: '/dashboard' },
};

export function WelcomeModal({ isOpen, onComplete, userRole }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const content = roleContent[userRole] || defaultContent;

  const handleGetStarted = async () => {
    setLoading(true);
    try {
      await authApi.completeOnboarding();
      onComplete();
      navigate(content.primaryAction.path);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // Still close the modal even if API fails
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    setLoading(true);
    try {
      await authApi.completeOnboarding();
      onComplete();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDismiss}
      size="lg"
      showClose={true}
    >
      <div className="text-center pb-4">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <Sparkles className="h-8 w-8 text-primary-600" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {content.title}
        </h2>
        <p className="text-primary-600 font-medium mb-4">
          {content.subtitle}
        </p>

        {/* Description */}
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {content.description}
        </p>

        {/* Tips */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Quick Tips:</p>
          <div className="space-y-3">
            {content.tips.map((tip, index) => (
              <div key={index} className="flex items-center text-left">
                <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center mr-3">
                  <tip.icon className="h-4 w-4 text-primary-600" />
                </div>
                <span className="text-sm text-gray-600">{tip.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ModalFooter>
        <Button
          variant="secondary"
          onClick={handleDismiss}
          disabled={loading}
        >
          Maybe Later
        </Button>
        <Button
          variant="primary"
          onClick={handleGetStarted}
          disabled={loading}
        >
          {loading ? 'Loading...' : content.primaryAction.label}
          {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
