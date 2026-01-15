import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Role-specific navigation links
  const getNavigationLinks = () => {
    if (!user) return [];

    switch (user.role) {
      case 'SYSTEM_ADMIN':
        return [
          { to: '/admin/dashboard', label: 'Dashboard' },
          { to: '/admin/users', label: 'Users' },
          { to: '/admin/stores', label: 'Stores' },
          { to: '/password-update', label: 'Change Password' },
        ];
      case 'NORMAL_USER':
        return [
          { to: '/stores', label: 'Browse Stores' },
          { to: '/password-update', label: 'Change Password' },
        ];
      case 'STORE_OWNER':
        return [
          { to: '/owner/dashboard', label: 'Dashboard' },
          { to: '/password-update', label: 'Change Password' },
        ];
      default:
        return [];
    }
  };

  const navigationLinks = getNavigationLinks();

  // Role badge color
  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case 'SYSTEM_ADMIN':
        return 'bg-blue-100 text-blue-800';
      case 'NORMAL_USER':
        return 'bg-green-100 text-green-800';
      case 'STORE_OWNER':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Role display name
  const getRoleDisplayName = () => {
    switch (user?.role) {
      case 'SYSTEM_ADMIN':
        return 'Admin';
      case 'NORMAL_USER':
        return 'User';
      case 'STORE_OWNER':
        return 'Owner';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo and role badge */}
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-800">Store Rating Platform</h1>
              {user && (
                <span className={`px-3 py-1 text-sm font-medium rounded ${getRoleBadgeColor()}`}>
                  {getRoleDisplayName()}
                </span>
              )}
            </div>

            {/* Center - Navigation links */}
            {navigationLinks.length > 0 && (
              <div className="hidden md:flex items-center space-x-1">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Right side - User info and logout */}
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 text-sm hidden sm:inline">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile navigation menu */}
          {navigationLinks.length > 0 && (
            <div className="md:hidden pb-3 pt-2 space-y-1">
              {navigationLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
