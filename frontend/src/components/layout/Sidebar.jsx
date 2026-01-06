import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardCheck,
  Building2,
  Users,
  Settings,
  LogOut,
  FileEdit,
  Activity,
  Brain,
  BarChart3,
  Upload,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Role hierarchy from lowest to highest access
const ROLE_HIERARCHY = [
  'clinical_resource',
  'facility_leader',
  'team_leader',
  'company_leader',
  'corporate',
  'admin'
];

// Check if user role meets minimum required role
const hasMinRole = (userRole, minRole) => {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole);
  const minIndex = ROLE_HIERARCHY.indexOf(minRole);
  return userIndex >= 0 && minIndex >= 0 && userIndex >= minIndex;
};

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, minRole: 'clinical_resource' },
  { name: 'Scorecards', href: '/scorecards', icon: ClipboardCheck, minRole: 'clinical_resource' },
  { name: 'Facilities', href: '/facilities', icon: Building2, minRole: 'clinical_resource' },
  { name: 'Survey Analytics', href: '/survey-analytics', icon: Activity, minRole: 'team_leader' },
  { name: 'Survey Intelligence', href: '/survey-intelligence', icon: Brain, end: true, minRole: 'facility_leader' },
  { name: 'Team Intelligence', href: '/survey-intelligence/team', icon: Users, minRole: 'team_leader' },
];

const adminNavigation = [
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Audit Template', href: '/admin/template', icon: FileEdit },
  { name: 'Historical Import', href: '/admin/import', icon: Upload },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const userRole = user?.role || 'clinical_resource';
  const filteredNavigation = navigation.filter(item => hasMinRole(userRole, item.minRole));
  // Both admin and corporate roles have access to admin pages
  const hasAdminAccess = user?.role === 'admin' || user?.role === 'corporate';

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 flex flex-col">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-800">
        <ClipboardCheck className="h-8 w-8 text-primary-500" />
        <span className="ml-2 text-xl font-bold text-white">SystemsCheck</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.name}
          </NavLink>
        ))}

        {hasAdminAccess && (
          <>
            <div className="pt-4 mt-4 border-t border-gray-800">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Admin
              </p>
            </div>
            {adminNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
              <span className="text-white font-medium">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            </div>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-400 truncate capitalize">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
          <button
            onClick={logout}
            className="ml-2 p-2 text-gray-400 hover:text-white transition-colors"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
