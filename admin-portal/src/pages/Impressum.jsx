import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Impressum = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-6 overflow-y-auto font-sans">
            <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={20} /> Zurück
            </button>

            <div className="max-w-4xl mx-auto space-y-12 pb-20">
                <header className="mb-16">
                    <h1 className="text-5xl font-black italic tracking-tighter mb-4 uppercase">Légal<span className="text-brand">Impressum</span></h1>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-xs md:text-sm lg:text-base">Gesetzliche Anbieterkennzeichnung</p>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-[var(--bg-secondary)] border border-white/5 p-8 rounded-[2rem] space-y-4">
                        <h2 className="text-2xl font-black italic text-brand uppercase tracking-wider">Angaben gemäß § 5 TMG</h2>
                        <p className="text-gray-400 font-medium leading-relaxed">
                            <span className="text-white font-bold tracking-tight italic uppercase">Green</span> App GmbH<br />
                            Musterstraße 123<br />
                            10115 Berlin, Deutschland
                        </p>
                        <p className="text-xs md:text-sm lg:text-base text-gray-500 font-bold uppercase tracking-widest mt-6">Geschäftsführung</p>
                        <p className="text-white font-bold">Jordan Personnel</p>
                    </div>

                    <div className="bg-[var(--bg-secondary)] border border-white/5 p-8 rounded-[2rem] space-y-4">
                        <h2 className="text-2xl font-black italic text-brand uppercase tracking-wider">Kontakt</h2>
                        <p className="text-gray-400 font-medium leading-relaxed">
                            Telefon: <span className="text-white">+49 (0) 30 1234567</span><br />
                            E-Mail: <span className="text-brand border-b border-brand/20">kontakt@green-app.de</span>
                        </p>
                        <p className="text-xs md:text-sm lg:text-base text-gray-500 font-bold uppercase tracking-widest mt-6">Register</p>
                        <p className="text-white font-bold">HRB 123456, AG Berlin-Charlottenburg</p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Impressum;



