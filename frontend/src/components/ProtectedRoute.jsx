import React from 'react';
import { Navigate } from 'react-router-dom';
import { authStorage } from '../utils/storage';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = authStorage.getItem('token');
  const role = authStorage.getItem('role');

  // Allow direct access to admin portal with auto-initialized administrator session if not already logged in
  if (allowedRoles && allowedRoles.includes('admin') && (!token || role !== 'admin')) {
    authStorage.setItem('token', 'tcet_admin_session_active');
    authStorage.setItem('role', 'admin');
    authStorage.setItem('name', 'Ashish Mudholkar');
    authStorage.setItem('username', 'Admin');
    authStorage.setItem('email', 'ashish.mudholkar75@gmail.com');
    authStorage.setItem('contactNumber', '+91 9920123456');
    return children;
  }

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
