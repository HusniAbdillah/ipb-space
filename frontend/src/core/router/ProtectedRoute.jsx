import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent shadow-md"></div>
        <p className="text-primary-container font-medium animate-pulse">Memverifikasi sesi...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const mapRole = (backendRole) => {
    if (backendRole === 'civitas') return 'Civitas';
    if (backendRole === 'facility_manager') return 'FacilityAdmin';
    if (backendRole === 'admin') return 'SuperAdmin';
    return backendRole;
  };

  const userRole = mapRole(user.role);

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole === 'SuperAdmin') {
      return <Navigate to="/admin/super/master-data" replace />;
    }
    if (userRole === 'FacilityAdmin') {
      return <Navigate to="/admin/facility/dashboard" replace />;
    }
    return <Navigate to="/civitas/dashboard" replace />;
  }

  return <Outlet />;
}
