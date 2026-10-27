import React, { useState, useEffect } from 'react';
import { Car, Users } from 'lucide-react';
import DriverDashboard from './DriverDashboard';
import ManagerDashboard from './ManagerDashboard';
import { useAuth } from '../context/AuthContext';

export default function DGrienHome() {
    const { user } = useAuth();

    // Ermittle Rolle: Nur verifizierte Manager / Super-Admins dürfen auf das Flotten-Dashboard zugreifen
    const resolvedRole = (
        user?.role ||
        localStorage.getItem('green_role') ||
        sessionStorage.getItem('simulator_active_role') ||
        ''
    ).toLowerCase();

    const isManager = resolvedRole === 'manager' || resolvedRole === 'super_admin';

    // Manager starten standardmäßig in der Flotten-Ansicht, Fahrer strikt im Fahrer-Cockpit
    const [activeTab, setActiveTab] = useState(() => {
        return isManager ? 'fleet' : 'driver';
    });

    // Sicherheits-Check: Fahrer werden immer sofort auf das Fahrer-Cockpit fixiert
    useEffect(() => {
        if (!isManager && activeTab !== 'driver') {
            setActiveTab('driver');
        }
    }, [isManager, activeTab]);

    return (
        <div className="min-h-screen bg-[#070b12] text-white flex flex-col font-sans select-none relative">
            {/* Flotten-Umschalter: NUR für Manager sichtbar – niemals für Fahrer! */}
            {isManager && (
                <div className="fixed top-3 right-4 z-[9999]">
                    <button
                        onClick={() => setActiveTab(prev => prev === 'driver' ? 'fleet' : 'driver')}
                        className="px-3.5 py-1.5 rounded-xl bg-[#0b1320]/90 hover:bg-[#111c30] text-emerald-400 hover:text-white border border-emerald-500/30 hover:border-emerald-400/60 shadow-xl shadow-black/70 backdrop-blur-md flex items-center gap-1.5 text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
                        title={activeTab === 'driver' ? 'Zu Flotte wechseln' : 'Zu Fahrer wechseln'}
                    >
                        {activeTab === 'driver' ? (
                            <>
                                <Users className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Flotte</span>
                            </>
                        ) : (
                            <>
                                <Car className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Fahrer</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1">
                {activeTab === 'driver' || !isManager ? (
                    <DriverDashboard />
                ) : (
                    <ManagerDashboard />
                )}
            </main>
        </div>
    );
}
