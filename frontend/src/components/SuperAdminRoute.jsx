import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/* Frontend convenience guard for the /super-admin area. The backend
   independently enforces the role on every API call — this only
   avoids rendering pages the user cannot use. */
function SuperAdminRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (user?.role !== 'super_admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

export default SuperAdminRoute;
