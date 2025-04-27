import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Show a loading indicator while checking auth status
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading authentication status...
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if route requires specific roles
  if (roles && roles.length > 0 && !roles.includes(user?.role)) {
    // Redirect to an unauthorized page or dashboard if role doesn't match
    // For now, redirecting to dashboard might be okay, or create a specific Unauthorized page
    console.warn(`User role (${user?.role}) does not have access to this route. Required: ${roles.join(', ')}`);
    return <Navigate to="/" replace />; // Or to an "/unauthorized" page
  }

  return children; // Render the child component if authenticated and authorized
};

export default ProtectedRoute; 