import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, Lock, Eye, EyeOff, Globe, Bell, Smartphone, MapPin, Database, UserCheck, CreditCard, X, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const Privacy = () => {
    const navigate = useNavigate();
    const [showFullPolicy, setShowFullPolicy] = useState(false);
    const [activeTab, setActiveTab] = useState('privacy'); // 'privacy' | 'terms'

    const defaultPrivacyProtocolText = `# GRIEN ECOSYSTEM: GLOBAL PRIVACY PROTOCOL (v1.0)

## 1. DATA COLLECTION & IDENTITY PROTECTION
The Grien Application ("The Platform") processes user data to provide seamless mobility and service solutions. This includes:
* PRIME-ID Identification: Mandatory unique identifiers for all Partners, Drivers, and Passengers.
* Geospatial Telemetry: Real-time tracking of movement, route optimization, and security coordination.
* Financial Data: Bank details, Tax IDs, and settlement processing via PCI-DSS compliant global gateways.
* Communication Logs: Encrypted messaging and contact masking to ensure total user privacy.

## 2. DATA PROTECTION & PRIVACY STANDARDS
* Market Sentiment Analysis: Aggregated, non-personally identifiable demographic trends are analyzed for service optimization.
* Operational Analytics: AI-driven routing and fleet density optimization to minimize wait times and environmental impact.
* PII Protection: All raw PII (Bank details, addresses) is protected behind AES-256 encryption and NEVER shared externally.

## 3. GDPR & INTERNATIONAL COMPLIANCE
The platform complies with the EU General Data Protection Regulation (GDPR) and international privacy standards.
* Right to Erasure: Users can request complete account and data deletion at any time ("Right to be Forgotten").
* Data Portability: Partners and users can export their account data in an encrypted electronic format.

## 4. SECURITY & DATA VAULT
All sensitive data is stored in secure, encrypted cloud data centers with strict access authorization protocols.`;

    const defaultTermsOfServiceText = `# ALLGEMEINE GESCHÄFTSBEDINGUNGEN (AGB) – GRIEN ECOSYSTEM

## Präambel
Die Grien GmbH (im Folgenden „Plattformbetreiber“) betreibt eine digitale Vermittlungsplattform für Mobilitäts- und Servicedienstleistungen. Diese AGB regeln die vertraglichen Beziehungen zwischen dem Plattformbetreiber und den Nutzern. Die Nutzerstruktur unterteilt sich in Endkunden (Fahrgäste), Transportpartner (Flotten-Manager) und deren Fahrpersonal (Fahrer), sowie B2B-Partner (Unternehmen/Hotels) und deren autorisiertes Personal (Staff).

## 1. Nutzungsbedingungen für Endkunden (Passengers)
* **Vermittlungsleistung:** Die App vermittelt Beförderungs- und Servicedienstleistungen zwischen dem Endkunden und lizenzierten Partnern. Der Plattformbetreiber wird selbst nicht Vertragspartner der eigentlichen Beförderungsleistung.
* **Zahlungsabwicklung:** Zahlungen erfolgen bargeldlos über integrierte Zahlungsdienstleister. Der Endkunde autorisiert die Abbuchung des Fahrpreises und etwaiger Stornierungsgebühren.
* **Privatsphäre:** Die Kommunikation mit dem Fahrpersonal erfolgt ausschließlich anonymisiert über die App-interne Maskierung.

## 2. Pflichten der Transportpartner (Flotten-Manager) & Fahrpersonal
* **Verantwortlichkeit des Flotten-Managers:** Der Flotten-Manager ist der direkte B2B-Vertragspartner der Grien GmbH. Er ist vollumfänglich dafür verantwortlich, dass sein eingesetztes Fahrpersonal über alle gesetzlichen Qualifikationen verfügt. Die Auszahlung der Fahrtumsätze erfolgt ausschließlich an den Flotten-Manager.
* **Status des Fahrpersonals (Drivers):** Das Fahrpersonal handelt im Auftrag des Flotten-Managers. Die Fahrer-Accounts (Driver Dashboard) sind streng an die jeweilige Flotte gebunden.
* **Telemetrie und Disposition:** Zur Gewährleistung der Sicherheit ist die kontinuierliche Übermittlung von Standortdaten (GPS-Telemetrie) der eingesetzten Fahrzeuge durch das Fahrpersonal zwingend erforderlich.

## 3. Bedingungen für B2B-Partner (Unternehmen & Hotels)
* **Vermittlung & Abrechnung:** B2B-Partner, die über ihr Dashboard Fahrten oder Services für Gäste vermitteln, erhalten eine vertraglich vereinbarte Umsatzbeteiligung. Die Abrechnung erfolgt automatisiert über das Settlement-Hub.
* **Account-Administration:** Manager sind für die Verwaltung ihrer Profile sowie die Zuweisung von Rechten für ihr Personal (Staff) verantwortlich.
* **Haftung:** Der B2B-Partner haftet für missbräuchliche Buchungen, die über seine autorisierten Unternehmenszugänge getätigt werden.

## 4. Richtlinien für berechtigtes Partner-Personal (Staff)
* **Nutzungsbindung:** Staff-Accounts sind streng an das Partner-Unternehmen gebunden und dürfen ausschließlich zur betrieblichen Vermittlung von Fahrten für Gäste genutzt werden.
* **Vertraulichkeit:** Das Personal verpflichtet sich, Gastdaten strikt vertraulich zu behandeln und nicht für private Zwecke zu nutzen.

## 5. Haftungsbeschränkung und Verlust von Gegenständen
* Die Grien GmbH haftet nur für Schäden, die auf vorsätzlicher oder grob fahrlässiger Pflichtverletzung beruhen.
* Für im Fahrzeug vergessene Gegenstände wird ein digitaler Koordinationsprozess bereitgestellt; eine Haftung der Grien GmbH ist jedoch ausgeschlossen.`;

    const [privacyPolicyText, setPrivacyPolicyText] = useState(defaultPrivacyProtocolText);
    const [termsOfServiceText, setTermsOfServiceText] = useState(defaultTermsOfServiceText);

    useEffect(() => {
        const fetchPolicies = async () => {
            try {
                const docRef = doc(db, 'system_config', 'legal');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.privacyPolicyText) setPrivacyPolicyText(data.privacyPolicyText);
                    if (data.termsOfServiceText) setTermsOfServiceText(data.termsOfServiceText);
                }
            } catch (err) {
                console.error("Error fetching policies:", err);
            }
        };
        fetchPolicies();
    }, []);

    const renderMarkdown = (text) => {
        if (!text) return null;
        return text.split('\n').map((line, idx) => {
            if (line.startsWith('# ')) {
                return <h1 key={idx} className="text-3xl font-black italic uppercase text-white mt-8 mb-4 border-b border-white/10 pb-2">{line.replace('# ', '')}</h1>;
            }
            if (line.startsWith('## ')) {
                return <h2 key={idx} className="text-xl font-black italic uppercase text-brand mt-6 mb-3">{line.replace('## ', '')}</h2>;
            }
            if (line.startsWith('### ')) {
                return <h3 key={idx} className="text-lg font-black text-white mt-4 mb-2">{line.replace('### ', '')}</h3>;
            }
            if (line.startsWith('* ')) {
                return <li key={idx} className="ml-6 list-disc text-gray-300 my-1">{line.replace('* ', '')}</li>;
            }
            if (line.trim() === '') {
                return <div key={idx} className="h-2" />;
            }
            return <p key={idx} className="text-gray-400 text-sm leading-relaxed my-2">{line}</p>;
        });
    };

    const sections = [
        {
            icon: ShieldCheck,
            title: "1. Verantwortlicher & Jugendschutz",
            content: "Grien Logistics GmbH ist der Hauptverantwortliche im Sinne der DSGVO. Um den Schutz von Minderjährigen zu gewährleisten, ist die Registrierung für Personen unter 16 Jahren strengstens untersagt. Minderjährige im Alter von 16-17 Jahren können die App nur nutzen, wenn sie eine verifizierte Einladung durch einen Erwachsenen erhalten."
        },
        {
            icon: MapPin,
            title: "2. Telemetrie & Lokale Angebote",
            content: "Wir verarbeiten hochpräzise GPS-Telemetriedaten, um Ride-Hailing zu ermöglichen (Vertragserfüllung, Art. 6.1.b DSGVO). Zusätzlich nutzen wir mit deiner freiwilligen Zustimmung (Art. 6.1.a DSGVO) Standortdaten, um dir exklusive lokale Angebote und Service-Aktionen in deiner Nähe anzuzeigen. Du kannst dies jederzeit in den Einstellungen deaktivieren."
        },
        {
            icon: UserCheck,
            title: "3. Social Media Wall & 15s Clips",
            content: "Unsere App enthält eine integrierte Social Media Wall, auf der Kunden und Partner freiwillig Fotos und kurze Videos (bis zu 15 Sekunden) hochladen können, um Mobilitäts- und Service-Erlebnisse zu teilen. Uploads basieren auf freiwilliger Zustimmung (Art. 6.1.a DSGVO), werden auf sicheren Servern gespeichert und können von dir jederzeit dauerhaft gelöscht werden."
        },
        {
            icon: CreditCard,
            title: "4. Finanzen & Partner-Verifizierung",
            content: "Alle Zahlungen werden sicher über PCI-konforme Gateways (Stripe/PayPal) abgewickelt. Bei B2B-Partnern überprüfen wir Gewerbeanmeldungen, Geschäftsadressen, Steuerdaten, Führerscheine und Personenbeförderungsscheine (P-Scheine) unter strengen rechtlichen Auflagen (Art. 6.1.c DSGVO)."
        },
        {
            icon: Globe,
            title: "5. Feedback, Support & Anonyme Daten",
            content: "Beschwerden und Support-Tickets werden zur Lösung von Servicefällen verarbeitet. Feedback dient der App-Optimierung. Bevor wir Erkenntnisse mit unseren Marktforschungspartnern teilen, entfernen wir alle personenbezogenen Daten (Namen, E-Mails, GPS), um die Daten vollständig und unwiderruflich zu anonymisieren."
        },
        {
            icon: Smartphone,
            title: "6. Schichtbasierter Sitzungsablauf",
            content: "Während Fahrgäste dauerhaft eingeloggt bleiben, haben die Sitzungen von Managern, Mitarbeitern und Fahrern ein sicheres tägliches Ablaufdatum. Alle aktiven Mitarbeiter-/Flotten-Sitzungen laufen automatisch ab und erzwingen einen sicheren Logout jeden Tag um exakt 5:00 Uhr morgens, zeitgleich mit dem Ende der nächtlichen Schicht."
        },
        {
            icon: Bell,
            title: "7. Strategische Durchsetzung: Red Flag Protokoll",
            content: "Um die Integrität der Community zu schützen, setzen wir ein strenges verhaltensbasiertes 'Red Flag'-System um. Das Ansammeln von 3 Red Flags innerhalb von 2 Monaten führt zu einer automatischen 1-jährigen Sperre. Ein erneuter Verstoß nach der Sperre führt zu einem permanenten und unwiderruflichen Ausschluss aus dem gesamten System."
        }
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-8 overflow-y-auto font-sans selection:bg-brand/30">
            <header className="fixed top-8 left-8 z-[100]">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-4 bg-[var(--bg-secondary)]/80 backdrop-blur-xl border border-white/10 rounded-2xl text-brand hover:text-white hover:border-brand/40 transition-all shadow-2xl active:scale-90"
                >
                    <ArrowLeft size={24} />
                </button>
            </header>

            <div className="max-w-5xl mx-auto pt-24 relative z-10">
                <div className="flex justify-end mb-8">
                    <div className="text-right">
                        <p className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-[0.4em] italic mb-1">
                            {activeTab === 'privacy' ? 'Privacy Protocol' : 'Terms of Service'}
                        </p>
                        <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-widest">Version 2.5.0 • Live Synchronized</p>
                    </div>
                </div>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 text-center space-y-4"
                >
                    <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none">
                        {activeTab === 'privacy' ? (
                            <>Privacy <span className="text-brand">Protocol</span></>
                        ) : (
                            <>Terms of <span className="text-brand">Service</span></>
                        )}
                    </h1>
                    <p className="text-gray-500 font-bold uppercase tracking-[0.5em] text-xs md:text-sm lg:text-base">
                        {activeTab === 'privacy' ? 'Protecting Global Mobility & Service Operations' : 'Operational Mandate & Legal Terms'}
                    </p>
                </motion.div>

                {/* Tab Selector */}
                <div className="flex justify-center gap-4 mb-12">
                    <button 
                        onClick={() => setActiveTab('privacy')}
                        className={`px-8 py-3.5 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${
                            activeTab === 'privacy' 
                                ? 'bg-brand text-dark-900 border-brand shadow-lg shadow-brand/10' 
                                : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                        }`}
                    >
                        <ShieldCheck size={14} />
                        Privacy Protocol
                    </button>
                    <button 
                        onClick={() => setActiveTab('terms')}
                        className={`px-8 py-3.5 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${
                            activeTab === 'terms' 
                                ? 'bg-brand text-dark-900 border-brand shadow-lg shadow-brand/10' 
                                : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                        }`}
                    >
                        <FileText size={14} />
                        Terms of Service
                    </button>
                </div>

                <div className="bg-[var(--bg-secondary)]/40 border border-white/5 p-10 md:p-12 rounded-[3.5rem] mb-20 backdrop-blur-3xl shadow-2xl">
                    {activeTab === 'privacy' ? (
                        <div className="space-y-6">
                            {renderMarkdown(privacyPolicyText)}
                            <div className="flex justify-center mt-12 pt-8 border-t border-white/5">
                                <button 
                                    onClick={() => setShowFullPolicy(true)}
                                    className="px-10 py-5 bg-brand text-dark-900 rounded-2xl text-xs md:text-sm lg:text-base font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand/10 flex items-center gap-2"
                                >
                                    <ShieldCheck size={16} />
                                    Read Full Datenschutzerklärung (DSGVO)
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {renderMarkdown(termsOfServiceText)}
                        </div>
                    )}
                </div>

                <footer className="text-center py-20 border-t border-white/5 space-y-8">
                    <div className="flex justify-center gap-10">
                        <div className="flex flex-col items-center gap-2">
                            <Lock className="text-brand" size={32} />
                            <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] text-gray-500">256-bit AES</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Database className="text-brand" size={32} />
                            <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] text-gray-500">GDPR Compliant</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Globe className="text-brand" size={32} />
                            <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] text-gray-500">Global Hubs</span>
                        </div>
                    </div>
                    <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-600 uppercase tracking-[0.3em]">
                        &copy; 2026 GRIEN OPERATIONS GMBH • ALL RIGHTS RESERVED
                    </p>
                </footer>
            </div>

            <AnimatePresence>
                {showFullPolicy && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-dark-950/90 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 30 }}
                            className="bg-dark-900 border border-white/10 rounded-[3rem] w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative"
                        >
                            {/* Close button */}
                            <button 
                                onClick={() => setShowFullPolicy(false)}
                                className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-secondary hover:text-white transition-all z-10"
                            >
                                <X size={20} />
                            </button>

                            {/* Header */}
                            <div className="p-8 border-b border-white/5">
                                <h2 className="text-3xl font-black italic uppercase text-brand tracking-tighter">Datenschutzerklärung (DSGVO)</h2>
                                <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Vollständige juristische Fassung • Version 2.5.0 (Mai 2026)</p>
                            </div>

                            {/* Scrollable Content */}
                            <div className="p-8 overflow-y-auto space-y-6 text-gray-300 text-sm leading-relaxed font-medium max-h-[60vh] pr-4">
                                <p className="text-gray-400 italic">Der Schutz Ihrer persönlichen Daten ist uns ein wichtiges Anliegen. Nachfolgend informieren wir Sie detailliert und gesetzeskonform über den Umgang mit Ihren Daten im Rahmen des Grien-Ecosystems gemäß den Anforderungen der EU-Datenschutz-Grundverordnung (DSGVO) und des TDDDG.</p>
                                
                                <div className="space-y-4">
                                    <h3 className="text-lg font-black text-white uppercase tracking-wider">1. Name und Anschrift des Verantwortlichen (Art. 13 Abs. 1 lit. a DSGVO)</h3>
                                    <p>Verantwortlich für die Datenverarbeitung im Grien-Ecosystem ist:<br/>
                                    <strong>Grien Logistics GmbH</strong><br/>
                                    Zeil 106, 60313 Frankfurt am Main, Deutschland<br/>
                                    E-Mail: ops@grien.app • Telefon: +49 69 1234567<br/>
                                    Geschäftsführung: Khiam Grien</p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-black text-white uppercase tracking-wider">1.1 Kontaktdaten des Datenschutzbeauftragten (Art. 13 Abs. 1 lit. b DSGVO)</h3>
                                    <p>Wir haben einen externen Datenschutzbeauftragten bestellt. Sie erreichen diesen unter:<br/>
                                    <strong>PROLIANCE IT GmbH</strong><br/>
                                    Leopoldstraße 244, 80807 München, Deutschland<br/>
                                    E-Mail: dsb@grien.app • Website: www.datenschutzexperte.de</p>
                                </div>

                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl space-y-2">
                                    <h4 className="text-xs md:text-sm lg:text-base font-black uppercase tracking-widest text-red-400">🛑 Wichtiges Mindestalter & Elternschutz-Regeln (Art. 8 DSGVO)</h4>
                                    <p className="text-xs md:text-sm lg:text-base text-gray-300 leading-normal"><strong>Unter 16 Jahren:</strong> Die Registrierung und Nutzung unserer App ist für Kinder unter 16 Jahren aus Gründen des Jugendschutzes und der gesetzlichen Vorgaben strengstens untersagt.<br/>
                                    <strong>Jugendliche (16 und 17 Jahre):</strong> Wenn du 16 oder 17 Jahre alt bist (also noch nicht volljährig), darfst du dich nur dann registrieren, wenn du eine offizielle Einladung von deinen Eltern (durch ein bereits registriertes Elternteil) erhalten hast. Ohne diese elterliche Einladung blockiert unser System deine Anmeldung automatisch.</p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-black text-white uppercase tracking-wider">2. Datenkategorien, Zwecke und Rechtsgrundlagen</h3>
                                    
                                    <div className="space-y-3 pl-2">
                                        <h4 className="font-extrabold text-white">2.1 Daten von Kunden (Fahrgäste & App-Nutzer)</h4>
                                        <p><strong>• 2.1.1 Echtzeit-Standortdaten (GPS):</strong> Erfassung des Standorts zur Vermittlung (Art. 6.1.b DSGVO - Vertragserfüllung) und optional mit Ihrer ausdrücklichen Einwilligung zur Anzeige regionaler Angebote in der Nähe (Art. 6.1.a DSGVO - Einwilligung, jederzeit in den Einstellungen widerrufbar).</p>
                                        <p><strong>• 2.1.2 Stammdaten:</strong> Vorname, Nachname, E-Mail, Telefonnummer, Geburtsdatum und Adresse zur Bereitstellung des Kundenkontos und Support (Art. 6.1.b DSGVO - Vertragserfüllung).</p>
                                        <p><strong>• 2.1.3 Zahlungsdaten:</strong> Bankverbindungen, Transaktions-IDs, Stripe/PayPal-Daten zur Zahlungsabwicklung (Art. 6.1.b DSGVO - Vertragserfüllung).</p>
                                        <p><strong>• 2.1.4 Social-Media-Inhalte (Bilder & 15s Videos):</strong> Freiwilliger Upload von Profilbildern, Fotos und Kurzvideos (max. 15s) auf der Social-Wall. Basiert auf Ihrer Einwilligung (Art. 6.1.a DSGVO) und kann von Ihnen jederzeit eigenständig in der App gelöscht werden.</p>
                                        <p><strong>• 2.1.5 Support-Daten & Feedback:</strong> Analyse von Feedback zur App-Verbesserung. Alle Feedback-Texte werden vor der Auswertung vollständig und unumkehrbar anonymisiert (ohne jeglichen Personenbezug, Art. 6.1.f DSGVO - Berechtigtes Interesse). Diese anonymen Statistik-Daten teilen wir mit Marktforschungspartnern für Mobilitäts- und Verkehrsanalysen (z.B. Grien-City Analytics GmbH, NextGen Mobility Marketing KG, EcoTransit Research Ltd.).</p>
                                    </div>

                                    <div className="space-y-3 pl-2">
                                        <h4 className="font-extrabold text-white">2.2 Daten von Partnern (Manager)</h4>
                                        <p><strong>• 2.2.1 Gewerbedokumente:</strong> Handelsregisterauszüge, Steuernachweise zur KYC-Identitätsprüfung (Art. 6.1.c DSGVO - Rechtliche Verpflichtung).</p>
                                        <p><strong>• 2.2.2 Geschäftliche Kontaktdaten:</strong> Name, E-Mail, Telefon zur B2B-Vertragsabwicklung (Art. 6.1.b DSGVO).</p>
                                    </div>

                                    <div className="space-y-3 pl-2">
                                        <h4 className="font-extrabold text-white">2.3 Daten von Angestellten (Staff)</h4>
                                        <p><strong>• 2.3.1 Mitarbeiter-ID & Berechtigungen:</strong> Zur Einrichtung von Systemrechten und Protokollierung betriebssicherheitsrelevanter Aktionen (Art. 6.1.b DSGVO / § 26 BDSG - Beschäftigungsverhältnis).</p>
                                    </div>

                                    <div className="space-y-3 pl-2">
                                        <h4 className="font-extrabold text-white">2.4 Daten von Fahrern (Drivers)</h4>
                                        <p><strong>• 2.4.1 Gesetzliche Nachweise (Führerschein & P-Schein):</strong> Verifizierung der staatlichen Erlaubnis zur gewerblichen Fahrgastbeförderung (Art. 6.1.c DSGVO - Rechtliche Verpflichtung).</p>
                                        <p><strong>• 2.4.2 Fahrzeugdaten:</strong> Nummernschild, Farbe, Automodell und Live-Standort zur Kunden-Identifikation (Art. 6.1.b DSGVO).</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-black text-white uppercase tracking-wider">3. Empfänger von personenbezogenen Daten (Art. 13 Abs. 1 lit. e DSGVO)</h3>
                                    <p>Ihre Daten werden sicher an Zahlungsdienstleister (Stripe/PayPal), Cloud-Provider für Medienspeicherung und B2B-Partnerbetriebe (Hotels/Unternehmen) weitergegeben, sofern dies zur Serviceerbringung nötig ist. Ansonsten erfolgt keine Weitergabe an unbefugte Dritte.</p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-black text-white uppercase tracking-wider">4. Speicherdauer & Sitzungsdauer (Art. 13 Abs. 2 lit. a DSGVO)</h3>
                                    <p>Social-Media-Inhalte werden beim Löschen sofort vom Server entfernt. Rechnungsdaten werden gemäß den steuerlichen und handelsrechtlichen Gesetzen bis zu 10 Jahre aufbewahrt (§ 257 HGB, § 147 AO).<br/>
                                    <strong>Sicherheitsrelevante Sitzungsdauer (JWT Session Expiration):</strong> Während Passagier-Sessions dauerhaft geöffnet bleiben, werden Manager, Staff und Fahrer aus IT-Sicherheitsgründen (Verhinderung unbefugter Zugriffe) täglich um <strong>exakt 05:00 Uhr morgens</strong> automatisch aus dem System ausgeloggt (Ablauf des JWT-Tokens).</p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-black text-white uppercase tracking-wider">5. Reine Vermittlungsplattform & Haftungsausschluss</h3>
                                    <p>Die Grien GmbH betreibt ausschließlich eine digitale Vermittlungssoftware. Sämtliche Beförderungen und Dienstleistungen werden eigenverantwortlich durch unabhängige, lizenzierte Partnerunternehmen erbracht. Die Grien GmbH haftet nicht für Schäden, Verspätungen, Unfälle, Verhalten Dritter oder im Fahrzeug verbliebene Gegenstände.</p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-black text-white uppercase tracking-wider">6. Automatisierte Entscheidungsfindung & Profiling (Art. 13 Abs. 2 lit. f, Art. 22 DSGVO)</h3>
                                    <p>Zur Erhaltung der Plattformintegrität nutzen wir ein automatisiertes Verwarnungssystem („Red-Flag-System“):<br/>
                                    • Das Sammeln von <strong>3 Red Flags innerhalb von 2 Monaten</strong> führt zu einer <strong>automatischen Sperrung des Kontos für genau 1 Jahr</strong>.<br/>
                                    • Sie haben das Recht, menschliches Eingreifen seitens unseres Support-Teams unter `ops@grien.app` zu verlangen.</p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-black text-white uppercase tracking-wider">7. Ihre Betroffenenrechte (Art. 13 Abs. 2 lit. b DSGVO)</h3>
                                    <p>Sie haben jederzeit folgende Rechte bezüglich Ihrer personenbezogenen Daten:<br/>
                                    • Recht auf <strong>Auskunft</strong> (Art. 15 DSGVO) über gespeicherte Daten und Kopien.<br/>
                                    • Recht auf <strong>Berichtigung</strong> (Art. 16 DSGVO) unrichtiger Daten.<br/>
                                    • Recht auf <strong>Löschung</strong> (Art. 17 DSGVO) („Recht auf Vergessenwerden“).<br/>
                                    • Recht auf <strong>Einschränkung der Verarbeitung</strong> (Art. 18 DSGVO).<br/>
                                    • Recht auf <strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO) in strukturiertem Format.<br/>
                                    • Recht auf <strong>Widerspruch</strong> (Art. 21 DSGVO) gegen künftige Verarbeitungen aus besonderen Gründen.</p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-black text-white uppercase tracking-wider">8. Recht auf Beschwerde bei der Aufsichtsbehörde (Art. 13 Abs. 2 lit. d DSGVO)</h3>
                                    <p>Bei datenschutzrechtlichen Verstößen haben Sie oder Ihre Erziehungsberechtigten das Recht, sich an die zuständige Aufsichtsbehörde zu wenden:<br/>
                                    <strong>Der Hessische Beauftragte für Datenschutz und Informationsfreiheit</strong><br/>
                                    Gustav-Stresemann-Ring 1, 65189 Wiesbaden, Deutschland<br/>
                                    E-Mail: poststelle@datenschutz.hessen.de • Telefon: +49 611 1408-0</p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-8 border-t border-white/5 flex justify-end">
                                <button 
                                    onClick={() => setShowFullPolicy(false)}
                                    className="px-8 py-3.5 bg-brand text-dark-900 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md"
                                >
                                    Verstanden & Schließen
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Ambient Background Elements */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-1/4 -left-1/4 w-[60%] h-[60%] bg-brand/5 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-1/4 -right-1/4 w-[60%] h-[60%] bg-violet-500/5 blur-[150px] rounded-full" />
            </div>
        </div>
    );
};

export default Privacy;



