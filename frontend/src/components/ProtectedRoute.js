import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getUserType } from '@/utils/auth';

export default function ProtectedRoute({ children, requiredRole }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const userType = getUserType();
  if (requiredRole && userType !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}