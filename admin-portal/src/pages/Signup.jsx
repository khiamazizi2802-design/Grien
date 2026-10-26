import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, ShieldCheck, Car, Mail, Lock, ChevronRight, Handshake, Upload, MapPin, Box, Phone, Search, ArrowLeft } from 'lucide-react';
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
        businessType: 'FM'
    });
    const [profilePic, setProfilePic] = useState(null);
    const [companySearch, setCompanySearch] = useState('');
    const [showCompanyResults, setShowCompanyResults] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');
    const [showCategoryResults, setShowCategoryResults] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(true);
    const [signupError, setSignupError] = useState('');

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

    const handleSignup = async (e) => {
        e.preventDefault();
        setSignupError('');

        // Map UI roles to auth database roles
        let finalRole = role;

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
            invitedByManager: inviteEmail || null,
            // Staff/driver no longer need to provide a company — manager will link them via Green ID
            gdprAccepted: true,
            gdprAcceptedAt: new Date().toISOString()
        };

        try {
            const res = await register(newUserData);
            if (!res.success) {
                setSignupError(res.message);
                return;
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
                            <p className="text-[9px] md:text-[11px] lg:text-xs font-black text-brand/80 uppercase tracking-widest text-center italic">
                                💡 Note: To become a B2B partner, please use a separate email address from your customer account.
                            </p>
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

                    {/* Staff / Driver — no company needed, just a friendly note */}
                    {(role === 'staff' || role === 'driver') && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-5 bg-brand/5 border border-brand/20 rounded-[2rem] space-y-3"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-2xl bg-brand/10 border border-brand/30 flex items-center justify-center">
                                    <ShieldCheck size={16} className="text-brand" />
                                </div>
                                <div>
                                    <p className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-widest">Grien ID System</p>
                                    <p className="text-[9px] md:text-[11px] lg:text-xs text-[var(--text-muted)] font-bold mt-0.5">No company search needed</p>
                                </div>
                            </div>
                            <p className="text-[9px] md:text-[11px] lg:text-xs text-[var(--text-muted)] font-medium leading-relaxed">
                                After registering, you will receive a unique <strong className="text-white">Grien ID</strong>. Share it with your Manager — they will link you to your business from their dashboard.
                            </p>
                        </motion.div>
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



