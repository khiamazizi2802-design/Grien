import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';
import { RideProvider } from './context/RideContext';
import { SocketProvider } from './context/SocketContext';
import NotificationToast from './components/NotificationToast';
import { ThemeProvider } from './context/ThemeContext';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen bg-[#060B12] flex items-center justify-center text-brand font-black italic tracking-widest p-6 text-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
                    <span className="text-xs uppercase tracking-[0.3em] text-emerald-400">Authenticating Director Node...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function PublicRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return null;

    if (user) {
        return <Navigate to="/admin" replace />;
    }

    return children;
}

function App() {
    console.log('🛡️ Grien: Launching Dedicated Director Admin Portal...');

    return (
        <ThemeProvider>
            <SocketProvider>
                <RideProvider>
                    <Router>
                        <div className="app-content-wrapper">
                            <Routes>
                                <Route 
                                    path="/login" 
                                    element={
                                        <PublicRoute>
                                            <Login />
                                        </PublicRoute>
                                    } 
                                />
                                <Route 
                                    path="/admin" 
                                    element={
                                        <ProtectedRoute>
                                            <AdminDashboard />
                                        </ProtectedRoute>
                                    } 
                                />
                                <Route 
                                    path="/" 
                                    element={
                                        <ProtectedRoute>
                                            <AdminDashboard />
                                        </ProtectedRoute>
                                    } 
                                />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </div>
                        <NotificationToast />
                    </Router>
                </RideProvider>
            </SocketProvider>
        </ThemeProvider>
    );
}

export default App;
