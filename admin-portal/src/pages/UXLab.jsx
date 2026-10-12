import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Smartphone, Tablet, Monitor, ArrowLeft, RefreshCw,
    LayoutGrid, Maximize2, Sun, Moon, ChevronLeft, ChevronRight,
    User, Car, Building2, Users, ShieldCheck, Wifi, WifiOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

// ─── DATA ────────────────────────────────────────────────────────────────────

const ROLES = [
    {
        id: 'passenger',
        label: 'Passenger',
        sub: 'Ride-Hailing & Discovery',
        icon: User,
        path: '/home?role=passenger',
        color: '#34d399',
        colorDim: 'rgba(52,211,153,0.12)',
        colorBorder: 'rgba(52,211,153,0.25)',
    },
    {
        id: 'driver',
        label: 'Driver',
        sub: 'Mission Dispatch & Telemetry',
        icon: Car,
        path: '/driver?role=driver',
        color: '#fbbf24',
        colorDim: 'rgba(251,191,36,0.12)',
        colorBorder: 'rgba(251,191,36,0.25)',
    },
    {
        id: 'manager',
        label: 'Manager',
        sub: 'Fleet & Venue Orchestration',
        icon: Building2,
        path: '/manager?role=manager',
        color: '#a78bfa',
        colorDim: 'rgba(167,139,250,0.12)',
        colorBorder: 'rgba(167,139,250,0.25)',
    },
    {
        id: 'admin',
        label: 'Super Admin',
        sub: 'Global System Control',
        icon: ShieldCheck,
        path: '/admin?role=super_admin',
        color: '#f43f5e',
        colorDim: 'rgba(244,63,94,0.12)',
        colorBorder: 'rgba(244,63,94,0.25)',
    },
];

const DEVICES = [
    { id: 'phone',    label: 'Phone',    icon: Smartphone, w: 390,  h: 844,  scale: 0.52, borderRadius: '3rem',  border: 10, notch: true  },
    { id: 'tablet',   label: 'Tablet',   icon: Tablet,     w: 820,  h: 1024, scale: 0.38, borderRadius: '1.5rem',border: 14, notch: false },
    { id: 'computer', label: 'Computer', icon: Monitor,    w: 1280, h: 780,  scale: 0.38, borderRadius: '0.75rem',border: 8,  notch: false },
];

// ─── DEVICE FRAME ─────────────────────────────────────────────────────────────

function DeviceFrame({ device, src, iframeId, roleColor, onRefresh }) {
    const shell = {
        width:  device.w,
        height: device.h,
        transform: `scale(${device.scale})`,
        transformOrigin: 'top left',
        borderRadius: device.borderRadius,
        border: `${device.border}px solid #1e2535`,
        background: '#0d1117',
        boxShadow: '0 40px 80px rgba(0,0,0,0.7)',
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden',
        flexShrink: 0,
        transition: 'border-color 0.3s',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Device shell wrapper — fixed visual height */}
            <div style={{ position: 'relative', height: device.h * device.scale + 2, width: device.w * device.scale + 2, overflow: 'hidden' }}>
                <div style={shell}>
                    {/* Notch (phone only) */}
                    {device.notch && (
                        <div style={{
                            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                            width: 120, height: 32, background: '#0d1117',
                            borderBottomLeftRadius: 18, borderBottomRightRadius: 18,
                            zIndex: 20, pointerEvents: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <div style={{ width: 70, height: 20, background: '#000', borderRadius: 12 }} />
                        </div>
                    )}

                    {/* Desktop top bar */}
                    {device.id === 'computer' && (
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: 28,
                            background: '#0a0d14', zIndex: 20, display: 'flex',
                            alignItems: 'center', padding: '0 12px', gap: 6,
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                        }}>
                            {['#ff5f57','#febc2e','#28c840'].map((c,i) => (
                                <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                            ))}
                        </div>
                    )}

                    <iframe
                        id={iframeId}
                        src={src}
                        style={{
                            width: '100%', border: 'none',
                            marginTop: device.id === 'computer' ? 28 : 0,
                            height: device.id === 'computer' ? 'calc(100% - 28px)' : '100%',
                        }}
                        title={iframeId}
                    />

                    {/* Home indicator (phone) */}
                    {device.notch && (
                        <div style={{
                            position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
                            width: 130, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.2)',
                            zIndex: 20, pointerEvents: 'none',
                        }} />
                    )}
                </div>

                {/* Refresh button */}
                <button
                    onClick={onRefresh}
                    title="Reload"
                    style={{
                        position: 'absolute', top: 6, right: 6, zIndex: 30,
                        width: 26, height: 26, borderRadius: 8,
                        background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}
                >
                    <RefreshCw size={11} />
                </button>
            </div>

            {/* Desktop stand */}
            {device.id === 'computer' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -2 }}>
                    <div style={{
                        width: 60, height: 22, background: '#0d1117',
                        clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
                        borderLeft: '1px solid #1e2535', borderRight: '1px solid #1e2535',
                    }} />
                    <div style={{
                        width: 160, height: 8, borderRadius: 4,
                        background: '#0d1117', border: '1px solid #1e2535',
                    }} />
                </div>
            )}
        </div>
    );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const UXLab = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    const [sidebarOpen, setSidebarOpen]   = useState(true);
    const [viewMode, setViewMode]          = useState('multi'); // 'multi' | 'single'
    const [activeRole, setActiveRole]      = useState('passenger');
    const [activeDevice, setActiveDevice]  = useState('phone');
    const [filterRole, setFilterRole]      = useState('all'); // 'all' | roleId

    const role   = ROLES.find(r => r.id === activeRole) || ROLES[0];
    const device = DEVICES.find(d => d.id === activeDevice) || DEVICES[0];

    const singleUrl = `http://localhost:5173${role.path}`;

    const refresh = (id) => {
        const el = document.getElementById(id);
        if (el) {
            try {
                el.contentWindow.location.reload();
            } catch (e) {
                el.src = el.src;
            }
        }
    };

    const refreshAll = () => {
        ROLES.forEach(r => DEVICES.forEach(d => refresh(`iframe-${r.id}-${d.id}`)));
    };

    const refreshSingle = () => refresh('iframe-single');

    const visibleRoles = filterRole === 'all' ? ROLES : ROLES.filter(r => r.id === filterRole);

    return (
        <div style={{
            minHeight: '100vh', background: '#060911', color: '#f0f6fc',
            fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
            display: 'flex', overflow: 'hidden', position: 'relative',
        }}>

            {/* ── SIDEBAR ──────────────────────────────────────────── */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.aside
                        key="sidebar"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 220, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 200 }}
                        style={{
                            width: 220, flexShrink: 0, overflowY: 'auto', overflowX: 'hidden',
                            background: '#08090e', borderRight: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex', flexDirection: 'column', zIndex: 40,
                        }}
                        className="no-scrollbar"
                    >
                        {/* Logo */}
                        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <button
                                    onClick={() => navigate('/')}
                                    style={{
                                        width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', cursor: 'pointer', color: '#34d399', flexShrink: 0,
                                    }}
                                >
                                    <ArrowLeft size={13} />
                                </button>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.12em', color: '#fff', lineHeight: 1 }}>
                                        UX LAB LAUNCHER
                                    </div>
                                    <div style={{ fontSize: 8, color: '#34d399', letterSpacing: '0.08em', marginTop: 3, opacity: 0.8 }}>
                                        SHADOW IDENTITY PROTOCOL
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ flex: 1, padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 22 }}>

                            {/* 1. SELECT IDENTITY */}
                            <div>
                                <SideLabel n="1" text="SELECT SHADOW IDENTITY" />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
                                    {ROLES.map(r => {
                                        const Icon = r.icon;
                                        const active = activeRole === r.id;
                                        return (
                                            <button
                                                key={r.id}
                                                onClick={() => setActiveRole(r.id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 10,
                                                    padding: '9px 11px', borderRadius: 8, cursor: 'pointer',
                                                    background: active ? '#fff' : 'transparent',
                                                    border: active ? 'none' : '1px solid transparent',
                                                    color: active ? '#000' : 'rgba(255,255,255,0.45)',
                                                    transition: 'all 0.15s', textAlign: 'left', width: '100%',
                                                }}
                                                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                                                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                <Icon size={14} style={{ flexShrink: 0, opacity: active ? 1 : 0.6 }} />
                                                <div>
                                                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', lineHeight: 1 }}>
                                                        {r.label.toUpperCase()}
                                                    </div>
                                                    <div style={{ fontSize: 8, letterSpacing: '0.05em', opacity: 0.55, marginTop: 3, lineHeight: 1 }}>
                                                        {r.sub.toUpperCase()}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 2. SELECT TARGET DEVICE */}
                            <div>
                                <SideLabel n="2" text="SELECT TARGET DEVICE" />
                                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                                    {[...DEVICES, { id: 'multi', label: 'Multi', icon: LayoutGrid }].map(d => {
                                        const Icon = d.icon;
                                        const isMulti = d.id === 'multi';
                                        const active = isMulti ? viewMode === 'multi' : (viewMode === 'single' && activeDevice === d.id);
                                        return (
                                            <button
                                                key={d.id}
                                                onClick={() => {
                                                    if (isMulti) { setViewMode('multi'); }
                                                    else { setViewMode('single'); setActiveDevice(d.id); }
                                                }}
                                                title={d.label}
                                                style={{
                                                    flex: 1, padding: '8px 4px', borderRadius: 8,
                                                    background: active ? '#fff' : 'rgba(255,255,255,0.05)',
                                                    border: '1px solid ' + (active ? 'transparent' : 'rgba(255,255,255,0.07)'),
                                                    color: active ? '#000' : 'rgba(255,255,255,0.4)',
                                                    cursor: 'pointer', display: 'flex', flexDirection: 'column',
                                                    alignItems: 'center', gap: 4, transition: 'all 0.15s',
                                                }}
                                            >
                                                <Icon size={14} />
                                                <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.07em' }}>
                                                    {d.label.toUpperCase()}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 3. VISUAL ATMOSPHERE */}
                            <div>
                                <SideLabel n="3" text="VISUAL ATMOSPHERE" />
                                <button
                                    onClick={toggleTheme}
                                    style={{
                                        marginTop: 10, width: '100%', padding: '9px 11px',
                                        borderRadius: 8, background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.07)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        cursor: 'pointer', color: '#fff', transition: 'all 0.15s',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {theme === 'dark'
                                            ? <Moon size={13} style={{ color: '#34d399' }} />
                                            : <Sun size={13} style={{ color: '#fbbf24' }} />
                                        }
                                        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em' }}>
                                            {theme === 'dark' ? 'LIGHT MODE' : 'DARK MODE'}
                                        </span>
                                    </div>
                                    {/* Toggle pill */}
                                    <div style={{
                                        width: 30, height: 16, borderRadius: 8,
                                        background: theme === 'dark' ? 'rgba(255,255,255,0.15)' : '#34d399',
                                        position: 'relative', transition: 'background 0.3s',
                                    }}>
                                        <div style={{
                                            width: 12, height: 12, borderRadius: '50%', background: '#fff',
                                            position: 'absolute', top: 2,
                                            left: theme === 'dark' ? 2 : 16,
                                            transition: 'left 0.3s',
                                        }} />
                                    </div>
                                </button>
                            </div>

                            {/* 4. TACTICAL NETWORK */}
                            <div>
                                <SideLabel n="4" text="TACTICAL NETWORK" />
                                <div style={{
                                    marginTop: 10, padding: '10px 11px', borderRadius: 8,
                                    background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                }}>
                                    <div style={{
                                        width: 7, height: 7, borderRadius: '50%', background: '#34d399',
                                        boxShadow: '0 0 8px #34d399', animation: 'pulse 1.5s infinite',
                                    }} />
                                    <div>
                                        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', color: '#34d399' }}>
                                            LIVE_LOCALHOST:5173
                                        </div>
                                        <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em', marginTop: 2 }}>
                                            WEBSOCKET ACTIVE
                                        </div>
                                    </div>
                                </div>

                                {/* Refresh all */}
                                <button
                                    onClick={viewMode === 'multi' ? refreshAll : refreshSingle}
                                    style={{
                                        marginTop: 8, width: '100%', padding: '8px',
                                        borderRadius: 8, background: 'transparent',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        gap: 6, fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(52,211,153,0.4)'; e.currentTarget.style.color = '#34d399'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
                                >
                                    <RefreshCw size={11} /> RELOAD ALL FRAMES
                                </button>
                            </div>

                            {/* 5. FILTER (multi only) */}
                            {viewMode === 'multi' && (
                                <div>
                                    <SideLabel n="5" text="FOCUS ROLE" />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 10 }}>
                                        {[{ id: 'all', label: 'All Roles' }, ...ROLES].map(r => (
                                            <button
                                                key={r.id}
                                                onClick={() => setFilterRole(r.id)}
                                                style={{
                                                    padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
                                                    background: filterRole === r.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                                                    border: 'none', color: filterRole === r.id ? '#fff' : 'rgba(255,255,255,0.35)',
                                                    fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
                                                    textAlign: 'left', width: '100%', display: 'flex', alignItems: 'center', gap: 6,
                                                    transition: 'all 0.15s',
                                                }}
                                            >
                                                {r.id !== 'all' && (
                                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                                                )}
                                                {(r.label || r.id).toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.05)',
                            fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <span>UX LAB v3.0</span>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'pulse 1.5s infinite' }} />
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* ── SIDEBAR TOGGLE ─────────────────────────────────── */}
            <button
                onClick={() => setSidebarOpen(p => !p)}
                style={{
                    position: 'fixed', top: '50%', transform: 'translateY(-50%)',
                    left: sidebarOpen ? 220 : 0, zIndex: 50,
                    width: 18, height: 48, borderRadius: '0 6px 6px 0',
                    background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)',
                    borderLeft: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'left 0.35s',
                }}
            >
                {sidebarOpen ? <ChevronLeft size={11} /> : <ChevronRight size={11} />}
            </button>

            {/* ── MAIN STAGE ─────────────────────────────────────── */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#060911' }}>

                {/* Top bar */}
                <div style={{
                    height: 44, borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 24px', background: 'rgba(8,9,14,0.8)', backdropFilter: 'blur(12px)',
                    flexShrink: 0,
                }}>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)' }}>
                        TACTICAL FIELD VIEW // LIVE TELEMETRY
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '4px 12px', borderRadius: 20,
                            background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
                        }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
                            <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.12em', color: '#34d399' }}>
                                ACTIVE IDENTITY: LIVE_{activeRole.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stage */}
                <div style={{ flex: 1, overflow: 'auto', padding: '32px 32px 48px' }} className="no-scrollbar">

                    {viewMode === 'multi' ? (
                        /* ── MULTI VIEW: 4 roles × 3 devices ── */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
                            {visibleRoles.map(r => (
                                <div key={r.id}>
                                    {/* Role header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 6,
                                            padding: '4px 12px', borderRadius: 6, fontSize: 8,
                                            fontWeight: 900, letterSpacing: '0.15em',
                                            background: r.colorDim, border: `1px solid ${r.colorBorder}`,
                                            color: r.color,
                                        }}>
                                            ● {r.id.toUpperCase()}
                                        </div>
                                        <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: '-0.02em', color: r.color }}>
                                            {r.label}
                                        </span>
                                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
                                            — {r.sub.toUpperCase()}
                                        </span>
                                        <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(255,255,255,0.06), transparent)' }} />
                                    </div>

                                    {/* 3 device frames */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 40, overflowX: 'auto', paddingBottom: 8 }} className="no-scrollbar">
                                        {DEVICES.map(d => (
                                            <div key={d.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                                {/* Device label */}
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    width: d.w * d.scale, marginBottom: 12,
                                                }}>
                                                    <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>
                                                        {d.id === 'phone' ? '📱' : d.id === 'tablet' ? '📲' : '🖥️'} {d.label.toUpperCase()}
                                                    </span>
                                                    <span style={{
                                                        fontSize: 7, padding: '2px 7px', borderRadius: 4,
                                                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                                                        color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace',
                                                    }}>
                                                        {d.w}×{d.h}
                                                    </span>
                                                </div>

                                                <DeviceFrame
                                                    device={d}
                                                    src={`http://localhost:5173${r.path}`}
                                                    iframeId={`iframe-${r.id}-${d.id}`}
                                                    roleColor={r.color}
                                                    onRefresh={() => refresh(`iframe-${r.id}-${d.id}`)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* ── SINGLE VIEW ── */
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
                            {/* Role + device info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    padding: '4px 14px', borderRadius: 6, fontSize: 9, fontWeight: 900,
                                    letterSpacing: '0.15em', background: role.colorDim,
                                    border: `1px solid ${role.colorBorder}`, color: role.color,
                                }}>
                                    {role.label.toUpperCase()}
                                </div>
                                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em' }}>
                                    {device.label.toUpperCase()} — {device.w}×{device.h}
                                </span>
                            </div>

                            <DeviceFrame
                                device={device}
                                src={singleUrl}
                                iframeId="iframe-single"
                                roleColor={role.color}
                                onRefresh={refreshSingle}
                            />

                            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', textAlign: 'center' }}>
                                ROLE_{role.id.toUpperCase()} // {device.label.toUpperCase()} // {device.w}×{device.h}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50%       { opacity: 0.5; transform: scale(0.7); }
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

// ─── SIDEBAR LABEL ────────────────────────────────────────────────────────────
function SideLabel({ n, text }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 8, fontWeight: 900, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>{n}.</span>
            <span style={{ fontSize: 8, fontWeight: 900, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em' }}>{text}</span>
        </div>
    );
}

export default UXLab;
