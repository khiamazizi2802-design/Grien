import React, { useState, useEffect } from 'react';
import { 
    Building2, 
    Ticket, 
    Bus, 
    Utensils, 
    ArrowRight, 
    CheckCircle2, 
    Sparkles, 
    Zap, 
    QrCode, 
    BedDouble, 
    Trophy,
    Mail,
    Phone,
    LogIn
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ManagerPortalOverview() {
    const navigate = useNavigate();
    const [selectedTab, setSelectedTab] = useState('hotel'); // 'hotel' | 'stadium'

    // Guarantee dark mode active for the manager platform
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
    }, []);

    const openDashboard = () => {
        const targetCtx = selectedTab === 'hotel' ? 'HM' : 'SM';
        try {
            // Garantieren, dass beim Klick von der Startseite IMMER der saubere Demo-Modus startet
            localStorage.removeItem('green_current_partner');
            localStorage.removeItem('green_manager_profile_default');
            localStorage.setItem('green_manager_context_demo', targetCtx);
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('green_manager_context_')) {
                    localStorage.setItem(key, targetCtx);
                }
            });
        } catch (e) {}
        navigate(`/manager?mode=${selectedTab}`);
    };

    return (
        <div className="min-h-screen bg-[#030712] text-white flex flex-col font-sans select-none relative overflow-x-hidden">
            {/* Ambient Background Glow: Deep Blue & subtle Grien Emerald */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute top-48 right-1/4 w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 bg-[#070D1B]/95 backdrop-blur-xl border-b border-blue-500/20 px-6 py-4 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-emerald-400 p-[2px] shadow-lg shadow-blue-500/25 flex items-center justify-center">
                        <div className="w-full h-full bg-[#050B17] rounded-[9px] flex items-center justify-center font-black tracking-tighter text-emerald-400 text-lg italic">
                            G
                        </div>
                    </div>
                    <div>
                        <span className="text-2xl font-black italic tracking-wider text-emerald-400" style={{ color: '#34D399' }}>
                            GRIEN
                        </span>
                    </div>
                </div>

                {/* Dynamic Button based on selected Tab (Hotel vs Stadium) & Partner Login */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/login')}
                        className="px-5 py-2.5 bg-[#0A1224]/90 hover:bg-[#111e3b] text-slate-200 hover:text-white border border-emerald-500/30 hover:border-emerald-400 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-black/40 flex items-center gap-2 cursor-pointer backdrop-blur-md hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <LogIn className="w-4 h-4 text-emerald-400" />
                        <span>Anmelden</span>
                    </button>
                    <button
                        onClick={openDashboard}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-blue-500/25 flex items-center gap-2 transform hover:scale-[1.02] border border-blue-400/30 cursor-pointer"
                        style={{ color: '#FFFFFF' }}
                    >
                        <span>{selectedTab === 'hotel' ? 'Hotel Dashboard öffnen' : 'Stadion Dashboard öffnen'}</span>
                        <ArrowRight className="w-4 h-4 text-emerald-200" />
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden py-16 md:py-20 px-6 border-b border-white/5 bg-gradient-to-b from-[#070D1B] via-[#050914] to-[#030712]">
                <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
                    
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-widest shadow-inner">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Offizielles Portal für Partner-Betriebe</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl md:text-6xl font-black italic tracking-tight text-white leading-tight" style={{ color: '#FFFFFF' }}>
                        Das moderne Betriebssystem für <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400">
                            Hotels & Stadien
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="max-w-2xl mx-auto text-base md:text-lg text-slate-200 leading-relaxed font-normal" style={{ color: '#E2E8F0' }}>
                        Verbinden Sie Ihre Zimmer-Reservierungen, VIP-Shuttle-Flotten und Event-Tickets in einer 
                        leistungsstarken Web-Plattform. Speziell entwickelt für Desktop, Tablet und Smartphone – 
                        direkt per Web-Link erreichbar.
                    </p>

                    {/* Action Buttons (Enhanced Premium Hero Button) */}
                    <div className="pt-6 flex flex-wrap items-center justify-center gap-5">
                        <button
                            onClick={openDashboard}
                            className="group relative px-9 py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-black uppercase text-sm tracking-widest rounded-2xl transition-all duration-300 shadow-[0_0_30px_rgba(37,99,235,0.45)] hover:shadow-[0_0_45px_rgba(16,185,129,0.55)] flex items-center gap-3 border border-white/20 transform hover:-translate-y-0.5 cursor-pointer overflow-hidden"
                            style={{ color: '#FFFFFF' }}
                        >
                            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <div className="w-7 h-7 rounded-lg bg-black/25 flex items-center justify-center text-emerald-300 shadow-inner">
                                <Zap className="w-4 h-4 fill-emerald-300 animate-pulse" />
                            </div>
                            <span className="tracking-wider">{selectedTab === 'hotel' ? 'Live Hotel-System starten' : 'Live Stadion-System starten'}</span>
                            <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <a
                            href="#ueberblick"
                            className="px-8 py-4 bg-[#0A1224]/80 hover:bg-[#101D38] text-slate-200 hover:text-white border border-blue-500/30 hover:border-blue-400/60 font-bold uppercase text-sm tracking-wider rounded-2xl transition-all duration-200 flex items-center gap-2.5 backdrop-blur-md shadow-lg shadow-black/40"
                            style={{ color: '#E2E8F0' }}
                        >
                            <span>Funktionsweise ansehen</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* Interactive Concept Showcase (Hotel vs Stadium) */}
            <section id="ueberblick" className="max-w-6xl mx-auto px-6 py-16 space-y-10">
                <div className="text-center space-y-3">
                    <span className="text-xs font-black uppercase tracking-[0.25em] text-blue-400 flex items-center justify-center gap-1.5" style={{ color: '#60A5FA' }}>
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        System-Überblick
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight text-white" style={{ color: '#FFFFFF' }}>
                        Wie funktioniert Grien für Sie?
                    </h2>
                    <p className="text-sm text-slate-300 max-w-2xl mx-auto" style={{ color: '#CBD5E1' }}>
                        Erfahren Sie, wie Grien Ihre Hotelzimmer vermarktet, die Auslastung steigert und Ihren Gästen erstklassigen Shuttle- & Kofferservice bietet:
                    </p>
                </div>

                {/* Industry Switcher Tabs */}
                <div className="flex justify-center">
                    <div className="bg-[#070D1B] p-1.5 rounded-2xl border border-blue-500/25 flex items-center gap-2 shadow-2xl">
                        <button
                            onClick={() => setSelectedTab('hotel')}
                            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-xs md:text-sm font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                                selectedTab === 'hotel'
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 border border-blue-400/40'
                                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                            }`}
                            style={{ color: '#FFFFFF' }}
                        >
                            <BedDouble className={`w-4 h-4 ${selectedTab === 'hotel' ? 'text-emerald-300' : 'text-blue-400'}`} />
                            <span>Für Hotel-Manager</span>
                        </button>
                        <button
                            onClick={() => setSelectedTab('stadium')}
                            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-xs md:text-sm font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                                selectedTab === 'stadium'
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 border border-blue-400/40'
                                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                            }`}
                            style={{ color: selectedTab === 'stadium' ? '#FFFFFF' : '#CBD5E1' }}
                        >
                            <Trophy className={`w-4 h-4 ${selectedTab === 'stadium' ? 'text-emerald-300' : 'text-blue-400'}`} />
                            <span>Für Stadion- & Event-Manager</span>
                        </button>
                    </div>
                </div>

                {/* Content Cards based on selection */}
                {selectedTab === 'hotel' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Card 1: Zimmer-Vermittlung & Auslastung */}
                        <div className="bg-[#070D1B] border border-blue-500/20 hover:border-blue-400/50 rounded-2xl p-6 space-y-4 transition-all duration-300 shadow-xl group hover:shadow-blue-500/10">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                <Building2 className="w-6 h-6 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-black italic uppercase tracking-wide text-white" style={{ color: '#FFFFFF' }}>
                                1. Zimmer-Vermittlung & Mehr Auslastung
                            </h3>
                            <p className="text-sm text-slate-200 leading-relaxed" style={{ color: '#E2E8F0' }}>
                                Wir vermarkten und verkaufen Ihre freien Hotelzimmer und Suiten über die exklusive 
                                Grien Kunden-App an solvente Gäste – ganz ohne zusätzlichen Vertriebsaufwand für Ihr Haus.
                            </p>
                            <ul className="text-xs text-slate-200 space-y-2 pt-3 border-t border-white/10" style={{ color: '#E2E8F0' }}>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    <span>Mehr Direktbuchungen und höhere Zimmerauslastung</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    <span>Eindeutiger Buchungscode (<strong className="text-white font-mono" style={{ color: '#FFFFFF' }}>#BK-...</strong>) für jeden Gast</span>
                                </li>
                            </ul>
                        </div>

                        {/* Card 2: VIP-Shuttle & Koffer-Transport */}
                        <div className="bg-gradient-to-b from-[#091329] to-[#070D1B] border border-blue-500/40 rounded-2xl p-6 space-y-4 relative overflow-hidden shadow-2xl group hover:border-emerald-400/50 transition-all">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300 group-hover:scale-110 transition-transform">
                                <Bus className="w-6 h-6 text-blue-300" />
                            </div>
                            <div className="inline-block px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider" style={{ color: '#34D399' }}>
                                DGrien Integration
                            </div>
                            <h3 className="text-lg font-black italic uppercase tracking-wide force-white">
                                2. VIP-Shuttle & Koffer-Transport
                            </h3>
                            <p className="text-sm text-slate-200 leading-relaxed" style={{ color: '#E2E8F0' }}>
                                Ihre Gäste können bei der Zimmerbuchung direkt einen VIP-Shuttle und Koffer-Transport 
                                zubuchen. Unsere DGrien-Flotte holt die Gäste pünktlich an Flughafen, Messe oder Bahnhof 
                                ab und bringt sie direkt vor Ihre Hotellobby.
                            </p>
                            <ul className="text-xs text-slate-200 space-y-2 pt-3 border-t border-white/10" style={{ color: '#E2E8F0' }}>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    <span>Zuverlässiger Koffer- & Gepäcktransport inklusive</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    <span>Entlastet Ihr Hotelpersonal – DGrien übernimmt die Logistik</span>
                                </li>
                            </ul>
                        </div>

                        {/* Card 3: Sofortige Reservierung per E-Mail */}
                        <div className="bg-[#070D1B] border border-blue-500/20 hover:border-blue-400/50 rounded-2xl p-6 space-y-4 transition-all duration-300 shadow-xl group hover:shadow-blue-500/10">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                <Mail className="w-6 h-6 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-black italic uppercase tracking-wide text-white" style={{ color: '#FFFFFF' }}>
                                3. Sofortige Reservierung per E-Mail
                            </h3>
                            <p className="text-sm text-slate-200 leading-relaxed" style={{ color: '#E2E8F0' }}>
                                Sobald ein Gast über Grien bucht, erhält Ihre Rezeption / Reservierungsabteilung umgehend 
                                eine vollständige E-Mail mit allen Gastdaten, Ankunftszeiten und gebuchten Shuttle-Details.
                            </p>
                            <ul className="text-xs text-slate-200 space-y-2 pt-3 border-t border-white/10" style={{ color: '#E2E8F0' }}>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    <span>Keine Software-Umstellung an Ihrer Rezeption nötig</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    <span>Alle Gast- und Buchungsdaten sofort per E-Mail griffbereit</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Stadium Card 1 */}
                        <div className="bg-[#070D1B] border border-blue-500/20 hover:border-blue-400/50 rounded-2xl p-6 space-y-4 transition-all duration-300 shadow-xl group hover:shadow-blue-500/10">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                <Ticket className="w-6 h-6 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-black italic uppercase tracking-wide text-white" style={{ color: '#FFFFFF' }}>
                                1. Box-Office & Tribünen-Tickets
                            </h3>
                            <p className="text-sm text-slate-200 leading-relaxed" style={{ color: '#E2E8F0' }}>
                                Erstellen Sie Spieltage, Turniere und Konzerte. Vergeben Sie 
                                VIP-Logen, Haupttribüne und Stehplatz-Kontingente mit flexibler 
                                Preisgestaltung und Echtzeit-Verfügbarkeit.
                            </p>
                            <ul className="text-xs text-slate-200 space-y-2 pt-3 border-t border-white/10" style={{ color: '#E2E8F0' }}>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    <span>Offizieller <strong className="text-white font-mono" style={{ color: '#FFFFFF' }}>#TK-...</strong> Ticketcode</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    <span>Block-, Reihen- und Sitzplatz-Zuteilung</span>
                                </li>
                            </ul>
                        </div>

                        {/* Stadium Card 2 */}
                        <div className="bg-gradient-to-b from-[#091329] to-[#070D1B] border border-blue-500/40 rounded-2xl p-6 space-y-4 relative overflow-hidden shadow-2xl group hover:border-emerald-400/50 transition-all">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300 group-hover:scale-110 transition-transform">
                                <QrCode className="w-6 h-6 text-blue-300" />
                            </div>
                            <div className="inline-block px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-black uppercase tracking-wider">
                                High-Speed Einlass
                            </div>
                            <h3 className="text-lg font-black italic uppercase tracking-wide force-white">
                                2. High-Speed Einlass-Scanner
                            </h3>
                            <p className="text-sm text-slate-200 leading-relaxed" style={{ color: '#E2E8F0' }}>
                                Ihr Ordnungsdienst scannt die QR-Codes der Fans an den Gates und VIP-Eingängen. 
                                Das System verhindert Ticket-Duplikate in Echtzeit.
                            </p>
                            <ul className="text-xs text-slate-200 space-y-2 pt-3 border-t border-white/10" style={{ color: '#E2E8F0' }}>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    <span>Sekundenschnelle Authentifizierung</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    <span>Live-Auslastung pro Block und Gate</span>
                                </li>
                            </ul>
                        </div>

                        {/* Stadium Card 3 */}
                        <div className="bg-[#070D1B] border border-blue-500/20 hover:border-blue-400/50 rounded-2xl p-6 space-y-4 transition-all duration-300 shadow-xl group hover:shadow-blue-500/10">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                <Utensils className="w-6 h-6 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-black italic uppercase tracking-wide text-white" style={{ color: '#FFFFFF' }}>
                                3. Stadion-Kioske & VIP-Lounge
                            </h3>
                            <p className="text-sm text-slate-200 leading-relaxed" style={{ color: '#E2E8F0' }}>
                                Fans bestellen Speisen und Getränke per App vor oder lassen sich in den VIP-Lounges 
                                direkt an den Platz beliefern. Keine langen Schlangen mehr in der Halbzeitpause.
                            </p>
                            <ul className="text-xs text-slate-200 space-y-2 pt-3 border-t border-white/10" style={{ color: '#E2E8F0' }}>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    <span>Deutliche Umsatzsteigerung am Spieltag</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    <span>Automatische Abrechnung nach Abpfiff</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}
            </section>

            {/* Direct Action Callout (Blue & Dark Theme) */}
            <section className="bg-gradient-to-r from-[#070D1B] via-[#09152E] to-[#070D1B] border-y border-blue-500/25 py-12 px-6 shadow-2xl">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2" style={{ color: '#60A5FA' }}>
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            Sofort loslegen
                        </span>
                        <h3 className="text-2xl md:text-3xl font-black italic text-white tracking-tight mt-1" style={{ color: '#FFFFFF' }}>
                            Bereit für Ihr {selectedTab === 'hotel' ? 'Hotel Dashboard' : 'Stadion Dashboard'}?
                        </h3>
                        <p className="text-sm text-slate-200 mt-1" style={{ color: '#E2E8F0' }}>
                            Öffnen Sie jetzt die operative Arbeitsfläche, um Zimmer, Tickets und Speisekarten zu steuern.
                        </p>
                    </div>

                    <button
                        onClick={openDashboard}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black uppercase text-sm tracking-wider rounded-xl transition-all shadow-xl shadow-blue-500/30 flex items-center gap-3 flex-shrink-0 transform hover:scale-[1.02] border border-blue-400/40 cursor-pointer"
                        style={{ color: '#FFFFFF' }}
                    >
                        <span>{selectedTab === 'hotel' ? 'Zum Hotel Dashboard wechseln' : 'Zum Stadion Dashboard wechseln'}</span>
                        <ArrowRight className="w-4 h-4 text-emerald-300" />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="mt-auto border-t border-white/10 py-10 px-8 bg-[#02050B]">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm">
                    <div className="flex items-center gap-2 font-black italic tracking-wider">
                        <span className="text-emerald-400 text-lg" style={{ color: '#34D399' }}>GRIEN</span>
                        <span className="text-slate-400">BUSINESS PLATFORM</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-center gap-8 text-xs md:text-sm text-slate-300">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400">Offizieller Partner-Support:</span>
                            <a href="mailto:partner@grien.de" className="text-white hover:text-emerald-400 font-bold transition-colors">
                                partner@grien.de
                            </a>
                        </div>
                        <span className="hidden md:inline text-slate-600">|</span>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400">24/7 Hotline:</span>
                            <a href="tel:+496912345678" className="text-white hover:text-emerald-400 font-bold font-mono transition-colors">
                                +49 (0) 69 1234 5678
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
