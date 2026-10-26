import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DGrienHome from './pages/DGrienHome';
import DriverDashboard from './pages/DriverDashboard';
import Login from './pages/Login';
import Privacy from './pages/Privacy';
import { useAuth } from './context/AuthContext';
import { RideProvider } from './context/RideContext';
import { SocketProvider } from './context/SocketContext';
import NotificationToast from './components/NotificationToast';
import { ThemeProvider } from './context/ThemeContext';

function App() {
    console.log('🚗 DGrien: Launching Dedicated Driver & Fleet Operations System...');

    return (
        <ThemeProvider>
            <SocketProvider>
                <RideProvider>
                    <Router>
                        <div className="app-content-wrapper min-h-screen bg-[#070b12] text-white">
                            <Routes>
                                {/* Direct Driver & Fleet Hub */}
                                <Route path="/" element={<DGrienHome />} />
                                <Route path="/driver" element={<DGrienHome />} />
                                <Route path="/fleet" element={<DGrienHome />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/privacy" element={<Privacy />} />
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
