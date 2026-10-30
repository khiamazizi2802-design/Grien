import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ManagerPortalOverview from './pages/ManagerPortalOverview';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminProductHub from './components/AdminProductHub';
import MenuManagement from './pages/MenuManagement';
import SettlementHub from './pages/SettlementHub';
import StaffPermissions from './pages/StaffPermissions';
import Login from './pages/Login';
import Register from './pages/Register';
import { useAuth } from './context/AuthContext';
import { RideProvider } from './context/RideContext';
import { SocketProvider } from './context/SocketContext';
import NotificationToast from './components/NotificationToast';
import { ThemeProvider } from './context/ThemeContext';

function App() {
    console.log('🏢 Grien: Launching Dedicated Hotel & Stadium Manager Web Portal...');

    return (
        <ThemeProvider>
            <SocketProvider>
                <RideProvider>
                    <Router>
                        <div className="app-content-wrapper min-h-screen bg-[#060B12] text-white">
                            <Routes>
                                {/* Manager Portal Landing & Overview (Sent directly via email to Hotel & Stadium Directors) */}
                                <Route path="/" element={<ManagerPortalOverview />} />
                                <Route path="/overview" element={<ManagerPortalOverview />} />

                                {/* Live Manager Operations Hub */}
                                <Route path="/manager" element={<ManagerDashboard />} />
                                <Route path="/dashboard" element={<ManagerDashboard />} />
                                <Route path="/menu-management" element={<MenuManagement />} />
                                <Route path="/settlement" element={<SettlementHub />} />
                                <Route path="/staff-permissions" element={<StaffPermissions />} />

                                {/* Platform Director & Super Admin Console */}
                                <Route path="/admin" element={<AdminDashboard />} />
                                <Route path="/products" element={<AdminProductHub />} />
                                <Route path="/product-hub" element={<AdminProductHub />} />
                                <Route path="/shop-hub" element={<AdminProductHub />} />

                                {/* Authentication */}
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/signup" element={<Register />} />

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
