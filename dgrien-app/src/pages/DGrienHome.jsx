import React, { useState } from 'react';
import { Car, Users } from 'lucide-react';
import DriverDashboard from './DriverDashboard';
import ManagerDashboard from './ManagerDashboard';

export default function DGrienHome() {
    const [activeTab, setActiveTab] = useState('driver'); // 'driver' | 'fleet'

    return (
        <div className="min-h-screen bg-[#070b12] text-white flex flex-col font-sans select-none relative">
            {/* Compact Floating Role Button (Top-Right) */}
            <div className="fixed top-3 right-4 z-[9999]">
                <button
                    onClick={() => setActiveTab(activeTab === 'driver' ? 'fleet' : 'driver')}
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

            {/* Main Content Area */}
            <main className="flex-1">
                {activeTab === 'driver' ? (
                    <DriverDashboard />
                ) : (
                    <ManagerDashboard />
                )}
            </main>
        </div>
    );
}
