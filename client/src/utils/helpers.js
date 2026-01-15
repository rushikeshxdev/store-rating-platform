// Helper functions for the application

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getRoleDisplayName = (role) => {
  const roleMap = {
    SYSTEM_ADMIN: 'System Administrator',
    NORMAL_USER: 'Normal User',
    STORE_OWNER: 'Store Owner',
  };
  return roleMap[role] || role;
};

export const getDefaultRedirectPath = (role) => {
  switch (role) {
    case 'SYSTEM_ADMIN':
      return '/admin/dashboard';
    case 'NORMAL_USER':
      return '/stores';
    case 'STORE_OWNER':
      return '/owner/dashboard';
    default:
      return '/login';
  }
};
