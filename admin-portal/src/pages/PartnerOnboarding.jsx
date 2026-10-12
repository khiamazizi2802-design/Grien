import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Building2, 
    Zap, 
    FileText, 
    ShieldCheck, 
    Activity, 
    ArrowRight, 
    ArrowLeft, 
    Camera,
    CheckCircle2
} from 'lucide-react';

const PartnerOnboarding = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);

    const steps = [
        { id: 1, title: 'Entity Intelligence', desc: 'Business identification and classification.' },
        { id: 2, title: 'Identity Handshake', desc: 'Manager verification and financial securing.' }
    ];

    const nextStep = () => {
        if (step < 2) {
            setIsProcessing(true);
            setTimeout(() => {
                setIsProcessing(false);
                setStep(step + 1);
            }, 1500);
        } else {
            alert("ONBOARDING COMPLETE: Your venue is now being synced with the Green Radar.");
            navigate('/manager');
        }
    };

    return (
        <div className="relative w-full min-h-screen bg-[#0B121E] font-sans text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#0B121E]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
                <button 
                    onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
                    className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all border border-white/5"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="text-center">
                    <h1 className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] text-brand">Partner Onboarding</h1>
                    <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">Joining the Grien Ecosystem</p>
                </div>
                <div className="w-10 h-10 bg-brand/10 border border-brand/20 rounded-xl flex items-center justify-center text-brand">
                    <Building2 size={18} />
                </div>
            </header>

            <main className="p-8 max-w-lg mx-auto space-y-12">
                
                {/* PROGRESS TRACKER */}
                <div className="flex items-center justify-between relative px-2">
                    <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/5 -translate-y-1/2 z-0" />
                    {steps.map((s) => (
                        <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all duration-500 ${step >= s.id ? 'bg-brand border-brand text-dark-900 shadow-[0_0_20px_rgba(52,211,153,0.3)]' : 'bg-dark-900 border-white/10 text-gray-500'}`}>
                                {step > s.id ? <CheckCircle2 size={20} /> : <span className="font-black italic text-sm">{s.id}</span>}
                            </div>
                        </div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.section 
                        key={step}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{steps[step-1].title}</h2>
                            <p className="text-xs md:text-sm lg:text-base text-gray-500 font-bold uppercase tracking-widest leading-relaxed">{steps[step-1].desc}</p>
                        </div>

                        {step === 1 && (
                            <div className="space-y-4">
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                                    <input placeholder="LEGAL BUSINESS NAME" className="w-full bg-dark-950 border border-white/5 p-4 rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase outline-none focus:border-brand/50 transition-all" />
                                    <select className="w-full bg-dark-950 border border-white/5 p-4 rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase outline-none focus:border-brand/50 transition-all">
                                        <option>Business Type: Hotel / Resort</option>
                                        <option>Business Type: Stadium / Arena</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4">
                                <div className="p-8 bg-brand/10 border border-brand/30 rounded-[3rem] text-center space-y-6">
                                    <div className="w-20 h-20 bg-brand rounded-full flex items-center justify-center text-dark-900 mx-auto shadow-2xl shadow-brand/20">
                                        <ShieldCheck size={40} />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Final Security Layer</h3>
                                        <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-brand uppercase tracking-[0.2em]">Securing Financial Payouts & Compliance</p>
                                    </div>
                                    <p className="text-[8px] md:text-[10px] lg:text-xs text-gray-400 font-bold uppercase leading-relaxed">
                                        By proceeding, you authorize GREEN to act as the primary facilitator for group settlements and automated VAT separation.
                                    </p>
                                </div>
                            </div>
                        )}
                    </motion.section>
                </AnimatePresence>

            </main>

            {/* ACTION BAR */}
            <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[#0B121E] via-[#0B121E]/95 to-transparent">
                <button 
                    onClick={nextStep}
                    disabled={isProcessing}
                    className="w-full py-6 bg-brand text-dark-900 rounded-[2rem] text-[12px] font-black uppercase tracking-[0.4em] italic shadow-[0_0_50px_rgba(52,211,153,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                >
                    {isProcessing ? (
                        <div className="w-5 h-5 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
                    ) : (
                        <>
                            {step === 2 ? 'Finalize Operations' : 'Proceed to Next Phase'}
                            <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default PartnerOnboarding;
