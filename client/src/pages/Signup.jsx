import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, ShieldCheck, Car, Mail, Lock, ChevronRight, Handshake, Upload, MapPin, Box, Phone, Search, ArrowLeft, Key, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Signup = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') || 'passenger';
    const inviteEmail = searchParams.get('invite');
    
    // Define available roles based on mode (restrict to staff/driver if invited)
    const availableRoles = mode === 'partner' 
        ? (inviteEmail ? ['driver'] : ['driver', 'manager']) 
        : ['passenger'];
    
    const [role, setRole] = useState(availableRoles[0]);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        zip: '',
        phone: '',
        email: '',
        password: '',
        age: '',
        businessType: 'FM',
        driverCode: ''
    });
    const [profilePic, setProfilePic] = useState(null);
    const [companySearch, setCompanySearch] = useState('');
    const [showCompanyResults, setShowCompanyResults] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');
    const [showCategoryResults, setShowCategoryResults] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(true);
    const [signupError, setSignupError] = useState('');
    const [matchedDriver, setMatchedDriver] = useState(null);
    const [driverCodeError, setDriverCodeError] = useState('');

    const businessCategories = [
        { id: 'FM', label: 'Fleet' },
        { id: 'HM', label: 'Hotel' },
        { id: 'SM', label: 'Stadium' },
    ];

    const verifiedCompanies = [
        { id: 'HM', name: 'Grien Palace & Spa', industry: 'Hotel' },
        { id: 'FM', name: 'Grien Fleet Ops', industry: 'Logistics' },
        { id: 'SM', name: 'Grien Stadium Arena', industry: 'Events' }
    ];

    const filteredCompanies = verifiedCompanies.filter(c => 
        c.name.toLowerCase().includes(companySearch.toLowerCase())
    );

    // Helper to retrieve all drivers across all fleet managers (defaults + saved in localStorage)
    const getAllFleetDrivers = () => {
        const defaultDrivers = [
            {
                id: 'drv_1',
                name: 'Sami Rahimi',
                phone: '+49 176 8829 1029',
                email: 'sami.rahimi@green-fleet.de',
                licenseNumber: 'B0892019382',
                vehicleAssigned: 'Tesla Model S Plaid (F-GR 777E)',
                status: 'Aktiv',
                approvalStatus: 'Approved',
                accessCode: 'DRV-7771-FM',
                managerName: 'Grien Fleet Ops',
                managerEmail: 'manager@green.de',
                managerKey: 'manager_green_de'
            },
            {
                id: 'drv_2',
                name: 'Darius Meier',
                phone: '+49 172 4432 9911',
                email: 'darius.m@green-fleet.de',
                licenseNumber: 'B0441920311',
                vehicleAssigned: 'Mercedes-Benz EQS (F-GR 888E)',
                status: 'Aktiv',
                approvalStatus: 'Approved',
                accessCode: 'DRV-8882-FM',
                managerName: 'Grien Fleet Ops',
                managerEmail: 'manager@green.de',
                managerKey: 'manager_green_de'
            },
            {
                id: 'drv_3',
                name: 'Elena Rostova',
                phone: '+49 151 8877 6655',
                email: 'elena.r@green-fleet.de',
                licenseNumber: 'B0993021948',
                vehicleAssigned: 'Porsche Taycan (F-GR 999E)',
                status: 'Pause',
                approvalStatus: 'Approved',
                accessCode: 'DRV-9993-FM',
                managerName: 'Grien Fleet Ops',
                managerEmail: 'manager@green.de',
                managerKey: 'manager_green_de'
            }
        ];

        let foundDrivers = [...defaultDrivers];

        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('green_fleet_drivers_')) {
                    const managerKey = key.replace('green_fleet_drivers_', '');
                    const raw = localStorage.getItem(key);
                    if (raw) {
                        try {
                            const parsed = JSON.parse(raw);
                            if (Array.isArray(parsed)) {
                                parsed.forEach(d => {
                                    if (d.accessCode) {
                                        const exists = foundDrivers.some(ex => ex.accessCode && ex.accessCode.toUpperCase() === d.accessCode.toUpperCase());
                                        if (!exists) {
                                            foundDrivers.push({
                                                ...d,
                                                managerKey,
                                                managerEmail: d.managerEmail || managerKey.replace(/_/g, '.'),
                                                managerName: d.managerName || 'Grien Fleet Ops'
                                            });
                                        }
                                    }
                                });
                            }
                        } catch (e) {}
                    }
                }
            }
        } catch (e) {}

        return foundDrivers;
    };

    const allDrivers = getAllFleetDrivers();
    const enteredEmail = formData.email.trim().toLowerCase();
    const enteredPhone = formData.phone.trim().replace(/\s+/g, '');
    const hasEnteredContact = enteredEmail.length > 3 || enteredPhone.length > 5;

    // Check if this driver was pre-registered/uploaded by a fleet manager
    const registeredDriverFound = allDrivers.find(d => 
        (enteredEmail && d.email && d.email.toLowerCase() === enteredEmail) ||
        (enteredPhone && d.phone && d.phone.replace(/\s+/g, '') === enteredPhone)
    );

    const isCodeVerified = Boolean(matchedDriver);
    // If contact info has been typed, and driver is NOT found in any manager fleet and code is not verified -> BLINK INFO!
    const isNotRegistered = role === 'driver' && hasEnteredContact && !registeredDriverFound && !isCodeVerified;
    // If driver was found in system by email or phone:
    const isFoundInSystem = role === 'driver' && Boolean(registeredDriverFound);

    const handleDriverCodeChange = (val) => {
        const codeUpper = val.toUpperCase().trim();
        setFormData(prev => ({ ...prev, driverCode: codeUpper }));

        if (!codeUpper) {
            setMatchedDriver(null);
            setDriverCodeError('');
            return;
        }

        const found = allDrivers.find(d => d.accessCode && d.accessCode.toUpperCase() === codeUpper);
        if (found) {
            setMatchedDriver(found);
            setDriverCodeError('');
            if (!formData.name && found.name) {
                setFormData(prev => ({ ...prev, name: found.name }));
            }
        } else {
            setMatchedDriver(null);
            if (codeUpper.length >= 7) {
                setDriverCodeError('Code nicht gefunden. Bitte frage deinen Flotten-Manager.');
            } else {
                setDriverCodeError('');
            }
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setSignupError('');

        // Map UI roles to auth database roles
        let finalRole = role;

        if (finalRole === 'driver') {
            if (!formData.driverCode) {
                setSignupError('Bitte gib den Flotten-Manager Code ein, den du von deinem Manager erhalten hast.');
                return;
            }
            if (!matchedDriver) {
                setSignupError('Der eingegebene Flotten-Manager Code ist ungültig oder existiert nicht im System.');
                return;
            }
        }

        const newUserData = {
            name: formData.name,
            email: formData.email,
            password: formData.password || 'green2026',
            role: finalRole,
            address: formData.address,
            zip: formData.zip,
            phone: formData.phone,
            age: finalRole === 'passenger' ? formData.age : null,
            businessType: finalRole === 'manager' ? formData.businessType : null,
            invitedByManager: matchedDriver ? (matchedDriver.managerEmail || matchedDriver.managerKey) : (inviteEmail || null),
            driverCode: formData.driverCode || null,
            managerId: matchedDriver ? (matchedDriver.managerEmail || matchedDriver.managerKey) : null,
            managerKey: matchedDriver ? (matchedDriver.managerKey || 'manager_green_de') : null,
            businessName: matchedDriver ? (matchedDriver.managerName || 'Grien Fleet Ops') : null,
            fleetCode: formData.driverCode || null,
            onboarded: true,
            gdprAccepted: true,
            gdprAcceptedAt: new Date().toISOString()
        };

        try {
            const res = await register(newUserData);
            if (!res.success) {
                setSignupError(res.message);
                return;
            }

            // Exclusively link driver to this fleet manager's dashboard
            if (finalRole === 'driver' && matchedDriver) {
                try {
                    const mgrKey = matchedDriver.managerKey || 'manager_green_de';
                    const storageKey = `green_fleet_drivers_${mgrKey}`;
                    const raw = localStorage.getItem(storageKey);
                    let currentDrivers = raw ? JSON.parse(raw) : [];
                    const idx = currentDrivers.findIndex(d => d.accessCode && d.accessCode.toUpperCase() === formData.driverCode.toUpperCase());
                    if (idx !== -1) {
                        currentDrivers[idx] = {
                            ...currentDrivers[idx],
                            name: formData.name || currentDrivers[idx].name,
                            email: formData.email.toLowerCase(),
                            phone: formData.phone || currentDrivers[idx].phone,
                            status: 'Aktiv',
                            registeredAt: new Date().toISOString()
                        };
                    } else {
                        currentDrivers.push({
                            id: `drv_${Date.now()}`,
                            name: formData.name,
                            email: formData.email.toLowerCase(),
                            phone: formData.phone,
                            status: 'Aktiv',
                            approvalStatus: 'Approved',
                            accessCode: formData.driverCode,
                            vehicleAssigned: matchedDriver.vehicleAssigned || 'Flottenfahrzeug zugewiesen',
                            rating: 5.0,
                            tripsCompleted: 0
                        });
                    }
                    localStorage.setItem(storageKey, JSON.stringify(currentDrivers));
                } catch (err) {
                    console.error("Failed to update manager fleet list:", err);
                }
            }

            if (finalRole === 'manager') {
                navigate('/manager');
            } else if (finalRole === 'driver') {
                navigate('/driver');
            } else {
                navigate('/home');
            }
        } catch (err) {
            console.error('Signup error:', err);
            setSignupError('Registration failed. Please check network connectivity.');
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 font-sans text-[var(--text-primary)] relative overflow-hidden">
            {/* Cosmic Overlays */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-mid/10 blur-[120px] rounded-full" />
            </div>

            <button 
                onClick={() => navigate('/')}
                className="absolute top-8 left-8 w-12 h-12 bg-[var(--bg-secondary)]/50 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-brand z-[100] hover:scale-110 transition-all shadow-2xl"
            >
                <ArrowLeft size={24} />
            </button>

            <div className="w-full max-w-lg relative z-10 bg-[var(--bg-secondary)]/50 backdrop-blur-2xl border border-white/5 p-8 md:p-10 rounded-[40px] shadow-2xl">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-black tracking-tighter italic uppercase mb-2" style={{ color: 'var(--text-primary)' }}>Create <span className="text-brand">Account</span></h1>
                    <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-[11px] md:text-sm lg:text-base">Become a Grien Member</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-5">
                    {inviteEmail && (
                        <div className="p-4 bg-brand/10 border border-brand/20 rounded-2xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-brand flex items-center gap-2">
                            <Handshake size={14} className="shrink-0" /> Joining Fleet of {inviteEmail}
                        </div>
                    )}
                    {/* Role Selection (Only shown if multiple roles are available) */}
                    {availableRoles.length > 1 && (
                        <div className="space-y-4 mb-6">
                            <div className="flex bg-[var(--bg-tertiary)]/50 p-1.5 rounded-2xl">
                                {availableRoles.map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRole(r)}
                                        className={`flex-1 py-3 rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest transition-all ${role === r ? 'bg-brand text-dark-950 shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                            {role === 'driver' ? (
                                <div 
                                    className={`p-4 rounded-2xl border text-center transition-all duration-300 mt-2 ${
                                        isCodeVerified 
                                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                            : isNotRegistered 
                                                ? 'bg-red-500/15 border-red-500 text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.4)] animate-pulse'
                                                : isFoundInSystem
                                                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        {isCodeVerified ? (
                                            <CheckCircle2 size={16} className="text-emerald-400" />
                                        ) : isNotRegistered ? (
                                            <AlertTriangle size={16} className="text-red-400 animate-bounce" />
                                        ) : (
                                            <Key size={16} className="text-amber-400" />
                                        )}
                                        <span className="text-[10px] md:text-xs font-black uppercase tracking-wider">
                                            {isCodeVerified 
                                                ? 'Flotte Verifiziert'
                                                : isNotRegistered 
                                                    ? '⚠️ Noch nicht vom Flotten-Manager erfasst!' 
                                                    : isFoundInSystem
                                                        ? '✓ Fahrerprofil im System gefunden'
                                                        : 'Flotten-Code erforderlich'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] md:text-xs font-bold leading-relaxed">
                                        {isCodeVerified 
                                            ? `Erfolgreich mit Flotten-Manager "${matchedDriver?.managerName || 'Grien Fleet'}" verknüpft. Dein Account wird exklusiv diesem Dashboard zugeordnet.`
                                            : isNotRegistered
                                                ? 'Für deine E-Mail/Nummer liegt noch keine Freischaltung vor! Bitte verlange den Code von deinem Flotten-Manager und warte, bis er dich im Dashboard hochlädt.'
                                                : isFoundInSystem
                                                    ? 'Dein Flotten-Manager hat dich im System erfasst! Bitte gib jetzt unten deinen persönlichen Flotten-Code ein.'
                                                    : 'Du benötigst einen Code von deinem Flotten-Manager. Bitte verlange den Code von deinem Manager und warte, bis er deine Dokumente hochlädt.'}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-[9px] md:text-[11px] lg:text-xs font-black text-brand/80 uppercase tracking-widest text-center italic">
                                    💡 Note: To become a B2B partner, please use a separate email address from your customer account.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Profile Pic Upload Simulation */}
                    <div className="flex justify-center mb-8">
                        <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center group-hover:border-brand/40 transition-all overflow-hidden">
                                {profilePic ? <img src={profilePic} alt="Profile" className="w-full h-full object-cover" /> : <User size={32} className="text-gray-600 group-hover:text-brand" />}
                            </div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 bg-brand rounded-full flex items-center justify-center text-dark-950 shadow-lg">
                                <Upload size={14} />
                            </div>
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setProfilePic(URL.createObjectURL(e.target.files[0]))} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="text"
                                placeholder="Full Name"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand/40 text-sm font-bold text-[var(--text-primary)] placeholder:text-gray-400/60 transition-colors"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="email"
                                placeholder="Email Address"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand/40 text-sm font-bold text-[var(--text-primary)] placeholder:text-gray-400/60 transition-colors"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div className="relative md:col-span-2">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="text"
                                placeholder={role === 'passenger' ? "Persönliche Adresse (Optional)" : "Geschäftsadresse (Optional)"}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand/40 text-sm font-bold text-[var(--text-primary)] placeholder:text-gray-400/60 transition-colors"
                                
                                value={formData.address}
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                            />
                        </div>
                        <div className="relative">
                            <Box className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="text"
                                placeholder={role === 'passenger' ? "PLZ (Optional)" : "PLZ (Optional)"}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand/40 text-sm font-bold text-[var(--text-primary)] placeholder:text-gray-400/60 transition-colors"
                                
                                value={formData.zip}
                                onChange={(e) => setFormData({...formData, zip: e.target.value})}
                            />
                        </div>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="tel"
                                placeholder="Phone Number (Optional)"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand/40 text-sm font-bold text-[var(--text-primary)] placeholder:text-gray-400/60 transition-colors"
                                
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>

                        <div className="relative md:col-span-2">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="password"
                                placeholder="Account Password"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand/40 text-sm font-bold text-[var(--text-primary)] placeholder:text-gray-400/60 transition-colors"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                    </div>

                    {role === 'manager' && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'FM', label: 'Fleet' },
                                    { id: 'HM', label: 'Hotel' },
                                    { id: 'SM', label: 'Stadium' },
                                ].map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setFormData({...formData, businessType: type.id})}
                                        className={`p-4 rounded-2xl border text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest transition-all ${formData.businessType === type.id ? 'bg-brand/10 border-brand text-brand shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'bg-white/5 border-white/5 text-[var(--text-muted)] hover:border-white/10'}`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6 bg-brand/5 border border-brand/20 rounded-[2.5rem] relative mt-4 shadow-xl">
                                <div className="absolute -top-3 left-8 px-3 py-1 bg-brand text-black rounded-full text-[7px] font-black uppercase tracking-widest shadow-lg">Network Protocol 🛰️</div>
                                <p className="text-[11px] md:text-sm lg:text-base font-black italic text-brand leading-relaxed">Partner Onboarding Active</p>
                                <p className="text-[9px] md:text-[11px] lg:text-xs text-[var(--text-muted)] mt-1 font-bold">Full business licensing and venue registration will be finalized in the Partner Dashboard.</p>
                            </div>
                        </div>
                    )}

                    {/* Driver Flotten-Manager Code Input */}
                    {role === 'driver' && (
                        <div className="space-y-2 p-5 bg-[var(--bg-tertiary)]/40 border border-white/10 rounded-[2rem]">
                            <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <Key size={14} className={isCodeVerified ? 'text-emerald-400' : 'text-brand'} /> Flotten-Manager Code
                                </span>
                                {isCodeVerified && (
                                    <span className="text-emerald-400 font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                                        <CheckCircle2 size={12} /> Exklusiv verknüpft
                                    </span>
                                )}
                            </label>
                            
                            <div className="relative">
                                <Key className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isCodeVerified ? 'text-emerald-400' : 'text-gray-500'}`} size={18} />
                                <input
                                    type="text"
                                    placeholder="z.B. DRV-7771-FM"
                                    className={`w-full bg-white/5 border rounded-2xl py-4 pl-12 pr-4 font-mono font-black text-sm tracking-widest uppercase focus:outline-none transition-all ${
                                        isCodeVerified 
                                            ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                                            : driverCodeError 
                                                ? 'border-red-500/60 bg-red-500/10 text-red-300'
                                                : 'border-white/10 text-[var(--text-primary)] focus:border-brand/40'
                                    }`}
                                    value={formData.driverCode}
                                    onChange={(e) => handleDriverCodeChange(e.target.value)}
                                    required
                                />
                            </div>

                            {isCodeVerified ? (
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-[10px] md:text-xs font-bold flex items-center gap-2">
                                    <ShieldCheck size={16} className="shrink-0" />
                                    <span>Verknüpft mit Flotten-Dashboard: <strong>{matchedDriver?.managerName || 'Grien Fleet Ops'}</strong></span>
                                </div>
                            ) : driverCodeError ? (
                                <p className="text-[10px] md:text-xs text-red-400 font-bold flex items-center gap-1 pl-1">
                                    <AlertTriangle size={12} /> {driverCodeError}
                                </p>
                            ) : (
                                <p className="text-[9px] md:text-[11px] text-[var(--text-muted)] font-medium pl-1">
                                    Diesen Code hat dein Flotten-Manager im Portal hinterlegt. Nur mit diesem Code wirst du exklusiv seinem Dashboard zugeteilt.
                                </p>
                            )}
                        </div>
                    )}

                    {signupError && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-red-500 animate-pulse">
                            ⚠️ {signupError}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="neon-button w-full py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 mt-4"
                    >
                        Access Grien <ChevronRight size={18} />
                    </button>
                </form>

                <p className="mt-8 text-center text-[var(--text-muted)] text-[11px] md:text-sm lg:text-base font-black uppercase tracking-widest">
                    Already a member? <Link to="/login" className="text-brand hover:underline">Log In</Link>
                </p>
            </div>
            {/* Mandatory Privacy Acceptance Modal (Store Compliance) */}
            <AnimatePresence>
                {showPrivacyModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-dark-950/95 backdrop-blur-3xl flex items-center justify-center p-6"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="w-full max-w-md bg-dark-900 border border-white/10 rounded-[3rem] p-10 space-y-8 shadow-[0_0_80px_rgba(0,0,0,0.3)]"
                        >
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-20 h-20 bg-brand/10 rounded-[2.5rem] flex items-center justify-center text-brand border border-brand/20 shadow-2xl">
                                    <ShieldCheck size={40} />
                                </div>
                                <h2 className="text-3xl font-black italic tracking-tighter uppercase">Privacy <span className="text-brand">Protocol</span></h2>
                                <p className="text-xs md:text-sm lg:text-base text-[var(--text-muted)] font-bold uppercase tracking-widest leading-relaxed">
                                    To enter the GRIEN network, you must acknowledge our data governance standards. We prioritize your digital autonomy.
                                </p>
                            </div>

                            <div className="space-y-4 bg-white/5 border border-white/5 p-6 rounded-3xl max-h-48 overflow-y-auto no-scrollbar">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-widest italic">1. Media Autonomy</h4>
                                    <p className="text-[10px] md:text-xs lg:text-sm text-[var(--text-muted)] font-medium leading-relaxed">You have total control over the photos and videos you post. Media is encrypted and served only to authorized members of the network.</p>
                                    
                                    <h4 className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-widest italic">2. Tactical Telemetry</h4>
                                    <p className="text-[10px] md:text-xs lg:text-sm text-[var(--text-muted)] font-medium leading-relaxed">GPS is active only during mission cycles to ensure service precision and safety.</p>

                                    <h4 className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-widest italic">3. Financial Integrity</h4>
                                    <p className="text-[10px] md:text-xs lg:text-sm text-[var(--text-muted)] font-medium leading-relaxed">All financial settlements are processed via encrypted, weekly automated cycles.</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 px-2">
                                <input 
                                    type="checkbox" 
                                    id="privacy-check"
                                    checked={privacyAccepted}
                                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                                    className="w-5 h-5 rounded-md border-white/10 bg-white/5 text-brand focus:ring-brand accent-brand cursor-pointer"
                                />
                                <label htmlFor="privacy-check" className="text-[9px] md:text-[11px] lg:text-xs font-black text-[var(--text-muted)] uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                                    I acknowledge the <Link to="/privacy" className="text-brand border-b border-white/20">Datenschutzerklärung (DSGVO)</Link>
                                </label>
                            </div>

                            <button 
                                disabled={!privacyAccepted}
                                onClick={() => setShowPrivacyModal(false)}
                                className={`w-full py-5 rounded-2xl font-black uppercase text-xs md:text-sm lg:text-base tracking-widest transition-all ${privacyAccepted ? 'bg-brand text-dark-950 shadow-2xl shadow-brand/30 hover:scale-105' : 'bg-white/5 text-gray-600 grayscale cursor-not-allowed'}`}
                            >
                                Enter Network
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Signup;



