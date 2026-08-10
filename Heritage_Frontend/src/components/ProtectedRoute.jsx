import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] bg-[#141618] text-[#EDE9DF]">
        <div className="relative w-16 h-16">
          {/* Outer elegant spinning border */}
          <div className="absolute inset-0 rounded-full border-4 border-t-[#1D9E75] border-r-transparent border-b-[#3D494F]/40 border-l-transparent animate-spin"></div>
          {/* Inner static branding dot */}
          <div className="absolute inset-4 rounded-full bg-[#1D9E75]/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#1D9E75] animate-pulse"></div>
          </div>
        </div>
        <p className="mt-6 font-sans text-xs font-medium uppercase tracking-widest text-[#C8B89A] animate-pulse">
          Verifying credentials...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
