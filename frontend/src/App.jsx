import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PostHogProvider } from './analytics';
import { Login } from './pages/auth/Login';
import { NotFound } from './pages/NotFound';
import { Dashboard } from './pages/dashboard/Dashboard';
import { FacilityList } from './pages/facilities/FacilityList';
import { FacilityDetail } from './pages/facilities/FacilityDetail';

// Lazy-loaded pages for code splitting
const ScorecardsList = lazy(() => import('./pages/scorecards/ScorecardsList').then(m => ({ default: m.ScorecardsList })));
const ScorecardForm = lazy(() => import('./pages/scorecards/ScorecardForm').then(m => ({ default: m.ScorecardForm })));
const ScorecardView = lazy(() => import('./pages/scorecards/ScorecardView').then(m => ({ default: m.ScorecardView })));
const TeamComparison = lazy(() => import('./pages/reports/TeamComparison').then(m => ({ default: m.TeamComparison })));
const CompanyComparison = lazy(() => import('./pages/reports/CompanyComparison').then(m => ({ default: m.CompanyComparison })));
const FacilityComparison = lazy(() => import('./pages/reports/FacilityComparison').then(m => ({ default: m.FacilityComparison })));
const SystemAnalysis = lazy(() => import('./pages/reports/SystemAnalysis').then(m => ({ default: m.SystemAnalysis })));
const SurveyAnalytics = lazy(() => import('./pages/survey-analytics/SurveyAnalytics').then(m => ({ default: m.SurveyAnalytics })));
const FacilityIntelligence = lazy(() => import('./pages/survey-intelligence/FacilityIntelligence').then(m => ({ default: m.FacilityIntelligence })));
const TeamIntelligence = lazy(() => import('./pages/survey-intelligence/TeamIntelligence'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement').then(m => ({ default: m.UserManagement })));
const OrganizationManagement = lazy(() => import('./pages/admin/OrganizationManagement').then(m => ({ default: m.OrganizationManagement })));
const Settings = lazy(() => import('./pages/admin/Settings'));
const UserProfile = lazy(() => import('./pages/profile/UserProfile'));
const HistoricalImport = lazy(() => import('./pages/admin/HistoricalImport').then(m => ({ default: m.HistoricalImport })));
const TemplateEditor = lazy(() => import('./pages/admin/TemplateEditor'));
const AnalyticsDashboard = lazy(() => import('./pages/admin/AnalyticsDashboard'));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <PostHogProvider>
          <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes with layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/scorecards" element={<Suspense fallback={<PageLoader />}><ScorecardsList /></Suspense>} />
            <Route path="/scorecards/:id" element={<Suspense fallback={<PageLoader />}><ScorecardView /></Suspense>} />
            <Route path="/scorecards/:id/edit" element={<Suspense fallback={<PageLoader />}><ScorecardForm /></Suspense>} />
            <Route path="/facilities" element={<FacilityList />} />
            <Route path="/facilities/:id" element={<FacilityDetail />} />
            <Route path="/facilities/:facilityId/scorecards/new" element={<Suspense fallback={<PageLoader />}><ScorecardForm /></Suspense>} />
            <Route path="/reports/teams" element={<Suspense fallback={<PageLoader />}><TeamComparison /></Suspense>} />
            <Route path="/reports/companies" element={<Suspense fallback={<PageLoader />}><CompanyComparison /></Suspense>} />
            <Route path="/reports/facilities" element={<Suspense fallback={<PageLoader />}><FacilityComparison /></Suspense>} />
            <Route path="/reports/systems" element={<Suspense fallback={<PageLoader />}><SystemAnalysis /></Suspense>} />
            <Route path="/survey-analytics" element={<Suspense fallback={<PageLoader />}><SurveyAnalytics /></Suspense>} />
            <Route path="/survey-intelligence" element={<Suspense fallback={<PageLoader />}><FacilityIntelligence /></Suspense>} />
            <Route path="/survey-intelligence/team" element={<Suspense fallback={<PageLoader />}><TeamIntelligence /></Suspense>} />
            <Route path="/profile" element={<Suspense fallback={<PageLoader />}><UserProfile /></Suspense>} />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<PageLoader />}><UserManagement /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/organization"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<PageLoader />}><OrganizationManagement /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<PageLoader />}><Settings /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/import"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<PageLoader />}><HistoricalImport /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/template"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<PageLoader />}><TemplateEditor /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<PageLoader />}><AnalyticsDashboard /></Suspense>
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
            </PostHogProvider>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

// Placeholder component for pages not yet implemented
function PlaceholderPage({ title }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="text-gray-500 mt-2">This page is coming soon.</p>
      </div>
    </div>
  );
}

export default App;
