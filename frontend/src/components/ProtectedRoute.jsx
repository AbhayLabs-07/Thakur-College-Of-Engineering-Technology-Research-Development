import React from 'react';
import { Navigate } from 'react-router-dom';
import { authStorage } from '../utils/storage';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = authStorage.getItem('token');
  const role = authStorage.getItem('role');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
