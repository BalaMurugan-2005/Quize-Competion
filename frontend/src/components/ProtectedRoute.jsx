import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020017]">
        <div className="relative w-20 h-20">
          <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
          <div className="absolute top-2 left-2 right-2 bottom-2 rounded-full border-4 border-pink-500 border-b-transparent animate-spin [animation-duration:1.5s]"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if user is not authenticated
    return <Navigate to={adminOnly ? "/admin/login" : "/login"} replace />;
  }

  if (adminOnly && !isAdmin) {
    // Redirect to normal student dashboard if user is not an admin
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
