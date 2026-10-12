import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ roles }) => {
    const { user, loading, isVerified } = useAuth();
    const allowedRoles = roles;

    if (loading) {
        return <div className="min-h-screen bg-dark-950 flex items-center justify-center text-brand font-black animate-pulse">SYNCHRONIZING IDENTITY...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Identity Verification Check (Bypassed for now)
    // if (!isVerified) {
    //     return <Navigate to="/verify" replace />;
    // }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    // Force redirection to Green ID pending page if staff is not yet onboarded by a manager
    if (user.role === 'staff' && user.onboarded !== true) {
        return <Navigate to="/green-id-pending" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
