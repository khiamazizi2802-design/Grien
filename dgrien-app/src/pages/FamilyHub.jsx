import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Mail, Plus, Clock, CheckCircle, ShieldCheck, AlertCircle, Trash2, Send, Heart, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const FamilyHub = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [childEmail, setChildEmail] = useState('');
    const [childAge, setChildAge] = useState('16');
    const [invitations, setInvitations] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Load invitations from local storage on mount
    useEffect(() => {
        const stored = localStorage.getItem('green_parent_invitations');
        if (stored) {
            const allInvites = JSON.parse(stored);
            // Filter invitations sent by this parent
            const myInvites = allInvites.filter(inv => inv.parentEmail.toLowerCase() === user.email.toLowerCase());
            setInvitations(myInvites);
        } else {
            const isDemo = user?.isDemo;
            if (isDemo) {
                // Seed a default pending invitation for testing/demo
                const demoInvites = [
                    {
                        id: 'inv-demo-1',
                        parentEmail: user.email,
                        childEmail: 'teenager@green.de',
                        age: 16,
                        status: 'pending',
                        sentAt: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
                    }
                ];
                localStorage.setItem('green_parent_invitations', JSON.stringify(demoInvites));
                setInvitations(demoInvites);
            } else {
                setInvitations([]);
            }
        }
    }, [user.email]);

    const handleSendInvitation = (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        
        if (!childEmail) {
            setErrorMsg('Bitte geben Sie eine E-Mail-Adresse ein.');
            return;
        }

        if (childEmail.toLowerCase() === user.email.toLowerCase()) {
            setErrorMsg('Sie können sich nicht selbst einladen.');
            return;
        }

        // Validate child is age 16 or 17
        const ageNum = parseInt(childAge);
        if (ageNum !== 16 && ageNum !== 17) {
            setErrorMsg('Aus Jugendschutzgründen sind nur Einladungen für Jugendliche im Alter von 16 und 17 Jahren gestattet.');
            return;
        }

        // Check if already invited
        const allInvites = JSON.parse(localStorage.getItem('green_parent_invitations') || '[]');
        const alreadyInvited = allInvites.some(inv => 
            inv.childEmail.toLowerCase() === childEmail.toLowerCase() && 
            inv.parentEmail.toLowerCase() === user.email.toLowerCase()
        );

        if (alreadyInvited) {
            setErrorMsg('Diese E-Mail-Adresse wurde von Ihnen bereits eingeladen.');
            return;
        }

        // Simulate sending process
        setIsSending(true);
        setTimeout(() => {
            const newInvite = {
                id: `inv-${Date.now()}`,
                parentEmail: user.email,
                childEmail: childEmail.toLowerCase(),
                age: ageNum,
                status: 'pending',
                sentAt: new Date().toISOString()
            };

            const updatedAllInvites = [newInvite, ...allInvites];
            localStorage.setItem('green_parent_invitations', JSON.stringify(updatedAllInvites));
            
            setInvitations([newInvite, ...invitations]);
            setChildEmail('');
            setSuccessMsg(`Einladung erfolgreich an ${childEmail} gesendet! Ihr Kind kann sich nun mit dieser E-Mail registrieren.`);
            setIsSending(false);
        }, 1200);
    };

    const handleDeleteInvitation = (id) => {
        const allInvites = JSON.parse(localStorage.getItem('green_parent_invitations') || '[]');
        const updatedAll = allInvites.filter(inv => inv.id !== id);
        localStorage.setItem('green_parent_invitations', JSON.stringify(updatedAll));
        
        setInvitations(invitations.filter(inv => inv.id !== id));
        setSuccessMsg('Einladung wurde gelöscht.');
    };

    return (
        <div className="min-h-screen bg-dark-950 text-primary p-8 overflow-y-auto font-sans relative">
            {/* Ambient Cosmic Background */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-1/4 -left-1/4 w-[60%] h-[60%] bg-brand/5 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-1/4 -right-1/4 w-[60%] h-[60%] bg-violet-500/5 blur-[150px] rounded-full" />
            </div>

            {/* Back Button */}
            <header className="fixed z-[100]" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)', left: '2rem' }}>
                <button 
                    onClick={() => navigate('/home')} 
                    className="p-4 bg-dark-900 border border-main rounded-2xl text-brand hover:text-white hover:border-brand/40 transition-all shadow-2xl active:scale-90"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                    <ArrowLeft size={24} />
                </button>
            </header>

            <div className="max-w-4xl mx-auto pt-36 pb-20 relative z-10 space-y-12">
                
                {/* Header Title */}
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-brand/10 rounded-[2.5rem] flex items-center justify-center text-brand border border-brand/20 shadow-lg mx-auto hover:scale-110 transition-transform">
                        <Users size={40} />
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-[0.4em] italic mb-1">Family Administration Hub</p>
                        <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">
                            Family <span className="text-brand">Hub</span>
                        </h1>
                    </div>
                    <p className="max-w-md mx-auto text-gray-400 text-sm font-semibold uppercase tracking-wider leading-relaxed">
                        Laden Sie Ihre Kinder (16 & 17 Jahre) ein, damit diese sich gesetzeskonform und sicher im Green-Ecosystem registrieren können.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Send Invitation Form */}
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-dark-900 border border-main p-8 md:p-10 rounded-[3rem] space-y-6 backdrop-blur-3xl shadow-2xl"
                    >
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black italic uppercase text-white tracking-tight flex items-center gap-3">
                                <UserPlus className="text-brand" size={24} /> Neue Einladung
                            </h3>
                            <p className="text-gray-500 text-xs md:text-sm lg:text-base font-bold uppercase tracking-widest">
                                Teenager per E-Mail freischalten
                            </p>
                        </div>

                        <form onSubmit={handleSendInvitation} className="space-y-6">
                            <div className="space-y-4">
                                <label className="block text-[10px] md:text-xs lg:text-sm font-black text-gray-400 uppercase tracking-widest px-1">E-Mail-Adresse des Kindes</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="email"
                                        placeholder="kind@email.de"
                                        value={childEmail}
                                        onChange={(e) => setChildEmail(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand/40 text-sm font-bold text-white placeholder-gray-600"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] md:text-xs lg:text-sm font-black text-gray-400 uppercase tracking-widest px-1">Alter des Kindes</label>
                                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
                                    {['16', '17'].map((age) => (
                                        <button
                                            key={age}
                                            type="button"
                                            onClick={() => setChildAge(age)}
                                            className={`flex-1 py-3.5 rounded-xl text-xs md:text-sm lg:text-base font-black uppercase tracking-widest transition-all ${childAge === age ? 'bg-brand text-dark-950 shadow-lg font-black' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            {age} Jahre alt
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {errorMsg && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center text-xs md:text-sm lg:text-base font-black uppercase tracking-widest text-red-400 flex items-center justify-center gap-2">
                                    <AlertCircle size={16} /> {errorMsg}
                                </div>
                            )}

                            {successMsg && (
                                <div className="p-4 bg-brand/10 border border-brand/20 rounded-2xl text-center text-xs md:text-sm lg:text-base font-black uppercase tracking-widest text-brand flex items-center justify-center gap-2">
                                    <CheckCircle size={16} /> {successMsg}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSending}
                                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm lg:text-base flex items-center justify-center gap-2 transition-all ${isSending ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'bg-brand text-dark-950 shadow-xl shadow-brand/10 hover:scale-105 active:scale-95'}`}
                            >
                                {isSending ? 'Sende Einladung...' : 'Einladung senden'}
                                <Send size={14} />
                            </button>
                        </form>

                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-start gap-3">
                            <ShieldCheck className="text-brand shrink-0 mt-0.5" size={16} />
                            <p className="text-[10px] md:text-xs lg:text-sm text-gray-500 font-bold uppercase tracking-wider leading-relaxed">
                                **Jugendschutz & DSGVO:** Jugendliche unter 16 Jahren dürfen sich absolut nicht registrieren. Jugendliche ab 16 benötigen diese elterliche Freigabe. Mit dem Absenden bestätigen Sie Ihre Erziehungsberechtigung.
                            </p>
                        </div>
                    </motion.div>

                    {/* Sent Invitations Status */}
                    <motion.div 
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-dark-900 border border-main p-8 md:p-10 rounded-[3rem] space-y-6 backdrop-blur-3xl shadow-2xl flex flex-col justify-between"
                    >
                        <div className="space-y-6 w-full">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black italic uppercase text-white tracking-tight flex items-center gap-3">
                                    <Clock className="text-brand" size={24} /> Status Einladungen
                                </h3>
                                <p className="text-gray-500 text-xs md:text-sm lg:text-base font-bold uppercase tracking-widest">
                                    Verwalte deine aktiven Einladungen
                                </p>
                            </div>

                            <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2">
                                {invitations.length > 0 ? (
                                    invitations.map((inv) => (
                                        <div 
                                            key={inv.id}
                                            className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-brand/20 transition-all flex items-center justify-between"
                                        >
                                            <div className="space-y-1.5">
                                                <p className="text-sm font-bold text-white tracking-tight leading-none">{inv.childEmail}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-gray-500 tracking-wider">Alter: {inv.age} Jahre</span>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-700" />
                                                    <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-gray-500 tracking-wider">
                                                        {new Date(inv.sentAt).toLocaleDateString('de-DE')}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest ${
                                                    inv.status === 'registered' 
                                                        ? 'bg-brand/10 text-brand border border-brand/20' 
                                                        : 'bg-white/5 text-gray-400 border border-white/10'
                                                }`}>
                                                    {inv.status === 'registered' ? 'Registriert' : 'Ausstehend'}
                                                </span>
                                                
                                                {inv.status !== 'registered' && (
                                                    <button 
                                                        onClick={() => handleDeleteInvitation(inv.id)}
                                                        className="p-2.5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:scale-105 active:scale-95 transition-all"
                                                        title="Einladung zurückziehen"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center text-gray-500">
                                        <Users className="mx-auto text-gray-600 mb-3 opacity-30 animate-pulse" size={40} />
                                        <p className="font-black uppercase tracking-widest text-[10px] md:text-xs lg:text-sm">Keine Einladungen gefunden</p>
                                        <p className="text-[9px] md:text-[11px] lg:text-xs text-gray-600 mt-1 uppercase font-bold">Nutzen Sie das linke Formular, um eine Einladung zu senden.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5 mt-6 flex justify-between items-center text-xs md:text-sm lg:text-base font-black uppercase tracking-widest text-gray-600">
                            <span>Gesamt Einladungen</span>
                            <span className="text-white text-base font-black italic">{invitations.length}</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default FamilyHub;
