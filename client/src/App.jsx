import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import GreenSPage from './pages/GreenSPage';
import GreenRidePage from './pages/GreenRidePage';
import DriverDashboard from './pages/DriverDashboard';
import ShieldAlertNotice from './components/ShieldAlertNotice';
import ManagerDashboard from './pages/ManagerDashboard';
import NightCrew from './pages/NightCrew';
import VenueMenuPage from './pages/VenueMenuPage';
import OrderTrackerPage from './pages/OrderTrackerPage';
import OrderReceiptPage from './pages/OrderReceiptPage';
import MissionControlPage from './pages/MissionControlPage';
import SettlementHub from './pages/SettlementHub';
import SafetySentinel from './pages/SafetySentinel';
import PartnerOnboarding from './pages/PartnerOnboarding';
import MenuManagement from './pages/MenuManagement';
import StaffPermissions from './pages/StaffPermissions';
import StaffOnboarding from './pages/StaffOnboarding';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Privacy from './pages/Privacy';
import VerificationGateway from './pages/VerificationGateway';
import PartnerDetailsPage from './pages/PartnerDetailsPage';
import DiscoveryGallery from './pages/DiscoveryGallery';
import FriendsListPage from './pages/FriendsListPage';
import UserProfilePage from './pages/UserProfilePage';
import MyProfilePage from './pages/MyProfilePage';
import EphemeralReceiptsPage from './pages/EphemeralReceiptsPage';
import LandingPage from './pages/LandingPage';
import SuspensionPage from './pages/SuspensionPage';
import ResolutionCenterPage from './pages/ResolutionCenterPage';
import SecurityRecovery from './pages/SecurityRecovery';
import UXLab from './pages/UXLab';
import StadiumBoxOffice from './pages/StadiumBoxOffice';
import PaymentHub from './pages/PaymentHub';
import RideHistoryHub from './pages/RideHistoryHub';
import AccountHub from './pages/AccountHub';
import FamilyHub from './pages/FamilyHub';
import MessagesPage from './pages/MessagesPage';
import GreenIdPendingPage from './pages/GreenIdPendingPage';
import { useAuth } from './context/AuthContext';
import { RideProvider } from './context/RideContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationToast from './components/NotificationToast';
import { ThemeProvider } from './context/ThemeContext';
import Bubbles from './components/Bubbles';

function App() {
    const { user } = useAuth();
    console.log('📱 Green: Launching Universal Engine...');

    const isBanned = user?.redFlags >= 3;

    return (
        <ThemeProvider>
            <SocketProvider>
                <RideProvider>
                <Router>
                    <Bubbles />
                    <div className="app-content-wrapper">
                        <Routes>
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route path="/privacy" element={<Privacy />} />
                            <Route path="/suspension" element={<SuspensionPage />} />
                            <Route path="/ux-lab" element={<UXLab />} />
                            
                            {/* New Verification Gate */}
                            <Route path="/verify" element={<VerificationGateway />} />
                            <Route path="/green-id-pending" element={<GreenIdPendingPage />} />
                            <Route path="/security-recovery" element={<SecurityRecovery />} />

                            {/* Ban Check Gate */}
                            {isBanned && (
                                <Route path="*" element={<Navigate to="/suspension" replace />} />
                            )}

                            {/* Passenger Routes */}
                            <Route element={<ProtectedRoute roles={['passenger']} />}>
                                <Route path="/home" element={<Home />} />
                                <Route path="/green-ride" element={<GreenRidePage />} />
                                <Route path="/greens" element={<DiscoveryGallery />} />
                                <Route path="/venue/menu" element={<VenueMenuPage />} />
                                <Route path="/partner/details" element={<PartnerDetailsPage />} />
                                <Route path="/discovery" element={<DiscoveryGallery />} />
                                <Route path="/stadium" element={<StadiumBoxOffice />} />
                                <Route path="/friends" element={<FriendsListPage />} />
                                <Route path="/profile/:id" element={<UserProfilePage />} />
                                <Route path="/my-profile" element={<MyProfilePage />} />
                                <Route path="/receipts/daily" element={<EphemeralReceiptsPage />} />
                                <Route path="/order/tracker" element={<OrderTrackerPage />} />
                                <Route path="/order/receipt" element={<OrderReceiptPage />} />
                                <Route path="/mission-control" element={<MissionControlPage />} />
                                <Route path="/safety/alert" element={<SafetySentinel />} />
                                <Route path="/payment/methods" element={<PaymentHub />} />
                                <Route path="/ride/history" element={<RideHistoryHub />} />
                                <Route path="/account/settings" element={<AccountHub />} />
                                <Route path="/family-hub" element={<FamilyHub />} />
                                <Route path="/messages" element={<MessagesPage />} />
                            </Route>

                            {/* Driver Routes */}
                            <Route element={<ProtectedRoute roles={['driver']} />}>
                                <Route path="/driver" element={<DriverDashboard />} />
                                <Route path="/ride" element={<GreenRidePage />} />
                            </Route>

                            {/* Manager Routes */}
                            <Route element={<ProtectedRoute roles={['manager', 'staff']} />}>
                                <Route path="/manager" element={<ManagerDashboard />} />
                                <Route path="/night-crew" element={<NightCrew />} />
                                <Route path="/history/settlement" element={<SettlementHub />} />
                                <Route path="/manager/onboarding" element={<PartnerOnboarding />} />
                                <Route path="/manager/menu-management" element={<MenuManagement />} />
                                <Route path="/manager/staff-permissions/:id" element={<StaffPermissions />} />
                                <Route path="/manager/onboarding-staff" element={<StaffOnboarding />} />
                                <Route path="/manager/resolution/:incidentId" element={<ResolutionCenterPage />} />
                            </Route>

                            {/* Super Admin Routes (Web Portal Only) */}
                            <Route element={<ProtectedRoute roles={['super_admin']} />}>
                                <Route path="/admin" element={<ShieldAlertNotice />} />
                            </Route>

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



