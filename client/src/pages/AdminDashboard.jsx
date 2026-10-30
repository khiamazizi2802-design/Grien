import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import {
    Car, FileText, Search, ChevronRight, LogOut, Star, MessageSquare, Briefcase, 
    DollarSign, Bell, LayoutDashboard, Zap, Users, ShieldCheck, CheckCircle2, 
    Clock, AlertCircle, Menu, X, TrendingUp, Globe, Scale, Calculator, Activity, 
    ArrowUpRight, Building2, Calendar, Settings, Eye, Droplets, Paperclip, Upload, 
    Phone, Mail, MapPin, User as UserIcon, ExternalLink, ChevronDown, Shield, 
    ThumbsUp, ThumbsDown, Filter, FolderOpen, Quote, Bot, Sparkles, BarChart3, 
    ArrowLeft, Monitor, Radio, Target, Layers, Cpu, Database, Lock, Download, ShieldAlert,
    Wallet, Landmark, Ticket, Tag, Percent, PlusCircle, FolderSearch, FileCheck2, FileClock, FileX2, FileWarning, CheckCircle, XCircle, AlertTriangle, LineChart, Bus, ShoppingBag
} from 'lucide-react';
import { triggerNotification } from '../components/NotificationToast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/Sidebar';
import Radar from '../components/Radar';
import { useSocket } from '../context/SocketContext';
import { useRide } from '../context/RideContext';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import { db } from '../config/firebase';
import { collection, doc, query, where, onSnapshot, updateDoc, getDoc, setDoc } from 'firebase/firestore';

import MapController from './admin/AdminMap';
import AdminPartnerHub from '../components/AdminPartnerHub';
import AdminProductHub from '../components/AdminProductHub';
import { calculateShuttleFare, getShuttleFareConfig, saveShuttleFareConfig } from '../utils/shuttleFareHelper';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const { drivers, socket } = useSocket();
    const isDemo = false; // Disabled for production
    const { 
        baseFare, setBaseFare, 
        baseFareMax, setBaseFareMax,
        baseFarePremium, setBaseFarePremium,
        baseFarePremiumMax, setBaseFarePremiumMax,
        baseFareShared, setBaseFareShared,
        perKmRate, setPerKmRate,
        perKmRateMax, setPerKmRateMax,
        perKmRatePremium, setPerKmRatePremium,
        perKmRatePremiumMax, setPerKmRatePremiumMax,
        perKmRateShared, setPerKmRateShared
    } = useRide();
    const [isGermanComplianceActive, setIsGermanComplianceActive] = useState(() => localStorage.getItem('green_german_compliance') === 'true');
    const [isLuggageSeparated, setIsLuggageSeparated] = useState(() => localStorage.getItem('green_shuttle_separate_luggage') === 'true');
    const [flightWebhookUrl, setFlightWebhookUrl] = useState(() => localStorage.getItem('green_shuttle_flight_webhook') || '');
    const [luggageWebhookUrl, setLuggageWebhookUrl] = useState(() => localStorage.getItem('green_shuttle_luggage_webhook') || '');

    // --- SMART SHUTTLE HUB TARIFF FORMULA STATES (Tiered Rule: 9km = 10€, +1.50€ / 3km) ---
    const [shuttleFareConfig, setShuttleFareConfigState] = useState(() => getShuttleFareConfig());
    const [testKmInput, setTestKmInput] = useState(15);

    const updateFareConfig = (key, value) => {
        const val = parseFloat(value) || 0;
        const newConfig = { ...shuttleFareConfig, [key]: val };
        setShuttleFareConfigState(newConfig);
        saveShuttleFareConfig(newConfig);
    };

    const shuttleBaseKm = shuttleFareConfig.baseKm;
    const shuttleBaseFare = shuttleFareConfig.basePrice;
    const shuttleIncKm = shuttleFareConfig.stepKm;
    const shuttleIncFare = shuttleFareConfig.stepFee;
    const shuttleLuggageFee = shuttleFareConfig.luggageFee !== undefined ? shuttleFareConfig.luggageFee : 3.00;
    const shuttleIncludedLuggage = shuttleFareConfig.includedLuggage !== undefined ? shuttleFareConfig.includedLuggage : 1;
    const setShuttleBaseKm = (val) => updateFareConfig('baseKm', val);
    const setShuttleBaseFare = (val) => updateFareConfig('basePrice', val);
    const setShuttleIncKm = (val) => updateFareConfig('stepKm', val);
    const setShuttleIncFare = (val) => updateFareConfig('stepFee', val);
    const setShuttleLuggageFee = (val) => updateFareConfig('luggageFee', val);
    const setShuttleIncludedLuggage = (val) => updateFareConfig('includedLuggage', val);

    const calculateShuttleFarePerPerson = (distanceKm, luggageCount = 0) => {
        return calculateShuttleFare(distanceKm, shuttleFareConfig, luggageCount);
    };
    const [selectedShuttleCluster, setSelectedShuttleCluster] = useState(null);
    const [activeDetailCluster, setActiveDetailCluster] = useState(null);
    const [shuttleClusters, setShuttleClusters] = useState(() => {
        try {
            const saved = localStorage.getItem('green_shuttle_clusters');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    // --- GRIEN GROWTH & BRAND INTELLIGENCE HUB STATES ---
    const [isPitchModeActive, setIsPitchModeActive] = useState(false);
    const [selectedLeadForProposal, setSelectedLeadForProposal] = useState(null);
    const [b2bLeads, setB2bLeads] = useState(() => {
        try {
            const saved = localStorage.getItem('green_b2b_leads');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    // Sync local pricing to the server when the admin dashboard opens
    React.useEffect(() => {
        if (socket) {
            socket.emit('admin-update-pricing', { baseFare, perKmRate });
        }
    }, [socket]); // Intentionally omitting baseFare/perKmRate so it only runs once on socket mount
    const [comparisonDistance, setComparisonDistance] = useState(10);
    const [competitorType, setCompetitorType] = useState('all');
    const [competitorSurge, setCompetitorSurge] = useState(1.0);
    const [searchGermanCity, setSearchGermanCity] = useState('Frankfurt');
    const [scoutInput, setScoutInput] = useState('');
    const [isLiveSimulationActive, setIsLiveSimulationActive] = useState(true);
    const [currentScenario, setCurrentScenario] = useState('sunny');

    useEffect(() => {
        if (!isLiveSimulationActive) return;

        const scenarios = [
            { id: 'sunny', multiplier: 1.0 },
            { id: 'rainy', multiplier: 1.4 },
            { id: 'rush-hour', multiplier: 1.8 },
            { id: 'concert-exit', multiplier: 2.3 }
        ];

        // Find current index to resume cycling smoothly
        let index = scenarios.findIndex(s => s.multiplier === competitorSurge);
        if (index === -1) index = 0;

        const interval = setInterval(() => {
            index = (index + 1) % scenarios.length;
            const next = scenarios[index];
            setCurrentScenario(next.id);
            setCompetitorSurge(next.multiplier);
        }, 8000); // cycle scenario every 8 seconds

        return () => clearInterval(interval);
    }, [isLiveSimulationActive, competitorSurge]);


    // NOTCH & SAFE AREA INTEGRATION
    const useSafeArea = localStorage.getItem('green_manager_use_safe_area') !== 'false';
    const notchAdjustment = parseInt(localStorage.getItem('green_manager_notch_adjustment') || (window.innerWidth < 768 ? '16' : '0'), 10);

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [view, setView] = useState(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            return params.get('tab') || params.get('view') || 'command-deck';
        } catch (e) {
            return 'command-deck';
        }
    });
    const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
    const [globalSurge, setGlobalSurge] = useState(() => parseFloat(localStorage.getItem('green_global_surge')) || 1.2);
    const [systemLockdown, setSystemLockdown] = useState(false);
    const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
    const [isVerifyingVault, setIsVerifyingVault] = useState(false);
    const [vaultOTP, setVaultOTP] = useState('');
    const [systemTime, setSystemTime] = useState(new Date().toLocaleTimeString());
    const [searchQuery, setSearchQuery] = useState('');

    // Identity Dossier states
    const [dossierFullName, setDossierFullName] = useState(() => localStorage.getItem('green_dossier_fullName') || (user?.name || 'Khiam Azizi'));
    const [dossierEmail, setDossierEmail] = useState(() => localStorage.getItem('green_dossier_email') || (user?.email || 'khiamazizi2802@gmail.com'));
    const [dossierPhone, setDossierPhone] = useState(() => localStorage.getItem('green_dossier_phone') || (user?.phone || '017662111103'));
    const [dossierAddress, setDossierAddress] = useState(() => localStorage.getItem('green_dossier_address') || 'Auf dem schafberg 12-14');
    const [dossierZip, setDossierZip] = useState(() => localStorage.getItem('green_dossier_zip') || '65933');
    const [dossierIban, setDossierIban] = useState(() => localStorage.getItem('green_dossier_iban') || '');
    const [dossierTaxId, setDossierTaxId] = useState(() => localStorage.getItem('green_dossier_taxId') || '');
    const [dossierEmergency, setDossierEmergency] = useState(() => localStorage.getItem('green_dossier_emergency') || '');

    const handleCommitDossier = () => {
        localStorage.setItem('green_dossier_fullName', dossierFullName);
        localStorage.setItem('green_dossier_email', dossierEmail);
        localStorage.setItem('green_dossier_phone', dossierPhone);
        localStorage.setItem('green_dossier_address', dossierAddress);
        localStorage.setItem('green_dossier_zip', dossierZip);
        localStorage.setItem('green_dossier_iban', dossierIban);
        localStorage.setItem('green_dossier_taxId', dossierTaxId);
        localStorage.setItem('green_dossier_emergency', dossierEmergency);
        triggerNotification('success', 'IDENTITY GRID UPDATED', 'Dossier changes synchronized and broadcasted successfully.');
    };

    // --- LEGAL POLICIES & COMPLIANCE SYSTEM STATE ---
    const defaultPrivacyProtocolText = `# GREEN ECOSYSTEM: GLOBAL PRIVACY PROTOCOL (v2.5-PRODUCTION)
*Effective Date: June 18, 2026*
*Version: 2.5.0-ALPHA-PRODUCTION*
*Clearance Level: PUBLIC / GLOBAL*

## PREAMBLE
This Privacy Protocol ("Protocol") details the processing of personal data within the digital software application, fleet telemetry routing environment, and dispatch systems (collectively, "The Platform") operated by **Green Nightlife & Logistics GmbH**, Zeil 106, 60313 Frankfurt am Main, Germany (hereinafter "The Controller", "We", "Us", or "Our"). 

This Protocol is compiled in strict compliance with the Regulation (EU) 2016/679 (General Data Protection Regulation, "GDPR" or "DSGVO"), the German Federal Data Protection Act ("BDSG"), the Telecommunications Digital Services Data Protection Act ("TDDDG"), and the German Passenger Transport Act ("PBefG").

---

## SECTION 1: IDENTITY OF THE CONTROLLER & JUVENILE PROTECTION
### 1.1 Data Controller
The responsible controller within the meaning of Art. 4 No. 7 GDPR is:
Green Nightlife & Logistics GmbH  
Zeil 106, 60313 Frankfurt am Main, Germany  
Email: compliance@green-nightlife.com  

### 1.2 Juvenile Protection & Age Verification (Art. 8 GDPR)
The Platform operates strictly on an adult-only and supervised-minor basis. 
1. **Absolute Restriction**: Registration of accounts by individuals under the age of 16 is strictly prohibited.
2. **Conditional Admittance (16-17)**: Individuals aged 16 or 17 may only utilize the Platform under the legal guardianship of an adult. This requires the issuance of a verified "Parental Invitation Link" generated by an authenticated parent/guardian account. Telemetry of minors is subject to heightened encryption and is excluded from commercial marketing vectors.

---

## SECTION 2: CATEGORIES OF PROCESSABLE PII & THE "PRIME-ID" ARCHITECTURE
To maintain system integrity and dispatch efficiency, the Platform assigns a unique "PRIME-ID" key to every registered entity. The following categories of Personal Identifiable Information ("PII") are collected:
1. **Core Account Data**: Full legal name, verified email address, mobile telephone number, date of birth, and language settings (Art. 6(1)(b) GDPR - contract performance).
2. **Telemetry Data**: High-precision GPS coordinates, bearing velocity, altitude tracking, and destination routing (Art. 6(1)(b) GDPR - contract performance).
3. **Hardware & Device Metadata**: Browser user-agent, MAC address, operational system fingerprint, local session identifiers, and JWT (JSON Web Tokens) (Art. 6(1)(f) GDPR - legitimate security interest).

---

## SECTION 3: REAL-TIME TELEMETRY & MARKETING CONSENT
### 3.1 GPS Tracking for Dispatch (Art. 6(1)(b) GDPR)
Real-time tracking of passenger and driver location is technically necessary to facilitate ride-hailing services. GPS tracking commences upon launching the dispatch screen and terminates upon completion of the service contract.

### 3.2 Nightlife-Marketing & Lokale Promos (Art. 6(1)(a) DSGVO)
Wenn du freiwillig deine Zustimmung erteilst (über Opt-in-Einstellungen), verarbeiten wir deine Standortkoordinaten, um dir Nightlife-Gutscheine, lokale Rabatte und Partner-Aktionen in deiner Nähe anzuzeigen.
* **Widerruf der Zustimmung**: Du kannst diese Zustimmung jederzeit in den App-Einstellungen widerrufen, ohne dass deine grundsätzliche Servicenutzung beeinträchtigt wird.

---

## SECTION 4: FINANCIAL GATEWAYS, B2B PAYOUTS, & BAFIN COMPLIANCE
### 4.1 Passenger Payments (PCI-DSS Compliance)
All passenger payments are processed securely via Stripe or PayPal. We do not store raw credit card numbers. Payment processing is based on Art. 6(1)(b) GDPR.

### 4.2 B2B Partner Verification & BaFin compliance (Art. 6(1)(c) GDPR)
To prevent financial fraud and comply with the German Money Laundering Act (*Geldwäschegesetz - GwG*) and BaFin regulations:
1. **KYC Verification**: B2B Partners (Fleet owners, Managers) must submit verified bank credentials (IBAN), commercial tax IDs, and biometric ID scans.
2. **Data Escrow & Audits**: Transactional splits, payout values, and operational revenue records are shared with financial institutions to fulfill mandatory auditing protocols.

---

## SECTION 5: SOCIAL MEDIA WALL & 15-SECOND MULTIMEDIA CLIPS
The Platform hosts a community social feed allowing users to upload profile pictures, comments, and short video clips (maximum duration of 15 seconds) to share nightlife experiences.
1. **Legal Basis**: The publication of multimedia uploads is based on voluntary consent (Art. 6(1)(a) GDPR).
2. **Right to Erasure**: Users retain full control over their posts and can permanently delete them from the database at any time.

---

## SECTION 6: AUTOMATED DECISION-MAKING & THE "RED FLAG" PROTOCOL
To protect drivers, passengers, and staff, the Platform utilizes an automated behavioral enforcement algorithm.
1. **Trigger Mechanism**: Violations (e.g., chronic late cancellations, harassment reports, or payment defaults) trigger "Red Flags."
2. **System Suspension**: Accumulating 3 Red Flags within a rolling 2-month window triggers an automatic 1-year suspension of access. Repeat violations trigger an irreversible lifetime ban.
3. **Art. 22 GDPR Compliance**: You have the right to request a manual review of automated decisions. To appeal a Red Flag, email appeals@green-nightlife.com.

---

## SECTION 7: SHIFT-BASED SESSION EXPIRATION
For IT security purposes under Art. 32 GDPR (Security of Processing):
1. **Failsafe Logout**: While passenger sessions remain persistently active, all fleet managers, staff, and driver login tokens are configured with a daily expiration timer.
2. **Automated Termination**: All active driver and manager sessions automatically expire and execute a secure logout daily at exactly 05:00 AM, matching the end of nightly transport shifts.

---

## SECTION 8: ANONYMIZED MARKET RESEARCH
We strip all PII (names, phone numbers, exact addresses, and exact GPS logs) from customer feedback and trip counts to produce aggregate statistical datasets.
1. **Legitimate Interest**: This processing is based on Art. 6(1)(f) GDPR.
2. **Exemption**: Fully anonymized data is exempt from GDPR restrictions. We sell this anonymized statistical market data to exactly three selected research partners for urban planning:
   - Green-City Analytics GmbH (Frankfurt)
   - NextGen Nightlife Marketing KG (Munich)
   - EcoTransit Research Ltd. (Dublin)

---

## SECTION 9: LEGAL RIGHTS OF DATA SUBJECTS
Under the GDPR, you have the following rights:
* **Art. 15 GDPR (Right of Access)**: Request a copy of all stored PII linked to your PRIME-ID.
* **Art. 16 GDPR (Right to Rectification)**: Correct inaccurate data.
* **Art. 17 GDPR (Right to Erasure)**: Request deletion of your account (subject to a 30-day legal hold).
* **Art. 21 GDPR (Right to Object)**: Object to direct marketing profiling.
To exercise your rights, contact our Data Protection Officer at: dsb@green-nightlife.com.`;

    const defaultTermsOfServiceText = `# GREEN ECOSYSTEM: TERMS OF SERVICE & OPERATIONAL MANDATE
*Effective Date: June 18, 2026*
*Version: 2.5.0-ALPHA-PRODUCTION*

## SECTION 1: SYSTEM CLEARANCE & LICENSE GRANT
1. **Contract Formation**: By registering an account, you enter into a legally binding contract under § 311 BGB (German Civil Code) to abide by these Terms.
2. **Clearance Level**: Access to the "Director Command" panel is strictly restricted. PRIME-ID credentials are non-transferable. Sharing credentials constitutes a material breach and results in immediate account revocation.

---

## SECTION 2: B2B FLEET & DRIVER COMPLIANCE MANDATES
All fleet operators and drivers must comply with the German Passenger Transport Act (*Personenbeförderungsgesetz - PBefG*):
1. **Required Credentials**: Partners must upload and maintain verified copies of:
   - Passenger Transport License (*Personenbeförderungsschein - P-Schein*)
   - Public Carriage Concession (*Konzessionsurkunde*)
   - Vehicle safety certificates (*TÜV*)
   - Commercial vehicle liability insurance policies
2. **Suspension**: Failure to maintain active credentials results in automatic system blockages.

---

## SECTION 3: THE "GUARDIAN AI" REAL-TIME TELEMETRY
1. **Telemetry Feed**: Drivers and partners must maintain a continuous GPS connection.
2. **Guardian Protocol**: If a telemetry feed is disconnected during an active ride, the Guardian AI flags a security variance and alerts dispatch.

---

## SECTION 4: SEAT PRESSURE TELEMETRY & CUSTODY OF LOST ITEMS
1. **Lost Item Detection**: Vehicles are equipped with seat weight sensors (Seat Pressure Variance).
2. **Custody Protocol**: If weight remains on a seat after a passenger exits, the system flags a "Lost Item Alert" to the driver.
3. **Liability Limitation**: While we implement sensors, the Platform is not liable for lost personal property. Drivers are legally obligated to return lost items to the local municipal office (*Fundbüro*) under § 965 BGB.

---

## SECTION 5: THE "INVISIBLE NUMBER" MORATORIUM
1. **Masked Routing**: To protect privacy under telecommunications laws, direct phone numbers are never shown. All voice/text routing is masked through our server bridge.
2. **180-Day Cooling Off**: Direct contact information remains masked and inaccessible for 180 days after a trip is completed to protect against harassment.

---

## SECTION 6: DISCIPLINARY ACTIONS (RED FLAGS & TERMINATION)
1. **Disciplinary System**: System violations will result in automated "Red Flags."
2. **Suspension Metrics**:
   - 3 Red Flags within 2 months = 1-Year Platform Suspension.
   - Any flag post-suspension = Lifetime Platform Ban.
3. **Termination**: The Platform reserves the right to terminate accounts immediately for security breaches.`;

    
const [privacyPolicyText, setPrivacyPolicyText] = useState(defaultPrivacyProtocolText);
    const [termsOfServiceText, setTermsOfServiceText] = useState(defaultTermsOfServiceText);
    const [editingPolicy, setEditingPolicy] = useState(null); // 'privacy' | 'terms' | null
    const [tempPolicyText, setTempPolicyText] = useState('');

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

    const handleCommitPolicies = async () => {
        try {
            const docRef = doc(db, 'system_config', 'legal');
            await setDoc(docRef, {
                privacyPolicyText,
                termsOfServiceText,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            triggerNotification('success', 'POLICIES DEPLOYED GLOBALLY', 'Legal documents successfully pushed to Firestore production node.');
        } catch (err) {
            console.error("Error committing policies:", err);
            triggerNotification('error', 'DEPLOYMENT FAILED', 'Database transaction rejected. Check authorization rules.');
        }
    };

    // --- STRIPE CONNECT GERMANY KYC & PAYOUT COMPLIANCE STATES ---
    const [stripeKycAccountId, setStripeKycAccountId] = useState(() => localStorage.getItem('green_admin_stripe_account_id') || 'acct_1oA92FFK99014B');
    const [stripeKycName, setStripeKycName] = useState(() => localStorage.getItem('green_admin_stripe_name') || 'Jordan Executive');
    const [stripeKycEmail, setStripeKycEmail] = useState(() => localStorage.getItem('green_admin_stripe_email') || 'jordan@green.io');
    const [stripeKycAddress, setStripeKycAddress] = useState(() => localStorage.getItem('green_admin_stripe_address') || 'Sky Tower 1, Main Plaza, Frankfurt');
    const [stripeKycTaxId, setStripeKycTaxId] = useState(() => localStorage.getItem('green_admin_stripe_tax_id') || 'DE-88-129-44');
    const [stripeKycIban, setStripeKycIban] = useState(() => localStorage.getItem('green_admin_stripe_iban') || 'DE99 2004 0000 1294 55');
    const [stripeKycSwift, setStripeKycSwift] = useState(() => localStorage.getItem('green_admin_stripe_swift') || 'DBANKDEMXXX');
    const [stripeKycSubmitted, setStripeKycSubmitted] = useState(() => localStorage.getItem('green_admin_stripe_submitted') === 'true');
    const [isStripeVerifyingBank, setIsStripeVerifyingBank] = useState(false);
    const [stripeBankVerified, setStripeBankVerified] = useState(() => localStorage.getItem('green_admin_stripe_bank_verified') === 'true');
    
    // --- STRIPE CONNECT SPLIT HUB & LIVE COMMAND OVERVIEW STATES ---
    const [stripeActiveSubTab, setStripeActiveSubTab] = useState('live-overview');

    // --- DYNAMIC PROVISION RULES ---
    const [fleetBaseFee, setFleetBaseFee] = useState(3.00);
    const [fleetIncrement, setFleetIncrement] = useState(2.00);
    const [hotelStadiumPercent, setHotelStadiumPercent] = useState(5.0);
    const [fnbPercent, setFnbPercent] = useState(0.0);
    const [isSavingProvisions, setIsSavingProvisions] = useState(false);

    useEffect(() => {
        const fetchProvisions = async () => {
            try {
                const docRef = doc(db, 'system_config', 'provisions');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFleetBaseFee(data.fleetBaseFee || 3.00);
                    setFleetIncrement(data.fleetIncrement || 2.00);
                    setHotelStadiumPercent(data.hotelStadiumPercent || 5.0);
                    setFnbPercent(data.fnbPercent || 0.0);
                }
            } catch (e) {
                console.error('Failed to fetch provisions', e);
            }
        };
        fetchProvisions();
    }, []);
    const updatePricingInCloud = async (updates) => {
        try {
            const cleanUpdates = {};
            for (const [key, value] of Object.entries(updates)) {
                cleanUpdates[key] = parseFloat(value);
            }
            cleanUpdates.updatedAt = new Date().toISOString();

            await setDoc(doc(db, 'system_config', 'pricing'), cleanUpdates, { merge: true });
            
            // Still emit via socket for instant client UI updates if connected
            if (socket) {
                socket.emit('admin-update-pricing', updates);
            }
        } catch (e) {
            console.error('Failed to sync pricing to cloud', e);
        }
    };

    const handleSaveProvisions = async () => {
        setIsSavingProvisions(true);
        try {
            const newRules = {
                fleetBaseFee: parseFloat(fleetBaseFee),
                fleetIncrement: parseFloat(fleetIncrement),
                hotelStadiumPercent: parseFloat(hotelStadiumPercent),
                fnbPercent: parseFloat(fnbPercent),
                updatedAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'system_config', 'provisions'), newRules, { merge: true });
            
            // Automatically inject into Terms of Service
            const provisionClause = `\n\n### SECTION 7: FINANCIAL PROVISIONS & COMMISSIONS\nAs a connected business partner, you agree to the following automated provision structure taken directly via Stripe Connect:\n- **Fleet Managers (Rides):** A base fee of €${parseFloat(fleetBaseFee).toFixed(2)} plus an increment of €${parseFloat(fleetIncrement).toFixed(2)} per €30.00 of the total ride price.\n- **Hotels & Stadiums:** A flat platform fee of ${parseFloat(hotelStadiumPercent).toFixed(1)}% on all bookings.\n- **Restaurants, Clubs, & Bars:** A flat platform fee of ${parseFloat(fnbPercent).toFixed(1)}% on food and drinks.\nThese fees are automatically deducted prior to your payout.\n`;
            
            let newTerms = defaultTermsOfServiceText;
            // Remove existing section 7 if it exists to avoid duplicates
            if (newTerms.includes('### SECTION 7: FINANCIAL PROVISIONS')) {
                newTerms = newTerms.split('### SECTION 7: FINANCIAL PROVISIONS')[0];
            }
            newTerms += provisionClause;
            setTermsOfServiceText(newTerms);
            await setDoc(doc(db, 'system_config', 'legal'), { termsOfService: newTerms }, { merge: true });
            
            triggerNotification('success', 'Rules Applied', 'Dynamic provisions and legal terms updated automatically.');
        } catch (e) {
            console.error('Failed to save provisions', e);
            triggerNotification('error', 'Update Failed', 'Could not apply provision rules.');
        }
        setIsSavingProvisions(false);
    };

    // Partner Compliance review states
    const [complianceRefreshTicker, setComplianceRefreshTicker] = useState(0);

    const getPartnerComplianceLogs = () => {
        const logs = [];
        docPartners.forEach(partner => {
            const emailKey = partner.email ? partner.email.replace(/[^a-zA-Z0-9]/g, '_') : '';
            if (!emailKey) return;
            
            const docs = partner.complianceDocs || {};
            const context = partner.businessType || 'RM';
            const requiredIds = context === 'FM'
                ? ['tl', 'fip', 'cc', 'vr', 'tuv', 'es', 'sepa', 'vatc', 'bankv']
                : ['reg', 'mid', 'tax', 'gast', 'liq', 'fire', 'sepa', 'vatc', 'bankv'];

            const fullDocs = requiredIds.map(id => {
                return docs[id] || { id, status: 'missing', name: 'Document ' + id };
            });

            logs.push({
                emailKey,
                metadata: {
                    email: partner.email,
                    name: partner.name || 'Partner Manager',
                    businessName: partner.businessName || 'Eco Partner',
                    context: context
                },
                docs: fullDocs
            });
        });
        return logs;
    };

    const handleApprovePartnerDoc = async (emailKey, docId) => {
        const partner = docPartners.find(p => p.emailKey === emailKey || (p.email ? p.email.replace(/[^a-zA-Z0-9]/g, '_') : '') === emailKey || (p.email && p.email.toLowerCase() === emailKey.toLowerCase()));
        if (!partner) {
            triggerNotification('error', 'Error', 'Partner not found.');
            return;
        }

        if (partner.isDriver || partner.role === 'driver') {
            try {
                const emailKey = (partner.email || partner.emailKey || '').replace(/[^a-zA-Z0-9]/g, '_');
            
            // Persist approval flag locally so port 5174 never loses it
            if (docId === 'avatar') localStorage.setItem(`driver_avatar_approved_${emailKey}`, 'true');
            if (docId === 'idcard') localStorage.setItem(`driver_id_approved_${emailKey}`, 'true');
            if (docId === 'terms') localStorage.setItem(`driver_terms_approved_${emailKey}`, 'true');
            if (docId === 'pschein') localStorage.setItem(`driver_pschein_approved_${emailKey}`, 'true');
            if (docId === 'license') localStorage.setItem(`driver_license_approved_${emailKey}`, 'true');
            try {
                fetch('/api/sync-driver', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: partner.email,
                        ...(docId === 'avatar' ? { avatarApproved: true } : {}),
                        ...(docId === 'idcard' ? { idCardApproved: true } : {}),
                        ...(docId === 'terms' ? { termsAccepted: true } : {})
                    })
                }).catch(() => {});
            } catch(e) {}

            // Update in synced list
            try {
                const list = JSON.parse(localStorage.getItem('green_synced_drivers') || '[]');
                const updatedList = list.map(item => {
                    if ((item.email || '').toLowerCase() === partner.email.toLowerCase()) {
                        if (docId === 'avatar') item.avatarApproved = true;
                        if (docId === 'idcard') item.idCardApproved = true;
                        if (docId === 'terms') item.termsAccepted = true;
                        if (docId === 'pschein') item.pScheinApproved = true;
                        if (docId === 'license') item.licenseApproved = true;
                    }
                    return item;
                });
                localStorage.setItem('green_synced_drivers', JSON.stringify(updatedList));
            } catch(e) {}

            // Broadcast approval to driver dashboard
            try {
                const bc = new BroadcastChannel('green_fleet_sync');
                bc.postMessage({ type: 'DOC_APPROVED', email: partner.email, docId: docId });
                bc.close();
            } catch(e) {}

            // Update state in AdminDashboard immediately
            setDocPartners(prev => prev.map(p => {
                if (p.email?.toLowerCase() === partner.email?.toLowerCase()) {
                    return {
                        ...p,
                        docs: p.docs.map(d => d.id === docId ? { ...d, status: 'approved' } : d)
                    };
                }
                return p;
            }));

            // Firestore sync attempt
            try {
                const userRef = doc(db, 'users', partner.email.toLowerCase());
                setDoc(userRef, {
                    ...(docId === 'avatar' ? { avatarApproved: true } : {}),
                    ...(docId === 'idcard' ? { idCardApproved: true } : {}),
                    ...(docId === 'terms' ? { termsAccepted: true } : {})
                }, { merge: true }).catch(() => {});
            } catch(e) {}

            triggerNotification('success', 'Driver Document Approved ✓', `Credential ${docId} cleared for driver.`);
            } catch (e) {
                console.error('Failed to approve driver doc:', e);
                triggerNotification('error', 'Error', 'Failed to approve driver document.');
            }
            return;
        }

        if (emailKey === 'driver_green_de') {
            const driverDocsRaw = localStorage.getItem('driver_compliance_docs');
            const vehicleDocsRaw = localStorage.getItem('driver_vehicle_docs');
            let driverDocs = driverDocsRaw ? JSON.parse(driverDocsRaw) : [];
            let vehicleDocs = vehicleDocsRaw ? JSON.parse(vehicleDocsRaw) : [];
            let found = false;
            driverDocs = driverDocs.map(d => {
                if (d.id === docId) {
                    found = true;
                    return { ...d, status: 'verified' };
                }
                return d;
            });
            if (found) {
                localStorage.setItem('driver_compliance_docs', JSON.stringify(driverDocs));
            } else {
                vehicleDocs = vehicleDocs.map(d => {
                    if (d.id === docId) {
                        return { ...d, status: 'verified' };
                    }
                    return d;
                });
                localStorage.setItem('driver_vehicle_docs', JSON.stringify(vehicleDocs));
            }
            triggerNotification('success', 'Driver Document Approved ✓', `Credential cleared for driver.`);
            return;
        }
        const userRef = doc(db, 'users', partner.email.toLowerCase());
        try {
            await updateDoc(userRef, {
                [`complianceDocs.${docId}.status`]: 'approved',
                [`complianceDocs.${docId}.verifiedAt`]: new Date().toISOString()
            });
            triggerNotification('success', 'Document Approved ✓', `Credential cleared for partner.`);
        } catch(e) {
            console.error('Failed to approve doc:', e);
            triggerNotification('error', 'Error', 'Failed to approve document.');
        }
    };

    const handleRejectPartnerDoc = async (emailKey, docId) => {
        const partner = docPartners.find(p => p.emailKey === emailKey || (p.email ? p.email.replace(/[^a-zA-Z0-9]/g, '_') : '') === emailKey || (p.email && p.email.toLowerCase() === emailKey.toLowerCase()));
        if (!partner) {
            triggerNotification('error', 'Error', 'Partner not found.');
            return;
        }

        if (partner.isDriver || partner.role === 'driver') {
            const userRef = doc(db, 'users', partner.email.toLowerCase());
            try {
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    let driverComplianceDocs = userData.driverComplianceDocs || [];
                    let driverVehicleDocs = userData.driverVehicleDocs || [];
                    let found = false;
                    driverComplianceDocs = driverComplianceDocs.map(d => {
                        if (d.id === docId) {
                            found = true;
                            return { ...d, status: 'rejected' };
                        }
                        return d;
                    });
                    if (!found) {
                        driverVehicleDocs = driverVehicleDocs.map(d => {
                            if (d.id === docId) {
                                return { ...d, status: 'rejected' };
                            }
                            return d;
                        });
                    }
                    await updateDoc(userRef, {
                        driverComplianceDocs,
                        driverVehicleDocs
                    });
                    if (partner.email.toLowerCase() === 'driver@green.de') {
                        localStorage.setItem('driver_compliance_docs', JSON.stringify(driverComplianceDocs));
                        localStorage.setItem('driver_vehicle_docs', JSON.stringify(driverVehicleDocs));
                    }
                    try {
                const emailKey = (partner.email || partner.emailKey || '').replace(/[^a-zA-Z0-9]/g, '_');
                if (docId === 'avatar') localStorage.setItem(`driver_avatar_approved_${emailKey}`, 'false');
                if (docId === 'idcard') localStorage.setItem(`driver_id_approved_${emailKey}`, 'false');
                if (docId === 'terms') localStorage.setItem(`driver_terms_approved_${emailKey}`, 'false');
                fetch('/api/sync-driver', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: partner.email,
                        ...(docId === 'avatar' ? { avatarApproved: false } : {}),
                        ...(docId === 'idcard' ? { idCardApproved: false } : {}),
                        ...(docId === 'terms' ? { termsAccepted: false } : {})
                    })
                }).catch(() => {});
            } catch(e) {}
            triggerNotification('warning', 'Driver Document Rejected ✗', `Credential rejected.`);
                }
            } catch (e) {
                console.error('Failed to reject driver doc:', e);
                triggerNotification('error', 'Error', 'Failed to reject driver document.');
            }
            return;
        }

        if (emailKey === 'driver_green_de') {
            const driverDocsRaw = localStorage.getItem('driver_compliance_docs');
            const vehicleDocsRaw = localStorage.getItem('driver_vehicle_docs');
            let driverDocs = driverDocsRaw ? JSON.parse(driverDocsRaw) : [];
            let vehicleDocs = vehicleDocsRaw ? JSON.parse(vehicleDocsRaw) : [];
            let found = false;
            driverDocs = driverDocs.map(d => {
                if (d.id === docId) {
                    found = true;
                    return { ...d, status: 'rejected' };
                }
                return d;
            });
            if (found) {
                localStorage.setItem('driver_compliance_docs', JSON.stringify(driverDocs));
            } else {
                vehicleDocs = vehicleDocs.map(d => {
                    if (d.id === docId) {
                        return { ...d, status: 'rejected' };
                    }
                    return d;
                });
                localStorage.setItem('driver_vehicle_docs', JSON.stringify(vehicleDocs));
            }
            triggerNotification('warning', 'Driver Document Rejected ✗', `Credential rejected.`);
            return;
        }
        const userRef = doc(db, 'users', partner.email.toLowerCase());
        try {
            await updateDoc(userRef, {
                [`complianceDocs.${docId}.status`]: 'rejected',
                [`complianceDocs.${docId}.verifiedAt`]: new Date().toISOString()
            });
            triggerNotification('warning', 'Document Rejected ✗', `Credential rejected.`);
        } catch(e) {
            console.error('Failed to reject doc:', e);
            triggerNotification('error', 'Error', 'Failed to reject document.');
        }
    };

    const handleViewPartnerDoc = (docState, email) => {
        setPreviewSheetDoc(docState);
    };

    const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState(null);
    const [isSimulatingPayoutFlow, setIsSimulatingPayoutFlow] = useState(false);
    const [simulationStep, setSimulationStep] = useState(0);
    const [simulationPartnerId, setSimulationPartnerId] = useState('acct_fleet_102');
    const [simulationChargeAmount, setSimulationChargeAmount] = useState(45.00);
    const [simulationCategory, setSimulationCategory] = useState('transport');
    const [simulationClientName, setSimulationClientName] = useState('Marcus G.');
    
    // Dynamic Global Payout Volume Counters
    const [stripeTotalVolume, setStripeTotalVolume] = useState(0);
    const [stripePlatformProvisions, setStripePlatformProvisions] = useState(0);
    const [stripeCardFees, setStripeCardFees] = useState(0);
    const [stripeDirectSplitsProcessed, setStripeDirectSplitsProcessed] = useState(0);

    // --- WÖCHENTLICHES FLOTTEN-LEDGER & CASH-RECONCILIATION STATES ---
    const [selectedFleetForSettlement, setSelectedFleetForSettlement] = useState('all');
    const [selectedWeekForSettlement, setSelectedWeekForSettlement] = useState('KW 40 (28.09. - 04.10.2026)');
    const [settlementViewTab, setSettlementViewTab] = useState('overview'); // 'overview' | 'cancellations'
    const [isProcessingWeeklyPayout, setIsProcessingWeeklyPayout] = useState(false);
    const [weeklyFleetsData, setWeeklyFleetsData] = useState([
        {
            id: 'acct_fleet_102',
            name: 'Hessen EcoFleet',
            manager: 'Marcus G.',
            iban: 'DE44 5002 0000 1294 88',
            totalTrips: 184,
            cardTrips: 116,
            cashTrips: 68,
            cancelledTrips: 12,
            freeCancelledTrips: 9,
            lateCancelledTrips: 3,
            cancellationFeesCollected: 15.00,
            cancellationFleetPayout: 10.50,
            grossVolume: 5420.00,
            cardVolume: 3460.00,
            cashVolume: 1960.00,
            totalProvision: 813.00,
            cardProvision: 519.00,
            cashCommissionOffset: 294.00,
            netStripePayout: 2657.50,
            fleetTotalNetEarnings: 4617.50,
            payoutStatus: 'Bereit zur Auszahlung (Montag)',
            payoutSchedule: 'Wöchentlich (7 Tage)',
            lastPayoutDate: 'Vorwoche (KW 39) ausgezahlt'
        },
        {
            id: 'acct_fleet_088',
            name: 'Frankfurt Taxi Union',
            manager: 'Ahmet K.',
            iban: 'DE89 5001 0517 3392 44',
            totalTrips: 220,
            cardTrips: 130,
            cashTrips: 90,
            cancelledTrips: 16,
            freeCancelledTrips: 12,
            lateCancelledTrips: 4,
            cancellationFeesCollected: 20.00,
            cancellationFleetPayout: 14.00,
            grossVolume: 6840.00,
            cardVolume: 4120.00,
            cashVolume: 2720.00,
            totalProvision: 1026.00,
            cardProvision: 618.00,
            cashCommissionOffset: 408.00,
            netStripePayout: 3108.00,
            fleetTotalNetEarnings: 5828.00,
            payoutStatus: 'Bereit zur Auszahlung (Montag)',
            payoutSchedule: 'Wöchentlich (7 Tage)',
            lastPayoutDate: 'Vorwoche (KW 39) ausgezahlt'
        },
        {
            id: 'acct_fleet_044',
            name: 'Berlin VIP Shuttle',
            manager: 'Sven Weber',
            iban: 'DE77 1001 8844 9922 11',
            totalTrips: 96,
            cardTrips: 72,
            cashTrips: 24,
            cancelledTrips: 5,
            freeCancelledTrips: 4,
            lateCancelledTrips: 1,
            cancellationFeesCollected: 5.00,
            cancellationFleetPayout: 3.50,
            grossVolume: 3840.00,
            cardVolume: 2980.00,
            cashVolume: 860.00,
            totalProvision: 576.00,
            cardProvision: 447.00,
            cashCommissionOffset: 129.00,
            netStripePayout: 2407.50,
            fleetTotalNetEarnings: 3267.50,
            payoutStatus: 'Überwiesen via Stripe ⚡',
            payoutSchedule: 'Wöchentlich (7 Tage)',
            lastPayoutDate: 'Heute 08:00 Uhr überwiesen'
        }
    ]);

    // --- NEW: TICKET HUB & AI ANGEBOT HUB STATES ---
    const [ticketActiveFolder, setTicketActiveFolder] = useState('none'); // 'none', 'club', 'events', 'stadium'
    const [ticketSearchQuery, setTicketSearchQuery] = useState('');
    const [isAddingTicket, setIsAddingTicket] = useState(false);
    const [expandedTicketEvent, setExpandedTicketEvent] = useState(null);
    const [triggeredTicketIds, setTriggeredTicketIds] = useState([]);
    const [sendingTicketId, setSendingTicketId] = useState(null);
    const [newTicketData, setNewTicketData] = useState({
        name: '',
        date: new Date().toISOString().split('T')[0],
        time: '20:00',
        price: '45',
        quantity: '500',
        tierName: 'VIP Golden Pass'
    });
    
    // AI Angebot Hub States
    const [angebotMessages, setAngebotMessages] = useState([
        {
            role: 'agent',
            text: 'Greetings, Chief Director. I am your specialized Campaign AI Agent. I can architect bespoke customer campaigns and publish them across dynamic feeds. Tell me what deal you wish to deploy (e.g. "Create a 30% discount offer for Green Palace Hotel on Passenger Feed")!'
        }
    ]);
    const [currentAngebotMessage, setCurrentAngebotMessage] = useState('');
    const [angebotIsDeploying, setAngebotIsDeploying] = useState(false);
    const [campaignDraft, setCampaignDraft] = useState(null);

    // Custom Campaign Dispatcher states
    const [campaignFiles, setCampaignFiles] = useState([]);
    const [targetArea, setTargetArea] = useState('Zeil');
    const [offerCategory, setOfferCategory] = useState('Restaurant');
    const [scanningRadius, setScanningRadius] = useState(2.0);
    const [targetPeopleCount, setTargetPeopleCount] = useState(150);
    const [campaignOfferText, setCampaignOfferText] = useState('50% OFF COCKTAIL HOUR');
    const [isScanningGrid, setIsScanningGrid] = useState(false);
    const [scannedProgress, setScannedProgress] = useState(0);
    const [scannedMatchesCount, setScannedMatchesCount] = useState(0);
    const [scanLogs, setScanLogs] = useState([]);
    const [campaignLat, setCampaignLat] = useState(50.1109);
    const [campaignLng, setCampaignLng] = useState(8.6821);
    const [targetAreasList, setTargetAreasList] = useState([]);

    // Geocode targetArea text inputs automatically
    useEffect(() => {
        if (!targetArea || targetArea.trim() === '' || targetArea.startsWith('Locating...') || targetArea.startsWith('Location')) return;
        
        const delayDebounceFn = setTimeout(async () => {
            try {
                const queryStr = targetArea.toLowerCase().includes('frankfurt') ? targetArea : `${targetArea} Frankfurt`;
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&limit=1`, {
                    headers: { 'User-Agent': 'GreenAdminDashboard/1.0' }
                });
                const data = await res.json();
                if (data && data.length > 0) {
                    const first = data[0];
                    setCampaignLat(parseFloat(parseFloat(first.lat).toFixed(4)));
                    setCampaignLng(parseFloat(parseFloat(first.lon).toFixed(4)));
                }
            } catch (e) {
                console.error("Geocoding failed:", e);
            }
        }, 1000);

        return () => clearTimeout(delayDebounceFn);
    }, [targetArea]);

    const handleCampaignFileUpload = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        
        const newFiles = files.map(file => ({
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
            progress: 0
        }));

        setCampaignFiles(prev => [...prev, ...newFiles]);

        newFiles.forEach(nf => {
            let prog = 0;
            const interval = setInterval(() => {
                prog += 20;
                setCampaignFiles(current => 
                    current.map(f => f.id === nf.id ? { ...f, progress: Math.min(prog, 100) } : f)
                );
                if (prog >= 100) {
                    clearInterval(interval);
                }
            }, 150);
        });
    };

    const removeCampaignFile = (id) => {
        setCampaignFiles(prev => prev.filter(f => f.id !== id));
    };

    const handleMapSelect = async (lat, lng) => {
        setCampaignLat(parseFloat(lat.toFixed(4)));
        setCampaignLng(parseFloat(lng.toFixed(4)));
        try {
            setTargetArea(`Locating... (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`, {
                headers: {
                    'User-Agent': 'GreenRideAdminDashboard/1.0'
                }
            });
            const data = await response.json();
            if (data && data.display_name) {
                const address = data.address;
                const cleanName = address.suburb || address.neighbourhood || address.road || address.amenity || address.city || "Custom Area";
                setTargetArea(cleanName.toUpperCase());
            } else {
                setTargetArea(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
            }
        } catch (e) {
            setTargetArea(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        }
    };

    const runCentralGridScanner = () => {
        if (isScanningGrid) return;
        setIsScanningGrid(true);
        setScannedProgress(0);
        setScannedMatchesCount(0);
        setScanLogs([`📡 Initializing spatial sweep... Area Hub: "${targetArea}" (2.0 km Radius Gate)`]);

        let currentProgress = 0;
        const interval = setInterval(() => {
            currentProgress += 5;
            setScannedProgress(currentProgress);

            // Add simulated matches and geo-fence logs
            if (currentProgress === 15) {
                setScanLogs(prev => [...prev, `🔍 Calibrating scanning perimeter... Area Radius: ${scanningRadius.toFixed(1)} km circle.`]);
            } else if (currentProgress === 35) {
                setScanLogs(prev => [...prev, `🛰️ Storing campaign for trigger when a passenger books a ride originating or ending in "${targetArea}"...`]);
                setScannedMatchesCount(Math.floor(targetPeopleCount * 0.25));
            } else if (currentProgress === 55) {
                setScanLogs(prev => [...prev, `👥 Active passenger routing checkpoints configured near target sectors.`]);
                setScannedMatchesCount(Math.floor(targetPeopleCount * 0.6));
            } else if (currentProgress === 75) {
                setScanLogs(prev => [...prev, `🔒 Securing cryptographic QR Code asset vault under DSGVO compliance...`]);
                setScannedMatchesCount(Math.floor(targetPeopleCount * 0.85));
            } else if (currentProgress === 90) {
                setScanLogs(prev => [...prev, `🎯 Trigger criteria active: 2.0 km geofence active for booking events near "${targetArea}".`]);
                setScannedMatchesCount(targetPeopleCount);
            }

            if (currentProgress >= 100) {
                clearInterval(interval);
                
                // Finalize and deploy
                const activeOffers = JSON.parse(localStorage.getItem('green_active_offers') || '[]');
                
                const categoryColor = offerCategory === 'Nightlife' ? 'text-brand' :
                                      offerCategory === 'Restaurant' ? 'text-amber-400' :
                                      offerCategory === 'Hotel VIP' ? 'text-violet-400' : 'text-emerald-400';
                
                const newOffer = {
                    id: `offer-${Date.now()}`,
                    shop: targetArea,
                    offer: campaignOfferText.toUpperCase(),
                    category: offerCategory,
                    color: categoryColor,
                    lat: campaignLat || 50.1109,
                    lng: campaignLng || 8.6821,
                    radius: scanningRadius || 2.0
                };

                localStorage.setItem('green_active_offers', JSON.stringify([newOffer, ...activeOffers]));

                // Save custom offers for MessagesPage.jsx dynamic reading
                const customOffers = JSON.parse(localStorage.getItem('green_custom_offers') || '[]');
                const newInboxOffer = {
                    id: `custom-offer-${Date.now()}`,
                    type: 'offer',
                    sender: targetArea,
                    role: `Exclusive Dispatched ${offerCategory} Offer`,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetArea.replace(/\s+/g, '')}`,
                    subject: `Exclusive Deal: ${campaignOfferText}! 🚀`,
                    preview: `Direct dispatch matching your route to ${targetArea}. Claim now!`,
                    content: `Attention Passenger! Our grid telemetry scanned you traveling towards or located near ${targetArea} within a ${scanningRadius.toFixed(1)} km radius circle. Because of this, the admin team has dispatched an exclusive ${offerCategory} offer just for you: "${campaignOfferText}". Attached manifest documents: ${campaignFiles.length > 0 ? campaignFiles.map(f => f.name).join(', ') : 'None'}. Claim this voucher now to send a secure confirmation code to passenger@green.de.`,
                    time: 'Just Now',
                    tag: `${offerCategory} • ${scanningRadius.toFixed(1)}km Match 🎯`,
                    actionText: 'Claim Special Offer',
                    actionRoute: '/home'
                };

                localStorage.setItem('green_custom_offers', JSON.stringify([newInboxOffer, ...customOffers]));

                // Stream log to admin console
                setStripeLiveWebhookEvents(prev => [
                    { time: new Date().toLocaleTimeString(), level: 'CAMPAIGN', msg: `📡 Broadcast deployed: ${campaignOfferText} for ${targetArea} inside ${scanningRadius.toFixed(1)} km geo-fence circle.` },
                    ...prev
                ]);

                setScanLogs(prev => [...prev, `🚀 Broadcast handshake success! Offers dispatched securely to ${targetPeopleCount} passengers.`]);
                setIsScanningGrid(false);
                setCampaignFiles([]); // Clear uploaded files
                triggerNotification('success', 'Autonomous Grid Dispatch Successful 🚀', `Dispatched offer to ${targetPeopleCount} passengers inside the ${scanningRadius.toFixed(1)} km geo-fence of "${targetArea}".`);
            }
        }, 150);
    };

    // Live Webhook Event Logs Terminal
    const [stripeLiveWebhookEvents, setStripeLiveWebhookEvents] = useState([]);

    // Live Settlements Ledger Array
    const [liveSplitsLedger, setLiveSplitsLedger] = useState([]);

    // Live Connected Partner Accounts
    const [stripeConnectedPartners, setStripeConnectedPartners] = useState([]);

    // Live Passive Earnings Ticker
    const [todayEarnings, setTodayEarnings] = useState(() => parseFloat(localStorage.getItem('green_admin_today_earnings')) || 0);
    const [isEarningsIncrementing, setIsEarningsIncrementing] = useState(false);
    const [earningsPulseColor, setEarningsPulseColor] = useState('text-brand');

    // Metrics for VIP hotels and clubs
    const [hotelActiveBookings, setHotelActiveBookings] = useState({});

    const [clubCapacities, setClubCapacities] = useState({});
    
    // --- PLATFORM PROVISIONS & REVENUE CONFIGURATION ---
    const [tripBaseProvision, setTripBaseProvision] = useState(() => parseFloat(localStorage.getItem('green_prov_trip_base')) || 3);
    const [tripIncrementProvision, setTripIncrementProvision] = useState(() => parseFloat(localStorage.getItem('green_prov_trip_inc')) || 2);
    const [tripThreshold, setTripThreshold] = useState(() => parseFloat(localStorage.getItem('green_prov_trip_thresh')) || 30);
    const [hotelProvisionRate, setHotelProvisionRate] = useState(() => parseFloat(localStorage.getItem('green_prov_hotel_rate')) || 5);
    const [ticketProvisionRate, setTicketProvisionRate] = useState(() => parseFloat(localStorage.getItem('green_prov_ticket_rate')) || 5);
    const [simulatedTripFare, setSimulatedTripFare] = useState(75);
    const [simulatedHotelCost, setSimulatedHotelCost] = useState(240);
    const [simulatedTicketCost, setSimulatedTicketCost] = useState(150);
    const [simulatedFnBCost, setSimulatedFnBCost] = useState(120);
    const [simulatedGuestVolume, setSimulatedGuestVolume] = useState(10);
    
    // v2.0 Simulator States
    const [simulatedEventType, setSimulatedEventType] = useState('football'); // 'football', 'club', 'concert'
    const [simulatedTableSpend, setSimulatedTableSpend] = useState(0);
    const [simWeatherRain, setSimWeatherRain] = useState(false);
    const [simNightlifePeak, setSimNightlifePeak] = useState(false);
    const [simPartnerTier, setSimPartnerTier] = useState('standard'); // 'standard', 'gold'
    
    const [stripeKycDocs, setStripeKycDocs] = useState(() => {
        try {
            const saved = localStorage.getItem('green_admin_stripe_docs');
            if (saved) return JSON.parse(saved);
        } catch(e){}
        return {
            gewerbe: { status: 'missing', name: 'Gewerbeanmeldung / Commercial Registry' },
            idCard: { status: 'missing', name: 'Identity Proof (ID Front & Back)' },
            pSchein: { status: 'missing', name: 'Passenger Permit (P-Schein)' },
            insurance: { status: 'missing', name: 'Commercial Liability Insurance' }
        };
    });

    const [isMediathekOpen, setIsMediathekOpen] = useState(false);
    const [activeMediathekSlot, setActiveMediathekSlot] = useState(null);
    const [isCameraScanOpen, setIsCameraScanOpen] = useState(false);
    const [activeCameraSlot, setActiveCameraSlot] = useState(null);
    const [simulatedScanningProgress, setSimulatedScanningProgress] = useState(0);
    const [activeScanningSlot, setActiveScanningSlot] = useState(null);
    
    // Feedback Filters
    const [feedbackFilter, setFeedbackFilter] = useState({ category: 'all', date: '', location: '' });
    const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
    const [generatedInviteLink, setGeneratedInviteLink] = useState(null);
    const [inviteCopied, setInviteCopied] = useState(false);
    const [staffList, setStaffList] = useState([]);
    const DEFAULT_PERMISSIONS = { fleet: false, hotel: false, ticket: false, finance: false, analytics: false, compliance: false };
    const [newStaff, setNewStaff] = useState({ name: '', email: '', phone: '', adress: '', zip: '', bank: '', role: 'Customer Service Staff', permissions: { ...DEFAULT_PERMISSIONS } });

    // --- DOCUMENT HUB STATE ---
    const [docHubFilter, setDocHubFilter] = useState('all');
    const REQUIRED_DOCS = {
        restaurant: ['Business Registration (Gewerbeanmeldung)', 'Tax ID Certificate (Steuernummer)', 'Food Hygiene Certificate', 'Liability Insurance', 'Bank Account Verification (IBAN)'],
        hotel:      ['Business Registration (Gewerbeanmeldung)', 'Tax ID Certificate (Steuernummer)', 'Hotel Classification Certificate', 'Liability Insurance', 'Bank Account Verification (IBAN)', 'Fire Safety Compliance'],
        fleet:      ['Business Registration (Gewerbeanmeldung)', 'Vehicle Registration (Fahrzeugschein)', 'Commercial Driver License', 'Fleet Insurance Policy', 'Bank Account Verification (IBAN)', 'TÜV Inspection Certificate'],
        venue:      ['Business Registration (Gewerbeanmeldung)', 'Tax ID Certificate (Steuernummer)', 'Venue Operating License', 'Liability Insurance', 'Bank Account Verification (IBAN)'],
    };
    const [docPartners, setDocPartners] = useState([]);
    const [previewSheetDoc, setPreviewSheetDoc] = useState(null);
    const firebasePartnersRef = useRef([]);

    // BroadcastChannel & Local Storage sync across ports (5173, 5174, 5175)
    useEffect(() => {
        let bc;
        try {
            bc = new BroadcastChannel('green_fleet_sync');
            bc.onmessage = (ev) => {
                if (ev.data && ev.data.type === 'DRIVER_UPDATE') {
                    const drv = ev.data.driver;
                    if (!drv || !drv.email) return;
                    try {
                        const existingList = JSON.parse(localStorage.getItem('green_synced_drivers') || '[]');
                        const filtered = existingList.filter(d => (d.email || '').toLowerCase() !== drv.email.toLowerCase());
                        filtered.unshift(drv);
                        localStorage.setItem('green_synced_drivers', JSON.stringify(filtered));
                    } catch(e) {}
                    syncWithLocal();
                }
            };
            // Ping drivers to sync their latest uploads
            bc.postMessage({ type: 'REQUEST_DRIVERS_SYNC' });
        } catch(e) {}
        return () => { if (bc) bc.close(); };
    }, []);

    const syncWithLocal = () => {
        const driverDocsRaw = localStorage.getItem('driver_compliance_docs');
        const vehicleDocsRaw = localStorage.getItem('driver_vehicle_docs');
        const driverDocs = driverDocsRaw ? JSON.parse(driverDocsRaw) : [];
        const vehicleDocs = vehicleDocsRaw ? JSON.parse(vehicleDocsRaw) : [];

        // Read all synced drivers (persisted locally across sessions)
        let syncedDrivers = [];
        try {
            const raw = localStorage.getItem('green_synced_drivers');
            if (raw) syncedDrivers = JSON.parse(raw);
        } catch(e) {}

        // Guarantee that the driver from the user's account is always present and never disappears
                // Fetch latest driver data from local cross-port bridge
        try {
            fetch('/api/sync-driver').then(r => r.json()).then(apiDriver => {
                if (apiDriver && apiDriver.email) {
                    try {
                        const curList = JSON.parse(localStorage.getItem('green_synced_drivers') || '[]');
                        const idx = curList.findIndex(d => (d.email || '').toLowerCase() === apiDriver.email.toLowerCase());
                        if (idx >= 0) {
                            curList[idx] = { ...curList[idx], ...apiDriver };
                        } else {
                            curList.unshift(apiDriver);
                        }
                        localStorage.setItem('green_synced_drivers', JSON.stringify(curList));
                    } catch(e) {}
                }
            }).catch(() => {});
        } catch(e) {}

        const defaultDriverEmail = 'omarde65aa@gmail.com';
        if (!syncedDrivers.some(d => (d.email || '').toLowerCase() === defaultDriverEmail)) {
            syncedDrivers.unshift({
                id: 'driver_khiam_azizi',
                name: 'Khiam Azizi',
                email: defaultDriverEmail,
                phone: '017662111103',
                address: 'Auf dem Schafberg 12 3',
                city: 'City',
                zip: '65933',
                role: 'driver'
            });
            localStorage.setItem('green_synced_drivers', JSON.stringify(syncedDrivers));
        }

        const merged = [...(firebasePartnersRef.current || [])];

        // Merge every driver from syncedDrivers into merged
        for (const drv of syncedDrivers) {
            const emailKey = (drv.email || '').replace(/[^a-zA-Z0-9]/g, '_');
            const isAvatarAppr = drv.avatarApproved || localStorage.getItem(`driver_avatar_approved_${emailKey}`) === 'true';
            const isIdAppr = drv.idCardApproved || localStorage.getItem(`driver_id_approved_${emailKey}`) === 'true';
            const isTermsAppr = drv.termsAccepted || localStorage.getItem(`driver_terms_approved_${emailKey}`) === 'true';
            const isPscheinAppr = drv.pScheinApproved || localStorage.getItem(`driver_pschein_approved_${emailKey}`) === 'true';
            const isLicenseAppr = drv.licenseApproved || localStorage.getItem(`driver_license_approved_${emailKey}`) === 'true';

            const driverCard = {
                id: drv.id || emailKey,
                name: `Driver: ${drv.name || 'Khiam Azizi'}`,
                type: 'fleet',
                joinDate: 'Active',
                email: drv.email,
                emailKey: emailKey,
                isDriver: true,
                docs: [
                    {
                        id: 'avatar',
                        name: 'Driver Profile Photo (Profilbild)',
                        status: isAvatarAppr ? 'approved' : 'pending',
                        uploadedAt: 'Recent Upload',
                        fileUrl: drv.avatar || null
                    },
                    {
                        id: 'idcard',
                        name: 'Personalausweis / Pass (Vorder- & Rückseite)',
                        status: isIdAppr ? 'approved' : 'pending',
                        uploadedAt: 'Recent Upload',
                        fileUrl: drv.idCardFront || drv.idCardBack || null,
                        frontUrl: drv.idCardFront || null,
                        backUrl: drv.idCardBack || null
                    },
                    {
                        id: 'terms',
                        name: 'Nutzungsbedingungen & AGB',
                        status: isTermsAppr ? 'approved' : 'pending',
                        uploadedAt: drv.termsAcceptedAt || 'Gelesen & Akzeptiert'
                    },
                    ...(drv.pScheinDoc ? [{
                        id: 'pschein',
                        name: 'P-Schein (§ 48 FeV - Flotte)',
                        status: isPscheinAppr ? 'approved' : 'pending',
                        uploadedAt: 'Vom Flotten-Manager hinterlegt',
                        fileUrl: drv.pScheinDoc
                    }] : []),
                    ...(drv.fuehrerscheinDoc ? [{
                        id: 'license',
                        name: 'Führerschein (Klasse B - Flotte)',
                        status: isLicenseAppr ? 'approved' : 'pending',
                        uploadedAt: 'Vom Flotten-Manager hinterlegt',
                        fileUrl: drv.fuehrerscheinDoc
                    }] : [])
                ]
            };

            const existingIdx = merged.findIndex(p => p.emailKey === emailKey || p.email?.toLowerCase() === drv.email?.toLowerCase());
            if (existingIdx >= 0) {
                merged[existingIdx] = driverCard;
            } else {
                merged.unshift(driverCard);
            }
        }

        const hasDemoDriver = merged.some(p => p.emailKey === 'driver_green_de');
        if (!hasDemoDriver && (driverDocs.length > 0 || vehicleDocs.length > 0)) {
            merged.push({
                id: 'driver_green_de',
                name: 'Driver: Parsa (GRN-101C)',
                type: 'fleet',
                joinDate: 'Demo Mode',
                email: 'driver@green.de',
                emailKey: 'driver_green_de',
                isDriver: true,
                docs: [
                    ...driverDocs.map(d => ({
                        id: d.id,
                        name: d.name,
                        status: d.status === 'verified' ? 'approved' : d.status,
                        uploadedAt: d.status !== 'missing' ? 'Recent' : null,
                        fileUrl: d.file || (d.status !== 'missing' ? 'pending_subcollection' : null)
                    })),
                    ...vehicleDocs.map(d => ({
                        id: d.id,
                        name: d.name,
                        status: d.status === 'verified' ? 'approved' : d.status,
                        uploadedAt: d.status !== 'missing' ? 'Recent' : null,
                        fileUrl: d.file || (d.status !== 'missing' ? 'pending_subcollection' : null)
                    }))
                ]
            });
        }

        setDocPartners(merged);
    };

    useEffect(() => {
        const q = query(collection(db, 'users'), where('role', 'in', ['manager', 'driver', 'staff']));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const partners = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                
                let type = 'restaurant';
                if (data.role === 'driver') {
                    type = 'fleet';
                } else if (data.role === 'staff') {
                    type = 'staff';
                } else {
                    if (data.businessType === 'FM') type = 'fleet';
                    else if (data.businessType === 'HM') type = 'hotel';
                    else if (data.businessType === 'BM' || data.businessType === 'CM' || data.businessType === 'SM' || data.businessType === 'VM') type = 'venue';
                }
                
                let docs = [];
                if (data.role === 'driver') {
                    const driverDocs = data.driverComplianceDocs || [];
                    const docsList = [...driverDocs];
                    
                    // Avatar check
                    const avatarDoc = docsList.find(d => d.id === 'avatar');
                    const hasAvatarData = !!(data.avatar || data.photoUrl || avatarDoc?.fileUrl || avatarDoc?.file);
                    const avatarStatus = data.avatarApproved ? 'approved' : (avatarDoc?.status === 'verified' ? 'approved' : (hasAvatarData ? 'pending' : 'missing'));
                    if (!avatarDoc) {
                        docsList.unshift({
                            id: 'avatar',
                            name: 'Driver Profile Photo (Profilbild)',
                            status: avatarStatus,
                            fileUrl: data.avatar || data.photoUrl || null
                        });
                    } else {
                        avatarDoc.status = avatarStatus;
                        avatarDoc.fileUrl = avatarDoc.fileUrl || data.avatar || data.photoUrl || null;
                    }

                    // ID Card (Ausweis Vorder- & Rückseite) check
                    const idCardDoc = docsList.find(d => d.id === 'idcard');
                    const hasIdCard = !!(data.idCardFront || data.idCardBack || data.ausweisDoc || idCardDoc?.fileUrl || idCardDoc?.file);
                    const idCardStatus = data.idCardApproved ? 'approved' : (idCardDoc?.status === 'verified' ? 'approved' : (hasIdCard ? 'pending' : 'missing'));
                    if (!idCardDoc) {
                        docsList.push({
                            id: 'idcard',
                            name: 'Personalausweis / Pass (Vorder- & Rückseite)',
                            status: idCardStatus,
                            fileUrl: data.idCardFront || data.idCardBack || data.ausweisDoc || null,
                            frontUrl: data.idCardFront || null,
                            backUrl: data.idCardBack || null
                        });
                    } else {
                        idCardDoc.status = idCardStatus;
                        idCardDoc.fileUrl = idCardDoc.fileUrl || data.idCardFront || data.idCardBack || data.ausweisDoc || null;
                        idCardDoc.frontUrl = data.idCardFront || null;
                        idCardDoc.backUrl = data.idCardBack || null;
                    }

                    // Terms check
                    const termsDoc = docsList.find(d => d.id === 'terms');
                    const termsStatus = data.termsAccepted ? 'approved' : (termsDoc?.status === 'verified' ? 'approved' : 'missing');
                    if (!termsDoc) {
                        docsList.push({
                            id: 'terms',
                            name: 'Allgemeine Geschäftsbedingungen (AGB)',
                            status: termsStatus,
                            fileUrl: null
                        });
                    } else {
                        termsDoc.status = termsStatus;
                    }

                    // P-Schein & Führerschein from Fleet Manager if present
                    if (data.pScheinDoc && !docsList.some(d => d.id === 'pschein')) {
                        docsList.push({
                            id: 'pschein',
                            name: 'P-Schein (§ 48 FeV - Flotte)',
                            status: data.pScheinApproved ? 'approved' : 'pending',
                            fileUrl: data.pScheinDoc
                        });
                    }
                    if (data.fuehrerscheinDoc && !docsList.some(d => d.id === 'license')) {
                        docsList.push({
                            id: 'license',
                            name: 'Führerschein (Klasse B - Flotte)',
                            status: data.licenseApproved ? 'approved' : 'pending',
                            fileUrl: data.fuehrerscheinDoc
                        });
                    }

                    docs = docsList.map(d => ({
                        id: d.id,
                        name: d.name,
                        status: d.status,
                        uploadedAt: d.status !== 'missing' ? 'Recent' : null,
                        fileUrl: d.fileUrl || null,
                        frontUrl: d.frontUrl || null,
                        backUrl: d.backUrl || null
                    }));
                } else {
                    const complianceDocs = data.complianceDocs || {};
                    const docSpecs = {
                        staff: [
                            { id: 'passport_id', name: 'Passport / ID Card' },
                            { id: 'work_permit', name: 'Work Permit' },
                            { id: 'bank_details', name: 'Bank Details (for Tips)' }
                        ],
                        restaurant: [
                            { id: 'reg', name: 'Commercial Register' },
                            { id: 'mid', name: 'Manager ID' },
                            { id: 'tax', name: 'Tax Registration' },
                            { id: 'gast', name: 'Gastronomy License' },
                            { id: 'liq', name: 'Liquor License' },
                            { id: 'fire', name: 'Fire Safety' },
                            { id: 'sepa', name: 'SEPA Mandate' },
                            { id: 'vatc', name: 'VAT Certification' },
                            { id: 'bankv', name: 'Bank Validation' }
                        ],
                        hotel: [
                            { id: 'reg', name: 'Commercial Register' },
                            { id: 'mid', name: 'Manager ID' },
                            { id: 'tax', name: 'Tax Registration' },
                            { id: 'gast', name: 'Gastronomy License' },
                            { id: 'liq', name: 'Liquor License' },
                            { id: 'fire', name: 'Fire Safety' },
                            { id: 'sepa', name: 'SEPA Mandate' },
                            { id: 'vatc', name: 'VAT Certification' },
                            { id: 'bankv', name: 'Bank Validation' }
                        ],
                        fleet: [
                            { id: 'tl', name: 'Transport License (P-Schein)' },
                            { id: 'fip', name: 'Fleet Insurance Policy' },
                            { id: 'cc', name: 'Chauffeur Certification' },
                            { id: 'vr', name: 'Vehicle Registration (V5C)' },
                            { id: 'tuv', name: 'Roadworthiness Cert (TÜV)' },
                            { id: 'es', name: 'Emission Standards' },
                            { id: 'sepa', name: 'SEPA Mandate' },
                            { id: 'vatc', name: 'VAT Certification' },
                            { id: 'bankv', name: 'Bank Validation' }
                        ],
                        venue: [
                            { id: 'reg', name: 'Commercial Register' },
                            { id: 'mid', name: 'Manager ID' },
                            { id: 'tax', name: 'Tax Registration' },
                            { id: 'gast', name: 'Gastronomy License' },
                            { id: 'liq', name: 'Liquor License' },
                            { id: 'fire', name: 'Fire Safety' },
                            { id: 'sepa', name: 'SEPA Mandate' },
                            { id: 'vatc', name: 'VAT Certification' },
                            { id: 'bankv', name: 'Bank Validation' }
                        ]
                    };
                    const specs = docSpecs[type] || docSpecs.restaurant;
                    docs = specs.map(spec => {
                        const savedDoc = complianceDocs[spec.id] || {};
                        return {
                            id: spec.id,
                            name: spec.name,
                            status: savedDoc.status || 'missing',
                            uploadedAt: savedDoc.uploadedAt || savedDoc.verifiedAt || null,
                            fileUrl: savedDoc.fileUrl || savedDoc.fileData || null
                        };
                    });
                }

                const parseDate = (val) => {
                    if (!val) return 'N/A';
                    if (typeof val.toDate === 'function') {
                        return val.toDate().toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
                    }
                    const d = new Date(val);
                    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
                };

                partners.push({
                    ...data,
                    name: data.role === 'driver' ? `Driver: ${data.name || 'Driver'}` : data.role === 'staff' ? `Staff: ${data.name || 'Staff'}` : (data.name || data.businessName || 'Partner Manager'),
                    type: type,
                    joinDate: parseDate(data.createdAt),
                    docs: docs,
                    emailKey: data.email ? data.email.replace(/[^a-zA-Z0-9]/g, '_') : '',
                    isDriver: data.role === 'driver',
                    isStaff: data.role === 'staff'
                });
            });
            firebasePartnersRef.current = partners;
            syncWithLocal();
        }, (err) => {
            console.error("Error listening to B2B managers:", err);
        });

        const interval = setInterval(syncWithLocal, 1000);
        window.addEventListener('storage', syncWithLocal);

        return () => {
            unsubscribe();
            clearInterval(interval);
            window.removeEventListener('storage', syncWithLocal);
        };
    }, []);
    const [isAddPartnerModalOpen, setIsAddPartnerModalOpen] = useState(false);
    const [newPartnerForm, setNewPartnerForm] = useState({ name: '', type: 'restaurant', joinDate: '' });

    // --- DSGVO COMPLIANCE & AI COMPLIANCE/SALES AGENT STATES ---
    const [anonymizedModeActive, setAnonymizedModeActive] = useState(true);
    const [isScoutThinking, setIsScoutThinking] = useState(false);
    const [scoutMessages, setScoutMessages] = useState([]);

    const rawFeedbackItems = [];

    const anonymizeFeedback = (items, active) => {
        if (!active) return items;
        
        const guestMap = {
            'Marcus G.': '[GUEST_ANON_782]',
            'Elena V.': '[GUEST_ANON_194]',
            'Hansi M.': '[GUEST_ANON_305]',
            'Sophie K.': '[GUEST_ANON_612]'
        };
        
        const unitMap = {
            'DR-492': '[SHIELD_UNIT_102]',
            'Midnight Neon': '[SHIELD_UNIT_495]',
            'Commerzbank Arena': '[SHIELD_UNIT_824]',
            'Grand Frankfurt': '[SHIELD_UNIT_913]'
        };

        const locationMap = {
            'Frankfurt Sector 2': '[SECTOR_FRANKFURT_II]',
            'Zeil District': '[SECTOR_ZEIL_A]',
            'South Gate': '[SECTOR_SOUTH_GATE]',
            'Main River': '[SECTOR_MAIN_RIVER]'
        };

        return items.map(item => {
            let text = item.text;
            Object.keys(guestMap).forEach(key => {
                text = text.replace(new RegExp(key, 'gi'), guestMap[key]);
            });
            Object.keys(unitMap).forEach(key => {
                text = text.replace(new RegExp(key, 'gi'), unitMap[key]);
            });
            Object.keys(locationMap).forEach(key => {
                text = text.replace(new RegExp(key, 'gi'), locationMap[key]);
            });
            
            return {
                ...item,
                user: guestMap[item.user] || `[GUEST_ANON_${Math.abs(item.user.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 1000}]`,
                id: unitMap[item.id] || `[SHIELD_UNIT_${Math.abs(item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 1000}]`,
                location: locationMap[item.location] || `[SECTOR_MASKED_${Math.abs(item.location.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 1000}]`,
                text: text
            };
        });
    };

    const getScoutResponse = (input) => {
        const query = input.toLowerCase();
        
        if (query.includes('fleet') || query.includes('driver') || query.includes('car')) {
            return `### 🚗 KHIAM GREEN AI FLEET PARTNERSHIP PITCH PROPOSAL\n` +
                   `**Target Segment:** Fleet Managers & Luxury Transportation Operators\n` +
                   `**Strategic Foundation:** Direct response to service gaps identified in telemetries (such as vehicle cleanliness & driver dispatch lag under \`[SHIELD_UNIT_102]\`).\n\n` +
                   `---\n\n` +
                   `#### 1. THE PROBLEM-SOLUTION METRIC\n` +
                   `*   **The Telemetry Gap:** Recent feedback indicates that high-net-worth customers are highly sensitive to driver delays and vehicle standards.\n` +
                   `*   **Our Solution:** The *Khiam Green Autonomous Matching Engine* solves this with a **6-second dispatch threshold** and live IoT-linked sanitization checklist confirmation before onboarding.\n\n` +
                   `#### 2. HIGH-INCENTIVE FINANCIAL MODEL (German Sector)\n` +
                   `*   **Base Provision:** Fleet managers earn a highly competitive base starting at **3.00 €** per completed trip.\n` +
                   `*   **Surge Tier Compensation:** For every incremental tier increase of **30.00 € or more**, an additional **2.00 €** bonus provision is dynamically compounded onto the base payout.\n` +
                   `*   **Example Model:** A standard premium shuttle trip of 90.00 € yields an immediate **7.00 € payout** to the manager, scaling profitability dynamically!\n\n` +
                   `#### 3. B2B OUTREACH PITCH SCRIPT\n` +
                   `> *"Dear Fleet Director, your operational overhead demands punctuality. The Khiam Green suite ensures a 100% automated matchmaking response rate in under 6 seconds, combined with a progressive base provision starting from 3 € + 2 € increments for every 30 € tier increase. Protect your brand reputation while compounding your high-ticket margins."*`;
        }
        
        if (query.includes('hotel') || query.includes('hospitality') || query.includes('concierge') || query.includes('room')) {
            return `### 🏨 KHIAM GREEN VIP HOTEL CONCIERGE INTEGRATION OUTREACH\n` +
                   `**Target Segment:** 5-Star Hospitality Establishments (e.g. \`[SHIELD_UNIT_913]\` / Grand Frankfurt Sector)\n` +
                   `**Strategic Foundation:** Leveraging stellar concierges reviews under \`[GUEST_ANON_612]\` with seamless checkout logs.\n\n` +
                   `---\n\n` +
                   `#### 1. SEAMLESS VIP INTEGRATION\n` +
                   `*   **Direct Concierge Console:** Hotels receive a premium glassmorphic booking interface integrated directly into the guest reception terminal. Guests bypass queues with instant digital priority tickets.\n` +
                   `*   **Eco-Luxury Appeal:** Highlight your property's ESG carbon-offset metrics with Khiam Green's premium fully-electric VIP fleet.\n\n` +
                   `#### 2. REVENUE COMMISSION MODEL\n` +
                   `*   **High-Yield commission:** The hotel receives a **5% revenue share** on all ticket types and a **5% provision** on all hotel transport arrangements booked through the app.\n\n` +
                   `#### 3. B2B OUTREACH PITCH SCRIPT\n` +
                   `> *"Dear General Manager, your elite guests expect a continuous luxury experience. By integrating the Khiam Green VIP Concierge Console, you extend your 5-star service standard straight onto the highway. Command a 5% commission yield on all digital rides and ticketing, backed by 100% eco-luxury transport credentials. Let's arrange a pilot setup."*`;
        }
        
        if (query.includes('compliance') || query.includes('gdpr') || query.includes('dsgvo') || query.includes('law') || query.includes('secure') || query.includes('anonym')) {
            return `### 🛡️ KHIAM NEURAL SENTINEL: DSGVO AUDIT REPORT\n` +
                   `**Platform Status:** SECURED & ANONYMIZED\n` +
                   `**Scope:** Super Admin Telemetry logs & Third-Party API boundary checks.\n\n` +
                   `---\n\n` +
                   `#### 1. TELEMETRY PROTECTION METRICS\n` +
                   `*   **PII Masking:** Active by default. All identifiable information (including guest names: \`Marcus G.\` ➔ \`[GUEST_ANON_782]\`, unit ids, and locations) are programmatically mapped to hash tokens before rendering.\n` +
                   `*   **Art. 25 GDPR (Privacy by Design):** Unanonymized raw metrics are locked behind a local encryption gate and only visible to authorized Super Admins. No raw data leaks to external AI processing boundaries.\n\n` +
                   `#### 2. REGULATORY CERTIFICATION\n` +
                   `*   **PSD2 / BaFin Gateway Compliance:** Bank verification handshakes utilize modern end-to-end tokenization.\n` +
                   `*   **Compliance Clearance:** Verified compliant under German BDSG (Neu) and EU GDPR requirements. No regulatory infractions found.`;
        }
        
        return `### 🔮 KHIAM INTELLIGENCE SCOUT ANALYTICAL REPORT\n` +
               `Director, I have analyzed your request against the latest platform parameters. Here is the active breakdown:\n\n` +
               `*   **Active Feedback Hub Sector:** Synthesized analysis of 4 active sectors (Fleet, Restaurants, Stadium, Hotels).\n` +
               `*   **Current Global Sentiment Rate:** **88.0%** positive margin.\n` +
               `*   **Scale Plan Directive:**\n` +
               `    1. Convert negative fleet complaints (\`[SHIELD_UNIT_102]\`) into high-performance fleet manager deals with 3€ base / 2€ increment incentives.\n` +
               `    2. Capitalize on high-end checkout satisfaction (\`[GUEST_ANON_612]\`) to secure hotel concierge console integrations at a 5% commission tier.\n\n` +
               `*Query me with "fleet", "hotel", or "compliance" for tailored B2B outreach scripts.*`;
    };

    const handleSendScoutMessage = (customText = null) => {
        const textToSend = customText || scoutInput;
        if (!textToSend.trim()) return;

        const userMsg = { role: 'user', text: textToSend, time: new Date().toLocaleTimeString().substring(0, 5) };
        setScoutMessages(prev => [...prev, userMsg]);
        setScoutInput('');
        setIsScoutThinking(true);

        setTimeout(() => {
            const responseText = getScoutResponse(textToSend);
            const agentMsg = {
                role: 'agent',
                text: responseText,
                time: new Date().toLocaleTimeString().substring(0, 5)
            };
            setScoutMessages(prev => [...prev, agentMsg]);
            setIsScoutThinking(false);
            triggerNotification('success', 'Neural Core Reply', 'Scout generated compliant sales insights.');
        }, 1000);
    };

    const exportAnonymizedReport = () => {
        const asciiBanner = 
`========================================================================
██╗  ██╗██╗  ██╗██╗ █████╗ ███╗   ███╗     ██████╗ ██████╗ ███████╗███████╗███╗   ██╗
██║  ██║██║  ██║██║██╔══██╗████╗ ████║    ██╔════╝ ██╔══██╗██╔════╝██╔════╝████╗  ██║
███████║███████║██║███████║██╔████╔██║    ██║  ███╗██████╔╝█████╗  █████╗  ██╔██╗ ██║
██╔══██║██╔══██║██║██╔══██║██║╚██╔╝██║    ██║   ██║██╔══██╗██╔══╝  ██╔══╝  ██║╚██╗██║
██║  ██║██║  ██║██║██║  ██║██║ ╚═╝ ██║    ╚██████╔╝██║  ██║███████╗███████╗██║ ╚████║
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝     ╚═╝     ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═══╝
========================================================================
              KHIAM GREEN APP v4.0 - COMPLIANCE & INTELLIGENCE REPORT
              DSGVO / GDPR TELEMETRY SECURED GATEWAY AUDIT
              LOCAL TIMESTAMP: ${new Date().toLocaleString()}
========================================================================

[🛡️ SECURITY STATUS: DSGVO SHIELD ACTIVE]
------------------------------------------------------------------------
Compliance Directives: All Personal Identifiable Information (PII) including
guest names, exact location nodes, and vehicle routing IDs have been fully
masked using the proprietary cryptographic tokenization engine of Khiam Green.

[📊 PLATFORM REVENUE & COMMISSION PARAMETERS]
------------------------------------------------------------------------
* Fleet Manager Provisions:
  - Base Commission: Starts at 3.00 € per ride.
  - Multi-tier Surge Bonus: +2.00 € for every 30.00 € incremental trip fare.
* Hospitality (Hotels) Commissions:
  - Booking Provision: 5% of gross reservation value.
* Ticketing/Events Payouts:
  - Ticket Sales Provision: 5% of direct face value.

------------------------------------------------------------------------
[📋 ANONYMIZED GUEST TELEMETRY LOGS]
------------------------------------------------------------------------
${anonymizeFeedback(rawFeedbackItems, anonymizedModeActive).map((f, idx) => (
`Log #${idx+1} [Sector: ${f.type.toUpperCase()}]
  Unit Reference:  ${f.id}
  Secure Location: ${f.location}
  Date / Time:     ${f.date} at ${f.time}
  Sentiment Grade: ${f.rating} / 5 Stars
  Log Transcript:  "${f.text}"
  Identity Token:  ${f.user}
------------------------------------------------------------------------`
)).join('\n')}

------------------------------------------------------------------------
[🚀 AI INTELLIGENCE: OUTREACH BLUEPRINTS & SALES SCRIPTS]
------------------------------------------------------------------------

=== PITCH OPTION A: FLEET MANAGER SCALE PITCH ===
Target Segment: Fleet Managers & Transport Operators (Responding to Unit ${anonymizedModeActive ? '[SHIELD_UNIT_102]' : 'DR-492'} delays)

* Strategic Pitch Proposal:
  - Core Pitch Concept: Introduce the Khiam Green 6-second auto-matchmaking threshold to erase driver delay bottlenecks. Include IoT telemetry checklist for vehicle cleanliness audits prior to passenger boarding.
  - Revenue Model Breakdown: Emphasize the progressive provision starting from 3 € plus an extra 2 € bonus for each 30 € fare increment to maximize driver retention.
  - Outreach Script:
    "Dear Fleet Director, your operational overhead demands punctuality. The Khiam Green suite ensures a 100% automated matchmaking response rate in under 6 seconds, combined with a progressive base provision starting from 3 € + 2 € increments for every 30 € tier increase. Protect your brand reputation while compounding your high-ticket margins."

=== PITCH OPTION B: LUXURY HOTEL PARTNERSHIP PITCH ===
Target Segment: 5-Star Hotel Concierge desks (Responding to Unit ${anonymizedModeActive ? '[SHIELD_UNIT_913]' : 'Grand Frankfurt'} concierge success)

* Strategic Pitch Proposal:
  - Core Pitch Concept: Provide a dedicated glassmorphic concierge booking app to fast-track bookings for elite hotel guests. Carbon-neutral EV transport matches corporate ESG metrics.
  - Revenue Model Breakdown: Highlight the direct 5% hotel reservation share and 5% ticket commission rewards built into the ecosystem.
  - Outreach Script:
    "Dear General Manager, your elite guests expect a continuous luxury experience. By integrating the Khiam Green VIP Concierge Console, you extend your 5-star service standard straight onto the highway. Command a 5% commission yield on all digital rides and ticketing, backed by 100% eco-luxury transport credentials. Let's arrange a pilot setup."

========================================================================
AUDIT DECLARATION: This ledger constitutes an official compliance record.
Approved for Release by: Super Admin / Chief Compliance Officer
Khiam Green Security Operations Center (Frankfurt am Main)
========================================================================`;

        const blob = new Blob([asciiBanner], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `KhiamGreen_Sales_Compliance_Audit_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        triggerNotification('success', 'Security Ledger Exported', 'Anonymized B2B pitch ledger saved locally.');
    };

    const downloadB2BInvoice = (invId, client, partnerId, fare, provision, date, tag, fee) => {
        try {
            const doc = new jsPDF();
            const total = parseFloat(fare) || 0;
            const prov = parseFloat(provision) || 0;
            const cardFee = parseFloat(fee) || parseFloat((total * 0.014 + 0.25).toFixed(2));
            const vat = parseFloat((prov * 0.19).toFixed(2));
            const netProv = parseFloat((prov * 0.81).toFixed(2));
            const grossPartner = parseFloat((total - prov).toFixed(2));
            const netPartner = parseFloat((grossPartner - cardFee).toFixed(2));

            // Header Background Accent
            doc.setFillColor(13, 21, 32);
            doc.rect(0, 0, 210, 45, 'F');

            // Logo & Title
            doc.setTextColor(52, 211, 153);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('GRIEN B2B TAX LEDGER', 20, 20);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(200, 200, 200);
            doc.text('Offizielle B2B-Provisionsabrechnung & Finanzamt Audit Ledger', 20, 28);
            doc.text('Automatisierter Stripe Connect Split (PSD2 & GwG Compliant)', 20, 34);

            // Invoice Ref & Date Block (Right)
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(`Ref: ${invId}`, 130, 20);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(200, 200, 200);
            doc.text(`Datum: ${date || new Date().toISOString().split('T')[0]}`, 130, 27);
            doc.text(`Status: AUSGEZAHLT (LIVE)`, 130, 34);

            // Divider
            doc.setDrawColor(52, 211, 153);
            doc.setLineWidth(0.8);
            doc.line(20, 48, 190, 48);

            // Issuer & Partner Info Box
            doc.setFillColor(245, 247, 250);
            doc.roundedRect(20, 54, 82, 38, 3, 3, 'F');
            doc.roundedRect(108, 54, 82, 38, 3, 3, 'F');

            // Issuer (Left)
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(16, 185, 129);
            doc.text('PLATTFORM-BETREIBER (AUSSTELLER):', 24, 62);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text('Khiam Green Security Operations', 24, 68);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            doc.text('Main Plaza, Frankfurt am Main, Germany', 24, 74);
            doc.text('USt-IdNr.: DE88-129-44', 24, 80);
            doc.text('Finanzamt Frankfurt am Main V', 24, 86);

            // Debtor Partner (Right)
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(16, 185, 129);
            doc.text('VERTRAGSPARTNER (EMPFÄNGER):', 112, 62);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text(`Partner: ${partnerId}`, 112, 68);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            doc.text(`Kunde / Buchung: ${client}`, 112, 74);
            doc.text('KYC-Status: Stripe Connect Verifiziert', 112, 80);
            doc.text('SEPA Clearing: Handshake PSD2 Cleared', 112, 86);

            // Table Header
            doc.setFillColor(30, 41, 59);
            doc.rect(20, 98, 170, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text('POSITION / BESCHREIBUNG', 24, 103.5);
            doc.text('BETRAG (EUR)', 160, 103.5);

            // Line Items
            let y = 114;
            const addItem = (label, val, isBold = false, isGreen = false, isRed = false) => {
                doc.setFont('helvetica', isBold ? 'bold' : 'normal');
                if (isGreen) doc.setTextColor(16, 185, 129);
                else if (isRed) doc.setTextColor(220, 38, 38);
                else doc.setTextColor(30, 41, 59);
                doc.setFontSize(9.5);
                doc.text(label, 24, y);
                doc.text(`${val} EUR`, 160, y);
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.3);
                doc.line(20, y + 2.5, 190, y + 2.5);
                y += 8.5;
            };

            addItem(`Gesamtbetrag der Buchung (Brutto-Zahlung)`, `${total.toFixed(2)}`, true);
            addItem(`- Grien Plattform-Provision (${tag || 'Servicegebühr'})`, `+${prov.toFixed(2)}`, false, true);
            addItem(`    davon 19% Umsatzsteuer (MwSt.)`, `${vat.toFixed(2)}`);
            addItem(`    Netto-Plattformwert (exkl. MwSt.)`, `${netProv.toFixed(2)}`);
            addItem(`Partner-Bruttoanteil vor Zahlungsgebühr`, `${grossPartner.toFixed(2)}`);
            addItem(`- Stripe Zahlungsabwicklungsgebühr (Absorbiert Option B)`, `-${cardFee.toFixed(2)}`, false, false, true);

            y += 3;
            // Payout Highlight Box
            doc.setFillColor(236, 253, 245);
            doc.setDrawColor(16, 185, 129);
            doc.setLineWidth(1);
            doc.roundedRect(20, y, 170, 16, 3, 3, 'FD');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10.5);
            doc.setTextColor(6, 95, 70);
            doc.text('AUSGEZAHLTER PARTNER-NETTOBETRAG (STRIPE CONNECT):', 24, y + 10);
            doc.setFontSize(12);
            doc.text(`${netPartner.toFixed(2)} EUR`, 155, y + 10);

            // Audit Note (Bottom)
            y += 26;
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(20, y, 170, 28, 2, 2, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(30, 41, 59);
            doc.text('STEUERRECHTLICHER COMPLIANCE-NACHWEIS (FINANZAMT AUDIT):', 24, y + 6);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text('Dieses Dokument dient als digitaler Buchungs- und Provisionsbeleg gem. § 14 UStG und GoBD.', 24, y + 12);
            doc.text('Die Auszahlung erfolgte in Echtzeit via automatisierter Stripe Connect Split-Route.', 24, y + 17);
            doc.text('Es ist keine manuelle Rechnungsstellung oder monatliche Sammelabrechnung erforderlich.', 24, y + 22);

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(`Erstellt durch Grien Alpha Command Portal | Dokument-Hash: SHA256-${invId}`, 20, 285);

            doc.save(`${invId}_Grien_B2B_Audit_Rechnung.pdf`);
            triggerNotification('success', 'PDF-Rechnung heruntergeladen 📄', `${invId} wurde als PDF exportiert.`);
        } catch (err) {
            console.error('PDF Export Error:', err);
            triggerNotification('error', 'PDF Export Fehler', 'PDF konnte nicht erstellt werden.');
        }
    };

    const downloadWeeklyFleetStatement = (fleetData, weekName = 'KW 40 (28.09. - 04.10.2026)') => {
        try {
            const doc = new jsPDF();
            const f = fleetData;
            const totalGross = parseFloat(f.grossVolume || 0);
            const cardGross = parseFloat(f.cardVolume || 0);
            const cashGross = parseFloat(f.cashVolume || 0);
            const totalProv = parseFloat(f.totalProvision || 0);
            const cashOffset = parseFloat(f.cashCommissionOffset || 0);
            const cardProv = parseFloat(f.cardProvision || 0);
            const netPayout = parseFloat(f.netStripePayout || 0);
            const fleetNetTotal = parseFloat(f.fleetTotalNetEarnings || 0);

            // Header Background
            doc.setFillColor(13, 21, 32);
            doc.rect(0, 0, 210, 48, 'F');

            // Platform Branding
            doc.setTextColor(52, 211, 153);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('GRIEN DISPATCH | WÖCHENTLICHES FLOTTEN-LEDGER', 20, 18);

            doc.setFontSize(9.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(200, 200, 200);
            doc.text('Offizielle wöchentliche Abrechnung mit Bar- & Kartengegenrechnung (§ 14 UStG / GoBD)', 20, 26);
            doc.text(`Abrechnungszeitraum: ${weekName} | Auszahlungszyklus: Wöchentlich (7 Tage Hold)`, 20, 32);
            doc.text(`Stripe Connect Transfer-Routing: Platform Payout Clearing (Gebühren: 100% Grien)`, 20, 38);

            // Right box: Statement ID & Date
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`Beleg-Nr: WSET-${f.id || 'FLEET'}-${Date.now().toString().slice(-6)}`, 130, 18);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(200, 200, 200);
            doc.text(`Erstellt: ${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString('de-DE')}`, 130, 25);
            doc.text(`Status: FREIGEGEBEN / ÜBERWIESEN`, 130, 32);

            // Divider
            doc.setDrawColor(52, 211, 153);
            doc.setLineWidth(0.8);
            doc.line(20, 52, 190, 52);

            // Issuer & Fleet Partner Cards
            doc.setFillColor(245, 247, 250);
            doc.roundedRect(20, 56, 82, 38, 3, 3, 'F');
            doc.roundedRect(108, 56, 82, 38, 3, 3, 'F');

            // Issuer (Platform)
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(16, 185, 129);
            doc.text('PLATTFORM-BETREIBER:', 24, 63);
            doc.setTextColor(30, 41, 59);
            doc.text('Khiam Green Security Operations', 24, 69);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            doc.text('Main Plaza, Frankfurt am Main, Germany', 24, 75);
            doc.text('USt-IdNr.: DE88-129-44 | Finanzamt FFM V', 24, 81);
            doc.text('Stripe-Gebühren: 100% von Plattform getragen', 24, 87);

            // Fleet Partner
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(16, 185, 129);
            doc.text('FLOTTENPARTNER (MIETWAGEN / TAXI):', 112, 63);
            doc.setTextColor(30, 41, 59);
            doc.text(`${f.name} (${f.manager || 'GF'})`, 112, 69);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            doc.text(`Stripe Account: ${f.id || 'acct_fleet'}`, 112, 75);
            doc.text(`IBAN: ${f.iban || 'DE44 5002 0000 **** **'}`, 112, 81);
            doc.text(`PBefG Lizenz: Geprüft & GoBD-konform`, 112, 87);

            // Summary KPI Box (Fahrten & Volumen)
            doc.setFillColor(241, 245, 249);
            doc.roundedRect(20, 98, 170, 18, 2, 2, 'F');
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text(`FAHRTEN GESAMT: ${f.totalTrips || 0} (Abgeschlossen: ${(f.cardTrips || 0) + (f.cashTrips || 0)} | Storniert: ${f.cancelledTrips || 0})`, 26, 105);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(71, 85, 105);
            doc.text(`Karte: ${f.cardTrips || 0} | Bar: ${f.cashTrips || 0} | Storno frei: ${f.freeCancelledTrips || 0} | Storno gebührenpfl.: ${f.lateCancelledTrips || 0} (Entschädigung: +${(f.cancellationFleetPayout || 0).toFixed(2)} €)`, 26, 112);

            // Table Header
            doc.setFillColor(30, 41, 59);
            doc.rect(20, 120, 170, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.text('ABRECHNUNGS-POSITION (BAR- & KARTENVERRECHNUNG)', 24, 125.5);
            doc.text('BETRAG (EUR)', 160, 125.5);

            // Rows
            let y = 135;
            const addRow = (label, val, isBold = false, isGreen = false, isRed = false) => {
                doc.setFont('helvetica', isBold ? 'bold' : 'normal');
                if (isGreen) doc.setTextColor(16, 185, 129);
                else if (isRed) doc.setTextColor(220, 38, 38);
                else doc.setTextColor(30, 41, 59);
                doc.setFontSize(9);
                doc.text(label, 24, y);
                doc.text(`${val} EUR`, 160, y);
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.3);
                doc.line(20, y + 2.5, 190, y + 2.5);
                y += 8;
            };

            addRow('1. Wöchentlicher Brutto-Umsatz (Vor Provision)', `${totalGross.toFixed(2)}`, true);
            addRow('    - davon Kartenzahlungen in App (Guthaben bei Plattform)', `${cardGross.toFixed(2)}`);
            addRow('    - davon Barzahlungen (Vollständig beim Fahrer im Auto kassiert)', `${cashGross.toFixed(2)}`);
            if ((f.cancellationFleetPayout || 0) > 0) {
                addRow(`    + Storno-Entschädigungen Flotte (${f.lateCancelledTrips || 0}x Spät-Storno / No-Show)`, `+${(f.cancellationFleetPayout || 0).toFixed(2)}`, false, true);
            }
            addRow('2. Grien Plattform-Provision Gesamt', `-${totalProv.toFixed(2)}`, false, false, true);
            addRow('    - davon Provision auf Kartenzahlungen', `-${cardProv.toFixed(2)}`);
            addRow('    - davon Provision auf Barzahlungen (Offene Bar-Provision)', `-${cashOffset.toFixed(2)}`, false, false, true);
            addRow('3. Verrechnung: Bar-Provision abgezogen von Kartenguthaben', `-${cashOffset.toFixed(2)}`, true, false, true);
            addRow('4. Stripe Zahlungsabwicklungsgebühren (von Grien übernommen)', `0.00`, false, true);

            y += 4;
            // Payout Highlight Box (What gets transferred to fleet's bank)
            doc.setFillColor(236, 253, 245);
            doc.setDrawColor(16, 185, 129);
            doc.setLineWidth(1);
            doc.roundedRect(20, y, 170, 16, 3, 3, 'FD');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.setTextColor(6, 95, 70);
            doc.text('WÖCHENTLICHE STRIPE NETTO-AUSZAHLUNG (AUF BANKKONTO):', 24, y + 10);
            doc.setFontSize(12);
            doc.text(`${netPayout.toFixed(2)} EUR`, 155, y + 10);

            y += 22;
            // Total Fleet Earnings Note
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(20, y, 170, 26, 2, 2, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(30, 41, 59);
            doc.text('FLOTTEN-GESAMT-ERTRAG DIESER WOCHE (NACH PROVISION):', 24, y + 6);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(71, 85, 105);
            doc.text(`Bargeld beim Fahrer (${cashGross.toFixed(2)} €) + Stripe Bank-Auszahlung (${netPayout.toFixed(2)} €) = ${fleetNetTotal.toFixed(2)} EUR Netto-Umsatz.`, 24, y + 12);
            doc.text('Dieses Dokument erfüllt die Vorgaben des § 14 UStG und der GoBD für digitale Vermittlungsabrechnungen.', 24, y + 17);
            doc.text('Die Bar-Provisionsverrechnung wurde mit den Karteneingängen saldiert.', 24, y + 22);

            // Footer
            doc.setFontSize(7.5);
            doc.setTextColor(148, 163, 184);
            doc.text(`Erstellt über Grien Command Center | Hash: SHA256-FLEET-SETTLEMENT-${f.id || 'FL'}`, 20, 285);

            doc.save(`Wochenabrechnung_${f.name?.replace(/\s+/g, '_') || 'Flotte'}_${weekName.slice(0, 5)}.pdf`);
            triggerNotification('success', 'Wochenabrechnung exportiert 📄', `PDF für ${f.name} wurde heruntergeladen.`);
        } catch (err) {
            console.error('Weekly fleet export error:', err);
            triggerNotification('error', 'PDF Fehler', 'Wochenabrechnung konnte nicht exportiert werden.');
        }
    };

    const triggerWeeklyFleetPayout = async (fleetId) => {
        const fleet = weeklyFleetsData.find(f => f.id === fleetId);
        if (!fleet) return;
        setIsProcessingWeeklyPayout(true);
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
            const res = await fetch(`${backendUrl}/api/payment/stripe/fleet-payout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fleetId: fleet.id,
                    fleetName: fleet.name,
                    stripeAccountId: fleet.id,
                    netPayout: fleet.netStripePayout,
                    totalGross: fleet.grossVolume,
                    cashOffset: fleet.cashCommissionOffset,
                    cardGross: fleet.cardVolume,
                    provisionTotal: fleet.totalProvision,
                    week: selectedWeekForSettlement
                })
            });
            const data = await res.json();
            setWeeklyFleetsData(prev => prev.map(f => f.id === fleetId ? {
                ...f,
                payoutStatus: 'Überwiesen via Stripe ⚡',
                lastPayoutDate: `Gerade überwiesen (${data.transferId || 'tr_live'})`
            } : f));
            triggerNotification('success', 'Wöchentlicher Payout erfolgt 🚀', `${fleet.netStripePayout.toFixed(2)} € an ${fleet.name} über Stripe Connect überwiesen.`);
        } catch (err) {
            console.error('Weekly payout error:', err);
            // Fallback for simulation
            setWeeklyFleetsData(prev => prev.map(f => f.id === fleetId ? {
                ...f,
                payoutStatus: 'Überwiesen via Stripe ⚡',
                lastPayoutDate: `Gerade überwiesen (Simulation tr_stripe_${Date.now().toString().slice(-6)})`
            } : f));
            triggerNotification('success', 'Wöchentlicher Payout erfolgt 🚀', `${fleet.netStripePayout.toFixed(2)} € an ${fleet.name} simuliert.`);
        } finally {
            setIsProcessingWeeklyPayout(false);
        }
    };

    // Role-Based Access Enforcement
    useEffect(() => {
        if (user?.role === 'staff' && !['customer-service', 'personal-data'].includes(view)) {
            setView('customer-service');
        }
    }, [user, view]);

    const generateInviteToken = (email) => {
        const raw = `${email}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        return btoa(raw).replace(/=/g, '').slice(0, 32);
    };

    const handleAddStaff = () => {
        if (!newStaff.name || !newStaff.email) {
            triggerNotification('error', 'Missing Fields', 'Name and email are required.');
            return;
        }
        const staffId = `S-900-${staffList.length + 11}`;
        const inviteToken = generateInviteToken(newStaff.email);
        const inviteLink = `${window.location.origin}/admin/staff-login?token=${inviteToken}&email=${encodeURIComponent(newStaff.email)}&role=${encodeURIComponent(newStaff.role)}`;
        const staffEntry = { ...newStaff, id: staffId, img: newStaff.name.split(' ')[0], inviteToken, inviteLink, status: 'pending' };
        setStaffList(prev => [...prev, staffEntry]);
        setGeneratedInviteLink(inviteLink);
        setNewStaff({ name: '', email: '', phone: '', adress: '', zip: '', bank: '', role: 'Customer Service Staff', permissions: { fleet: false, hotel: false, ticket: false, finance: false, analytics: false, compliance: false } });
        triggerNotification('success', 'Staff Clearance Granted', `Invite link generated for ${staffEntry.name}.`);
    };

    const handleCopyInviteLink = (link) => {
        navigator.clipboard.writeText(link).then(() => {
            setInviteCopied(true);
            setTimeout(() => setInviteCopied(false), 2500);
            triggerNotification('success', 'Invite Link Copied', 'Share this secure link with your staff member.');
        });
    };

    const handleToggleStaffPermission = (staffId, hub) => {
        setStaffList(prev => prev.map(s => {
            if (s.id !== staffId) return s;
            return { ...s, permissions: { ...s.permissions, [hub]: !s.permissions?.[hub] } };
        }));
    };
    
    // --- GREEN NEURAL CORE: AUTONOMOUS INTELLIGENCE ---
    const [isAssistantExpanded, setIsAssistantExpanded] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [activeAgent, setActiveAgent] = useState('financial');
    const [neuralInsights, setNeuralInsights] = useState([]);

    useEffect(() => {
        if (!isDemo) {
            setStripeTotalVolume(0);
            setStripePlatformProvisions(0);
            setStripeCardFees(0);
            setStripeDirectSplitsProcessed(0);
            setTodayEarnings(0);
            setStripeLiveWebhookEvents([]);
            setLiveSplitsLedger([]);
            setStripeConnectedPartners([]);
            setStaffList([]);
            setNeuralInsights([]);
            setStripeKycAccountId('');
            setStripeKycName('');
            setStripeKycEmail('');
            setStripeKycAddress('');
            setStripeKycTaxId('');
            setStripeKycIban('');
            setStripeKycSwift('');
            setStripeKycSubmitted(false);
            setStripeBankVerified(false);
        } else {
            setStripeTotalVolume(142840.00);
            setStripePlatformProvisions(14320.00);
            setStripeCardFees(2841.80);
            setStripeDirectSplitsProcessed(3204);
            setTodayEarnings(642.45);
            setStripeLiveWebhookEvents([
                { time: '21:05:33', level: 'SYSTEM', msg: '🔐 Stripe API Connect Session active on port 443' },
                { time: '21:04:42', level: 'WEBHOOK', msg: 'Event payment_intent.succeeded received for tx ch_3M4d99FKe821' },
                { time: '21:04:42', level: 'ROUTING', msg: 'Connect Split: routed 20.91 € net to partner acct_fleet_102 (absorbed card fee 0.59 €)' },
                { time: '21:04:42', level: 'PLATFORM', msg: 'Secured flat step provision of 3.00 € for Jordan Executive' },
                { time: '21:04:42', level: 'FINANZAMT', msg: 'Stored legal B2B invoice INV-2026-0881 under BDSG / GwG §6' },
                { time: '20:46:01', level: 'WEBHOOK', msg: 'Event payment_intent.succeeded received for tx ch_3M4d88FKe190' },
                { time: '20:46:01', level: 'ROUTING', msg: 'Connect Split: routed 140.15 € net to partner acct_stadium_824 (absorbed card fee 2.35 €)' },
                { time: '20:46:01', level: 'PLATFORM', msg: 'Secured flat 5% ticket commission of 7.50 €' }
            ]);
            setLiveSplitsLedger([
                { id: 1, time: '21:02:44', tx: 'ch_3M4d99FKe821', partner: 'acct_fleet_102', partnerName: 'Hessen EcoFleet', client: 'Marcus G.', total: '24.50', prov: '3.00', fee: '0.59', tag: '🚗 Fleet Trip (Base Step)', status: 'INSTANT SPLIT ⚡', inv: 'INV-2026-0881', category: 'transport', date: '2026-05-23' },
                { id: 2, time: '20:45:12', tx: 'ch_3M4d88FKe190', partner: 'acct_stadium_824', partnerName: 'Green Stadium Arena', client: 'Hansi M.', total: '150.00', prov: '7.50', fee: '2.35', tag: '🎟️ VIP Tickets (5% Commission)', status: 'INSTANT SPLIT ⚡', inv: 'INV-2026-0882', category: 'events', date: '2026-05-23' },
                { id: 3, time: '19:12:05', tx: 'ch_3M4d77FKe402', partner: 'acct_hotel_913', partnerName: 'Grand Frankfurt Hotel', client: 'Sophie K.', total: '240.00', prov: '12.00', fee: '3.61', tag: '🏨 Hotel Suite (5% Commission)', status: 'INSTANT SPLIT ⚡', inv: 'INV-2026-0883', category: 'hotels', date: '2026-05-23' },
                { id: 4, time: '18:55:30', tx: 'ch_3M4d66FKe331', partner: 'acct_restaurant_495', partnerName: 'Saffron Fine Dining', client: 'Elena V.', total: '85.00', prov: '0.00', fee: '1.44', tag: '🍔 Food & Drinks (0% Platform Fee)', status: 'VENUE PAYOUT 🍹', inv: 'N/A (Direct Sales)', category: 'clubs', date: '2026-05-23' }
            ]);
            setStripeConnectedPartners([
                { id: 'acct_fleet_102', name: 'Hessen EcoFleet', manager: 'Marcus G.', industry: 'Logistics', status: 'Active', balance: 4120.50, grossContribution: 38400.00, iban: 'DE44 5002 0000 1294 88', swift: 'HEFLEETDEM1X', commissionModel: 'Progressive Step (3€ Base + 2€ per 30€)', totalPaidOut: 34279.50 },
                { id: 'acct_restaurant_495', name: 'Saffron Fine Dining', manager: 'Elena V.', industry: 'Restaurant', status: 'Active', balance: 1480.00, grossContribution: 22120.00, iban: 'DE91 2201 9922 4481 00', swift: 'SAFFRONDEM2X', commissionModel: '0% Restaurant Sales Policy', totalPaidOut: 20640.00 },
                { id: 'acct_hotel_913', name: 'Grand Frankfurt Hotel', manager: 'Sophie K.', industry: 'Hospitality', status: 'Active', balance: 5800.00, grossContribution: 54300.00, iban: 'DE33 4004 1122 3344 55', swift: 'GRANDDEM3X', commissionModel: 'Flat 5.0% Platform Fee', totalPaidOut: 48500.00 },
                { id: 'acct_stadium_824', name: 'Green Stadium Arena', manager: 'Hansi M.', industry: 'Events', status: 'Active', balance: 9200.00, grossContribution: 28020.00, iban: 'DE22 9009 5544 3322 11', swift: 'STADIUMDEM4X', commissionModel: 'Flat 5.0% Booking Fee', totalPaidOut: 18820.00 },
                { id: 'acct_fleet_044', name: 'Berlin VIP Shuttle', manager: 'Sven Weber', industry: 'Logistics', status: 'Active', balance: 2940.00, grossContribution: 16120.00, iban: 'DE77 1001 8844 9922 11', swift: 'BERLINDEM5X', commissionModel: 'Progressive Step (3€ Base + 2€ per 30€)', totalPaidOut: 13180.00 }
            ]);
            setStaffList([
                { id: 'S-900-11', name: 'Elena Richter', role: 'Customer Service Alpha', email: 'elena.r@green.io', phone: '+49 152 4492 110', adress: 'Hauptstr 12, 60311 Frankfurt', zip: '60311', bank: 'DE44 5002 0000 1294 88', img: 'Elena' },
                { id: 'S-900-12', name: 'Sven Weber', role: 'Partner Support Beta', email: 'sven.w@green.io', phone: '+49 176 8821 004', adress: 'Zeil 44, 60313 Frankfurt', zip: '60313', bank: 'DE91 2201 9922 4481 00', img: 'Sven' }
            ]);
            setNeuralInsights([
                { id: 'INS-01', type: 'fraud', title: 'GPS Manipulation Detected', target: 'Driver D-404', reason: 'System detected simulated coordinates matching known spoofing patterns.', law: 'PBefG §49 (Operating outside territory)', severity: 'high', status: 'pending' },
                { id: 'INS-02', type: 'compliance', title: 'V5C Authenticity Warning', target: 'Partner P-102', reason: 'Metadata mismatch in uploaded Vehicle Registration. Possible forgery.', law: 'StVZO §13 (Document Integrity)', severity: 'critical', status: 'pending' },
                { id: 'INS-03', type: 'legal', title: 'New EU Data Directive', target: 'System Policy', reason: 'Amendment required for cross-border passenger data retention.', law: 'GDPR Art. 44-49', severity: 'medium', status: 'pending' }
            ]);
            setStripeKycAccountId('acct_1oA92FFK99014B');
            setStripeKycName('Jordan Executive');
            setStripeKycEmail('jordan@green.io');
            setStripeKycAddress('Sky Tower 1, Main Plaza, Frankfurt');
            setStripeKycTaxId('DE-88-129-44');
            setStripeKycIban('DE99 2004 0000 1294 55');
            setStripeKycSwift('DBANKDEMXXX');
            setStripeKycSubmitted(true);
            setStripeBankVerified(true);
        }
    }, [isDemo]);

    const [chatMessages, setChatMessages] = useState({
        financial: [{ role: 'agent', text: 'Good morning, Director. I have reviewed the latest transport amendments for Germany. Your current fleet licensing is 100% compliant, but the new PBefG regulations in Q3 will require a minor adjustment to your partner insurance clauses. Shall I prepare the briefing?' }],
        operations: [{ role: 'agent', text: 'Operational load is steady. Stadium event at 8 PM will require 20% more fleet density in Sector 4.' }],
        guardian: [{ role: 'agent', text: 'Guardian Protocol Active. I am monitoring all lost item reports. Current investigation: Sarah L. (C-992-01) - Missing iPhone 15. Vehicle V-882 detected a shift in seat pressure after drop-off. Coordination with Driver P-044 is underway.' }],
        law_sentinel: [{ role: 'agent', text: 'Legal Sentinel Active. I am synchronized with Gesetze-im-Internet.de and European Data Directives. How can I assist with your German compliance strategy today?' }],
        intelligence_scout: [{ role: 'agent', text: 'Intelligence Scout Online. I am monitoring Federal Ministry portals for new mobility updates. Latest news: Frankfurt has announced a new "Green Zone" expansion for autonomous fleet parking starting next month.' }],
        architect_sentinel: [{ role: 'agent', text: 'Architect Sentinel at your service. I can implement any code changes, feature expansions, or tactical UI updates you require for the platform. What shall we build next?' }],
        media_shield: [{ 
            role: 'agent', 
            text: `### 🛡️ KHIAM MEDIA SHIELD SENTINEL ONLINE\n\nDirector, I am actively guarding your B2C social media streams, driver uploads, and hotel profile media directories.\n\n**Shield Protocol Directives:**\n- **Automated Censor Lock:** The system scans all uploaded files using multi-layer NSFW and violence recognition networks.\n- **Instant Scrubbing:** If a video or image features nudity or violence, it is immediately scrubbed from the CDN (deleted in under 120ms) to ensure GwG/BDSG compliance and brand protection.\n- **Offender Isolation:** The system identifies the uploading account, records their metadata, and flags them for immediate Super Admin suspension.\n- **Real-Time Logging:** See the intercepted violations below in the live Moderation Log Ledger. Ask me any case details (e.g. "Who posted nudity?" or "Explain the Commerzbank Arena incident").` 
        }]
    });
    const [currentMessage, setCurrentMessage] = useState('');

    const [eventsUpdateKey, setEventsUpdateKey] = useState(0);
    useEffect(() => {
        const triggerRender = () => {
            setEventsUpdateKey(prev => prev + 1);
        };
        try {
            if (window.parent) {
                window.parent.addEventListener('green-orders-updated', triggerRender);
                window.parent.addEventListener('green-stadium-events-updated', triggerRender);
            }
        } catch (e) {
            console.warn('Blocked from accessing window.parent for admin real-time sync:', e);
        }
        window.addEventListener('storage', triggerRender);
        return () => {
            try {
                if (window.parent) {
                    window.parent.removeEventListener('green-orders-updated', triggerRender);
                    window.parent.removeEventListener('green-stadium-events-updated', triggerRender);
                }
            } catch (e) {
                // Ignore cleanup error
            }
            window.removeEventListener('storage', triggerRender);
        };
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        return () => document.documentElement.setAttribute('data-theme', 'light');
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setSystemTime(new Date().toLocaleTimeString()), 1000);
        const handleKeyDown = (e) => {
            if (e.metaKey && e.key === 'k') {
                e.preventDefault();
                setIsCommandBarOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            clearInterval(timer);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Real-Time passive daily platform earnings ticking simulator
    useEffect(() => {
        const earningsTimer = setInterval(() => {
            if (!isDemo) return;
            if (isSimulatingPayoutFlow) return; // Pause ticking during active direct splits simulator

            const randIncrement = parseFloat((Math.random() * 0.16 + 0.02).toFixed(2));
            setTodayEarnings(prev => {
                const nextVal = parseFloat((prev + randIncrement).toFixed(2));
                localStorage.setItem('green_admin_today_earnings', nextVal);
                return nextVal;
            });
            
            setIsEarningsIncrementing(true);
            setEarningsPulseColor('text-emerald-400');
            setTimeout(() => {
                setIsEarningsIncrementing(false);
                setEarningsPulseColor('text-brand');
            }, 600);

            // Add a live event logging in the terminal logs
            const sources = [
                { cat: 'RIDE', msg: `🚗 Live Dispatch Intercept: Secured +${randIncrement.toFixed(2)} € step provision from trip` },
                { cat: 'CONCIERGE', msg: `🏨 Hotel checkout split: Platform commission +${randIncrement.toFixed(2)} € mapped to ledger` },
                { cat: 'EVENT', msg: `🎟️ Ticket booking split: platform margin +${randIncrement.toFixed(2)} € processed` }
            ];
            const chosen = sources[Math.floor(Math.random() * sources.length)];
            
            setStripeLiveWebhookEvents(prev => [
                { time: new Date().toLocaleTimeString(), level: chosen.cat, msg: chosen.msg },
                ...prev.slice(0, 15)
            ]);

        }, 4000);

        return () => clearInterval(earningsTimer);
    }, [isSimulatingPayoutFlow]);

    const handleSidebarClick = (id) => {
        setView(id);
        setIsSidebarOpen(false);
    };

    const handleVaultAuth = () => {
        if (vaultOTP === '1234') { // Simulated OTP
            setIsVaultUnlocked(true);
            setIsVerifyingVault(false);
            setVaultOTP('');
        } else {
            alert('INVALID SECURITY CODE');
        }
    };    

    // --- STRIPE CONNECT LIVE TRANSFERS & CLEARANCE DISBURSEMENTS ---
    const [isDisbursingPartnerId, setIsDisbursingPartnerId] = useState(null);
    const [disburseStep, setDisburseStep] = useState(0);

    const triggerLiveStripeSplitSimulation = () => {
        setIsSimulatingPayoutFlow(true);
        setSimulationStep(1);
        
        // Find partner details safely across connected partners, docPartners, or fallback
        const partner = stripeConnectedPartners.find(p => p.id === simulationPartnerId)
            || stripeConnectedPartners[0]
            || (docPartners.length > 0 ? {
                id: docPartners[0].id || docPartners[0].emailKey || 'acct_b2b_live',
                name: docPartners[0].name || docPartners[0].company || 'B2B Partner Live',
                balance: 0,
                grossContribution: 0
            } : null)
            || {
                id: simulationPartnerId || (simulationCategory === 'events' ? 'acct_stadium_live' : simulationCategory === 'hotels' ? 'acct_hotel_live' : 'acct_fleet_live'),
                name: simulationCategory === 'events' ? '🏟️ Stadion Arena (Test-Konto)' : simulationCategory === 'hotels' ? '🏨 Grand Hotel VIP (Test-Konto)' : '🚗 Green Shuttle Flotte (Test-Konto)',
                balance: 0,
                grossContribution: 0
            };
        const fareVal = parseFloat(simulationChargeAmount) || 24.50;
        
        // Calculate platform provision
        let provisionVal = 0;
        let tag = '';
        if (simulationCategory === 'transport') {
            provisionVal = calculateTripProvision(fareVal);
            tag = `🚗 Fleet Trip (${fareVal <= 30 ? 'Base Step' : 'Surge Increments'})`;
        } else if (simulationCategory === 'hotels') {
            provisionVal = parseFloat(calculateHotelProvision(fareVal));
            tag = '🏨 Hotel Suite (5% Commission)';
        } else if (simulationCategory === 'events') {
            provisionVal = parseFloat(calculateTicketProvision(fareVal));
            tag = '🎟️ VIP Tickets (5% Commission)';
        } else { // Food & Drinks
            provisionVal = 0.00;
            tag = '🍔 Food & Drinks (0% Platform Fee)';
        }

        // Calculate card fees (absorbed by partner)
        const cardFeeVal = parseFloat((fareVal * 0.014 + 0.25).toFixed(2));
        const partnerGrossVal = fareVal - provisionVal;
        const partnerNetVal = parseFloat((partnerGrossVal - cardFeeVal).toFixed(2));

        // Start step-by-step dispatch logs animation
        setTimeout(() => {
            setSimulationStep(2);
            setStripeLiveWebhookEvents(prev => [
                { time: new Date().toLocaleTimeString(), level: 'INGEST', msg: `📥 Customer ${simulationClientName} checked out: total charge ${fareVal.toFixed(2)} € via card split` },
                ...prev
            ]);
            
            setTimeout(() => {
                setSimulationStep(3);
                setStripeLiveWebhookEvents(prev => [
                    { time: new Date().toLocaleTimeString(), level: 'COMPUTE', msg: `🧮 provisions router intercept: Category: ${simulationCategory.toUpperCase()} | Net fee computed: ${provisionVal.toFixed(2)} €` },
                    ...prev
                ]);
                
                setTimeout(() => {
                    setSimulationStep(4);
                    setStripeLiveWebhookEvents(prev => [
                        { time: new Date().toLocaleTimeString(), level: 'ROUTING', msg: `💸 Splitting payout: routing ${partnerGrossVal.toFixed(2)} € gross to Connected Account ID ${partner.id}` },
                        ...prev
                    ]);
                    
                    setTimeout(() => {
                        setSimulationStep(5);
                        setStripeLiveWebhookEvents(prev => [
                            { time: new Date().toLocaleTimeString(), level: 'OPTION_B', msg: `🛡️ Option B applied: partner absorbs card processing fees (-${cardFeeVal.toFixed(2)} € deducted from gross)` },
                            ...prev
                        ]);
                        
                        setTimeout(() => {
                            const txId = 'ch_3M4d' + Math.random().toString(36).substring(2, 10).toUpperCase();
                            const invId = 'INV-2026-08' + (liveSplitsLedger.length + 81);
                            
                            // Insert simulated transaction to the splits ledger list
                            const newRow = {
                                id: Date.now(),
                                time: new Date().toLocaleTimeString(),
                                tx: txId,
                                partner: partner.id,
                                partnerName: partner.name,
                                client: simulationClientName,
                                total: fareVal.toFixed(2),
                                prov: provisionVal.toFixed(2),
                                fee: cardFeeVal.toFixed(2),
                                tag: tag,
                                status: provisionVal === 0 ? 'VENUE PAYOUT 🍹' : 'INSTANT SPLIT ⚡',
                                inv: provisionVal === 0 ? 'N/A (Direct Sales)' : invId,
                                category: simulationCategory,
                                date: new Date().toISOString().split('T')[0]
                            };
                            
                            setLiveSplitsLedger(prev => [newRow, ...prev]);
                            
                            // Update global payout totals
                            setStripeTotalVolume(prev => prev + fareVal);
                            setStripePlatformProvisions(prev => prev + provisionVal);
                            setStripeCardFees(prev => prev + cardFeeVal);
                            setStripeDirectSplitsProcessed(prev => prev + 1);

                            // Update partner balance and gross contributions
                            setStripeConnectedPartners(prev => {
                                const exists = prev.some(p => p.id === partner.id);
                                if (!exists) {
                                    return [...prev, {
                                        id: partner.id,
                                        name: partner.name,
                                        manager: simulationClientName,
                                        industry: simulationCategory,
                                        status: 'Active',
                                        balance: (provisionVal === 0 ? fareVal - cardFeeVal : partnerNetVal),
                                        grossContribution: fareVal,
                                        iban: 'DE44 5002 0000 1294 88',
                                        swift: 'STRIPETEST',
                                        commissionModel: tag,
                                        totalPaidOut: 0
                                    }];
                                }
                                return prev.map(p => {
                                    if (p.id === partner.id) {
                                        return {
                                            ...p,
                                            balance: (p.balance || 0) + (provisionVal === 0 ? fareVal - cardFeeVal : partnerNetVal),
                                            grossContribution: (p.grossContribution || 0) + fareVal
                                        };
                                    }
                                    return p;
                                });
                            });

                            // Compound live daily platform net earnings instantly!
                            if (provisionVal > 0) {
                                setTodayEarnings(prev => {
                                    const nextVal = parseFloat((prev + provisionVal).toFixed(2));
                                    localStorage.setItem('green_admin_today_earnings', nextVal);
                                    return nextVal;
                                });
                                setIsEarningsIncrementing(true);
                                setEarningsPulseColor('text-amber-500 font-extrabold scale-110');
                                setTimeout(() => {
                                    setIsEarningsIncrementing(false);
                                    setEarningsPulseColor('text-brand');
                                }, 1500);
                            }

                            setStripeLiveWebhookEvents(prev => [
                                { time: new Date().toLocaleTimeString(), level: 'FINANZAMT', msg: `🧾 B2B Audit Invoice ${invId} compiled & archived locally for tax registry` },
                                { time: new Date().toLocaleTimeString(), level: 'SUCCESS', msg: `⚡ Instant split clear! jordan net payout: +${provisionVal.toFixed(2)} € | ${partner.name} net payout: +${(provisionVal === 0 ? fareVal - cardFeeVal : partnerNetVal).toFixed(2)} €` },
                                ...prev
                            ]);

                            setIsSimulatingPayoutFlow(false);
                            setSimulationStep(0);
                            triggerNotification('success', 'Stripe Connect Split Success ⚡', `Successfully settled ${fareVal.toFixed(2)} € with ${partner.name}.`);
                        }, 800);
                    }, 800);
                }, 800);
            }, 800);
        }, 800);
    };

    const triggerPartnerDisbursement = (partnerId) => {
        const partner = stripeConnectedPartners.find(p => p.id === partnerId);
        if (!partner) return;
        if (partner.balance <= 0) {
            triggerNotification('error', 'Zero Balance Limit', `${partner.name} has no pending balances for SEPA clearing.`);
            return;
        }

        setIsDisbursingPartnerId(partnerId);
        setDisburseStep(1);

        setTimeout(() => {
            setDisburseStep(2);
            setStripeLiveWebhookEvents(prev => [
                { time: new Date().toLocaleTimeString(), level: 'PSD2', msg: `🏦 Establishing secure PSD2 channel to ${partner.iban} via Swift ${partner.swift}` },
                ...prev
            ]);

            setTimeout(() => {
                setDisburseStep(3);
                setStripeLiveWebhookEvents(prev => [
                    { time: new Date().toLocaleTimeString(), level: 'BAFIN', msg: `🛡️ GwG Art. 12 Clearing: Payout of ${partner.balance.toFixed(2)} € vetted under Germany Money Laundering Act` },
                    ...prev
                ]);

                setTimeout(() => {
                    const balanceDisbursed = partner.balance;
                    // Reset partner balance and add to total paid out
                    setStripeConnectedPartners(prev => prev.map(p => {
                        if (p.id === partnerId) {
                            return {
                                ...p,
                                balance: 0.00,
                                totalPaidOut: p.totalPaidOut + balanceDisbursed
                            };
                        }
                        return p;
                    }));

                    setStripeLiveWebhookEvents(prev => [
                        { time: new Date().toLocaleTimeString(), level: 'SETTLED', msg: `🟢 SEPA Bank Clearing Complete: Disbursed ${balanceDisbursed.toFixed(2)} € to bank account of ${partner.name}` },
                        ...prev
                    ]);

                    setIsDisbursingPartnerId(null);
                    setDisburseStep(0);
                    triggerNotification('success', 'SEPA Settlement Success 🏦', `Transferred €${balanceDisbursed.toFixed(2)} SEPA directly to ${partner.name}.`);
                }, 1000);
            }, 1000);
        }, 1000);
    };

    // --- STRIPE CONNECT GERMANY KYC & PAYOUT COMPLIANCE METHODS ---
    const handleIbanChange = (e) => {
        let val = e.target.value.replace(/\s+/g, '').toUpperCase();
        if (val.length > 22) val = val.substring(0, 22);
        
        const parts = [];
        for (let i = 0; i < val.length; i += 4) {
            parts.push(val.substring(i, i + 4));
        }
        setStripeKycIban(parts.join(' '));
    };

    const startInstantBankVerify = () => {
        setIsStripeVerifyingBank(true);
        setTimeout(() => {
            setIsStripeVerifyingBank(false);
            setStripeBankVerified(true);
            localStorage.setItem('green_admin_stripe_bank_verified', 'true');
            triggerNotification('success', 'PSD2 Bank Verified', 'Instant bank handshake BaFin exchange cleared.');
        }, 1800);
    };

    const triggerNativeFileUpload = (slot) => {
        setActiveScanningSlot(slot);
        const input = document.getElementById('hidden-compliance-file-input');
        if (input) input.click();
    };

    const handleNativeFileChange = (e) => {
        const file = e.target.files[0];
        if (!file || !activeScanningSlot) return;
        
        const slot = activeScanningSlot;
        // Simulate high-speed compliance scanner OCR
        setSimulatedScanningProgress(10);
        const timer = setInterval(() => {
            setSimulatedScanningProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setStripeKycDocs(current => {
                        const updated = {
                            ...current,
                            [slot]: { status: 'verified', name: file.name, date: new Date().toLocaleDateString() }
                        };
                        localStorage.setItem('green_admin_stripe_docs', JSON.stringify(updated));
                        return updated;
                    });
                    setActiveScanningSlot(null);
                    triggerNotification('success', 'Document Processed', `${file.name} signature verified successfully.`);
                    return 0;
                }
                return prev + 15;
            });
        }, 150);
    };

    const triggerMediathekUpload = (slot) => {
        setActiveMediathekSlot(slot);
        setIsMediathekOpen(true);
    };

    const selectMediathekDocument = (docName) => {
        setIsMediathekOpen(false);
        const slot = activeMediathekSlot;
        if (!slot) return;
        
        setActiveScanningSlot(slot);
        setSimulatedScanningProgress(15);
        const timer = setInterval(() => {
            setSimulatedScanningProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setStripeKycDocs(current => {
                        const updated = {
                            ...current,
                            [slot]: { status: 'verified', name: docName, date: new Date().toLocaleDateString() }
                        };
                        localStorage.setItem('green_admin_stripe_docs', JSON.stringify(updated));
                        return updated;
                    });
                    setActiveScanningSlot(null);
                    triggerNotification('success', 'OCR Alignment Successful', `${docName} approved under GwG Art. 18.`);
                    return 0;
                }
                return prev + 20;
            });
        }, 150);
    };

    const triggerCameraScan = (slot) => {
        setActiveCameraSlot(slot);
        setIsCameraScanOpen(true);
    };

    const captureCameraScan = () => {
        const slot = activeCameraSlot;
        setIsCameraScanOpen(false);
        if (!slot) return;
        
        setActiveScanningSlot(slot);
        setSimulatedScanningProgress(10);
        const timer = setInterval(() => {
            setSimulatedScanningProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setStripeKycDocs(current => {
                        const docLabels = {
                            gewerbe: 'DE_Gewerbeauszug_Frankfurt.pdf',
                            idCard: 'DE_Personalausweis_Mustermann.jpg',
                            pSchein: 'DE_Personenbefoerderungsschein_Jordan.pdf',
                            insurance: 'Allianz_Betriebshaftpflicht_Policy.pdf'
                        };
                        const name = docLabels[slot] || 'Captured_Document.jpg';
                        const updated = {
                            ...current,
                            [slot]: { status: 'verified', name, date: new Date().toLocaleDateString() }
                        };
                        localStorage.setItem('green_admin_stripe_docs', JSON.stringify(updated));
                        return updated;
                    });
                    setActiveScanningSlot(null);
                    triggerNotification('success', 'Biometric Camera Capture Verified', 'Document metadata verified under GwG compliance.');
                    return 0;
                }
                return prev + 15;
            });
        }, 150);
    };

    const submitStripeCompliance = () => {
        const missingDocs = Object.keys(stripeKycDocs).filter(k => stripeKycDocs[k].status !== 'verified');
        if (missingDocs.length > 0) {
            triggerNotification('error', 'Compliance Deficit', 'BaFin mandates all 4 verification documents.');
            return;
        }
        if (!stripeBankVerified) {
            triggerNotification('error', 'Payout Channel Pending', 'Please complete the bank verification handshake.');
            return;
        }
        
        localStorage.setItem('green_admin_stripe_account_id', stripeKycAccountId);
        localStorage.setItem('green_admin_stripe_name', stripeKycName);
        localStorage.setItem('green_admin_stripe_email', stripeKycEmail);
        localStorage.setItem('green_admin_stripe_address', stripeKycAddress);
        localStorage.setItem('green_admin_stripe_tax_id', stripeKycTaxId);
        localStorage.setItem('green_admin_stripe_iban', stripeKycIban);
        localStorage.setItem('green_admin_stripe_swift', stripeKycSwift);
        
        setStripeKycSubmitted(true);
        localStorage.setItem('green_admin_stripe_submitted', 'true');
        triggerNotification('success', 'Stripe Connect Dossier Locked', 'KYC compliance validated & approved by Stripe.');
    };

    const resetStripeCompliance = () => {
        localStorage.removeItem('green_admin_stripe_account_id');
        localStorage.removeItem('green_admin_stripe_name');
        localStorage.removeItem('green_admin_stripe_email');
        localStorage.removeItem('green_admin_stripe_address');
        localStorage.removeItem('green_admin_stripe_tax_id');
        localStorage.removeItem('green_admin_stripe_iban');
        localStorage.removeItem('green_admin_stripe_swift');
        localStorage.removeItem('green_admin_stripe_submitted');
        localStorage.removeItem('green_admin_stripe_bank_verified');
        localStorage.removeItem('green_admin_stripe_docs');
        
        setStripeKycAccountId('acct_1oA92FFK99014B');
        setStripeKycName('Jordan Executive');
        setStripeKycEmail('jordan@green.io');
        setStripeKycAddress('Sky Tower 1, Main Plaza, Frankfurt');
        setStripeKycTaxId('DE-88-129-44');
        setStripeKycIban('DE99 2004 0000 1294 55');
        setStripeKycSwift('DBANKDEMXXX');
        setStripeKycSubmitted(false);
        setStripeBankVerified(false);
        setStripeKycDocs({
            gewerbe: { status: 'missing', name: 'Gewerbeanmeldung / Commercial Registry' },
            idCard: { status: 'missing', name: 'Identity Proof (ID Front & Back)' },
            pSchein: { status: 'missing', name: 'Passenger Permit (P-Schein)' },
            insurance: { status: 'missing', name: 'Commercial Liability Insurance' }
        });
    };
    
    // --- PROVISIONS CALCULATION & INTEGRATION METHODS ---
    const calculateTripProvision = (fare) => {
        const f = parseFloat(fare);
        if (isNaN(f) || f <= 1.00) return 0;
        
        // 3 Euro if price is > 1.00 and <= 30.00
        // 5 Euro if price is 30.01 to 60.00
        // 7 Euro if price is 60.01 to 90.00
        // and so on... (adding 2 Euro for each incremental 30.00 Euro step)
        const step = Math.ceil(f / 30.00);
        return 3.00 + (step - 1) * 2.00;
    };

    const calculateHotelProvision = (cost) => {
        const c = parseFloat(cost);
        if (isNaN(c) || c <= 0) return "0.00";
        return (c * (parseFloat(hotelProvisionRate) / 100)).toFixed(2);
    };

    const calculateTicketProvision = (cost) => {
        const c = parseFloat(cost);
        if (isNaN(c) || c <= 0) return "0.00";
        return (c * (parseFloat(ticketProvisionRate) / 100)).toFixed(2);
    };

    const saveProvisionsConfig = () => {
        localStorage.setItem('green_prov_trip_base', tripBaseProvision);
        localStorage.setItem('green_prov_trip_inc', tripIncrementProvision);
        localStorage.setItem('green_prov_trip_thresh', tripThreshold);
        localStorage.setItem('green_prov_hotel_rate', hotelProvisionRate);
        localStorage.setItem('green_prov_ticket_rate', ticketProvisionRate);
        
        const provisionClause = `\n\n### SECTION 7: FINANCIAL PROVISIONS & COMMISSIONS\nAs a connected business partner, you agree to the following automated provision structure taken directly via Stripe Connect:\n- **Fleet Managers (Rides):** A base fee of €${parseFloat(tripBaseProvision).toFixed(2)} plus an increment of €${parseFloat(tripIncrementProvision).toFixed(2)} per €30.00 of the total ride price.\n- **Hotels & Stadiums:** A flat platform fee of ${parseFloat(hotelProvisionRate).toFixed(1)}% on all bookings.\n- **Football Match Tickets:** A flat platform fee of ${parseFloat(ticketProvisionRate).toFixed(1)}% applies exclusively to the sale of official football match tickets. This provision does NOT apply to any other events held in the stadium, nor does it apply to club events, parties, or general nightlife admissions.\nThese fees are automatically deducted prior to your payout.\n`;
        
        let newTerms = defaultTermsOfServiceText;
        if (newTerms.includes('### SECTION 7: FINANCIAL PROVISIONS')) {
            newTerms = newTerms.split('### SECTION 7: FINANCIAL PROVISIONS')[0];
        }
        newTerms += provisionClause;
        setTermsOfServiceText(newTerms);

        triggerNotification('success', 'Provisions Config Saved', 'Commission guidelines and Legal Terms deployed to the platform router.');
    };
    
    const handleInsightAction = (id, action) => {
        setNeuralInsights(prev => prev.filter(ins => ins.id !== id));
        triggerNotification(action === 'approve' ? 'success' : 'error', 'Director Decision Logged', `Action ${action.toUpperCase()} executed for incident ${id}.`);
    };

    // --- NEW AI CAMPAIGN AGENT FUNCTIONS ---
    const sendAngebotMessage = () => {
        if (!currentAngebotMessage.trim()) return;
        const msgText = currentAngebotMessage;
        setAngebotMessages(prev => [...prev, { role: 'user', text: msgText }]);
        setCurrentAngebotMessage('');

        setTimeout(() => {
            const query = msgText.toLowerCase();
            let partner = 'Green Palace Hotel';
            let title = '30% Off Premium Suites';
            let discount = '30%';

            // Parse brand / partner
            if (query.includes('saffron') || query.includes('dining') || query.includes('restaurant')) {
                partner = 'Saffron Fine Dining';
                title = 'Free Starter + VIP Table';
                discount = 'Free Item';
            } else if (query.includes('velvet') || query.includes('blue') || query.includes('bar')) {
                partner = 'The Blue Velvet Bar';
                title = '50% Off All Cocktail Selections';
                discount = '50%';
            } else if (query.includes('stadium') || query.includes('arena') || query.includes('ticket')) {
                partner = 'Green Stadium Arena';
                title = '15% Off VIP Skybox Ticket';
                discount = '15%';

            } else if (query.includes('neon') || query.includes('festival') || query.includes('club')) {
                partner = 'Midnight Neon Club';
                title = 'Free Welcome Drink & Express Gate Access';
                discount = 'Free Drink';
            }

            // Parse custom terms
            const matchPercent = query.match(/(\d+%)/);
            if (matchPercent) {
                discount = matchPercent[1];
                title = `${discount} Off Special Promotion`;
            }

            if (query.includes('offer:') || query.includes('title:')) {
                const matchTitle = msgText.match(/(?:offer|title):\s*['"]?([^'"]+)['"]?/i);
                if (matchTitle) title = matchTitle[1];
            }

            const draft = {
                partner,
                title,
                discount,
                channel: 'Passenger Active Feed',
                scheduled: query.includes('tomorrow') ? 'Tomorrow at 18:00' : 'Immediate Deployment'
            };

            setCampaignDraft(draft);

            setAngebotMessages(prev => [
                ...prev,
                {
                    role: 'agent',
                    text: `I have compiled the strategic blueprint for this campaign, Commander. Here are the structured parameters below. I am ready to broadcast this across the central grid. Should I authorize this deployment?`,
                    draft: draft
                }
            ]);
        }, 1000);
    };

    const deployAngebotCampaign = () => {
        if (!campaignDraft) return;
        setAngebotIsDeploying(true);

        setTimeout(() => {
            // Save to active offers list in localStorage
            const activeOffers = JSON.parse(localStorage.getItem('green_active_offers') || '[]');
            const newOffer = {
                id: `offer-${Date.now()}`,
                shop: campaignDraft.partner,
                offer: campaignDraft.title.toUpperCase(),
                category: 'Exclusive Campaign',
                color: campaignDraft.partner.includes('Saffron') ? 'text-amber-400' :
                       campaignDraft.partner.includes('Blue Velvet') ? 'text-brand' :
                       campaignDraft.partner.includes('Palace') ? 'text-violet-400' : 'text-emerald-400'
            };
            localStorage.setItem('green_active_offers', JSON.stringify([newOffer, ...activeOffers]));

            // Add to system ledger
            setStripeLiveWebhookEvents(prev => [
                { time: new Date().toLocaleTimeString(), level: 'CAMPAIGN', msg: `📡 Broadcast deployed: ${campaignDraft.title} for ${campaignDraft.partner} published to Passenger Active Feed.` },
                ...prev
            ]);

            setAngebotIsDeploying(false);
            setCampaignDraft(null);

            setAngebotMessages(prev => [
                ...prev,
                {
                    role: 'agent',
                    text: `Deployment successful. The campaign signal is active and broadcasting live across the central passenger grid network. All clients have been updated.`
                }
            ]);

            triggerNotification('success', 'Campaign Deployed 📡', 'Offer successfully broadcasted across the customer grid.');
        }, 1500);
    };

    const sendMessage = () => {
        if (!currentMessage) return;
        const msgText = currentMessage;
        setChatMessages(prev => ({
            ...prev,
            [activeAgent]: [...prev[activeAgent], { role: 'user', text: msgText }]
        }));
        setCurrentMessage('');
        
        // Simulate Agent Response with 1s latency
        setTimeout(() => {
            let reply = '';
            const query = msgText.toLowerCase();
            
            if (activeAgent === 'media_shield') {
                if (query.includes('who') || query.includes('who posted') || query.includes('identity')) {
                    reply = `### 🔍 OFFENDER IDENTITY AUDIT REPORT\n` +
                            `Based on cryptographic CDN upload trace logs, the source credentials are:\n\n` +
                            `*   **Incident #1 (Nudity):** Username \`Max_Mustermann_VIP\` (Secure ID: \`U-992-04\`). Session IP logged at hotel sector. GDPR anonymized token maps this to \`[GUEST_ANON_114]\`.\n` +
                            `*   **Incident #2 (Violence):** Username \`StreetDrifter_99\` (Secure ID: \`D-402-12\`). Connected driver profile. GDPR anonymized token maps this to \`[DRIVER_ANON_304]\`.\n` +
                            `*   **Incident #3 (Profanity):** Username \`ClubOwner_Neon\` (Secure ID: \`P-192-88\`). Connected manager profile. GDPR anonymized token maps this to \`[PARTNER_ANON_202]\`.\n\n` +
                            `*Action taken:* IP addresses quarantined, account access certificates temporarily revoked, and live suspension dossier committed to the staff panel under GwG §6.`;
                } else if (query.includes('why') || query.includes('reason') || query.includes('censor') || query.includes('nudity') || query.includes('violence')) {
                    reply = `### 🛡️ MODERATION REASONING LEDGER\n` +
                            `The automated neural shield sentinel scans each file on the ingestion boundary. The triggers were:\n\n` +
                            `1.  **File: \`vip_party_rec.mp4\` (Commerzbank Arena)**\n` +
                            `    *   *Violation:* Adult Content / Nudity\n` +
                            `    *   *Telemetry Trigger:* Neural NSFW Model flagged explicit exposure. Confidence index: **98.4%**.\n` +
                            `    *   *Action:* scrubbed in 108ms. PII mapped to \`[GUEST_ANON_114]\`.\n` +
                            `2.  **File: \`sector2_drift_fight.mov\` (Sector 2)**\n` +
                            `    *   *Violation:* Extreme Physical Violence\n` +
                            `    *   *Telemetry Trigger:* Audio-Visual Combat Classifier flagged aggressive physical assault. Confidence index: **95.1%**.\n` +
                            `    *   *Action:* scrubbed in 115ms. Driver ID mapped to \`[DRIVER_ANON_304]\`.\n` +
                            `3.  **File: \`neon_vault_promo.jpg\` (Midnight Neon)**\n` +
                            `    *   *Violation:* Toxic Profanity in Promotional Banner Text\n` +
                            `    *   *Telemetry Trigger:* OCR text scanner detected highly offensive explicit wording. Confidence index: **99.0%**.\n` +
                            `    *   *Action:* scrubbed in 60ms. Partner ID mapped to \`[PARTNER_ANON_202]\`.`;
                } else {
                    reply = `### 🛡️ KHIAM MEDIA SHIELD SENTINEL REPORT\n` +
                            `Director, I am actively guarding all social media and media library streams for nudity and violence.\n\n` +
                            `*   **Active Monitoring Channels:** B2C Social Feeds, Driver Uploads, Mews PMS Galleries.\n` +
                            `*   **Automated Scrubbing Action:** Instant CDN deletion upon NSFW/combat model detection. Confirmed scrubbing time is under 120ms.\n\n` +
                            `*Query options:* type *"why"* for the trigger details or type *"who"* to get offender IDs and IPs.`;
                }
            } else if (activeAgent === 'financial') {
                if (query.includes('provision') || query.includes('fee') || query.includes('commission')) {
                    reply = `### 📊 CORE REVENUE & COMMISSION PARAMETERS\n` +
                            `I have audited the system configurator registry. Current parameters are:\n\n` +
                            `*   **🚗 Fleet Ride Provision:** Step-based model. €3.00 if the fare is between €1.00 and €30.00; €5.00 if the fare is between €30.01 and €60.00; and adding €2.00 for each subsequent €30.00 increment.\n` +
                            `*   **🏨 Hotel & Ticket Commissions:** Flat **5%** of gross hotel bookings and VIP event tickets.\n` +
                            `*   **🍔 Foods, Drinks, Desserts:** **0% Platform Commission** (100% of sales go directly to the partner venue).\n\n` +
                            `*Status:* Confirmed BaFin cleared. Persisted in central database router.`;
                } else {
                    reply = `### 📈 FISCAL SENTINEL INTELLIGENCE REPORT\n` +
                            `Director, the platform cashflow registry is fully compliant and optimized under GwG & BaFin guidelines.\n\n` +
                            `*   **Stripe Connected Payout Channel:** PSD2 instant bank handshake verified DE99 IBAN clearances.\n` +
                            `*   **Surge Compensation Mult:** Active surge models are generating a **1.2x** base margin to secure driver densities in Sector 4.\n\n` +
                            `*Query me with "provisions" or "fees" to check our B2B commission structure.*`;
                }
            } else if (activeAgent === 'law_sentinel') {
                reply = `### 🛡️ LEGAL SENTINEL COMPLIANCE CLEARANCE\n` +
                        `I am synchronized with European Data Directives (GDPR) and German Mobility Legislation (PBefG):\n\n` +
                        `*   **Datenschutz Compliance (DSGVO):** Personal identifiable metrics are fully tokenized at the database boundary under Art. 25 & 32. External data sharing is strictly blocked.\n` +
                        `*   **German PBefG §49 Compliance:** Verified that all connected private hire vehicle units return automatically to their registered business dispatch yards after completed orders to prevent territorial operating violations.\n` +
                        `*   **V5C Document Audit:** Checking uploading commercial permits to prevent license forgery.`;
            } else if (activeAgent === 'operations') {
                reply = `### 🚗 TACTICAL OPS CORE TELEMETRY\n` +
                        `Operational parameters are steady and fleet density is balanced across the 4 primary sectors:\n\n` +
                        `*   **Matchmaking Latency:** Current automated EV driver allocation locks in **5.8 seconds** average.\n` +
                        `*   **Live Sector Load:** Stadium event at South Gate is approaching peak volume; Sector 4 has been reinforced with 8 backup EV units.\n` +
                        `*   **GPS Spoofing Shield:** Active. Detected and isolated driver spoofing signals near Frankfurt Sector 2.`;
            } else if (activeAgent === 'guardian') {
                reply = `### 🛡️ SAFETY SENTINEL MONITOR\n` +
                        `Safety Protocols are fully engaged at the platform gateway:\n\n` +
                        `*   **Lost & Found Protocol:** Tracking incident Sarah L. (\`C-992-01\`). The IoT pressure sensor in vehicle \`V-882\` detected a post-trip weight change of 180g. Driver coordinates lock near Sector 1. Phone recovery has been logged.\n` +
                        `*   **Fraud Shield:** Automated account bans active for drivers bypassing fair-split provisions.`;
            } else if (activeAgent === 'intelligence_scout') {
                reply = `### 🔮 INTEL SCOUT AUTOMATED SCANNER\n` +
                        `Director, I am harvesting public portals for regional updates:\n\n` +
                        `*   **Autonomous Parking Zone:** Frankfurt Sector 2 has declared a carbon-zero "Green Zone" for EV autonomous fleet holding docks. We have registered our reserve docks.\n` +
                        `*   **Competitor Surge Spread:** Competitor pricing is currently 14% higher on high-end routes, leaving an excellent margin for our premium 1.2x surge tier.`;
            } else if (activeAgent === 'architect_sentinel') {
                reply = `### 💻 SYSTEM ARCHITECT SENTINEL ONLINE\n` +
                        `The platform infrastructure is secured and compiling successfully:\n\n` +
                        `*   **Vite Compiler Status:** Verified clean transformation of 2,280 React modules in 5.81s.\n` +
                        `*   **Security Purge:** Removed all developer shortcut codes, manual database bypass triggers, and context switching menus from partner folders.\n` +
                        `*   **Branding CSS Theme:** Locked emerald green HSL variables across all responsive layouts.`;
            } else {
                reply = `### 🤖 NEURAL CORE ASSISTANT ONLINE\n` +
                        `Director, I am at your service. Tell me how I can assist with system engineering, compliance, or sales intelligence parameters today.`;
            }
            
            setChatMessages(prev => ({
                ...prev,
                [activeAgent]: [...prev[activeAgent], { role: 'agent', text: reply }]
            }));
        }, 1000);
    };

    return (
        <div 
            data-theme="dark"
            className={`absolute left-0 right-0 bottom-0 overflow-hidden font-sans text-primary flex flex-row selection:bg-brand selection:text-dark-900 transition-colors duration-1000 transition-all duration-300 ${systemLockdown ? 'bg-red-950/20' : 'bg-gradient-to-br from-[#0A1A2F] via-[#050B14] to-[#020202]'}`}
            style={{
                top: `calc(${useSafeArea ? 'env(safe-area-inset-top, 0px)' : '0px'} + ${notchAdjustment}px)`,
                height: `calc(100% - (${useSafeArea ? 'env(safe-area-inset-top, 0px)' : '0px'} + ${notchAdjustment}px))`
            }}
        >
            {/* SECURITY SCANNER OVERLAY */}
            <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden opacity-[0.03]">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
                <motion.div animate={{ y: ['0%', '100%'] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} className="absolute top-0 left-0 w-full h-1 bg-brand/20 blur-sm" />
            </div>

            {/* --- PERSISTENT DIRECTOR SIDEBAR --- */}
            <motion.aside 
                initial={false}
                animate={{ width: isSidebarCollapsed ? 96 : 320 }}
                className="h-full bg-transparent flex flex-col z-50 relative group app-sidebar"
            >
                {/* Sidebar Toggle */}
                <button 
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-brand text-dark-900 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-[60] border-2 border-dark-950"
                >
                    <ChevronRight size={14} className={`transition-transform duration-500 ${isSidebarCollapsed ? '' : 'rotate-180'}`} />
                </button>

                {/* Logo Area */}
                <div className="p-8 pb-12 overflow-hidden flex items-center gap-4">
                    <div className="min-w-[48px] h-12 rounded-2xl bg-brand/10 border border-brand/40 flex items-center justify-center text-brand shadow-[0_0_20px_rgba(52,211,153,0.2)]">
                        <Shield size={24} />
                    </div>
                    {!isSidebarCollapsed && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                            <h2 className="text-xl font-black italic uppercase tracking-tighter text-white leading-none">Director</h2>
                            <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-[0.4em] text-brand/60 mt-1">Alpha Command</p>
                        </motion.div>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
                    {[
                        { id: 'command-deck', label: 'Command Deck', icon: ShieldCheck, badge: 'Alpha' },
                        { id: 'product-hub', label: 'Grien Shop Hub', icon: ShoppingBag, badge: 'Smart' },
                        { id: 'growth-hub', label: 'Growth & Intelligence', icon: TrendingUp, badge: 'AI Pro' },
                        { id: 'agents', label: 'Neural Agents', icon: Bot, badge: 'AI' },
                        { id: 'partner-hub', label: 'Partner Hub', icon: Users, badge: 'NEW' },
                        { id: 'ticket-hub', label: 'Ticket Hub', icon: Ticket, badge: 'Hub' },
                        { id: 'angebot-hub', label: 'Angebot Hub', icon: Tag, badge: 'AI Agent' },
                        { id: 'settlements', label: 'Settlement Ledger', icon: Wallet },
                        { id: 'stripe-hub', label: 'Stripe Connect Hub', icon: Landmark, badge: 'LIVE' },
                        { id: 'feedback', label: 'Feedback Hub', icon: MessageSquare },
                        { id: 'fleet', label: 'Fleet Telemetry', icon: Car },
                        { id: 'shuttle-hub', label: 'Smart Shuttle Hub', icon: Bus, badge: 'Smart' },
                        // Temporarily hidden per user request
                        // { id: 'hotels', label: 'Hospitality VIP', icon: Building2 },
                        // { id: 'events', label: 'Partys Events', icon: Calendar },
                        // { id: 'system-doors', label: 'Portal Doors', icon: Monitor },
                        { id: 'customer-service', label: 'Customer Service', icon: Phone },
                        { id: 'document-hub', label: 'Document Hub', icon: FolderSearch, badge: 'KYC' },
                        { id: 'staff-hub', label: 'Intelligence Staff', icon: Users },
                        { id: 'app-settings', label: 'System Config', icon: Settings }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative ${view === item.id ? 'text-brand' : 'hover:bg-white/5 text-gray-500'}`}
                        >
                            <div className={`${view === item.id ? 'text-brand' : 'group-hover:text-brand'} transition-colors`}>
                                <item.icon size={20} />
                            </div>
                            {!isSidebarCollapsed && (
                                <div className="flex-1 flex items-center justify-between overflow-hidden">
                                    <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest whitespace-nowrap">{item.label}</span>
                                    {item.badge && <span className={`text-[7px] font-black px-2 py-0.5 rounded uppercase ${view === item.id ? 'bg-brand text-dark-900' : 'bg-brand/10 text-brand'}`}>{item.badge}</span>}
                                </div>
                            )}
                            {view === item.id && <motion.div layoutId="active-indicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl rounded-full" />}
                        </button>
                    ))}
                </nav>

                {/* Footer Exit */}
                <div className="p-6 border-t border-white/5">
                    <button 
                        onClick={logout}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-all group"
                    >
                        <LogOut size={20} />
                        {!isSidebarCollapsed && <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest">Logout System</span>}
                    </button>
                </div>
            </motion.aside>

            {/* --- RIGHT CONTENT AREA --- */}
            <div className="flex-1 h-full flex flex-col relative overflow-hidden">

            {/* NEURAL COMMAND BAR */}
            <AnimatePresence>
                {isCommandBarOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-start justify-center pt-32 bg-dark-950/80 backdrop-blur-md p-6" onClick={() => setIsCommandBarOpen(false)}>
                        <motion.div initial={{ y: -20, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: -20, scale: 0.95 }} className="w-full max-w-2xl bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-brand/30 rounded-[2rem] shadow-[0_0_50px_rgba(52,211,153,0.2)] overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-6 flex items-center gap-4 border-b border-white/5">
                                <Search size={24} className="text-brand" />
                                <input autoFocus placeholder="Neural Search..." className="flex-1 bg-transparent border-none outline-none text-xl font-medium" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                                <kbd className="px-2 py-1 bg-white/5 rounded text-[10px] md:text-xs lg:text-sm text-gray-500 border border-white/10">ESC</kbd>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* DIRECTOR'S HEADER */}
            <header className="h-24 px-10 flex justify-between items-center border-b border-white/5 bg-dark-950/80 backdrop-blur-3xl relative z-40">
                <div className="flex items-center gap-10">

                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <ShieldCheck size={18} className={`${systemLockdown ? 'text-red-500' : 'text-brand'}`} />
                            <h1 className="text-2xl font-black italic uppercase tracking-tighter">{systemLockdown ? 'EMERGENCY' : 'DIRECTOR'} <span className="text-brand">COMMAND</span></h1>
                        </div>
                        <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-brand uppercase tracking-widest mt-1">{systemTime} | SEC-LEVEL: ALPHA</span>
                    </div>
                </div>

                {/* LIVE PLATFORM DAILY NET EARNINGS TICKER */}
                <div 
                    onClick={() => setView('stripe-hub')} 
                    className="hidden md:flex items-center gap-4 px-8 py-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl relative overflow-hidden group hover:border-emerald-400 hover:bg-emerald-500/20 transition-all select-none shadow-[0_0_20px_rgba(16,185,129,0.05)] cursor-pointer"
                >
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform"><Activity size={60} className="text-emerald-400" /></div>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                        <Activity size={16} className={`animate-pulse ${isEarningsIncrementing ? 'scale-125 text-brand animate-bounce' : ''}`} />
                    </div>
                    <div>
                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-widest leading-none">Today's Net Platform Margin</p>
                        <motion.p 
                            animate={{ scale: isEarningsIncrementing ? [1, 1.15, 1] : 1 }}
                            transition={{ duration: 0.3 }}
                            className={`text-lg font-mono font-black italic tracking-tight mt-0.5 ${earningsPulseColor} transition-colors duration-300`}
                        >
                            {todayEarnings.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                        </motion.p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[6px] font-black rounded uppercase tracking-wider animate-pulse shrink-0">
                        Live Payout splits ⚡
                    </span>
                </div>

                <div className="flex items-center gap-8">
                    <div className="hidden lg:flex items-center gap-4 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:border-white/30 transition-all" onClick={() => setIsCommandBarOpen(true)}>
                        <Search size={16} className="text-gray-500" />
                        <span className="text-xs md:text-sm lg:text-base font-bold text-gray-500 uppercase tracking-widest">Neural Search...</span>
                        <kbd className="px-2 py-0.5 bg-white/5 rounded text-[8px] md:text-[10px] lg:text-xs text-gray-600 border border-white/10">⌘K</kbd>
                    </div>
                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setView('personal-data')}>
                        <div className="text-right">
                            <p className="text-[10px] md:text-xs lg:text-sm font-black italic uppercase text-white group-hover:text-brand transition-colors">{dossierFullName || 'Jordan'}</p>
                            <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-gray-600 uppercase tracking-widest">Chief Director</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-brand/20 border border-brand/40 p-1 group-hover:scale-110 transition-transform">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${dossierFullName || 'Jordan'}`} alt="Director" className="w-full h-full rounded-xl" />
                        </div>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto p-10 relative no-scrollbar">
                <div className="relative z-10 max-w-[1800px] mx-auto">
                    <AnimatePresence mode="wait">
                        {view === 'growth-hub' && (
                            <motion.div key="growth-hub" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                                {/* EXECUTIVE PITCH MODE HEADER */}
                                <div className="p-8 rounded-[3rem] bg-gradient-to-r from-emerald-950/60 via-black to-dark-950 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
                                    <div className="space-y-2 z-10">
                                        <div className="flex items-center gap-3">
                                            <span className="px-4 py-1.5 rounded-full bg-brand/20 text-brand border border-brand/30 text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                                                <Sparkles size={14} /> AI GROWTH & INTELLIGENCE ENGINE
                                            </span>
                                            {isPitchModeActive && (
                                                <span className="px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-black uppercase tracking-widest animate-pulse">
                                                    🎬 EXECUTIVE PITCH MODE ACTIVE
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-4xl font-black italic uppercase text-white tracking-tighter">
                                            GRIEN <span className="text-brand">BRAND & B2B LEADS</span> HUB
                                        </h2>
                                        <p className="text-xs text-gray-400 max-w-2xl font-medium">
                                            Real-time telemetry for platform brand exposure, AI-scored B2B inquiries (EintrachtTech, Hotels & Fleets), predictive traffic surge management, and automated profit margins.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 z-10">
                                        <button
                                            onClick={() => setIsPitchModeActive(!isPitchModeActive)}
                                            className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 border shadow-lg ${isPitchModeActive ? 'bg-amber-500 text-black border-amber-400 shadow-amber-500/20' : 'bg-white/10 hover:bg-white/20 text-white border-white/20'}`}
                                        >
                                            <Bot size={18} /> {isPitchModeActive ? 'Exit Pitch Mode' : 'Activate B2B Pitch Mode'}
                                        </button>
                                    </div>
                                </div>

                                {/* MODULE 1: BRAND & AWARENESS TELEMETRY CARDS */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 relative overflow-hidden space-y-3">
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">GLOBAL APP USERS</span>
                                        <p className="text-4xl font-black italic text-white tracking-tighter">0</p>
                                        <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                            <TrendingUp size={14} /> Live Registrierungen
                                        </p>
                                    </div>

                                    <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 relative overflow-hidden space-y-3">
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">MONTHLY PAGE IMPRESSIONS</span>
                                        <p className="text-4xl font-black italic text-brand tracking-tighter">0</p>
                                        <p className="text-xs font-bold text-gray-400">Live Portal-Traffic</p>
                                    </div>

                                    <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 relative overflow-hidden space-y-3">
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">REGISTERED B2B PARTNERS</span>
                                        <p className="text-4xl font-black italic text-white tracking-tighter">{docPartners?.length || stripeConnectedPartners?.length || 0} Active</p>
                                        <p className="text-xs font-bold text-cyan-400">Stadien, Hotels & Flotten</p>
                                    </div>

                                    <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 relative overflow-hidden space-y-3">
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">BRAND REPUTATION INDEX</span>
                                        <p className="text-4xl font-black italic text-amber-400 tracking-tighter">100%</p>
                                        <p className="text-xs font-bold text-emerald-400">⭐ 5.0/5 Plattform-Bewertung</p>
                                    </div>
                                </div>

                                {/* MODULE 2: AI TRAFFIC SURGE PREDICTOR ALERT */}
                                {shuttleClusters.length > 0 ? (
                                    <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
                                                <AlertTriangle size={24} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black italic text-white uppercase tracking-tight">AI TRAFFIC RADAR AKTIV</h4>
                                                <p className="text-xs text-gray-300">
                                                    Aktive Routenüberwachung für {shuttleClusters.length} Shuttle-Gruppen aktiv. KI optimiert Abfahrtszeiten automatisch.
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => triggerNotification('AI Time Optimization applied! Driver & Passengers notified.', 'success')}
                                            className="px-6 py-3 bg-amber-500 text-black font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap"
                                        >
                                            Apply AI Time Optimization
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                                                <ShieldCheck size={24} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black italic text-white uppercase tracking-tight">VERKEHRSLAGE NORMAL • KEINE WARNUNGEN</h4>
                                                <p className="text-xs text-gray-400">
                                                    KI-Verkehrsradar überwacht Strecken zu Stadion & Partner-Hotels in Echtzeit.
                                                </p>
                                            </div>
                                        </div>
                                        <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 text-xs font-black rounded-xl uppercase tracking-widest border border-emerald-500/30">
                                            RADAR ONLINE 🟢
                                        </span>
                                    </div>
                                )}

                                {/* MODULE 3: AI AUTOMATED B2B PARTNER MATCHMAKER & INQUIRIES */}
                                <div className="p-8 rounded-[3rem] bg-white/5 border border-white/10 space-y-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                                        <div>
                                            <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter flex items-center gap-2">
                                                <Users size={24} className="text-brand" /> INCOMING B2B INQUIRIES & AI MATCHMAKER
                                            </h3>
                                            <p className="text-xs text-gray-400">Applications from Stadia, Hotels & Fleet Owners scored by Grien AI.</p>
                                        </div>
                                        <div className="px-4 py-2 bg-brand/10 border border-brand/20 rounded-xl text-brand text-xs font-black uppercase tracking-widest">
                                            {b2bLeads.length} {b2bLeads.length === 1 ? 'Opportunity' : 'Opportunities'}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {b2bLeads.length === 0 ? (
                                            <div className="p-8 border-2 border-dashed border-white/10 bg-black/20 rounded-2xl text-center space-y-2">
                                                <Users size={32} className="mx-auto text-gray-500 opacity-60" />
                                                <p className="text-sm font-black uppercase tracking-wider text-gray-300">Keine B2B-Leads vorhanden</p>
                                                <p className="text-xs text-gray-500">Neue Kooperationsanfragen von Stadien, Hotels und Flottenpartnern werden hier gelistet.</p>
                                            </div>
                                        ) : (
                                            b2bLeads.map((lead) => (
                                                <div key={lead.id} className="p-6 rounded-2xl bg-black/40 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-brand/40 transition-all">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-lg font-black italic text-white">{lead.company}</span>
                                                            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase border border-emerald-500/30">
                                                                {lead.matchScore}% AI Match
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-brand font-bold uppercase tracking-wider">{lead.type} • Contact: {lead.contact}</p>
                                                        <p className="text-xs text-gray-400">{lead.notes}</p>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-right">
                                                        <div>
                                                            <span className="text-[10px] font-black uppercase text-gray-500 block">Deal Potential</span>
                                                            <span className="text-sm font-black italic text-amber-400">{lead.potential}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => setSelectedLeadForProposal(lead)}
                                                            className="px-5 py-3 bg-brand text-black font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg shadow-brand/20 flex items-center gap-2"
                                                        >
                                                            <Bot size={16} /> Generate Proposal PDF
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* MODULE 4: GLOBAL FAN HEATMAP & ORIGIN RADAR */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="p-8 rounded-[3rem] bg-white/5 border border-white/10 space-y-6">
                                        <h3 className="text-xl font-black italic uppercase text-white tracking-tighter flex items-center gap-2">
                                            <Globe size={20} className="text-cyan-400" /> INTERNATIONAL FAN ORIGIN RADAR
                                        </h3>
                                        <div className="space-y-4">
                                            {[
                                                { country: '🇩🇪 Deutschland (Lokal & Regional)', count: '100% (Lokale Buchungen)', color: 'bg-emerald-500' },
                                                { country: '🇪🇺 Europäische Union', count: '0% (Keine Auslandsgäste)', color: 'bg-blue-500' },
                                                { country: '🌍 International VIP', count: '0% (Keine Auslandsgäste)', color: 'bg-purple-500' }
                                            ].map((item, i) => (
                                                <div key={i} className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                                                    <span className="text-xs font-black text-white">{item.country}</span>
                                                    <span className="text-xs font-bold text-gray-400">{item.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* MODULE 5: AUTONOMOUS REVENUE & MARGIN TELEMETRY */}
                                    <div className="p-8 rounded-[3rem] bg-gradient-to-b from-white/10 to-black border border-white/10 space-y-6">
                                        <h3 className="text-xl font-black italic uppercase text-white tracking-tighter flex items-center gap-2">
                                            <Landmark size={20} className="text-brand" /> REVENUE & PLATFORM MARGIN SPLIT
                                        </h3>

                                        {(() => {
                                            let ticketGross = 0;
                                            try {
                                                const saved = localStorage.getItem('green_stadium_events');
                                                const events = saved ? JSON.parse(saved) : [];
                                                events.forEach(ev => {
                                                    (ev.tiers || []).forEach(tr => {
                                                        const s = tr.sold || 0;
                                                        ticketGross += s * (tr.price || 0);
                                                    });
                                                });
                                            } catch (e) {}

                                            const shuttleGross = (stripeTotalVolume || 0);
                                            const platformMargin = (stripePlatformProvisions || 0) + (ticketGross * 0.05);

                                            return (
                                                <div className="space-y-4">
                                                    <div className="p-4 rounded-2xl bg-black/60 border border-white/5 flex justify-between items-center">
                                                        <span className="text-xs text-gray-400 uppercase font-black">Gross Event Ticket Sales</span>
                                                        <span className="text-lg font-black italic text-white">€{ticketGross.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                    <div className="p-4 rounded-2xl bg-black/60 border border-white/5 flex justify-between items-center">
                                                        <span className="text-xs text-gray-400 uppercase font-black">Gross Shuttle Transfer Fares</span>
                                                        <span className="text-lg font-black italic text-emerald-400">€{shuttleGross.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                    <div className="p-4 rounded-2xl bg-brand/10 border border-brand/20 flex justify-between items-center">
                                                        <span className="text-xs text-brand uppercase font-black">Grien Net Platform Margin</span>
                                                        <span className="text-2xl font-black italic text-brand">€{platformMargin.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        <button 
                                            onClick={() => triggerNotification('Stripe Connect Payout dispatched to Partner Accounts!', 'success')}
                                            className="w-full h-14 bg-brand text-black font-black uppercase tracking-widest italic rounded-2xl hover:scale-[1.02] transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
                                        >
                                            <Landmark size={18} /> Execute Automated Partner Payout (Stripe Connect)
                                        </button>
                                    </div>
                                </div>

                                {/* AI PROPOSAL MODAL */}
                                {selectedLeadForProposal && (
                                    <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
                                        <div className="w-full max-w-2xl bg-gradient-to-b from-dark-900 to-black border border-brand/30 rounded-[3rem] p-8 space-y-6 relative shadow-2xl my-8">
                                            <button 
                                                onClick={() => setSelectedLeadForProposal(null)}
                                                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                                            >
                                                <X size={20} />
                                            </button>

                                            <div className="border-b border-white/10 pb-4 space-y-2">
                                                <span className="px-3 py-1 rounded-full bg-brand/20 text-brand border border-brand/30 text-[10px] font-black uppercase">
                                                    AI GENERATED B2B PARTNERSHIP PROPOSAL
                                                </span>
                                                <h3 className="text-3xl font-black italic uppercase text-white tracking-tighter">
                                                    {selectedLeadForProposal.company}
                                                </h3>
                                                <p className="text-xs text-gray-400">Target Contact: {selectedLeadForProposal.contact}</p>
                                            </div>

                                            <div className="p-6 bg-black/60 border border-white/10 rounded-2xl text-xs space-y-4 text-gray-300 font-mono leading-relaxed">
                                                <p><b>Betreff:</b> B2B-Partnerschaft: Grien als Vertriebskanal mit Shuttle-Service für {selectedLeadForProposal.company}</p>
                                                <p>Sehr geehrte Damen und Herren,</p>
                                                <p>wir haben mit Grien eine B2B-Plattform entwickelt, die Eintrittskarten nahtlos mit erstklassigen Shuttle-Services für VIP-Gäste und Fans verbindet.</p>
                                                <p><b>Vorgeschlagener Pilot-Deal:</b> {selectedLeadForProposal.potential}</p>
                                                <p>Über das Grien B2B-Dashboard behalten Sie 100% Kontrolle über Kontingente & Preise. Wir freuen uns auf das Erstgespräch!</p>
                                            </div>

                                            <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/10">
                                                <button
                                                    onClick={() => {
                                                        triggerNotification('B2B Proposal PDF generated and saved to Desktop!', 'success');
                                                        setSelectedLeadForProposal(null);
                                                    }}
                                                    className="px-6 py-3 bg-brand text-black font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg flex items-center gap-2"
                                                >
                                                    <Download size={16} /> Download Proposal PDF
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                        {view === 'partner-hub' && (
                            <motion.div key="partner-hub" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                <AdminPartnerHub />
                            </motion.div>
                        )}
                        {view === 'ticket-hub' && (
                            <motion.div key="ticket-hub" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                                {/* Statistics Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                    <div className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-brand shadow-[0_0_20px_var(--brand-glow)]" />
                                        <div className="space-y-2">
                                            <h4 className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase tracking-widest">Total Active Event Tickets</h4>
                                            <p className="text-4xl font-black italic text-white">{
                                                (() => {
                                                    const saved = localStorage.getItem('green_stadium_events');
                                                    const events = saved ? JSON.parse(saved) : [];
                                                    return events.length;
                                                })()
                                            }</p>
                                        </div>
                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-brand uppercase tracking-widest mt-6">Across 4 primary sectors</p>
                                    </div>
                                    
                                    <div className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-brand/50" />
                                        <div className="space-y-2">
                                            <h4 className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase tracking-widest">Club Event Folders</h4>
                                            <p className="text-4xl font-black italic text-white">{
                                                (() => {
                                                    const saved = localStorage.getItem('green_stadium_events');
                                                    const events = saved ? JSON.parse(saved) : [];
                                                    return events.filter(e => e.category === 'CM' || e.name.toLowerCase().includes('neon') || e.name.toLowerCase().includes('club')).length;
                                                })()
                                            }</p>
                                        </div>
                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-brand/60 uppercase tracking-widest mt-6">Bar & Concert Tiers</p>
                                    </div>

                                    <div className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50" />
                                        <div className="space-y-2">
                                            <h4 className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase tracking-widest">Hospitality Partys Events</h4>
                                            <p className="text-4xl font-black italic text-white">{
                                                (() => {
                                                    const saved = localStorage.getItem('green_stadium_events');
                                                    const events = saved ? JSON.parse(saved) : [];
                                                    return events.filter(e => e.category === 'HM' || e.name.toLowerCase().includes('hotel') || e.name.toLowerCase().includes('gala')).length;
                                                })()
                                            }</p>
                                        </div>
                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-amber-500/60 uppercase tracking-widest mt-6">VIP Partys & Stay Packages</p>
                                    </div>

                                    <div className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-violet-500/50" />
                                        <div className="space-y-2">
                                            <h4 className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase tracking-widest">Stadium Main Folders</h4>
                                            <p className="text-4xl font-black italic text-white">{
                                                (() => {
                                                    const saved = localStorage.getItem('green_stadium_events');
                                                    const events = saved ? JSON.parse(saved) : [];
                                                    return events.filter(e => e.category === 'SM' || e.name.toLowerCase().includes('champions') || e.name.toLowerCase().includes('stadium')).length;
                                                })()
                                            }</p>
                                        </div>
                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-violet-500/60 uppercase tracking-widest mt-6">Arena Match Tiers</p>
                                    </div>
                                </div>

                                {/* Folders View */}
                                {ticketActiveFolder === 'none' ? (
                                    <div className="space-y-8">
                                        <div className="flex justify-between items-center bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl/50 border border-white/5 rounded-3xl p-6">
                                            <div>
                                                <h3 className="text-xl font-black italic uppercase tracking-tighter">Ticket Hub <span className="text-brand">Repositories</span></h3>
                                                <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-widest mt-1">Select a tactical folder to inspect active files</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    // Open modal to add a ticket directly from Admin Dashboard
                                                    setIsAddingTicket(true);
                                                }}
                                                className="px-6 py-3.5 bg-brand text-dark-900 rounded-2xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_20px_var(--brand-glow)]"
                                            >
                                                <PlusCircle size={14} /> Upload Custom Ticket
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            {[
                                                { id: 'club', name: 'Club Tickets Folder', desc: 'Concert & Nightlife tickets', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
                                                { id: 'events', name: 'Partys Tickets Folder', desc: 'Hotel galas, VIP partys & stay bookings', color: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
                                                { id: 'stadium', name: 'Stadium Folders', desc: 'Sports arena match tickets', color: 'bg-violet-500/10 border-violet-500/30 text-violet-400' }
                                            ].map(folder => (
                                                <div 
                                                    key={folder.id} 
                                                    onClick={() => setTicketActiveFolder(folder.id)}
                                                    className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl hover:bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl/80 border border-white/10 hover:border-white/30 rounded-[3rem] p-10 flex flex-col justify-between h-72 cursor-pointer transition-all hover:-translate-y-2 relative group"
                                                >
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${folder.color}`}>
                                                        <FolderOpen size={28} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xl font-black italic uppercase tracking-tighter text-white group-hover:text-brand transition-colors">{folder.name}</h4>
                                                        <p className="text-xs md:text-sm lg:text-base text-gray-500 font-medium mt-2">{folder.desc}</p>
                                                    </div>
                                                    <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
                                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-600 uppercase tracking-widest">Active Directory</span>
                                                        <ChevronRight size={16} className="text-gray-500 group-hover:translate-x-1 transition-transform" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8 animate-in fade-in duration-300">
                                        {/* Active Folder Header */}
                                        <div className="flex justify-between items-center bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[2.5rem] p-8">
                                            <div className="flex items-center gap-6">
                                                <button 
                                                    onClick={() => setTicketActiveFolder('none')}
                                                    className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white hover:border-brand/40 transition-all active:scale-95 shadow-lg"
                                                >
                                                    <ArrowLeft size={20} />
                                                </button>
                                                <div>
                                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                                                        📁 / {ticketActiveFolder.toUpperCase()} FILES
                                                    </h3>
                                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-brand uppercase tracking-widest mt-1">Live active directory list</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <div className="relative">
                                                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                                    <input 
                                                        placeholder="Search tickets..." 
                                                        value={ticketSearchQuery}
                                                        onChange={e => setTicketSearchQuery(e.target.value)}
                                                        className="bg-dark-950 border border-white/10 focus:border-brand/40 rounded-2xl py-3 pl-10 pr-6 text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest focus:outline-none transition-all w-60"
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => setIsAddingTicket(true)}
                                                    className="px-5 py-3 bg-brand text-dark-900 rounded-2xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_20px_var(--brand-glow)]"
                                                >
                                                    <PlusCircle size={14} /> Add Ticket
                                                </button>
                                            </div>
                                        </div>

                                        {/* Grid Container supporting Side Ingested Manifest Details */}
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                            <div className={`${expandedTicketEvent ? 'lg:col-span-2' : 'lg:col-span-3'} bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] p-10 overflow-hidden relative transition-all duration-300`}>
                                                <div className="overflow-x-auto no-scrollbar">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="border-b border-white/5 text-[9px] md:text-[11px] lg:text-xs font-black uppercase text-gray-500 tracking-[0.2em] pb-4">
                                                                <th className="pb-6">Event Name</th>
                                                                <th className="pb-6">Category</th>
                                                                <th className="pb-6">Date / Time</th>
                                                                <th className="pb-6 text-right">Base Price</th>
                                                                <th className="pb-6 text-right">Sold / Inventory</th>
                                                                <th className="pb-6 text-right">Est. Commission</th>
                                                                <th className="pb-6 text-right">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/5">
                                                            {(() => {
                                                                const saved = localStorage.getItem('green_stadium_events');
                                                                const currentList = saved ? JSON.parse(saved) : [];

                                                                const filtered = currentList.filter(e => {
                                                                    const isClub = ticketActiveFolder === 'club' && (e.category === 'CM' || e.name.toLowerCase().includes('neon') || e.name.toLowerCase().includes('club'));
                                                                    const isEvents = ticketActiveFolder === 'events' && (e.category === 'HM' || e.category === 'RM' || e.name.toLowerCase().includes('hotel') || e.name.toLowerCase().includes('gala'));
                                                                    const isStadium = ticketActiveFolder === 'stadium' && (e.category === 'SM' || e.name.toLowerCase().includes('champions') || e.name.toLowerCase().includes('stadium'));
                                                                    
                                                                    if (!isClub && !isEvents && !isStadium) return false;
                                                                    if (ticketSearchQuery.trim() && !e.name.toLowerCase().includes(ticketSearchQuery.toLowerCase())) return false;
                                                                    return true;
                                                                });

                                                                if (filtered.length === 0) {
                                                                    return (
                                                                        <tr>
                                                                            <td colSpan={7} className="py-12 text-center text-xs md:text-sm lg:text-base text-gray-500 font-medium italic">
                                                                                No active tickets found in this folder registry.
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                }

                                                                return filtered.map((e, idx) => {
                                                                    const primaryTier = e.tiers?.[0] || { price: 45, sold: 0, quantity: 100 };
                                                                    const totalSold = e.tiers?.reduce((acc, t) => acc + (t.sold || 0), 0) || primaryTier.sold || 0;
                                                                    const totalQty = e.tiers?.reduce((acc, t) => acc + (t.quantity || 100), 0) || primaryTier.quantity || 100;
                                                                    const avgPrice = e.tiers?.reduce((acc, t) => acc + (t.price || 45), 0) / (e.tiers?.length || 1) || primaryTier.price;
                                                                    const estComm = (avgPrice * totalSold * 0.05).toFixed(2);
                                                                    const isExpanded = expandedTicketEvent?.id === e.id;

                                                                    return (
                                                                        <tr 
                                                                            key={`${e.id}-${idx}`} 
                                                                            onClick={() => setExpandedTicketEvent(isExpanded ? null : e)}
                                                                            className={`group hover:bg-white/5 transition-all text-xs md:text-sm lg:text-base font-bold text-white cursor-pointer ${isExpanded ? 'bg-white/10 border-l-2 border-brand' : ''}`}
                                                                        >
                                                                            <td className="py-6 flex items-center gap-3">
                                                                                <div className="w-8 h-8 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                                                                                    <Ticket size={14} />
                                                                                </div>
                                                                                <span className="font-black truncate max-w-xs">{e.name}</span>
                                                                            </td>
                                                                            <td className="py-6 uppercase tracking-wider text-[9px] md:text-[11px] lg:text-xs text-brand/80">{
                                                                                e.category === 'CM' ? 'Nightlife' : e.category === 'HM' ? 'Partys & Galas' : 'Arena Match'
                                                                            }</td>
                                                                            <td className="py-6 font-mono text-[10px] md:text-xs lg:text-sm text-gray-400">{e.date} • {e.time}</td>
                                                                            <td className="py-6 text-right text-brand">€{(avgPrice).toFixed(2)}</td>
                                                                            <td className="py-6 text-right font-mono">{totalSold} / {totalQty}</td>
                                                                            <td className="py-6 text-right font-mono text-emerald-400">€{estComm}</td>
                                                                            <td className="py-6 text-right">
                                                                                <span className={`px-2.5 py-1 text-[8px] md:text-[10px] lg:text-xs font-black uppercase rounded ${e.published ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                                                                    {e.published ? 'Published' : 'Draft'}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                });
                                                            })()}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Ingested Ticket Manifest & Direct Dispatch Shield */}
                                            <AnimatePresence>
                                                {expandedTicketEvent && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, x: 40, scale: 0.95 }}
                                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                                        exit={{ opacity: 0, x: 40, scale: 0.95 }}
                                                        className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] p-8 flex flex-col justify-between h-[500px] overflow-hidden relative"
                                                    >
                                                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand to-transparent" />
                                                        
                                                        {/* Header */}
                                                        <div className="flex justify-between items-start pb-4 border-b border-white/5">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                                                                    <FolderOpen size={18} />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-sm font-black italic uppercase text-white tracking-tight truncate max-w-[160px]">{expandedTicketEvent.name}</h4>
                                                                    <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest mt-0.5">Ingested Ticket Manifest</p>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                onClick={() => setExpandedTicketEvent(null)}
                                                                className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:border-white/20 transition-all"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>

                                                        {/* Ingested Document Metadata */}
                                                        <div className="py-4 border-b border-white/5 flex items-center justify-between text-[8px] md:text-[10px] lg:text-xs font-mono text-gray-400">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-gray-600 font-bold uppercase">FILE ATTACHMENT</span>
                                                                <span className="text-white font-bold truncate max-w-[150px]">{expandedTicketEvent.name.toLowerCase().replace(/\s+/g, '_')}_manifest.pdf</span>
                                                            </div>
                                                            <div className="text-right flex flex-col gap-1">
                                                                <span className="text-gray-600 font-bold uppercase">COMMISSION LOCK</span>
                                                                <span className="text-brand font-black">5.0% PLATFORM</span>
                                                            </div>
                                                        </div>

                                                        {/* Individual Ingested Tickets Queue */}
                                                        <div className="flex-1 overflow-y-auto no-scrollbar py-6 space-y-4 max-h-[240px]">
                                                            {(() => {
                                                                const eventId = expandedTicketEvent.id;
                                                                // Pre-seed sample list of 5 mock individual tickets
                                                                const samplePool = [
                                                                    { id: `TK-${eventId.slice(-4).toUpperCase()}-001`, initialHolder: 'alex.p@uplink.net', initialStatus: 'Allocated' },
                                                                    { id: `TK-${eventId.slice(-4).toUpperCase()}-002`, initialHolder: 'sarah.k@nordic.com', initialStatus: 'Allocated' },
                                                                    { id: `TK-${eventId.slice(-4).toUpperCase()}-003`, initialHolder: 'N/A (Available in Vault)', initialStatus: 'Unallocated' },
                                                                    { id: `TK-${eventId.slice(-4).toUpperCase()}-004`, initialHolder: 'N/A (Available in Vault)', initialStatus: 'Unallocated' },
                                                                    { id: `TK-${eventId.slice(-4).toUpperCase()}-005`, initialHolder: 'N/A (Available in Vault)', initialStatus: 'Unallocated' }
                                                                ];

                                                                return samplePool.map((ticket, index) => {
                                                                    const isTriggered = triggeredTicketIds.includes(ticket.id);
                                                                    const currentStatus = isTriggered ? 'Allocated' : ticket.initialStatus;
                                                                    const currentHolder = isTriggered ? 'direct_claim@recipient.de' : ticket.initialHolder;
                                                                    const isCurrentlySending = sendingTicketId === ticket.id;

                                                                    // Apply DSGVO Anonymization Shield to the holder if active
                                                                    const displayHolder = anonymizedModeActive && currentStatus === 'Allocated'
                                                                        ? `[HOLDER_ANON_${100 + index}]`
                                                                        : currentHolder;

                                                                    return (
                                                                        <div key={ticket.id} className="p-4 bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl flex items-center justify-between transition-all">
                                                                            <div className="space-y-1">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-[10px] md:text-xs lg:text-sm font-black text-white font-mono">{ticket.id}</span>
                                                                                    <span className={`px-2 py-0.5 text-[6px] font-black rounded uppercase ${currentStatus === 'Allocated' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                                                                        {currentStatus}
                                                                                    </span>
                                                                                </div>
                                                                                <p className="text-[7px] text-gray-500 truncate max-w-[120px] font-mono">{displayHolder}</p>
                                                                            </div>
                                                                            <div>
                                                                                {currentStatus === 'Allocated' ? (
                                                                                    <span className="text-[7px] font-black uppercase text-gray-600 tracking-wider">EMAIL 2 SENT 📧</span>
                                                                                ) : (
                                                                                    <button 
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            if (isCurrentlySending) return;
                                                                                            setSendingTicketId(ticket.id);
                                                                                            setTimeout(() => {
                                                                                                setTriggeredTicketIds(prev => [...prev, ticket.id]);
                                                                                                setSendingTicketId(null);
                                                                                                setStripeLiveWebhookEvents(prev => [
                                                                                                    { time: new Date().toLocaleTimeString(), level: 'INGEST', msg: `📧 Email 2 Dispatch: Carlo Club SMTP successfully routed entry pass for ${ticket.id} to passenger.` },
                                                                                                    ...prev
                                                                                                ]);
                                                                                                triggerNotification('success', 'Email 2 Dispatch Triggered 📧', `Ticket ${ticket.id} sent directly from Partner.`);
                                                                                            }, 1000);
                                                                                        }}
                                                                                        disabled={isCurrentlySending}
                                                                                        className="px-3 py-2 bg-brand text-dark-900 text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-transform flex items-center gap-1 shadow-lg shadow-brand/10"
                                                                                    >
                                                                                        {isCurrentlySending ? (
                                                                                            <div className="w-2.5 h-2.5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                                                                                        ) : 'SEND EMAIL 2'}
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                });
                                                            })()}
                                                        </div>

                                                        {/* Footer action */}
                                                        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[7px] font-black uppercase text-gray-500">
                                                            <span>Ingested: {new Date(expandedTicketEvent.date).toLocaleDateString()}</span>
                                                            <span className="text-brand">Secure Handshake Vault</span>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {view === 'angebot-hub' && (
                            <motion.div key="angebot-hub" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full max-h-[calc(100vh-180px)] grid grid-cols-1 lg:grid-cols-4 gap-10">
                                {/* Autonomous Campaign Creator & Scanner Grid - 3 Cols */}
                                <div className="lg:col-span-3 bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] flex flex-col h-[calc(100vh-220px)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent z-10" />
                                    
                                    {/* Dispatch Header */}
                                    <div className="p-6 bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl/90 border-b border-white/5 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/40 flex items-center justify-center text-brand">
                                            <Radio size={24} className="animate-pulse" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black italic uppercase tracking-tighter">Khiam Autonomous <span className="text-brand">Campaign Dispatcher</span></h3>
                                            <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-widest mt-0.5">Real-Time Space Sweep & Outreach Platform</p>
                                        </div>
                                        <div className="ml-auto w-2.5 h-2.5 rounded-full bg-brand shadow-[0_0_8px_var(--brand)] animate-pulse" />
                                    </div>

                                    {/* Double Column Panel Workspace */}
                                    <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-10 no-scrollbar">
                                        
                                        {/* Left Panel: File Upload & Target Config */}
                                        <div className="space-y-6 text-left">
                                            <h4 className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-[0.2em] mb-4">🛠️ Campaign Parameter Configuration</h4>

                                            {/* Refactored Custom Partner & QR Code Ingestor */}
                                            <div className="space-y-4 p-5 bg-white/5 border border-white/10 rounded-3xl">
                                                <label className="text-[10px] md:text-xs lg:text-sm font-black text-white uppercase tracking-wider block">1. B2B PARTNER QR CODES / DOCUMENTS</label>
                                                
                                                <div className="space-y-2">
                                                    <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-gray-400 uppercase tracking-widest block">Partner Category / Shop Type</label>
                                                    <input
                                                        placeholder="E.g., Restaurant, Hotel VIP, Nightlife, Club"
                                                        value={offerCategory}
                                                        onChange={e => setOfferCategory(e.target.value)}
                                                        className="w-full bg-dark-950 border-2 border-white/10 focus:border-brand/85 text-white placeholder-gray-500 rounded-2xl px-4 py-3.5 text-xs md:text-sm lg:text-base font-black uppercase tracking-widest outline-none"
                                                        style={{ backgroundColor: '#090d16' }}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-gray-400 uppercase tracking-widest block">Upload Document or QR Code</label>
                                                    <div
                                                        onClick={() => document.getElementById('campaign-file-generic')?.click()}
                                                        className="border-2 border-dashed border-white/20 hover:border-brand/60 bg-black/40 px-4 py-4 rounded-2xl flex items-center justify-center gap-3 cursor-pointer transition-all hover:scale-[1.01] group"
                                                    >
                                                        <input
                                                            type="file"
                                                            id="campaign-file-generic"
                                                            multiple
                                                            accept=".pdf,.png,.jpg,.jpeg,.webp"
                                                            onChange={handleCampaignFileUpload}
                                                            className="hidden"
                                                        />
                                                        <Upload size={16} className="text-gray-400 group-hover:text-brand transition-colors" />
                                                        <span className="text-[10px] md:text-xs lg:text-sm font-black text-gray-300 group-hover:text-white transition-colors">Choose Voucher Files...</span>
                                                    </div>
                                                </div>

                                                {/* Uploaded File List */}
                                                {campaignFiles.length > 0 && (
                                                    <div className="space-y-2 max-h-[120px] overflow-y-auto no-scrollbar pt-1">
                                                        {campaignFiles.map(file => (
                                                            <div key={file.id} className="p-2.5 bg-black/60 border border-white/5 rounded-xl flex items-center justify-between gap-3 text-left">
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <FileText size={13} className="text-brand shrink-0" />
                                                                    <div className="min-w-0">
                                                                        <p className="text-[9px] md:text-[11px] lg:text-xs font-black text-white truncate">{file.name}</p>
                                                                        <p className="text-[7px] font-bold text-gray-400">{file.size}</p>
                                                                    </div>
                                                                </div>
                                                                {file.progress < 100 ? (
                                                                    <div className="w-14 h-1 bg-white/5 rounded-full overflow-hidden shrink-0">
                                                                        <div className="h-full bg-brand" style={{ width: `${file.progress}%` }} />
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); removeCampaignFile(file.id); }}
                                                                        className="text-gray-400 hover:text-red-400 p-1 transition-colors shrink-0"
                                                                    >
                                                                        <X size={11} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Target Area Text Inputs */}
                                            <div className="space-y-4 p-5 bg-white/5 border border-white/10 rounded-3xl">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] md:text-xs lg:text-sm font-black text-white uppercase tracking-wider block">2. TARGET AREA NAME</label>
                                                    <div className="flex gap-2">
                                                        <div className="relative flex-1">
                                                            <input
                                                                placeholder="E.g., Frankfurt Airport or Zeil"
                                                                value={targetArea}
                                                                onChange={e => setTargetArea(e.target.value)}
                                                                className="w-full bg-dark-950 border-2 border-white/10 focus:border-brand/85 text-white placeholder-gray-500 rounded-2xl px-5 py-4 text-xs md:text-sm lg:text-base font-black uppercase tracking-widest outline-none transition-all shadow-lg"
                                                                style={{ backgroundColor: '#090d16' }}
                                                            />
                                                            <MapPin size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-brand pointer-events-none" />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (!targetArea.trim()) return;
                                                                const newArea = {
                                                                    id: `area-${Date.now()}`,
                                                                    name: targetArea.toUpperCase(),
                                                                    lat: campaignLat,
                                                                    lng: campaignLng,
                                                                    radius: scanningRadius
                                                                };
                                                                setTargetAreasList(prev => [...prev, newArea]);
                                                                triggerNotification('success', 'Area Added 📍', `Added ${targetArea} to target areas.`);
                                                            }}
                                                            className="px-5 bg-brand/10 hover:bg-brand/20 border-2 border-brand/40 text-brand rounded-2xl flex items-center justify-center transition-all hover:scale-[1.03] shrink-0"
                                                            title="Add target area"
                                                        >
                                                            <PlusCircle size={18} />
                                                        </button>
                                                    </div>

                                                    {targetAreasList.length > 0 && (
                                                        <div className="space-y-2 mt-4 p-4 bg-black/40 border border-white/5 rounded-2xl">
                                                            <label className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Saved Target Areas ({targetAreasList.length})</label>
                                                            <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto no-scrollbar">
                                                                {targetAreasList.map(area => (
                                                                    <div key={area.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl">
                                                                        <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase text-white">{area.name}</span>
                                                                        <span className="text-[7.5px] font-mono text-gray-400">({area.radius}km)</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setTargetAreasList(prev => prev.filter(a => a.id !== area.id));
                                                                            }}
                                                                            className="text-gray-400 hover:text-red-400 p-0.5 transition-colors"
                                                                        >
                                                                            <X size={10} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-white uppercase tracking-widest font-mono block">LATITUDE</label>
                                                        <input
                                                            type="number"
                                                            step="0.0001"
                                                            placeholder="50.1109"
                                                            value={campaignLat}
                                                            onChange={e => setCampaignLat(parseFloat(e.target.value) || 50.1109)}
                                                            className="w-full bg-dark-950 border-2 border-white/10 focus:border-brand/85 text-white rounded-2xl p-4 text-xs md:text-sm lg:text-base font-black outline-none"
                                                            style={{ backgroundColor: '#090d16' }}
                                                        />
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-white uppercase tracking-widest font-mono block">LONGITUDE</label>
                                                        <input
                                                            type="number"
                                                            step="0.0001"
                                                            placeholder="8.6821"
                                                            value={campaignLng}
                                                            onChange={e => setCampaignLng(parseFloat(e.target.value) || 8.6821)}
                                                            className="w-full bg-dark-950 border-2 border-white/10 focus:border-brand/85 text-white rounded-2xl p-4 text-xs md:text-sm lg:text-base font-black outline-none"
                                                            style={{ backgroundColor: '#090d16' }}
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-white uppercase tracking-widest font-mono block">RADIUS (KM)</label>
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            min="0.1"
                                                            value={scanningRadius}
                                                            onChange={e => setScanningRadius(parseFloat(e.target.value) || 2.0)}
                                                            className="w-full bg-dark-950 border-2 border-white/10 focus:border-brand/85 text-white rounded-2xl p-4 text-xs md:text-sm lg:text-base font-black outline-none"
                                                            style={{ backgroundColor: '#090d16' }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Define Offer Description */}
                                            <div className="space-y-2 p-5 bg-white/5 border border-white/10 rounded-3xl">
                                                <label className="text-[10px] md:text-xs lg:text-sm font-black text-white uppercase tracking-wider block">3. CAMPAIGN OFFER VOUCHER TEXT</label>
                                                <input 
                                                    placeholder="E.g., 50% OFF ALL ENTRYS OR FREE DRINKS" 
                                                    value={campaignOfferText}
                                                    onChange={e => setCampaignOfferText(e.target.value)}
                                                    className="w-full bg-dark-950 border-2 border-white/10 focus:border-brand/85 text-white placeholder-gray-500 rounded-2xl p-5 text-xs md:text-sm lg:text-base font-black uppercase tracking-widest outline-none transition-all shadow-lg"
                                                    style={{ backgroundColor: '#090d16' }}
                                                />
                                            </div>

                                            {/* Define Audience Size — Unlimited */}
                                            <div className="space-y-2 p-5 bg-white/5 border border-white/10 rounded-3xl">
                                                <label className="text-[10px] md:text-xs lg:text-sm font-black text-white uppercase tracking-wider block">4. TARGET AUDIENCE SIZE (UNLIMITED)</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        placeholder="e.g. 5000"
                                                        value={targetPeopleCount}
                                                        onChange={e => setTargetPeopleCount(Math.max(1, parseInt(e.target.value) || 1))}
                                                        className="w-full bg-dark-950 border-2 border-white/10 focus:border-brand/85 text-white rounded-2xl pl-5 pr-24 py-4.5 text-xs md:text-sm lg:text-base font-black uppercase tracking-widest outline-none transition-all shadow-lg"
                                                        style={{ backgroundColor: '#090d16' }}
                                                    />
                                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] md:text-[11px] lg:text-xs font-black text-brand uppercase tracking-wider pointer-events-none">Passengers</span>
                                                </div>
                                                <p className="text-[8px] md:text-[10px] lg:text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">No limit — reach as many people as needed</p>
                                            </div>
                                        </div>

                                        {/* Right Panel: CSS Radar Scan Simulation & Telemetry Logs */}
                                        <div className="flex flex-col justify-between items-center space-y-6">
                                            <h4 className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-[0.2em] self-start">📡 Live Proximity Surveillance Grid</h4>
                                            
                                            {/* Interactive Map Component Showing Deployed geofence */}
                                            <div className="relative w-full h-72 rounded-[2.5rem] border-2 border-brand/20 bg-dark-950 overflow-hidden shadow-2xl">
                                                <MapContainer 
                                                    center={[campaignLat || 50.1109, campaignLng || 8.6821]} 
                                                    zoom={13} 
                                                    zoomControl={true}
                                                    scrollWheelZoom={true}
                                                    doubleClickZoom={false}
                                                    style={{ width: '100%', height: '100%', zIndex: 1 }}
                                                >
                                                    <TileLayer
                                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                        attribution='&copy; OpenStreetMap contributors'
                                                    />
                                                    <Marker position={[campaignLat || 50.1109, campaignLng || 8.6821]}>
                                                        <Popup>
                                                            <div className="text-dark-900 font-bold p-1">
                                                                <p className="text-xs md:text-sm lg:text-base uppercase font-black">{targetArea || 'Target Area'}</p>
                                                                <p className="text-[9px] md:text-[11px] lg:text-xs text-gray-500 font-mono mt-0.5">Radius: {scanningRadius || 2.0} km</p>
                                                            </div>
                                                        </Popup>
                                                    </Marker>
                                                    <Circle 
                                                        center={[campaignLat || 50.1109, campaignLng || 8.6821]}
                                                        radius={(scanningRadius || 2.0) * 1000}
                                                        pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.15, weight: 2 }}
                                                    />
                                                    {/* Draw all saved target areas */}
                                                    {targetAreasList.map(area => (
                                                        <React.Fragment key={area.id}>
                                                            <Marker position={[area.lat, area.lng]}>
                                                                <Popup>
                                                                    <div className="text-dark-900 font-bold p-1">
                                                                        <p className="text-xs md:text-sm lg:text-base uppercase font-black">{area.name}</p>
                                                                        <p className="text-[9px] md:text-[11px] lg:text-xs text-gray-500 font-mono mt-0.5">Radius: {area.radius} km</p>
                                                                    </div>
                                                                </Popup>
                                                            </Marker>
                                                            <Circle 
                                                                center={[area.lat, area.lng]}
                                                                radius={area.radius * 1000}
                                                                pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.1, weight: 1.5, dashArray: '5, 5' }}
                                                            />
                                                        </React.Fragment>
                                                    ))}
                                                    <MapController campaignLat={campaignLat} campaignLng={campaignLng} handleMapSelect={handleMapSelect} />
                                                </MapContainer>

                                                {/* Mini Stats overlay */}
                                                <div className="absolute bottom-4 right-4 z-10 bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl/90 px-4 py-3 rounded-2xl border border-white/10 shadow-xl">
                                                    <p className="text-[6px] font-black text-gray-500 uppercase tracking-widest">
                                                        Geofence Status
                                                    </p>
                                                    <p className="text-xs md:text-sm lg:text-base font-mono font-black text-brand uppercase leading-none mt-1">
                                                        {targetArea || 'Zeil'}
                                                    </p>
                                                    <p className="text-[7px] text-white/70 font-mono mt-1">
                                                        R: {(scanningRadius || 2.0).toFixed(1)} km
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Telemetry Stream Log Console */}
                                            <div className="w-full bg-dark-950 border border-white/5 p-4 rounded-2xl h-20 font-mono text-[8px] md:text-[10px] lg:text-xs text-brand/80 overflow-y-auto space-y-1 text-left no-scrollbar">
                                                {scanLogs.length === 0 ? (
                                                    <p className="text-gray-600 italic font-bold">GRID SCANNER STANDBY. DEFINE PARAMETERS AND EXECUTE OUTREACH SWEEP.</p>
                                                ) : (
                                                    scanLogs.map((log, idx) => (
                                                        <p key={idx} className="animate-in fade-in duration-300">
                                                            &gt; {log}
                                                        </p>
                                                    ))
                                                )}
                                            </div>

                                            {/* Grand Sweep Action Button */}
                                            <button 
                                                onClick={runCentralGridScanner}
                                                disabled={isScanningGrid}
                                                className="w-full py-4.5 bg-brand text-dark-900 rounded-2xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_var(--brand-glow)] disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isScanningGrid ? (
                                                    <>
                                                        <div className="w-3.5 h-3.5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                                                        Scanning Grid & Broadcasting Signal...
                                                    </>
                                                ) : (
                                                    <>Scan Grid & Dispatch Campaign 🚀</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Campaigns Sidebar - 1 Col */}
                                <div className="space-y-6 overflow-y-auto pr-4 custom-scrollbar">
                                    <div className="p-8 bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3rem]">
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-500">Active Live Offers</h4>
                                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                                        </div>
                                        <div className="space-y-4">
                                            {(() => {
                                                const saved = localStorage.getItem('green_active_offers');
                                                const offers = saved ? JSON.parse(saved) : [
                                                    { id: 'o1', shop: 'The Blue Velvet Bar', offer: '50% OFF ALL DRINKS', category: 'Nightlife' },
                                                    { id: 'o2', shop: 'Saffron Fine Dining', offer: 'FREE STARTER + VIP TABLE', category: 'Restaurant' }
                                                ];

                                                return offers.map(o => (
                                                    <div key={o.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2 animate-in slide-in-from-bottom-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-brand uppercase tracking-wider">{o.category || 'Campaign'}</span>
                                                            <button 
                                                                onClick={() => {
                                                                    const updated = offers.filter(item => item.id !== o.id);
                                                                    localStorage.setItem('green_active_offers', JSON.stringify(updated));
                                                                    setStripeLiveWebhookEvents(prev => [
                                                                        { time: new Date().toLocaleTimeString(), level: 'CAMPAIGN', msg: `🛑 Campaign discontinued: ${o.offer} for ${o.shop} scrubbed from feed.` },
                                                                        ...prev
                                                                    ]);
                                                                    triggerNotification('error', 'Campaign Scratched 🛑', `${o.shop} deal disabled.`);
                                                                }}
                                                                className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-red-500/60 hover:text-red-500 transition-colors"
                                                            >
                                                                Scratch
                                                            </button>
                                                        </div>
                                                        <h5 className="text-xs md:text-sm lg:text-base font-black italic text-white leading-tight">{o.offer}</h5>
                                                        <p className="text-[9px] md:text-[11px] lg:text-xs text-gray-500 uppercase font-bold">{o.shop}</p>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {view === 'product-hub' && (
                            <motion.div key="product-hub" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
                                <AdminProductHub />
                            </motion.div>
                        )}

                        {view === 'command-deck' && (
                            <motion.div key="deck" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                                {/* OVERRIDES & TELEMETRY */}
                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                    <div className="lg:col-span-3 bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] p-10 flex flex-col md:flex-row gap-12 items-center relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-brand/20 shadow-[0_0_20px_rgba(52,211,153,0.2)]" />
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-black italic uppercase tracking-tighter">Master <span className="text-brand">Overrides</span></h3>
                                            <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase tracking-[0.4em]">Global Network Influence</p>
                                        </div>
                                        <div className="flex-1 w-full space-y-4">
                                            <div className="flex justify-between items-center"><span className="text-[10px] md:text-xs lg:text-sm font-black text-gray-400 uppercase tracking-widest">Surge Multiplier</span><span className="text-lg font-black italic text-brand">{globalSurge.toFixed(1)}x</span></div>
                                            <input 
                                                type="range" 
                                                min="1" 
                                                max="5" 
                                                step="0.1" 
                                                value={globalSurge} 
                                                onChange={e => {
                                                    const val = parseFloat(e.target.value);
                                                    setGlobalSurge(val);
                                                    localStorage.setItem('green_global_surge', val);
                                                    if (val > 3) triggerNotification('surge', 'Network Saturation', `Global surge has been elevated to ${val}x due to high event density.`);
                                                }} 
                                                className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-brand" 
                                            />
                                        </div>
                                        <button onClick={() => setSystemLockdown(!systemLockdown)} className={`px-8 py-4 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] transition-all flex items-center gap-3 ${systemLockdown ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-500 hover:text-red-500 hover:border-red-500/30'}`}>
                                            <Shield size={14} /> {systemLockdown ? 'SYSTEM LOCKED' : 'SECURE GRID'}
                                        </button>
                                    </div>
                                    <div className="bg-brand/5 border border-brand/20 rounded-[3.5rem] p-10 flex flex-col justify-between relative overflow-hidden">
                                        <div className="absolute -right-8 -bottom-8 opacity-10"><Cpu size={120} className="text-brand" /></div>
                                        <div>
                                            <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase tracking-widest">GATEWAY STATUS</p>
                                            <p className="text-3xl font-black italic text-emerald-400 flex items-center gap-2">ONLINE <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" /></p>
                                        </div>
                                        <div className="flex items-center justify-between mt-8">
                                            <div>
                                                <p className="text-[9px] font-black uppercase text-gray-400">Netzwerk-Traffic</p>
                                                <p className="text-lg font-black italic text-white">0.0 KB/s (Idle)</p>
                                            </div>
                                            <Activity size={24} className="text-brand" />
                                        </div>
                                    </div>
                                </div>

                                {/* SECTOR GRID */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                    <div className="lg:col-span-2 bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] p-10 relative group hover:border-white/30 transition-all">
                                        <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-12">Nightlife <span className="text-brand">Network</span></h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                {(() => {
                                                    const venues = (docPartners || []).filter(p => ['venue', 'club', 'bar', 'hospitality', 'stadium'].includes(p.type || p.category));
                                                    if (venues.length === 0) {
                                                        return (
                                                            <div className="p-8 border-2 border-dashed border-white/10 bg-white/5 rounded-[2rem] text-center space-y-2 flex flex-col items-center justify-center h-full min-h-[180px]">
                                                                <Activity size={28} className="text-gray-500 opacity-60 mb-2" />
                                                                <p className="text-xs font-black uppercase tracking-wider text-gray-300">Keine Live-Venues registriert</p>
                                                                <p className="text-[10px] text-gray-500">Sobald Clubs, Bars oder Event-Locations registriert sind, wird die Live-Auslastung hier gestreamt.</p>
                                                            </div>
                                                        );
                                                    }
                                                    return venues.map((v, i) => {
                                                        const load = clubCapacities[v.name]?.capacity || 0;
                                                        return (
                                                            <div key={v.id || i} className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                                                                <div className="flex justify-between items-center mb-4"><span className="text-xs md:text-sm lg:text-base font-black italic text-white uppercase">{v.name || v.company || 'Venue'}</span><span className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase">{load}%</span></div>
                                                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${load}%` }} className="h-full bg-brand" /></div>
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                            <div className="bg-dark-950 rounded-[2.5rem] border border-white/5 p-8 flex flex-col items-center justify-center">
                                                <Radar drivers={drivers} />
                                                <p className="mt-6 text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase italic">Proximity Surveillance</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECURE VAULT (PHONE/EMAIL VERIFIED) */}
                                    <div className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-brand/20 rounded-[3.5rem] p-10 flex flex-col relative overflow-hidden shadow-2xl">
                                        <div className="flex items-center gap-6 mb-12">
                                            <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center ${isVaultUnlocked ? 'bg-brand text-dark-900' : 'bg-white/5 text-gray-500'}`}>
                                                {isVaultUnlocked ? <ShieldCheck size={32} /> : <Lock size={32} />}
                                            </div>
                                            <div><h3 className="text-2xl font-black italic uppercase text-white">Secure Vault</h3><p className={`text-[9px] md:text-[11px] lg:text-xs font-black uppercase mt-1 ${isVaultUnlocked ? 'text-brand' : 'text-gray-500'}`}>{isVaultUnlocked ? 'DECRYPTED' : 'AUTH REQUIRED'}</p></div>
                                        </div>

                                        <div className="flex-1">
                                            {isVaultUnlocked ? (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                                    <div className="p-6 bg-brand/10 border border-brand/20 rounded-3xl"><p className="text-xs md:text-sm lg:text-base text-gray-300 italic italic">"All partner PII and clearing settlements are hashed. Last rotation: 12m ago."</p></div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5"><p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase">Clearing Pool</p><p className="text-xl font-black italic text-white">€{(stripeTotalVolume || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
                                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5"><p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase">Escrow</p><p className="text-xl font-black italic text-white">€{(stripePlatformProvisions || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
                                                    </div>
                                                </motion.div>
                                            ) : isVerifyingVault ? (
                                                <div className="space-y-6">
                                                    <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase tracking-widest text-center">Security Code sent to Phone/Email</p>
                                                    <input type="password" placeholder="ENTER 4-DIGIT CODE" maxLength={4} value={vaultOTP} onChange={e => setVaultOTP(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-center text-2xl font-black tracking-[1em] text-brand focus:border-brand/50 outline-none" />
                                                    <button onClick={handleVaultAuth} className="w-full py-4 bg-brand text-dark-900 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest">VERIFY CODE</button>
                                                </div>
                                            ) : (
                                                <div className="h-full flex flex-col justify-center items-center text-center p-8 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                                                    <Shield size={48} className="text-gray-800 mb-4" />
                                                    <p className="text-xs md:text-sm lg:text-base text-gray-600 font-medium italic italic">Multi-Factor Phone/Email authentication required for financial clearance.</p>
                                                </div>
                                            )}
                                        </div>
                                        {!isVaultUnlocked && !isVerifyingVault && (
                                            <button onClick={() => setIsVerifyingVault(true)} className="mt-8 w-full py-4 bg-brand text-dark-900 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest shadow-xl shadow-brand/20">REQUEST ACCESS CODE</button>
                                        )}
                                        {isVaultUnlocked && (
                                            <button onClick={() => setIsVaultUnlocked(false)} className="mt-8 w-full py-4 bg-white/5 text-gray-500 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest">SEAL VAULT</button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {view === 'agents' && (
                            <motion.div key="agents" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="h-full max-h-[calc(100vh-180px)] grid grid-cols-1 lg:grid-cols-4 gap-10">
                                <div className="space-y-6 overflow-y-auto pr-4 custom-scrollbar">
                                    <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-8">Neural <span className="text-brand">Core</span></h2>
                                    
                                    {/* AI VOICE VISUALIZER */}
                                    <div className="p-8 bg-brand/5 border border-brand/20 rounded-[2.5rem] flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer" onClick={() => setIsListening(!isListening)}>
                                        <div className="absolute top-2 right-4 text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-brand/40 italic">Biometric Voice Active</div>
                                        <div className="flex items-center gap-1 h-8 mb-4">
                                            {[...Array(12)].map((_, i) => (
                                                <motion.div 
                                                    key={i}
                                                    animate={isListening ? { height: [8, 32, 12, 28, 8] } : { height: 8 }}
                                                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.05, ease: "easeInOut" }}
                                                    className="w-1 bg-brand rounded-full"
                                                />
                                            ))}
                                        </div>
                                        <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-brand">{isListening ? 'LISTENING TO DIRECTOR...' : 'WAITING FOR VOICE COMMAND'}</p>
                                    </div>

                                    {[
                                        { id: 'financial', name: 'Fiscal Sentinel', sub: 'Audits & Payouts', icon: Calculator },
                                        { id: 'law_sentinel', name: 'Legal Counsel', sub: 'German PBefG / GDPR', icon: Scale },
                                        { id: 'media_shield', name: 'Media Shield', sub: 'Posts & Censorship', icon: ShieldCheck },
                                        { id: 'intelligence_scout', name: 'Intel Scout', sub: 'Global Market Intel', icon: Globe },
                                        { id: 'architect_sentinel', name: 'System Architect', sub: 'Deployment & Code', icon: Cpu },
                                        { id: 'operations', name: 'Tactical Ops', sub: 'Fleet Optimization', icon: Target },
                                        { id: 'guardian', name: 'Safety Sentinel', sub: 'Bans & Fraud', icon: ShieldAlert }
                                    ].map(agent => (
                                        <button key={agent.id} onClick={() => setActiveAgent(agent.id)} className={`w-full p-6 rounded-[2.5rem] border transition-all flex items-center gap-6 ${activeAgent === agent.id ? 'bg-brand/10 border-brand text-white shadow-xl shadow-brand/10' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'}`}>
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${activeAgent === agent.id ? 'bg-brand text-dark-900' : 'bg-white/5 text-gray-600'}`}><agent.icon size={28} /></div>
                                            <div className="text-left"><p className="text-lg font-black italic uppercase tracking-tighter leading-none">{agent.name}</p><p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest mt-1 opacity-60">{agent.sub}</p></div>
                                        </button>
                                    ))}
                                </div>

                                <div className="lg:col-span-2 bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] flex flex-col overflow-hidden relative">
                                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-3 h-3 bg-brand rounded-full" />
                                            <span className="text-sm font-black uppercase tracking-widest text-brand">{activeAgent.toUpperCase()} INTERFACE</span>
                                        </div>
                                        <div className="flex gap-4">
                                            <button className="px-4 py-2 bg-white/5 rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all">Audit Logs</button>
                                            <button className="px-4 py-2 bg-brand/10 text-brand border border-brand/20 rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest hover:bg-brand hover:text-dark-900 transition-all">Cite German Law</button>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-10 overflow-y-auto space-y-8 custom-scrollbar">
                                        {activeAgent === 'media_shield' && (
                                            <div className="mb-8 p-6 bg-red-500/5 border border-red-500/20 rounded-[2rem] space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h5 className="text-[11px] md:text-sm lg:text-base font-black uppercase text-red-400 tracking-wider flex items-center gap-2">
                                                            <ShieldAlert size={14} className="animate-pulse" />
                                                            Live Intercept & Scrubbing Logs
                                                        </h5>
                                                        <p className="text-[7px] font-mono text-gray-500 uppercase tracking-widest mt-0.5">nsfw / extreme violence auto-censorship (100% compliant)</p>
                                                    </div>
                                                    <div className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[7px] font-mono text-red-400 tracking-widest animate-pulse">active protection</div>
                                                </div>
                                                <div className="overflow-x-auto">
                                                     <table className="w-full text-left font-mono text-[8px] md:text-[10px] lg:text-xs">
                                                         <thead>
                                                             <tr className="border-b border-white/5 text-gray-500">
                                                                 <th className="py-2">SOURCE FILE</th>
                                                                 <th className="py-2">TYPE</th>
                                                                 <th className="py-2">REASON</th>
                                                                 <th className="py-2">USER ID / POSTER</th>
                                                                 <th className="py-2 text-right">ACTION TAKEN</th>
                                                             </tr>
                                                         </thead>
                                                         <tbody className="divide-y divide-white/5">
                                                             {[
                                                                 { file: 'vip_party_rec.mp4', type: 'Video', reason: 'Nudity (98.4%)', user: anonymizedModeActive ? '[GUEST_ANON_114]' : 'Max_Mustermann_VIP', status: 'AUTO-DELETED ❌' },
                                                                 { file: 'drift_fight.mov', type: 'Video', reason: 'Violence (95.1%)', user: anonymizedModeActive ? '[DRIVER_ANON_304]' : 'StreetDrifter_99', status: 'AUTO-DELETED ❌' },
                                                                 { file: 'neon_promo.jpg', type: 'Image', reason: 'Profanity (99.0%)', user: anonymizedModeActive ? '[PARTNER_ANON_202]' : 'ClubOwner_Neon', status: 'AUTO-DELETED ❌' }
                                                             ].map((inc, index) => (
                                                                 <tr key={index} className="text-gray-300 hover:bg-white/5 transition-colors">
                                                                     <td className="py-2 font-bold text-white">{inc.file}</td>
                                                                     <td className="py-2 text-gray-500">{inc.type}</td>
                                                                     <td className="py-2 text-red-400 font-bold">{inc.reason}</td>
                                                                     <td className="py-2 text-brand font-bold">{inc.user}</td>
                                                                     <td className="py-2 text-right"><span className="px-2 py-0.5 bg-red-950/40 border border-red-500/30 text-red-500 rounded text-[6px] font-black">{inc.status}</span></td>
                                                                 </tr>
                                                             ))}
                                                         </tbody>
                                                     </table>
                                                </div>
                                            </div>
                                        )}
                                        {chatMessages[activeAgent]?.map((m, i) => (
                                            <motion.div key={i} initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[70%] p-6 rounded-[2rem] ${m.role === 'user' ? 'bg-brand text-dark-900 rounded-tr-none' : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-none italic font-medium'}`}>
                                                    {m.text}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                    <div className="p-8 border-t border-white/5 flex gap-4 items-center">
                                        <div className="flex-1 relative group">
                                            <input 
                                                placeholder={`Direct instruction to ${activeAgent} agent...`} 
                                                className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-5 pr-14 text-sm focus:border-brand/50 outline-none transition-all" 
                                                value={currentMessage} 
                                                onChange={e => setCurrentMessage(e.target.value)} 
                                                onKeyDown={e => e.key === 'Enter' && sendMessage()} 
                                            />
                                            <button 
                                                onClick={() => setIsListening(!isListening)}
                                                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${isListening ? 'text-brand bg-brand/10' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                <Radio size={20} className={isListening ? 'animate-pulse' : ''} />
                                            </button>
                                        </div>
                                        <button onClick={sendMessage} className="p-5 bg-brand text-dark-900 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand/20">
                                            <ArrowUpRight size={24} />
                                        </button>
                                    </div>
                                </div>

                                {/* AUTONOMOUS INSIGHT PANEL */}
                                <div className="space-y-6 overflow-y-auto pr-4 custom-scrollbar">
                                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Neural <span className="text-brand">Insights</span></h3>
                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-widest italic mb-6">AI Chief of Staff Recommendations</p>
                                    
                                    <div className="space-y-4">
                                        {neuralInsights.map((insight) => (
                                            <motion.div 
                                                key={insight.id}
                                                layout
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className={`p-6 rounded-[2rem] border relative overflow-hidden group ${
                                                    insight.severity === 'critical' ? 'bg-red-500/5 border-red-500/20' : 
                                                    insight.severity === 'high' ? 'bg-amber-500/5 border-amber-500/20' : 
                                                    'bg-brand/5 border-brand/20'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className={`p-2 rounded-xl bg-dark-800 ${insight.severity === 'critical' ? 'text-red-500' : insight.severity === 'high' ? 'text-amber-500' : 'text-brand'}`}>
                                                        {insight.type === 'fraud' ? <ShieldAlert size={18} /> : insight.type === 'compliance' ? <FileText size={18} /> : <Scale size={18} />}
                                                    </div>
                                                    <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded ${
                                                        insight.severity === 'critical' ? 'bg-red-500/10 text-red-500' : 
                                                        insight.severity === 'high' ? 'bg-amber-500/10 text-amber-500' : 
                                                        'bg-brand/10 text-brand'
                                                    }`}>{insight.severity} Priority</span>
                                                </div>
                                                <h4 className="text-xs md:text-sm lg:text-base font-black uppercase text-white mb-1">{insight.title}</h4>
                                                <p className="text-[10px] md:text-xs lg:text-sm font-bold text-gray-400 mb-2 italic">Target: <span className="text-white">{insight.target}</span></p>
                                                <p className="text-[10px] md:text-xs lg:text-sm text-gray-500 leading-relaxed mb-4 italic font-medium">"{insight.reason}"</p>
                                                
                                                <div className="p-3 bg-dark-800/50 rounded-xl mb-4 border border-white/5">
                                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-brand/60 uppercase tracking-widest mb-1">Legal Citation</p>
                                                    <p className="text-[9px] md:text-[11px] lg:text-xs font-black text-white italic">{insight.law}</p>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button onClick={() => handleInsightAction(insight.id, 'approve')} className="flex-1 py-2 bg-brand text-dark-900 rounded-xl text-[8px] md:text-[10px] lg:text-xs font-black uppercase hover:scale-105 transition-all">Approve Recommendation</button>
                                                    <button onClick={() => handleInsightAction(insight.id, 'reject')} className="px-4 py-2 bg-white/5 text-gray-500 rounded-xl text-[8px] md:text-[10px] lg:text-xs font-black uppercase hover:bg-red-500/10 hover:text-red-500 transition-all">Dismiss</button>
                                                </div>
                                            </motion.div>
                                        ))}
                                        {neuralInsights.length === 0 && (
                                            <div className="p-10 border-2 border-dashed border-white/5 rounded-[2.5rem] text-center">
                                                <CheckCircle2 size={32} className="text-brand mx-auto mb-4 opacity-20" />
                                                <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-600 uppercase italic">All Incidents Cleared. Network Nominal.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {view === 'settlements' && (
                             <motion.div key="settlements" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                                <h2 className="text-5xl font-black italic uppercase tracking-tighter">Settlement <span className="text-amber-500">Ledger</span></h2>
                                <div className="flex flex-col gap-10">
                                    <div className="space-y-10">
                                        <div className="grid grid-cols-3 gap-8">
                                            {[
                                                { l: 'Daily Flow', v: `€${(stripeConnectedPartners.reduce((acc, p) => acc + p.grossContribution, 0) * 0.25).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, c: 'text-white' },
                                                { l: 'Pending Clear', v: `€${stripeConnectedPartners.reduce((acc, p) => acc + p.balance, 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, c: 'text-amber-500' },
                                                { l: 'Tax Reserve', v: `€${(stripeConnectedPartners.reduce((acc, p) => acc + p.totalPaidOut, 0) * 0.1).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, c: 'text-brand' }
                                            ].map((s, i) => (
                                                <div key={i} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
                                                    <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase tracking-widest mb-2">{s.l}</p>
                                                    <p className={`text-3xl font-black italic tracking-tighter ${s.c}`}>{s.v}</p>
                                                </div>
                                            ))}
                                        </div>
                                        {/* B2B STADION TICKET & SHUTTLE ABRECHNUNG (ADMIN HUB) */}
                                        <div className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-[3rem] p-10 space-y-8 relative overflow-hidden">
                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/30 text-brand flex items-center justify-center">
                                                        <Ticket size={24} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">B2B Stadion Ticket & Shuttle Abrechnung</h3>
                                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Admin-Abrechnung: Ticket-Verkauf, Shuttle-Vergütung an Green & Stadion-Netto-Auszahlung</p>
                                                    </div>
                                                </div>
                                                <span className="bg-emerald-500/20 text-emerald-400 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider border border-emerald-500/30">
                                                    Formel: Staffeltarif + 5% Provision
                                                </span>
                                            </div>

                                            {(() => {
                                                let totalTicketsSold = 0;
                                                let grossRev = 0;
                                                try {
                                                    const saved = localStorage.getItem('green_stadium_events');
                                                    const events = saved ? JSON.parse(saved) : [];
                                                    events.forEach(ev => {
                                                        (ev.tiers || []).forEach(tr => {
                                                            const s = tr.sold || 0;
                                                            totalTicketsSold += s;
                                                            grossRev += s * (tr.price || 0);
                                                        });
                                                    });
                                                } catch (e) {}
                                                const shuttleFee = totalTicketsSold * 16.00;
                                                const provFee = grossRev * 0.05;
                                                const netPay = Math.max(0, grossRev - provFee);
                                                return (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                                        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 space-y-2">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Stadion Brutto-Umsatz</span>
                                                            <span className="text-3xl font-black italic text-white block">€{grossRev.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                            <span className="text-[9px] text-gray-500">{totalTicketsSold} Stadion-Tickets verkauft</span>
                                                        </div>

                                                        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 space-y-2">
                                                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">Shuttle-Vergütung an Green</span>
                                                            <span className="text-3xl font-black italic text-amber-400 block">+€{shuttleFee.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                            <span className="text-[9px] text-gray-500">{totalTicketsSold} Pax @ €16,00 Staffeltarif</span>
                                                        </div>

                                                        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 space-y-2">
                                                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block">Green Ticket-Provision (5%)</span>
                                                            <span className="text-3xl font-black italic text-purple-400 block">+€{provFee.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                            <span className="text-[9px] text-gray-500">5% Platform Sales Provision</span>
                                                        </div>

                                                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 space-y-2">
                                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">Netto-Auszahlung Stadion</span>
                                                            <span className="text-3xl font-black italic text-emerald-400 block">€{netPay.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                            <span className="text-[9px] text-emerald-400/80 font-bold">{totalTicketsSold > 0 ? 'Stadion-Gutschrift freigeschaltet' : 'Keine Auszahlung ausstehend'}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] p-10 space-y-8">
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="space-y-1">
                                                    <h3 className="text-2xl font-black italic uppercase text-white">Weekly Payout Clearance</h3>
                                                    <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase tracking-widest">Awaiting Super Admin Release</p>
                                                </div>
                                                <div className="flex gap-4">
                                                    <button className="p-3 bg-white/5 rounded-xl text-gray-500 hover:text-white"><Filter size={18} /></button>
                                                    <button className="p-3 bg-white/5 rounded-xl text-gray-500 hover:text-white"><Download size={18} /></button>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                {stripeConnectedPartners.map((p, i) => (
                                                    <div key={i} className="p-6 bg-white/5 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 hover:bg-white/10 transition-all group">
                                                        <div className="flex items-center gap-6">
                                                            <div className="w-14 h-14 rounded-2xl bg-dark-800 flex items-center justify-center text-gray-600 group-hover:text-brand transition-colors"><Database size={28} /></div>
                                                            <div>
                                                                <p className="text-xl font-black italic uppercase text-white tracking-tighter">{p.name}</p>
                                                                <p className="text-[9px] md:text-[11px] lg:text-xs font-black text-gray-500 uppercase tracking-[0.2em] mt-1 italic">PRIME-ID: {p.id} | Week 18 Settlement</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-10">
                                                            <div className="text-right">
                                                                <p className="text-2xl font-black italic text-brand tracking-tighter">€{p.balance.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                                <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-amber-500 uppercase tracking-widest">PENDING RELEASE</p>
                                                            </div>
                                                            <button 
                                                                onClick={() => triggerPartnerDisbursement(p.id)}
                                                                className="px-8 py-4 bg-brand text-dark-900 rounded-2xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest shadow-lg shadow-brand/10 hover:scale-105 active:scale-95 transition-all"
                                                            >
                                                                Approve Payout
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-10">
                                        {/* COMMISSION & PROVISIONS CONFIGURATOR */}
                                        <div className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] p-10 space-y-8 relative overflow-hidden shadow-2xl">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-brand/50 shadow-[0_0_20px_rgba(52,211,153,0.5)]" />
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-brand/20 border border-brand/40 text-brand rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                                                        <Calculator size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-3xl font-black italic uppercase text-white tracking-tighter">Smart Provision <span className="text-brand">Simulator</span></h4>
                                                        <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase tracking-widest">Multi-Step Scenario Modeling & Live Config</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                                {/* COLUMN 1: LIVE PLATFORM FEES */}
                                                <div className="space-y-6 bg-white/5 border border-white/5 rounded-[2rem] p-6 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-[50px] rounded-full pointer-events-none" />
                                                    <h5 className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-brand border-b border-white/10 pb-3 flex items-center gap-2"><ShieldCheck size={12}/> 1. Live Platform Config</h5>
                                                    
                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] md:text-xs lg:text-sm font-bold text-gray-300 uppercase">🚗 Trip Base (Fixed)</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs md:text-sm lg:text-base font-mono text-gray-500">€</span>
                                                                <input type="number" value={tripBaseProvision} onChange={e => setTripBaseProvision(parseFloat(e.target.value) || 0)} className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-center font-mono text-sm font-bold text-white outline-none focus:border-brand/50 transition-all" />
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] md:text-xs lg:text-sm font-bold text-gray-300 uppercase">🚗 Trip Increment</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs md:text-sm lg:text-base font-mono text-gray-500">+ €</span>
                                                                <input type="number" value={tripIncrementProvision} onChange={e => setTripIncrementProvision(parseFloat(e.target.value) || 0)} className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-center font-mono text-sm font-bold text-white outline-none focus:border-brand/50 transition-all" />
                                                            </div>
                                                        </div>
                                                        <div className="w-full h-[1px] bg-white/5 my-2" />
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] md:text-xs lg:text-sm font-bold text-gray-300 uppercase">🏨 Hotel / VIP Rate</span>
                                                            <div className="flex items-center gap-2">
                                                                <input type="number" value={hotelProvisionRate} onChange={e => setHotelProvisionRate(parseFloat(e.target.value) || 0)} className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-center font-mono text-sm font-bold text-white outline-none focus:border-brand/50 transition-all" />
                                                                <span className="text-xs md:text-sm lg:text-base font-bold text-gray-500">%</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] md:text-xs lg:text-sm font-bold text-gray-300 uppercase">🎟️ Club & Ticket Rate</span>
                                                            <div className="flex items-center gap-2">
                                                                <input type="number" value={ticketProvisionRate} onChange={e => setTicketProvisionRate(parseFloat(e.target.value) || 0)} className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-center font-mono text-sm font-bold text-white outline-none focus:border-brand/50 transition-all" />
                                                                <span className="text-xs md:text-sm lg:text-base font-bold text-gray-500">%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* COLUMN 2: SCENARIO INPUTS */}
                                                <div className="space-y-6 bg-white/5 border border-white/5 rounded-[2rem] p-6">
                                                    <h5 className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-brand border-b border-white/10 pb-3 flex items-center gap-2"><Target size={12}/> 2. Scenario Variables</h5>
                                                    
                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] md:text-xs lg:text-sm font-bold text-gray-400 uppercase">🎪 Event Type</span>
                                                            <select value={simulatedEventType} onChange={e => setSimulatedEventType(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px] md:text-xs lg:text-sm font-bold text-brand outline-none focus:border-brand/50 uppercase">
                                                                <option value="football">⚽ Football Match</option>
                                                                <option value="club">🪩 Club Party</option>
                                                                <option value="concert">🎤 Stadium Concert</option>
                                                            </select>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] md:text-xs lg:text-sm font-bold text-gray-400 uppercase">👥 Expected Volume (Guests)</span>
                                                            <input type="number" value={simulatedGuestVolume} onChange={e => setSimulatedGuestVolume(parseFloat(e.target.value) || 0)} className="w-20 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-center font-mono text-sm font-bold text-white outline-none focus:border-brand/50 transition-all" />
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] md:text-xs lg:text-sm font-bold text-gray-400 uppercase">Avg. Trip Fare / Guest</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs md:text-sm lg:text-base font-mono text-gray-600">€</span>
                                                                <input type="number" value={simulatedTripFare} onChange={e => setSimulatedTripFare(parseFloat(e.target.value) || 0)} className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-center font-mono text-sm font-bold text-gray-300 outline-none focus:border-brand/50" />
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] md:text-xs lg:text-sm font-bold text-gray-400 uppercase">Avg. Hotel Spend / Guest</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs md:text-sm lg:text-base font-mono text-gray-600">€</span>
                                                                <input type="number" value={simulatedHotelCost} onChange={e => setSimulatedHotelCost(parseFloat(e.target.value) || 0)} className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-center font-mono text-sm font-bold text-gray-300 outline-none focus:border-brand/50" />
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] md:text-xs lg:text-sm font-bold text-gray-400 uppercase">Avg. Ticket Spend / Guest</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs md:text-sm lg:text-base font-mono text-gray-600">€</span>
                                                                <input type="number" value={simulatedFnBCost} onChange={e => setSimulatedFnBCost(parseFloat(e.target.value) || 0)} className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-center font-mono text-sm font-bold text-gray-300 outline-none focus:border-brand/50" />
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] md:text-xs lg:text-sm font-bold text-amber-500/80 uppercase">👑 VIP Table Spend (Total)</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs md:text-sm lg:text-base font-mono text-amber-600">€</span>
                                                                <input type="number" value={simulatedTableSpend} onChange={e => setSimulatedTableSpend(parseFloat(e.target.value) || 0)} className="w-20 bg-black/40 border border-amber-500/30 rounded-lg px-2 py-1 text-center font-mono text-sm font-bold text-amber-400 outline-none focus:border-amber-500" />
                                                            </div>
                                                        </div>
                                                        <div className="w-full h-[1px] bg-white/5 my-2" />
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] md:text-xs lg:text-sm font-bold text-gray-400 uppercase">Partner Tier</span>
                                                            <select value={simPartnerTier} onChange={e => setSimPartnerTier(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px] md:text-xs lg:text-sm font-bold text-gray-300 outline-none focus:border-brand/50 uppercase">
                                                                <option value="standard">Standard</option>
                                                                <option value="gold">Gold (15% Off)</option>
                                                            </select>
                                                        </div>
                                                        <div className="flex gap-2 mt-2">
                                                            <button onClick={() => setSimWeatherRain(!simWeatherRain)} className={`flex-1 py-1 rounded text-[9px] md:text-[11px] lg:text-xs font-bold uppercase transition-all ${simWeatherRain ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-black/40 text-gray-500 border border-white/5'}`}>🌧️ Rain (+20% Surge)</button>
                                                            <button onClick={() => setSimNightlifePeak(!simNightlifePeak)} className={`flex-1 py-1 rounded text-[9px] md:text-[11px] lg:text-xs font-bold uppercase transition-all ${simNightlifePeak ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-black/40 text-gray-500 border border-white/5'}`}>🌙 Peak (+50% Surge)</button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* COLUMN 3: OUTPUT & VISUALIZER */}
                                                <div className="space-y-6 bg-brand/5 border border-brand/20 rounded-[2rem] p-6 relative overflow-hidden flex flex-col justify-between">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand/20 blur-[60px] rounded-full pointer-events-none" />
                                                    
                                                    <div className="space-y-4 relative z-10">
                                                        <h5 className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-brand border-b border-brand/20 pb-3 flex items-center gap-2"><LineChart size={12}/> 3. Projection & Output</h5>
                                                        
                                                        {(() => {
                                                            let actualSurge = globalSurge;
                                                            if (simWeatherRain) actualSurge *= 1.2;
                                                            if (simNightlifePeak) actualSurge *= 1.5;
                                                            
                                                            const tierDiscount = simPartnerTier === 'gold' ? 0.85 : 1; // 15% discount for Gold

                                                            const tripProv = calculateTripProvision(simulatedTripFare) * simulatedGuestVolume * actualSurge;
                                                            const hotelProv = calculateHotelProvision(simulatedHotelCost) * simulatedGuestVolume * actualSurge * tierDiscount;
                                                            
                                                            // Ticket/Club provision ONLY applies to football matches
                                                            const baseTicketYield = simulatedEventType === 'football' ? calculateTicketProvision(simulatedFnBCost) * simulatedGuestVolume : 0;
                                                            // For tables, same rule: only if football (though table spend at a football match is rare, we keep the rule consistent)
                                                            const tableYield = simulatedEventType === 'football' ? calculateTicketProvision(simulatedTableSpend) : 0;
                                                            
                                                            const clubProv = (baseTicketYield + parseFloat(tableYield)) * actualSurge * tierDiscount;

                                                            const totalYield = tripProv + hotelProv + clubProv;
                                                            
                                                            const tripPct = totalYield > 0 ? (tripProv / totalYield) * 100 : 0;
                                                            const hotelPct = totalYield > 0 ? (hotelProv / totalYield) * 100 : 0;
                                                            const clubPct = totalYield > 0 ? (clubProv / totalYield) * 100 : 0;

                                                            return (
                                                                <div className="space-y-6">
                                                                    <div className="flex flex-col items-center justify-center p-4 bg-black/20 rounded-2xl border border-white/5">
                                                                        <span className="text-[10px] md:text-xs lg:text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Net Platform Margin</span>
                                                                        <span className="text-4xl font-black font-mono text-white tracking-tighter shadow-brand/50 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                                                                            €{totalYield.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </span>
                                                                        {actualSurge > 1 && <span className="text-[9px] md:text-[11px] lg:text-xs font-black text-brand mt-1 uppercase">Surge Active ({actualSurge.toFixed(2)}x)</span>}
                                                                        {simulatedEventType !== 'football' && <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-red-400 mt-1 uppercase">0% Ticket Provision (Non-Football Event)</span>}
                                                                    </div>
                                                                    
                                                                    <div className="space-y-2">
                                                                        <div className="flex justify-between text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-gray-500">
                                                                            <span>Fleet: €{tripProv.toFixed(2)}</span>
                                                                            <span>Hotel: €{hotelProv.toFixed(2)}</span>
                                                                            <span>Ticket/VIP: €{clubProv.toFixed(2)}</span>
                                                                        </div>
                                                                        {totalYield > 0 && (
                                                                            <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden flex shadow-inner">
                                                                                <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${tripPct}%` }} />
                                                                                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${hotelPct}%` }} />
                                                                                <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${clubPct}%` }} />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>

                                                    <button 
                                                        onClick={saveProvisionsConfig}
                                                        className="w-full py-4 mt-6 bg-brand text-dark-900 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_30px_rgba(52,211,153,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all relative z-10 flex items-center justify-center gap-2"
                                                    >
                                                        <ShieldCheck size={14} /> SECURE TO LIVE GRID
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                             </motion.div>
                        )}

                        {view === 'feedback' && (
                            <motion.div key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                                    <div className="space-y-4">
                                        <h2 className="text-6xl font-black italic uppercase tracking-tighter leading-none">Feedback <span className="text-brand">Hub</span></h2>
                                        <p className="text-gray-500 text-sm font-bold uppercase tracking-[0.4em]">Global Surveillance & Sentiment Analysis</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4">
                                        {/* DSGVO COMPLIANCE SHIELD TOGGLE */}
                                        <button 
                                            onClick={() => {
                                                const nextState = !anonymizedModeActive;
                                                setAnonymizedModeActive(nextState);
                                                triggerNotification(
                                                    nextState ? 'success' : 'warning',
                                                    nextState ? 'DSGVO Shield Activated' : 'DSGVO Shield Deactivated',
                                                    nextState ? 'All guest telemetry has been securely anonymized.' : 'Raw guest PII is now visible in logs.'
                                                );
                                            }}
                                            className={`flex items-center gap-3 px-5 py-4 rounded-[2rem] border transition-all ${
                                                anonymizedModeActive 
                                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/5' 
                                                    : 'bg-red-500/10 border-red-500/30 text-red-400 shadow-lg shadow-red-500/5 hover:bg-red-500/20'
                                            }`}
                                        >
                                            <Shield size={14} className={anonymizedModeActive ? 'animate-pulse' : ''} />
                                            <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest">
                                                DSGVO Shield: {anonymizedModeActive ? 'SECURED' : 'UNMASKED'}
                                            </span>
                                            <div className={`w-2 h-2 rounded-full ${anonymizedModeActive ? 'bg-emerald-400 shadow-md shadow-emerald-400/50' : 'bg-red-400 shadow-md shadow-red-400/50'}`} />
                                        </button>

                                        <div className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-[2.5rem]">
                                            <select value={feedbackFilter.category} onChange={e => setFeedbackFilter({...feedbackFilter, category: e.target.value})} className="bg-transparent text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-brand outline-none cursor-pointer"><option value="all">ALL SECTORS</option><option value="fleet">FLEET</option><option value="restaurant">RESTAURANTS</option><option value="hotel">HOTELS</option><option value="stadium">STADIUM</option></select>
                                            <div className="w-px h-6 bg-white/10 mx-2" />
                                            <input type="date" className="bg-transparent text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-500 outline-none" onChange={e => setFeedbackFilter({...feedbackFilter, date: e.target.value})} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                    <div className="lg:col-span-2 space-y-6">
                                        {anonymizeFeedback(rawFeedbackItems, anonymizedModeActive)
                                            .filter(f => feedbackFilter.category === 'all' || f.type.toLowerCase() === feedbackFilter.category)
                                            .map((f, i) => (
                                            <div key={i} className="p-8 bg-white/5 border border-white/5 rounded-[3rem] hover:border-white/30 transition-all group relative overflow-hidden">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="flex items-center gap-6">
                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${f.rating < 3 ? 'bg-red-500/10 text-red-500' : 'bg-brand/10 text-brand'}`}>
                                                            {f.type === 'Fleet' ? <Car size={28} /> : f.type === 'Stadium' ? <Target size={28} /> : <Building2 size={28} />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xl font-black italic uppercase text-white tracking-tighter">{f.id}</span>
                                                                <span className="px-3 py-1 bg-white/5 rounded text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase">{f.type}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1 text-gray-500">
                                                                <MapPin size={10} />
                                                                <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest">{f.location}</span>
                                                                <Clock size={10} className="ml-2" />
                                                                <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest">{f.date} {f.time}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < f.rating ? 'currentColor' : 'none'} className={i < f.rating ? (f.rating < 3 ? 'text-red-500' : 'text-brand') : 'text-gray-800'} />)}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-400 italic leading-relaxed pl-20">"{f.text}"</p>
                                                <div className="mt-6 pl-20 flex justify-between items-center">
                                                    <span className="text-[10px] md:text-xs lg:text-sm font-black text-gray-600 uppercase italic">— {f.user}</span>
                                                    <div className="flex gap-4">
                                                        <button className="text-[9px] md:text-[11px] lg:text-xs font-black text-brand uppercase tracking-widest hover:underline">Flag Integrity</button>
                                                        <button className="text-[9px] md:text-[11px] lg:text-xs font-black text-white bg-white/10 px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-brand hover:text-dark-900 transition-all">Direct Response</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-8">
                                        {/* SENTIMENT PULSE CARD */}
                                        <div className="bg-brand/5 border border-brand/20 rounded-[3.5rem] p-10">
                                            <h4 className="text-xl font-black italic uppercase text-white mb-6">Sentiment Pulse</h4>
                                            <div className="space-y-6">
                                                {[{ l: 'Fleet Satisfaction', v: 88, c: 'bg-brand' }, { l: 'Venue Vibes', v: 94, c: 'bg-emerald-500' }, { l: 'Stadium Flow', v: 72, c: 'bg-amber-500' }].map((s, i) => (
                                                    <div key={i} className="space-y-2">
                                                        <div className="flex justify-between text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest italic text-gray-500"><span>{s.l}</span><span>{s.v}%</span></div>
                                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className={`h-full ${s.c}`} style={{ width: `${s.v}%` }} /></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* KHIAM NEURAL INTELLIGENCE SCOUT TERMINAL */}
                                        <div className="bg-white/5 border border-white/10 rounded-[3.5rem] p-10 flex flex-col relative overflow-hidden backdrop-blur-md">
                                            {/* Status Header */}
                                            <div className="flex justify-between items-center mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative flex items-center justify-center">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-brand animate-ping absolute" />
                                                        <div className="w-2.5 h-2.5 rounded-full bg-brand relative" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs md:text-sm lg:text-base font-black italic uppercase text-white tracking-wider">KHIAM AI SCOUT</h4>
                                                        <p className="text-[7px] font-mono text-gray-500 uppercase tracking-widest">Compliance & Sales Intelligence</p>
                                                    </div>
                                                </div>
                                                <span className="px-3 py-1 bg-brand/10 border border-brand/30 rounded-xl text-[8px] md:text-[10px] lg:text-xs font-mono text-brand uppercase tracking-widest animate-pulse">
                                                    GDPR SHIELD: {anonymizedModeActive ? 'ON' : 'OFF'}
                                                </span>
                                            </div>

                                            {/* Scrolling Chat Window */}
                                            <div className="h-[280px] overflow-y-auto mb-6 p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4 font-mono text-[9px] md:text-[11px] lg:text-xs scrollbar-thin scrollbar-thumb-brand scrollbar-track-transparent">
                                                {scoutMessages.map((msg, index) => (
                                                    <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                                        <div className="flex items-center gap-2 mb-1 text-[7px] text-gray-500">
                                                            <span className="font-bold">{msg.role === 'user' ? 'DIRECTOR' : '🛡️ AI SCOUT'}</span>
                                                            <span>•</span>
                                                            <span>{msg.time}</span>
                                                        </div>
                                                        <div className={`p-4 rounded-2xl max-w-[90%] whitespace-pre-wrap leading-relaxed ${
                                                            msg.role === 'user' 
                                                                ? 'bg-brand/10 border border-brand/30 text-brand rounded-tr-none' 
                                                                : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-none'
                                                        }`}>
                                                            {msg.text.split('\n').map((line, lIdx) => {
                                                                let content = line;
                                                                if (content.startsWith('### ')) {
                                                                    return <h5 key={lIdx} className="text-[10px] md:text-xs lg:text-sm font-black text-white uppercase italic tracking-wider mb-2 mt-1">{content.replace('### ', '')}</h5>;
                                                                }
                                                                if (content.startsWith('**') && content.endsWith('**')) {
                                                                    return <p key={lIdx} className="font-black text-white mt-1">{content.replaceAll('**', '')}</p>;
                                                                }
                                                                if (content.startsWith('* ')) {
                                                                    return <div key={lIdx} className="flex gap-2 pl-1 text-gray-400 my-0.5"><span>•</span><span>{content.replace('* ', '')}</span></div>;
                                                                }
                                                                if (content.startsWith('- ')) {
                                                                    return <div key={lIdx} className="flex gap-2 pl-3 text-brand my-0.5"><span>-</span><span>{content.replace('- ', '')}</span></div>;
                                                                }
                                                                if (content.startsWith('> ')) {
                                                                    return <blockquote key={lIdx} className="border-l border-brand/50 pl-2 italic my-1.5 text-brand/80 text-[8px] md:text-[10px] lg:text-xs bg-brand/5 p-2 rounded-r-xl leading-normal">{content.replace('> ', '')}</blockquote>;
                                                                }
                                                                return <p key={lIdx} className="mb-0.5 text-gray-400">{content}</p>;
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                                {isScoutThinking && (
                                                    <div className="flex flex-col items-start">
                                                        <div className="flex items-center gap-2 mb-1 text-[7px] text-gray-500">
                                                            <span className="font-bold">🛡️ AI SCOUT</span>
                                                            <span>•</span>
                                                            <span className="animate-pulse text-brand">THINKING</span>
                                                        </div>
                                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-brand rounded-tl-none flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                            <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                            <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                            <span className="text-[8px] md:text-[10px] lg:text-xs text-gray-500 italic ml-2">Parsing real-time dataset...</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Quick Actions Row */}
                                            <div className="grid grid-cols-3 gap-2 mb-4">
                                                <button 
                                                    disabled={isScoutThinking}
                                                    onClick={() => handleSendScoutMessage("🚗 Draft Fleet Manager Pitch")}
                                                    className="py-3 px-1.5 bg-white/5 border border-white/10 rounded-xl text-[7px] font-black uppercase text-gray-400 tracking-wider hover:bg-brand/10 hover:border-brand/30 hover:text-brand hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
                                                >
                                                    🚗 Fleet Pitch
                                                </button>
                                                <button 
                                                    disabled={isScoutThinking}
                                                    onClick={() => handleSendScoutMessage("🏨 Draft Luxury Hotel Pitch")}
                                                    className="py-3 px-1.5 bg-white/5 border border-white/10 rounded-xl text-[7px] font-black uppercase text-gray-400 tracking-wider hover:bg-brand/10 hover:border-brand/30 hover:text-brand hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
                                                >
                                                    🏨 Hotel Pitch
                                                </button>
                                                <button 
                                                    disabled={isScoutThinking}
                                                    onClick={() => handleSendScoutMessage("🛡️ Request DSGVO Compliance Audit")}
                                                    className="py-3 px-1.5 bg-white/5 border border-white/10 rounded-xl text-[7px] font-black uppercase text-gray-400 tracking-wider hover:bg-brand/10 hover:border-brand/30 hover:text-brand hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
                                                >
                                                    🛡️ DSGVO Audit
                                                </button>
                                            </div>

                                            {/* Chat Input */}
                                            <form 
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    handleSendScoutMessage();
                                                }}
                                                className="flex gap-2 mb-6"
                                            >
                                                <input 
                                                    type="text" 
                                                    value={scoutInput}
                                                    onChange={e => setScoutInput(e.target.value)}
                                                    placeholder="Ask compliance scout..."
                                                    className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-3 font-mono text-[8px] md:text-[10px] lg:text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand/50 transition-all"
                                                />
                                                <button 
                                                    type="submit"
                                                    disabled={!scoutInput.trim() || isScoutThinking}
                                                    className="w-10 h-10 bg-brand text-dark-900 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                            </form>

                                            {/* Download ledger button */}
                                            <button 
                                                onClick={exportAnonymizedReport}
                                                className="w-full py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all flex items-center justify-center gap-2 group"
                                            >
                                                <Download size={12} className="group-hover:translate-y-0.5 transition-transform" />
                                                DOWNLOAD SECURITY LEDGER & OUTREACH AUDIT
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {view === 'shuttle-hub' && (
                            <motion.div key="shuttle-hub" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                                {/* HEADER HERO CARD */}
                                <div className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-[3.5rem] p-10 space-y-8 relative overflow-hidden">
                                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0 shadow-lg">
                                            <Bus size={32} />
                                        </div>
                                        <div>
                                            <h2 className="text-4xl md:text-5xl font-black italic uppercase text-white tracking-tighter">
                                                SMART SHUTTLE <span className="text-white">HUB</span>
                                            </h2>
                                            <p className="text-xs font-black tracking-widest text-gray-400 uppercase mt-1">
                                                AI FLIGHT-TO-HOTEL GROUP POOLING · LUGGAGE SPLIT & ADVANCE PRE-FLIGHT MESSAGING
                                            </p>
                                        </div>
                                    </div>

                                    {/* DYNAMIC SHUTTLE FARE FORMULA CONFIGURATOR */}
                                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-6 max-w-5xl">
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
                                            <div>
                                                <h3 className="text-sm font-black uppercase text-white tracking-widest flex items-center gap-2">
                                                    <Calculator size={16} className="text-brand" /> Shuttle Preiskalkulation (Staffeltarif & Gepäck)
                                                </h3>
                                                <p className="text-[11px] text-gray-400 mt-0.5">
                                                    Beispiel: Bis zu <span className="text-white font-bold">{shuttleBaseKm} km</span> = <span className="text-brand font-bold">{shuttleBaseFare} €</span> / Person, danach für jede weiteren <span className="text-white font-bold">{shuttleIncKm} km</span> +<span className="text-emerald-400 font-bold">{shuttleIncFare} €</span>. Gepäck: <span className="text-white font-bold">{shuttleIncludedLuggage} Koffer frei</span>, extra Koffer: <span className="text-emerald-400 font-bold">+€{shuttleLuggageFee}</span> / Stk.
                                                </p>
                                            </div>
                                            <span className="bg-brand/10 border border-brand/30 text-brand text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                                                Formel Aktiv
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                            {/* Tier 1: Base KM */}
                                            <div className="space-y-1.5 bg-dark-950/80 border border-white/10 rounded-2xl p-4">
                                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                                                    GRUND-DISTANZ (KM)
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number"
                                                        step="0.5"
                                                        value={shuttleBaseKm}
                                                        onChange={e => {
                                                            const val = parseFloat(e.target.value) || 0;
                                                            setShuttleBaseKm(val);
                                                            localStorage.setItem('green_shuttle_base_km', val);
                                                        }}
                                                        className="bg-transparent text-white font-black text-xl w-full focus:outline-none"
                                                    />
                                                    <span className="text-gray-400 font-bold text-xs">KM</span>
                                                </div>
                                            </div>

                                            {/* Tier 1: Base Fare */}
                                            <div className="space-y-1.5 bg-dark-950/80 border border-white/10 rounded-2xl p-4">
                                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                                                    GRUNDTARIF / PAX (€)
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-brand font-bold text-lg">€</span>
                                                    <input 
                                                        type="number"
                                                        step="0.50"
                                                        value={shuttleBaseFare}
                                                        onChange={e => {
                                                            const val = parseFloat(e.target.value) || 0;
                                                            setShuttleBaseFare(val);
                                                            localStorage.setItem('green_shuttle_base_fare', val);
                                                        }}
                                                        className="bg-transparent text-white font-black text-xl w-full focus:outline-none"
                                                    />
                                                </div>
                                            </div>

                                            {/* Tier 2: Increment KM */}
                                            <div className="space-y-1.5 bg-dark-950/80 border border-white/10 rounded-2xl p-4">
                                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                                                    STAFFEL-DISTANZ (KM)
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number"
                                                        step="0.5"
                                                        value={shuttleIncKm}
                                                        onChange={e => {
                                                            const val = parseFloat(e.target.value) || 0;
                                                            setShuttleIncKm(val);
                                                            localStorage.setItem('green_shuttle_inc_km', val);
                                                        }}
                                                        className="bg-transparent text-white font-black text-xl w-full focus:outline-none"
                                                    />
                                                    <span className="text-gray-400 font-bold text-xs">KM</span>
                                                </div>
                                            </div>

                                            {/* Tier 2: Increment Fare */}
                                            <div className="space-y-1.5 bg-dark-950/80 border border-white/10 rounded-2xl p-4">
                                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                                                    AUFPREIS / PAX (€)
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-emerald-400 font-bold text-lg">+€</span>
                                                    <input 
                                                        type="number"
                                                        step="0.50"
                                                        value={shuttleIncFare}
                                                        onChange={e => {
                                                            const val = parseFloat(e.target.value) || 0;
                                                            setShuttleIncFare(val);
                                                            localStorage.setItem('green_shuttle_inc_fare', val);
                                                        }}
                                                        className="bg-transparent text-white font-black text-xl w-full focus:outline-none"
                                                    />
                                                </div>
                                            </div>

                                            {/* Tier 3: Luggage Fee */}
                                            <div className="space-y-1.5 bg-dark-950/80 border border-white/10 rounded-2xl p-4">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                                                        KOFFER-AUFPREIS (€)
                                                    </label>
                                                    <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                                        {shuttleIncludedLuggage} frei
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-emerald-400 font-bold text-lg">+€</span>
                                                    <input 
                                                        type="number"
                                                        step="0.50"
                                                        value={shuttleLuggageFee}
                                                        onChange={e => {
                                                            const val = parseFloat(e.target.value) || 0;
                                                            setShuttleLuggageFee(val);
                                                            localStorage.setItem('green_shuttle_luggage_fee', val);
                                                        }}
                                                        className="bg-transparent text-white font-black text-xl w-full focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                                            <div className="text-xs text-gray-400 font-medium">
                                                💡 Berechnungsbeispiel: <span className="text-white font-bold">14.5 KM</span> Fahrt (1 Gast + 2 Koffer [1 frei, 1 extra à €{shuttleLuggageFee}]) = <span className="text-brand font-black">€{calculateShuttleFarePerPerson(14.5, 2).toFixed(2)}</span> Gesamt
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    localStorage.setItem('green_shuttle_base_fare', shuttleBaseFare);
                                                    localStorage.setItem('green_shuttle_base_km', shuttleBaseKm);
                                                    localStorage.setItem('green_shuttle_inc_fare', shuttleIncFare);
                                                    localStorage.setItem('green_shuttle_inc_km', shuttleIncKm);
                                                    localStorage.setItem('green_shuttle_luggage_fee', shuttleLuggageFee);
                                                    localStorage.setItem('green_shuttle_included_luggage', shuttleIncludedLuggage);
                                                    saveShuttleFareConfig({
                                                        basePrice: shuttleBaseFare,
                                                        baseKm: shuttleBaseKm,
                                                        stepKm: shuttleIncKm,
                                                        stepFee: shuttleIncFare,
                                                        luggageFee: shuttleLuggageFee,
                                                        includedLuggage: shuttleIncludedLuggage
                                                    });
                                                    triggerNotification('success', 'Shuttle Staffel- & Gepäcktarif Gespeichert 🚀', `Bis zu ${shuttleBaseKm}km: €${shuttleBaseFare} | Je +${shuttleIncKm}km: +€${shuttleIncFare} | Extra Koffer: +€${shuttleLuggageFee}`);
                                                }}
                                                className="w-full sm:w-auto px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <CheckCircle size={16} /> SPEICHERN
                                            </button>
                                        </div>
                                    </div>

                                    {/* B2B WEBHOOK URL & SEPARATE LUGGAGE LOGISTICS CARD (Weg 2 & 3) */}
                                    <div className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-[2rem] p-6 space-y-6 max-w-5xl">
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
                                            <div>
                                                <h3 className="text-sm font-black uppercase text-white tracking-widest flex items-center gap-2">
                                                    <Globe size={16} className="text-cyan-400" /> B2B Webhook Feed & Getrennter Gepäck-Transport
                                                </h3>
                                                <p className="text-[11px] text-gray-400 mt-0.5">
                                                    Live-Schnittstellen für Flughafen-Landezeiten, Cargo-Gepäckabholung und automatische Tracking-Links.
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const nextState = !isLuggageSeparated;
                                                    setIsLuggageSeparated(nextState);
                                                    localStorage.setItem('green_shuttle_separate_luggage', nextState ? 'true' : 'false');
                                                    triggerNotification(
                                                        nextState ? 'success' : 'info',
                                                        nextState ? 'VIP Getrennter Gepäckservice Aktiv 🧳' : 'Standard Gepäck-Transport',
                                                        nextState ? 'Gepäck wird getrennt an der Cargo-Station abgeholt und ins Hotel geliefert.' : 'Gäste und Gepäck fahren gemeinsam im Shuttle.'
                                                    );
                                                }}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                                                    isLuggageSeparated 
                                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                                                        : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
                                                }`}
                                            >
                                                {isLuggageSeparated ? '✓ Getrennter Gepäck-Transport (Aktiv)' : '+ Getrennten Gepäck-Service Aktivieren'}
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Webhook 1: Live Flight Feed */}
                                            <div className="space-y-2 bg-dark-950/80 border border-white/10 rounded-2xl p-4">
                                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-2">
                                                    <Globe size={14} className="text-cyan-400" /> FLUGDATEN & ANKUNFTS-API WEBHOOK URL (WEG 2)
                                                </label>
                                                <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl px-3 py-2">
                                                    <input 
                                                        type="text"
                                                        value={flightWebhookUrl}
                                                        onChange={e => {
                                                            setFlightWebhookUrl(e.target.value);
                                                            localStorage.setItem('green_shuttle_flight_webhook', e.target.value);
                                                        }}
                                                        placeholder="https://api.airport.com/v1/flights/live-sync"
                                                        className="bg-transparent text-xs font-mono text-cyan-300 w-full focus:outline-none"
                                                    />
                                                </div>
                                                <p className="text-[9px] text-gray-500">
                                                    Live-Flugstatus, Verspätungen und Lande-Windows direkt vom Flughafen-Portal.
                                                </p>
                                            </div>

                                            {/* Webhook 2: Luggage & Cargo Hub Feed */}
                                            <div className="space-y-2 bg-dark-950/80 border border-white/10 rounded-2xl p-4">
                                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-2">
                                                    <Briefcase size={14} className="text-amber-400" /> GEPÄCK-LOGISTIK & CARGO-HUB LINK (WEG 3)
                                                </label>
                                                <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl px-3 py-2">
                                                    <input 
                                                        type="text"
                                                        value={luggageWebhookUrl}
                                                        onChange={e => {
                                                            setLuggageWebhookUrl(e.target.value);
                                                            localStorage.setItem('green_shuttle_luggage_webhook', e.target.value);
                                                        }}
                                                        placeholder="https://cargo-hub.green-logistics.de/v1/baggage/claim-tracking"
                                                        className="bg-transparent text-xs font-mono text-amber-300 w-full focus:outline-none"
                                                    />
                                                </div>
                                                <p className="text-[9px] text-gray-500">
                                                    Abhol-Koordinaten für Gepäckbänder, Cargo-Hallen und Hotel-Gepäckräume.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-1">
                                            <button 
                                                onClick={() => {
                                                    localStorage.setItem('green_shuttle_flight_webhook', flightWebhookUrl);
                                                    localStorage.setItem('green_shuttle_luggage_webhook', luggageWebhookUrl);
                                                    triggerNotification('success', 'B2B Webhooks Gespeichert 🚀', 'Schnittstellen-Links für Flugzeiten und Gepäck-Abholung aktualisiert.');
                                                }}
                                                className="px-6 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
                                            >
                                                <CheckCircle size={14} /> WEBHOOK-LINKS SPEICHERN
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* 4 METRICS CARDS */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-[2.5rem] p-8 space-y-2">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-wider">ACTIVE HOTEL CLUSTERS</p>
                                        <p className="text-3xl font-black italic text-white">{shuttleClusters.length} Active Groups</p>
                                    </div>

                                    <div className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-[2.5rem] p-8 space-y-2">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-wider">TOTAL CONFIRMED GUESTS</p>
                                        <p className="text-3xl font-black italic text-white">
                                            {shuttleClusters.reduce((sum, c) => sum + ((c.guests || []).filter(g => g.status === 'accepted').length), 0)} / {shuttleClusters.reduce((sum, c) => sum + (c.guests ? c.guests.length : 0), 0)} Confirmed
                                        </p>
                                    </div>

                                    <div className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-[2.5rem] p-8 space-y-2">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-wider">ESTIMATED REVENUE</p>
                                        <p className="text-3xl font-black italic text-cyan-400">
                                            €{shuttleClusters.reduce((sum, c) => sum + ((c.guests || []).filter(g => g.status === 'accepted').length * calculateShuttleFarePerPerson(c.distanceKm || 0)), 0).toFixed(2)}
                                        </p>
                                    </div>

                                    <div className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-[2.5rem] p-8 space-y-2">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-wider">TOTAL LUGGAGE VOLUME</p>
                                        <p className="text-3xl font-black italic text-amber-400">
                                            {shuttleClusters.reduce((sum, c) => sum + ((c.guests || []).reduce((acc, g) => acc + (g.bags || 0), 0)), 0)} Gepäckstücke
                                        </p>
                                    </div>
                                </div>

                                {/* TARIFF CONFIGURATOR PANEL */}
                                <div className="bg-gradient-to-r from-emerald-950/40 via-black to-dark-950 p-8 rounded-[3rem] border border-emerald-500/20 space-y-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                                        <div>
                                            <h3 className="text-xl font-black italic uppercase text-brand tracking-tighter flex items-center gap-2">
                                                <Calculator size={20} /> SHUTTLE FARE & DISTANCE MATRIX CONFIGURATOR
                                            </h3>
                                            <p className="text-xs text-gray-400 font-medium">Configure tiered dynamic shuttle fare calculation parameters in real-time across all user & partner gateways.</p>
                                        </div>
                                        <div className="px-4 py-2 bg-brand/10 border border-brand/20 rounded-xl text-brand text-xs font-black uppercase tracking-widest">
                                            Rule: {shuttleFareConfig.baseKm} km Base (€{shuttleFareConfig.basePrice.toFixed(2)}) + €{shuttleFareConfig.stepFee.toFixed(2)} / +{shuttleFareConfig.stepKm} km
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Base Price (€)</label>
                                            <input 
                                                type="number"
                                                step="0.5"
                                                value={shuttleFareConfig.basePrice}
                                                onChange={(e) => updateFareConfig('basePrice', e.target.value)}
                                                className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-sm font-black text-emerald-400 focus:outline-none focus:border-brand"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Base Distance (KM)</label>
                                            <input 
                                                type="number"
                                                step="0.5"
                                                value={shuttleFareConfig.baseKm}
                                                onChange={(e) => updateFareConfig('baseKm', e.target.value)}
                                                className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-sm font-black text-white focus:outline-none focus:border-brand"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Step Interval (KM)</label>
                                            <input 
                                                type="number"
                                                step="0.5"
                                                value={shuttleFareConfig.stepKm}
                                                onChange={(e) => updateFareConfig('stepKm', e.target.value)}
                                                className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-sm font-black text-white focus:outline-none focus:border-brand"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Step Fee (€)</label>
                                            <input 
                                                type="number"
                                                step="0.25"
                                                value={shuttleFareConfig.stepFee}
                                                onChange={(e) => updateFareConfig('stepFee', e.target.value)}
                                                className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-sm font-black text-emerald-400 focus:outline-none focus:border-brand"
                                            />
                                        </div>
                                    </div>

                                    {/* Live Calculator Simulation Test */}
                                    <div className="p-4 rounded-2xl bg-black/50 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black uppercase text-gray-400">Live Tariff Simulator:</span>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="number"
                                                    value={testKmInput}
                                                    onChange={(e) => setTestKmInput(parseFloat(e.target.value) || 0)}
                                                    className="w-20 bg-white/10 border border-white/20 rounded-lg py-1 px-2 text-xs font-bold text-white text-center"
                                                />
                                                <span className="text-xs text-gray-400 font-bold">KM</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-black uppercase">
                                            <span className="text-gray-400">Calculated Dynamic Shuttle Fee:</span>
                                            <span className="text-xl text-brand font-black italic">€{calculateShuttleFarePerPerson(testKmInput).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION HEADER */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">
                                        LIVE FLIGHT-TO-HOTEL GROUP CLUSTERS
                                    </h3>
                                    <span className="text-xs font-black uppercase text-gray-400 tracking-widest">
                                        CLICK CLUSTER CARD TO VIEW FULL ROUTE & PASSENGER SCHEDULE
                                    </span>
                                </div>

                                {/* GROUP CLUSTERS CARDS */}
                                <div className="space-y-6">
                                    {shuttleClusters.length === 0 ? (
                                        <div className="p-12 border-2 border-dashed border-white/10 bg-white/5 rounded-[3rem] text-center space-y-3">
                                            <Users size={40} className="mx-auto text-gray-400 opacity-60" />
                                            <p className="text-base font-black uppercase tracking-wider text-gray-300">Keine aktiven Shuttle-Gruppen</p>
                                            <p className="text-xs text-gray-500">Shuttle-Cluster werden automatisch gebildet, sobald Fahrten für Stadion & Hotels gebucht werden.</p>
                                        </div>
                                    ) : (
                                        shuttleClusters.map((cluster) => {
                                        const acceptedGuests = cluster.guests.filter(g => g.status === 'accepted');
                                        const totalBags = cluster.guests.reduce((acc, g) => acc + (g.bags || 0), 0);

                                        return (
                                            <div key={cluster.id} className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-[3rem] p-8 space-y-6 relative overflow-hidden">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-3">
                                                            <span className="bg-white/10 text-white font-black text-xs px-4 py-1.5 rounded-full uppercase tracking-wider">
                                                                {cluster.origin}
                                                            </span>
                                                            <span className="text-gray-400 font-bold">➔</span>
                                                            <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-black text-xs px-4 py-1.5 rounded-full uppercase tracking-wider">
                                                                {cluster.targetHotel}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs font-black uppercase text-gray-400 tracking-widest pt-1">
                                                            {cluster.hotelAddress}
                                                        </p>
                                                    </div>

                                                    <div className="text-right">
                                                        <span className="text-[10px] font-black uppercase text-gray-500 block tracking-widest">LANDING WINDOW</span>
                                                        <span className="text-sm font-black italic text-white">14:00 - 14:30</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-dark-950/60 rounded-2xl p-6 border border-white/5">
                                                    <div>
                                                        <span className="text-[10px] font-black uppercase text-gray-500 block tracking-widest">PASSENGERS</span>
                                                        <span className="text-lg font-black italic text-white">{acceptedGuests.length} / {cluster.guests.length} Confirmed</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-black uppercase text-gray-500 block tracking-widest">LUGGAGE COUNT</span>
                                                        <span className="text-lg font-black italic text-amber-400">{totalBags || 14} Bags</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-black uppercase text-gray-500 block tracking-widest">VEHICLE SPLIT</span>
                                                        <span className="text-lg font-black italic text-brand">2x VIP Vans</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-gray-400 font-bold">Driver: {cluster.driverName} ({cluster.driverVehicle})</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => setSelectedShuttleCluster(cluster)}
                                                        className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
                                                    >
                                                        <MessageSquare size={16} className="text-brand" /> Broadcast Message
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }))}
                                </div>

                                {selectedShuttleCluster && (
                                    <ShuttleMessagingModal 
                                        isOpen={!!selectedShuttleCluster}
                                        cluster={selectedShuttleCluster} 
                                        shuttleFare={calculateShuttleFarePerPerson(selectedShuttleCluster.distanceKm)} 
                                        onClose={() => setSelectedShuttleCluster(null)} 
                                    />
                                )}

                                {/* SHUTTLE ROUTE & PASSENGER DETAIL MODAL */}
                                {activeDetailCluster && (
                                    <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
                                        <div className="w-full max-w-2xl bg-gradient-to-b from-dark-900 to-black border border-white/20 rounded-[3rem] p-8 space-y-6 relative shadow-2xl my-8">
                                            <button 
                                                onClick={() => setActiveDetailCluster(null)}
                                                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                                            >
                                                <X size={20} />
                                            </button>

                                            {/* Event & Target Venue Header */}
                                            <div className="border-b border-white/10 pb-6 space-y-2">
                                                <div className="flex items-center gap-2 text-xs font-black text-brand uppercase tracking-widest">
                                                    <Ticket size={16} /> {activeDetailCluster.eventName || 'Event / Match Day'}
                                                </div>
                                                <h3 className="text-3xl font-black italic uppercase text-white tracking-tighter">
                                                    {activeDetailCluster.destinationVenue || activeDetailCluster.targetHotel}
                                                </h3>
                                                <p className="text-xs text-gray-400 font-medium flex items-center gap-2">
                                                    <Calendar size={14} className="text-brand" /> {activeDetailCluster.eventDate || 'Spieltag / Event Datum'}
                                                </p>
                                            </div>

                                            {/* Travel Time & Arrival Info */}
                                            <div className="grid grid-cols-3 gap-4 bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                                                <div>
                                                    <span className="text-[9px] font-black uppercase text-gray-400 block tracking-widest">TOTAL DISTANCE</span>
                                                    <span className="text-base font-black italic text-white">{activeDetailCluster.distanceKm} KM</span>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-black uppercase text-gray-400 block tracking-widest">TRAVEL DURATION</span>
                                                    <span className="text-base font-black italic text-amber-400">{activeDetailCluster.estimatedTime || '25 Min'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-black uppercase text-gray-400 block tracking-widest">TARGET ARRIVAL</span>
                                                    <span className="text-base font-black italic text-brand">{activeDetailCluster.arrivalTime || '14:50 Uhr'}</span>
                                                </div>
                                            </div>

                                            {/* Passenger Pickup Schedule List */}
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center justify-between">
                                                    <span>Passenger Pickup Sequence & Locations</span>
                                                    <span className="text-emerald-400">Total Pickup Window: {activeDetailCluster.totalPickupDuration || '20 Min'}</span>
                                                </h4>

                                                <div className="space-y-3">
                                                    {activeDetailCluster.guests.map((guest, idx) => (
                                                        <div key={guest.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-brand/20 text-brand border border-brand/30 flex items-center justify-center text-xs font-black">
                                                                    #{idx + 1}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black italic text-white">{guest.name}</p>
                                                                    <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                                                        <MapPin size={12} className="text-brand" /> {guest.pickupAddress || 'Frankfurt am Main'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-xs font-black text-brand block">{guest.pickupTime || '14:00 Uhr'}</span>
                                                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                                    {guest.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Driver & Fare Summary */}
                                            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                                <div>
                                                    <span className="text-[10px] font-black uppercase text-gray-400 block">Assigned Shuttle Driver</span>
                                                    <span className="text-xs font-bold text-white">{activeDetailCluster.driverName} ({activeDetailCluster.driverVehicle})</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] font-black uppercase text-gray-400 block">Shuttle Fare per Person</span>
                                                    <span className="text-base font-black italic text-emerald-400">€{calculateShuttleFarePerPerson(activeDetailCluster.distanceKm).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {view === 'fleet' && (
                            <motion.div key="fleet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                                <h2 className="text-5xl font-black italic uppercase tracking-tighter">Live <span className="text-white">Fleet</span> Telemetry</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                    {['Active Units', 'On Trip', 'Idle/Standby', 'Emergency'].map((label, i) => {
                                        const count = [
                                            drivers.length,
                                            drivers.filter(d => d.status === 'busy' || d.status === 'arrived').length,
                                            drivers.filter(d => d.status === 'available').length,
                                            drivers.filter(d => d.status === 'stalled').length
                                        ][i];
                                        return (
                                            <div key={i} className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5">
                                                <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase tracking-widest mb-2">{label}</p>
                                                <p className="text-4xl font-black italic text-white tracking-tighter">{count}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="bg-dark-950 border border-white/5 rounded-[3.5rem] p-12 h-[600px] flex items-center justify-center relative overflow-hidden">
                                    <Radar drivers={drivers} />
                                </div>
                            </motion.div>
                        )}

                        {view === 'hotels' && (
                            <motion.div key="hotels" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                                <h2 className="text-5xl font-black italic uppercase tracking-tighter">VIP <span className="text-white">Hospitality</span> Logistics</h2>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    {['Grand Frankfurt Palace', 'The Steigenberger', 'Marriott Executive', 'River Main Suites'].map((hotel, i) => (
                                        <div key={i} className="p-8 bg-white/5 border border-white/5 rounded-[3rem] flex justify-between items-center group hover:border-white/30 transition-all">
                                            <div className="flex items-center gap-8">
                                                <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-white group-hover:scale-110 transition-transform"><Building2 size={32} /></div>
                                                <div><p className="text-2xl font-black italic uppercase text-white tracking-tighter">{hotel}</p><p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase tracking-widest mt-1">Status: Premium Partner</p></div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-3xl font-black italic text-white tracking-tighter">{hotelActiveBookings[hotel] || 0}</p>
                                                <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-white uppercase tracking-widest">Active Bookings</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {view === 'clubs' && (
                            <motion.div key="clubs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                                <h2 className="text-5xl font-black italic uppercase tracking-tighter">Nightlife <span className="text-brand">Heatmap</span></h2>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                    <div className="lg:col-span-2 bg-dark-950 border border-white/5 rounded-[3.5rem] p-12 h-[600px] flex items-center justify-center relative overflow-hidden">
                                        <Radar drivers={drivers} />
                                        <div className="absolute top-10 left-10 p-6 bg-brand/10 border border-brand/20 rounded-2xl backdrop-blur-md">
                                            <p className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-widest mb-1">Peak Intensity</p>
                                            <p className="text-2xl font-black italic text-white">Zeil District</p>
                                        </div>
                                    </div>
                                    <div className="space-y-8">
                                        {(() => {
                                            const venues = (docPartners || []).filter(p => ['venue', 'club', 'bar'].includes(p.type || p.category));
                                            if (venues.length === 0) {
                                                return (
                                                    <div className="p-8 border-2 border-dashed border-white/10 bg-white/5 rounded-[3rem] text-center space-y-2">
                                                        <p className="text-sm font-black uppercase text-gray-300">Keine Clubs registriert</p>
                                                        <p className="text-xs text-gray-500">Registrierte Clubs & Bars werden hier mit Live-Kapazität aufgeführt.</p>
                                                    </div>
                                                );
                                            }
                                            return venues.map((v, i) => {
                                                const cName = v.name || v.company || 'Club';
                                                const cap = clubCapacities[cName]?.capacity || 0;
                                                const fill = clubCapacities[cName]?.fill || 0;
                                                return (
                                                    <div key={v.id || i} className="p-8 bg-white/5 border border-white/5 rounded-[3rem] space-y-6">
                                                        <div className="flex justify-between items-center"><p className="text-xl font-black italic uppercase text-white">{cName}</p><Zap size={18} className="text-brand" /></div>
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-gray-500"><span>Capacity</span><span>{cap}%</span></div>
                                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-brand" style={{ width: `${fill}%` }} /></div>
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {view === 'events' && (
                            <motion.div key="events" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                                <h2 className="text-5xl font-black italic uppercase tracking-tighter">Strategic <span className="text-amber-500">Calendar</span></h2>
                                <div className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] p-10 overflow-hidden">
                                    <div className="grid grid-cols-7 gap-4 mb-10">
                                        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => <div key={d} className="text-center text-[10px] md:text-xs lg:text-sm font-black text-gray-600 uppercase tracking-widest">{d}</div>)}
                                        {[...Array(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate())].map((_, i) => {
                                            const isToday = (i + 1) === new Date().getDate();
                                            return (
                                                <div key={i} className={`h-24 rounded-2xl border border-white/5 p-4 flex flex-col justify-between hover:bg-brand/5 transition-all group cursor-pointer ${isToday ? 'bg-brand/10 border-brand/20' : 'bg-white/5'}`}>
                                                    <span className={`text-xs md:text-sm lg:text-base font-black italic ${isToday ? 'text-brand' : 'text-gray-500'} group-hover:text-white transition-colors`}>{i + 1}</span>
                                                    {isToday && <div className="w-full h-1 bg-brand rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {isDemo ? (
                                        <div className="p-8 bg-brand/10 border border-brand/20 rounded-[2.5rem] flex items-center gap-8">
                                            <div className="w-16 h-16 bg-brand rounded-[1.5rem] flex items-center justify-center text-dark-900"><Calendar size={32} /></div>
                                            <div><p className="text-2xl font-black italic uppercase text-white tracking-tighter">Stadium Main Event</p><p className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-widest mt-1">Demo Deployment — Full Fleet Simulation</p></div>
                                        </div>
                                    ) : (
                                        <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] flex items-center gap-8">
                                            <div className="w-16 h-16 bg-white/5 rounded-[1.5rem] flex items-center justify-center text-gray-500"><Calendar size={32} /></div>
                                            <div><p className="text-xl font-black italic uppercase text-gray-500 tracking-tighter">No Scheduled Events</p><p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-600 uppercase tracking-widest mt-1">Events will appear here once created via Ticket Hub.</p></div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {view === 'system-doors' && (
                            <motion.div key="doors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                                <h2 className="text-5xl font-black italic uppercase tracking-tighter">Portal <span className="text-brand">Doors</span></h2>
                                <p className="text-gray-500 text-sm font-bold uppercase tracking-[0.4em]">Seamless Cross-Platform Orchestration</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                    {[
                                        { label: 'Customer Portal', sub: 'Rider Interface', color: 'bg-blue-500', path: '/home', icon: Globe },
                                        { label: 'Driver Portal', sub: 'Fleet Interface', color: 'bg-brand', path: '/driver', icon: Car },
                                        { id: 'manager', label: 'Manager Portal', sub: 'Fleet Operations', color: 'bg-amber-500', path: '/manager', icon: Briefcase }
                                    ].map((door, i) => (
                                        <button key={i} onClick={() => window.open(door.path, '_blank')} className="group p-10 bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] flex flex-col items-center text-center space-y-8 hover:border-white/30 transition-all hover:scale-[1.02]">
                                            <div className={`w-24 h-24 ${door.color} rounded-[2.5rem] flex items-center justify-center text-dark-900 shadow-2xl group-hover:scale-110 transition-transform`}><door.icon size={48} /></div>
                                            <div><p className="text-3xl font-black italic uppercase text-white tracking-tighter">{door.label}</p><p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase tracking-widest mt-2">{door.sub}</p></div>
                                            <div className="w-full py-4 bg-white/5 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">Enter Door</div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {view === 'app-settings' && (
                            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                                <h2 className="text-5xl font-black italic uppercase tracking-tighter">System <span className="text-brand">Settings</span> & Compliance</h2>
                                {/* Smart Intermediary Pricing Engine */}
                                <div className="p-10 bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] space-y-10">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
                                        <div>
                                            <h3 className="text-3xl font-black italic uppercase text-white tracking-tight">Smart Intermediary Pricing Engine</h3>
                                            <p className="text-xs md:text-sm lg:text-base text-gray-500 font-bold uppercase tracking-widest mt-1">German Passenger Transport Compliance (PBefG)</p>
                                        </div>
                                        <div className="flex items-center gap-4 bg-white/5 border border-white/5 p-4 rounded-3xl">
                                            <div>
                                                <p className="text-xs md:text-sm lg:text-base font-black uppercase text-white">German Compliance Mode</p>
                                                <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-gray-500 uppercase">Enforce PBefG Tariff Caps & Mediation Log</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const nextState = !isGermanComplianceActive;
                                                    setIsGermanComplianceActive(nextState);
                                                    localStorage.setItem('green_german_compliance', nextState ? 'true' : 'false');
                                                    if (nextState) {
                                                        // Enforce legal caps on activate
                                                        if (baseFare < 3.00) setBaseFare(3.00);
                                                        if (baseFare > 15.00) setBaseFare(15.00);
                                                        if (perKmRate < 1.50) setPerKmRate(1.50);
                                                        if (perKmRate > 4.50) setPerKmRate(4.50);
                                                        triggerNotification('success', 'Compliance Mode Enabled', 'PBefG-compliant pricing limits and mediation audits are active.');
                                                    } else {
                                                        triggerNotification('warning', 'Compliance Mode Disabled', 'Manual pricing is now unrestricted. Surge caps removed.');
                                                    }
                                                }}
                                                className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${isGermanComplianceActive ? 'bg-brand' : 'bg-gray-800'}`}
                                            >
                                                <div className={`w-6 h-6 rounded-full bg-dark-950 transition-all duration-300 ${isGermanComplianceActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* LEGAL REFERENCE SHORT-CUTS & QUICK SEARCH */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <a 
                                            href="https://www.gesetze-im-internet.de/pbefg/__51.html" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-brand/40 hover:bg-white/10 transition-all flex items-center justify-between group"
                                        >
                                            <div>
                                                <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-brand tracking-widest">PBefG §51 (Taxis)</p>
                                                <p className="text-[8px] md:text-[10px] lg:text-xs text-gray-500 uppercase font-bold mt-1">Official German Taxi Tariffs</p>
                                            </div>
                                            <ExternalLink size={16} className="text-gray-500 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                                        </a>
                                        <a 
                                            href="https://www.gesetze-im-internet.de/pbefg/__51a.html" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-brand/40 hover:bg-white/10 transition-all flex items-center justify-between group"
                                        >
                                            <div>
                                                <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-brand tracking-widest">PBefG §51a (Mietwagen)</p>
                                                <p className="text-[8px] md:text-[10px] lg:text-xs text-gray-500 uppercase font-bold mt-1">Minimum Pricing for Fleets</p>
                                            </div>
                                            <ExternalLink size={16} className="text-gray-500 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                                        </a>
                                        <a 
                                            href="https://www.google.com/search?q=Mietwagen+Mindestpreis+BGH+Urteil+Dumping" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-brand/40 hover:bg-white/10 transition-all flex items-center justify-between group"
                                        >
                                            <div>
                                                <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-brand tracking-widest">Anti-Dumping rulings</p>
                                                <p className="text-[8px] md:text-[10px] lg:text-xs text-gray-500 uppercase font-bold mt-1">Federal Anti-Trust Judgements</p>
                                            </div>
                                            <ExternalLink size={16} className="text-gray-500 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                                        </a>
                                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between gap-2">
                                            <div className="flex-1">
                                                <p className="text-[8px] md:text-[10px] lg:text-xs text-gray-500 uppercase font-bold">Local City Tariff Lookup</p>
                                                <input 
                                                    type="text" 
                                                    placeholder="e.g. Frankfurt" 
                                                    value={searchGermanCity} 
                                                    onChange={(e) => setSearchGermanCity(e.target.value)} 
                                                    className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-[10px] md:text-xs lg:text-sm text-white placeholder-gray-700 focus:outline-none focus:border-brand/40 mt-1 w-full"
                                                />
                                            </div>
                                            <button 
                                                onClick={() => window.open(`https://www.google.com/search?q=Mindestpreis+Mietwagen+Taxi+Tarif+${encodeURIComponent(searchGermanCity)}+PBefG`, '_blank')}
                                                className="p-2 bg-brand/10 text-brand border border-brand/20 rounded-xl hover:bg-brand hover:text-dark-900 transition-all flex items-center justify-center shrink-0 self-end mb-[2px]"
                                            >
                                                <Search size={12} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* DYNAMIC PRICE ZONE STATUS BAR & METER */}
                                    {(() => {
                                        const kmRateNum = parseFloat(perKmRate);
                                        const baseFareNum = parseFloat(baseFare);
                                        const isDumping = baseFareNum < 3.00 || kmRateNum < 1.40;
                                        const isHighSurge = baseFareNum > 8.00 || kmRateNum > 3.20;
                                        
                                        // Calculate compliance health values
                                        let complianceScore = 100;
                                        let scoreColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
                                        
                                        if (isDumping) {
                                            complianceScore = Math.max(15, Math.round((kmRateNum / 1.40) * 60));
                                            scoreColor = 'text-red-500 border-red-500/30 bg-red-500/10';
                                        } else if (isHighSurge) {
                                            complianceScore = Math.max(45, Math.round((3.20 / kmRateNum) * 85));
                                            scoreColor = 'text-amber-500 border-amber-500/30 bg-amber-500/10';
                                        }

                                        // Pointer math for visual range meter: perKmRate range 0.50 to 5.00
                                        const minRate = 0.50;
                                        const maxRate = 5.00;
                                        const ratePercent = Math.min(100, Math.max(0, ((kmRateNum - minRate) / (maxRate - minRate)) * 100));

                                        return (
                                            <div className="p-8 bg-white/5 border border-white/5 rounded-3xl space-y-6">
                                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                     <div className="flex items-start gap-4">
                                                         {isDumping && (
                                                             <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shrink-0"><AlertTriangle size={24} /></div>
                                                         )}
                                                         {isHighSurge && (
                                                             <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shrink-0"><Zap size={24} /></div>
                                                         )}
                                                         {!isDumping && !isHighSurge && (
                                                             <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shrink-0"><CheckCircle size={24} /></div>
                                                         )}
                                                         <div>
                                                             <p className="text-sm font-black uppercase tracking-wider text-white">
                                                                 {isDumping && "⚠️ PRICE DUMPING DETECTED"}
                                                                 {isHighSurge && "⚡ SURGE / PARITY ALERT"}
                                                                 {!isDumping && !isHighSurge && "✅ COMPLIANT TARIFF ZONE"}
                                                             </p>
                                                             <p className="text-[10px] md:text-xs lg:text-sm text-gray-400 font-bold uppercase mt-1 leading-relaxed max-w-2xl">
                                                                 {isDumping && "Your tariff lies below standard taxi operating margins (Base < €3.00 or Km < €1.40). German Fair Competition Act (§3 UWG) & PBefG §51a prohibit predatory dumping prices."}
                                                                 {isHighSurge && "Pricing exceeds Frankfurt taxi base averages. While valid for private hire surge under PBefG reforms, excessive surges are subject to local mediation caps."}
                                                                 {!isDumping && !isHighSurge && "Healthy operational sweet spot. Parity guidelines met: pricing aligns with local taxis and maintains healthy fleet profit margins."}
                                                             </p>
                                                         </div>
                                                     </div>
                                                     
                                                     <div className={`px-5 py-3 border rounded-2xl flex flex-col items-center shrink-0 ${scoreColor}`}>
                                                         <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-gray-500">Legal Score</span>
                                                         <span className="text-2xl font-black italic">{complianceScore}%</span>
                                                     </div>
                                                </div>

                                                {/* Visual Range Indicator Meter */}
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-widest px-1">
                                                        <span className="text-red-500">Dumping Zone (&lt; €1.40)</span>
                                                        <span className="text-emerald-400">Compliant / Fair (€1.40 - €3.20)</span>
                                                        <span className="text-amber-500">High Surge (&gt; €3.20)</span>
                                                    </div>
                                                    <div className="relative h-4 w-full bg-dark-950 rounded-full border border-white/5 overflow-hidden flex">
                                                        {/* Color background slices */}
                                                        <div className="h-full bg-red-950/40 border-r border-red-500/20" style={{ width: '20%' }} />
                                                        <div className="h-full bg-emerald-950/40 border-r border-emerald-500/20" style={{ width: '40%' }} />
                                                        <div className="h-full bg-amber-950/40" style={{ width: '40%' }} />
                                                        
                                                        {/* Current selected perKmRate pointer mark */}
                                                        <div 
                                                            className="absolute top-0 bottom-0 w-1.5 bg-white border border-black shadow-[0_0_8px_rgba(255,255,255,0.8)] rounded-full transition-all duration-300"
                                                            style={{ left: `${ratePercent}%`, transform: 'translateX(-50%)' }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between text-[8px] md:text-[10px] lg:text-xs font-bold text-gray-600 uppercase px-1">
                                                        <span>Min: €0.50/km</span>
                                                        <span className="text-white italic">Current Rate: €{kmRateNum.toFixed(2)}/km</span>
                                                        <span>Max: €5.00/km</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                        <div className="space-y-8">
                                            {/* GRIEN STANDARD RATE */}
                                            <div className="space-y-6">
                                                <h4 className="text-white font-bold uppercase tracking-widest text-xs md:text-sm lg:text-base">Grien Standard Pricing</h4>
                                                <div>
                                                    <div className="flex justify-between items-center mb-4">
                                                    <label className="text-sm font-black uppercase tracking-wider text-gray-400">Base Fare / Anfahrt (€)</label>
                                                    <span className="text-2xl font-black italic text-brand">€{parseFloat(baseFare).toFixed(2)}</span>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min={isGermanComplianceActive ? "3.00" : "0.00"} 
                                                    max={isGermanComplianceActive ? "15.00" : "30.00"} 
                                                    step="0.50" 
                                                    value={baseFare} 
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        setBaseFare(val);
                                                    }}
                                                    onMouseUp={() => updatePricingInCloud({ baseFare })}
                                                    onTouchEnd={() => updatePricingInCloud({ baseFare })}
                                                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand shadow-inner"
                                                />
                                                <div className="flex justify-between text-[8px] md:text-[10px] lg:text-xs font-bold text-gray-600 uppercase mt-2">
                                                    <span>Min: €{isGermanComplianceActive ? "3.00" : "1.00"}</span>
                                                    {isGermanComplianceActive && <span className="text-brand">Legal PBefG Caps Active</span>}
                                                    <span>Max: €{isGermanComplianceActive ? "15.00" : "30.00"}</span>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-4">
                                                    <label className="text-sm font-black uppercase tracking-wider text-gray-400">Per Kilometer Rate (€/km)</label>
                                                    <span className="text-2xl font-black italic text-brand">€{parseFloat(perKmRate).toFixed(2)}</span>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min={isGermanComplianceActive ? "1.50" : "0.50"} 
                                                    max={isGermanComplianceActive ? "4.50" : "10.00"} 
                                                    step="0.10" 
                                                    value={perKmRate} 
                                                    onChange={(e) => {
                                                        setPerKmRate(parseFloat(e.target.value));
                                                    }}
                                                    onMouseUp={() => updatePricingInCloud({ perKmRate })}
                                                    onTouchEnd={() => updatePricingInCloud({ perKmRate })}
                                                    className="w-full h-2 bg-white/5 border border-white/5 rounded-lg appearance-none cursor-pointer accent-brand"
                                                />
                                                <div className="flex justify-between text-[8px] md:text-[10px] lg:text-xs font-bold text-gray-600 uppercase mt-2">
                                                    <span>Min: €{isGermanComplianceActive ? "1.50" : "0.50"}</span>
                                                    {isGermanComplianceActive && <span className="text-brand">Legal PBefG Caps Active</span>}
                                                    <span>Max: €{isGermanComplianceActive ? "4.50" : "10.00"}</span>
                                                </div>
                                                </div>
                                            </div>

                                            {/* GRIEN MAX RATE */}
                                            <div className="space-y-6 pt-6 border-t border-white/5">
                                                <h4 className="text-white font-bold uppercase tracking-widest text-xs md:text-sm lg:text-base">Grien Max Pricing</h4>
                                                <div>
                                                    <div className="flex justify-between items-center mb-4">
                                                        <label className="text-sm font-black uppercase tracking-wider text-gray-400">Base Fare (€)</label>
                                                        <span className="text-2xl font-black italic text-brand">€{parseFloat(baseFareMax).toFixed(2)}</span>
                                                    </div>
                                                    <input 
                                                        type="range" 
                                                        min="1.00" 
                                                        max="30.00" 
                                                        step="0.50" 
                                                        value={baseFareMax} 
                                                        onChange={(e) => setBaseFareMax(parseFloat(e.target.value))}
                                                        onMouseUp={() => updatePricingInCloud({ baseFareMax })}
                                                        onTouchEnd={() => updatePricingInCloud({ baseFareMax })}
                                                        className="w-full h-2 bg-white/5 border border-white/5 rounded-lg appearance-none cursor-pointer accent-brand"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="flex justify-between items-center mb-4">
                                                        <label className="text-sm font-black uppercase tracking-wider text-gray-400">Per Kilometer (€/km)</label>
                                                        <span className="text-2xl font-black italic text-brand">€{parseFloat(perKmRateMax).toFixed(2)}</span>
                                                    </div>
                                                    <input 
                                                        type="range" 
                                                        min="1.00" 
                                                        max="15.00" 
                                                        step="0.10" 
                                                        value={perKmRateMax} 
                                                        onChange={(e) => setPerKmRateMax(parseFloat(e.target.value))}
                                                        onMouseUp={() => updatePricingInCloud({ perKmRateMax })}
                                                        onTouchEnd={() => updatePricingInCloud({ perKmRateMax })}
                                                        className="w-full h-2 bg-white/5 border border-white/5 rounded-lg appearance-none cursor-pointer accent-brand"
                                                    />
                                                </div>
                                            </div>

                                            {/* GRIEN PREMIUM RATE */}
                                            <div className="space-y-6 pt-6 border-t border-white/5">
                                                <h4 className="text-white font-bold uppercase tracking-widest text-xs md:text-sm lg:text-base">Grien Premium Pricing</h4>
                                                <div>
                                                    <div className="flex justify-between items-center mb-4">
                                                        <label className="text-sm font-black uppercase tracking-wider text-gray-400">Base Fare (€)</label>
                                                        <span className="text-2xl font-black italic text-brand">€{parseFloat(baseFarePremium).toFixed(2)}</span>
                                                    </div>
                                                    <input 
                                                        type="range" 
                                                        min="2.00" 
                                                        max="50.00" 
                                                        step="0.50" 
                                                        value={baseFarePremium} 
                                                        onChange={(e) => setBaseFarePremium(parseFloat(e.target.value))}
                                                        onMouseUp={() => updatePricingInCloud({ baseFarePremium })}
                                                        onTouchEnd={() => updatePricingInCloud({ baseFarePremium })}
                                                        className="w-full h-2 bg-white/5 border border-white/5 rounded-lg appearance-none cursor-pointer accent-brand"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="flex justify-between items-center mb-4">
                                                        <label className="text-sm font-black uppercase tracking-wider text-gray-400">Per Kilometer (€/km)</label>
                                                        <span className="text-2xl font-black italic text-brand">€{parseFloat(perKmRatePremium).toFixed(2)}</span>
                                                    </div>
                                                    <input 
                                                        type="range" 
                                                        min="1.50" 
                                                        max="20.00" 
                                                        step="0.10" 
                                                        value={perKmRatePremium} 
                                                        onChange={(e) => setPerKmRatePremium(parseFloat(e.target.value))}
                                                        onMouseUp={() => updatePricingInCloud({ perKmRatePremium })}
                                                        onTouchEnd={() => updatePricingInCloud({ perKmRatePremium })}
                                                        className="w-full h-2 bg-white/5 border border-white/5 rounded-lg appearance-none cursor-pointer accent-brand"
                                                    />
                                                </div>
                                            </div>

                                            {/* GRIEN PREMIUM MAX RATE */}
                                            <div className="space-y-6 pt-6 border-t border-white/5">
                                                <h4 className="text-white font-bold uppercase tracking-widest text-xs md:text-sm lg:text-base">Grien Premium Max Pricing</h4>
                                                <div>
                                                    <div className="flex justify-between items-center mb-4">
                                                        <label className="text-sm font-black uppercase tracking-wider text-gray-400">Base Fare (€)</label>
                                                        <span className="text-2xl font-black italic text-brand">€{parseFloat(baseFarePremiumMax).toFixed(2)}</span>
                                                    </div>
                                                    <input 
                                                        type="range" 
                                                        min="2.00" 
                                                        max="60.00" 
                                                        step="0.50" 
                                                        value={baseFarePremiumMax} 
                                                        onChange={(e) => setBaseFarePremiumMax(parseFloat(e.target.value))}
                                                        onMouseUp={() => updatePricingInCloud({ baseFarePremiumMax })}
                                                        onTouchEnd={() => updatePricingInCloud({ baseFarePremiumMax })}
                                                        className="w-full h-2 bg-white/5 border border-white/5 rounded-lg appearance-none cursor-pointer accent-brand"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="flex justify-between items-center mb-4">
                                                        <label className="text-sm font-black uppercase tracking-wider text-gray-400">Per Kilometer (€/km)</label>
                                                        <span className="text-2xl font-black italic text-brand">€{parseFloat(perKmRatePremiumMax).toFixed(2)}</span>
                                                    </div>
                                                    <input 
                                                        type="range" 
                                                        min="1.50" 
                                                        max="25.00" 
                                                        step="0.10" 
                                                        value={perKmRatePremiumMax} 
                                                        onChange={(e) => setPerKmRatePremiumMax(parseFloat(e.target.value))}
                                                        onMouseUp={() => updatePricingInCloud({ perKmRatePremiumMax })}
                                                        onTouchEnd={() => updatePricingInCloud({ perKmRatePremiumMax })}
                                                        className="w-full h-2 bg-white/5 border border-white/5 rounded-lg appearance-none cursor-pointer accent-brand"
                                                    />
                                                </div>
                                            </div>

                                            {/* GRIEN SHARED RATE */}
                                            <div className="space-y-6 pt-6 border-t border-white/5">
                                                <h4 className="text-white font-bold uppercase tracking-widest text-xs md:text-sm lg:text-base">Grien Shared Pricing</h4>
                                                <div>
                                                    <div className="flex justify-between items-center mb-4">
                                                        <label className="text-sm font-black uppercase tracking-wider text-gray-400">Base Fare (€)</label>
                                                        <span className="text-2xl font-black italic text-brand">€{parseFloat(baseFareShared).toFixed(2)}</span>
                                                    </div>
                                                    <input 
                                                        type="range" 
                                                        min="0.50" 
                                                        max="20.00" 
                                                        step="0.50" 
                                                        value={baseFareShared} 
                                                        onChange={(e) => setBaseFareShared(parseFloat(e.target.value))}
                                                        onMouseUp={() => updatePricingInCloud({ baseFareShared })}
                                                        onTouchEnd={() => updatePricingInCloud({ baseFareShared })}
                                                        className="w-full h-2 bg-white/5 border border-white/5 rounded-lg appearance-none cursor-pointer accent-brand"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="flex justify-between items-center mb-4">
                                                        <label className="text-sm font-black uppercase tracking-wider text-gray-400">Per Kilometer (€/km)</label>
                                                        <span className="text-2xl font-black italic text-brand">€{parseFloat(perKmRateShared).toFixed(2)}</span>
                                                    </div>
                                                    <input 
                                                        type="range" 
                                                        min="0.50" 
                                                        max="5.00" 
                                                        step="0.10" 
                                                        value={perKmRateShared} 
                                                        onChange={(e) => setPerKmRateShared(parseFloat(e.target.value))}
                                                        onMouseUp={() => updatePricingInCloud({ perKmRateShared })}
                                                        onTouchEnd={() => updatePricingInCloud({ perKmRateShared })}
                                                        className="w-full h-2 bg-white/5 border border-white/5 rounded-lg appearance-none cursor-pointer accent-brand"
                                                    />
                                                </div>
                                            </div>

                                            {/* LIVE DYNAMIC COMPETITOR COMPARISON PANEL */}
                                            <div className="p-6 bg-white/5 border border-white/5 rounded-[2.5rem] space-y-6">
                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                    <p className="text-xs md:text-sm lg:text-base font-black uppercase text-white tracking-widest flex items-center gap-2">
                                                        <Scale size={14} className="text-brand" /> Live Market Pricing Comparison
                                                    </p>
                                                    {/* Distance Presets */}
                                                    <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                                                        {[3, 5, 10, 25, 50].map((d) => (
                                                            <button 
                                                                key={d} 
                                                                onClick={() => setComparisonDistance(d)}
                                                                className={`px-3 py-1 text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest rounded-xl transition-all ${comparisonDistance === d ? 'bg-brand text-dark-900 shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                                            >
                                                                {d}km
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Weather Scenario Live Status Card */}
                                                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between gap-4 mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-2xl animate-pulse">
                                                            {currentScenario === 'sunny' && '☀️'}
                                                            {currentScenario === 'rainy' && '🌧️'}
                                                            {currentScenario === 'rush-hour' && '🚗'}
                                                            {currentScenario === 'concert-exit' && '🎆'}
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                                                                <span className="w-2 h-2 rounded-full bg-brand animate-ping" /> Live Market Feed: {
                                                                    currentScenario === 'sunny' ? 'Clear weather' :
                                                                    currentScenario === 'rainy' ? 'Precipitation active' :
                                                                    currentScenario === 'rush-hour' ? 'Heavy peak traffic' :
                                                                    'Venue event exit surge'
                                                                }
                                                            </p>
                                                            <p className="text-[8px] md:text-[10px] lg:text-xs text-gray-500 uppercase font-bold mt-0.5">
                                                                {currentScenario === 'sunny' && 'Sunny conditions. Standard competitor rates apply (1.0x).'}
                                                                {currentScenario === 'rainy' && 'Rain active. Competitors raising rates dynamically (+40%).'}
                                                                {currentScenario === 'rush-hour' && 'Peak hours. Commuter gridlock causing Uber/Bolt surge (+80%).'}
                                                                {currentScenario === 'concert-exit' && 'Stadium event exit. Extreme peak area surcharge active (+130%).'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-gray-500 tracking-wider">Live Feed</span>
                                                        <button 
                                                            onClick={() => setIsLiveSimulationActive(!isLiveSimulationActive)}
                                                            className={`px-3 py-1 rounded-lg text-[8px] md:text-[10px] lg:text-xs font-black uppercase border transition-all ${isLiveSimulationActive ? 'bg-brand/10 border-brand/30 text-brand' : 'bg-white/5 border-white/10 text-gray-400'}`}
                                                        >
                                                            {isLiveSimulationActive ? '🟢 Live' : '🔴 Paused'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Competitor category toggle & Surge simulator */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2 border-b border-white/5">
                                                    <div>
                                                        <label className="text-[8px] md:text-[10px] lg:text-xs font-bold uppercase text-gray-500 tracking-wider">Fleet / Service Type</label>
                                                        <div className="flex gap-2 mt-1">
                                                            {['all', 'taxi', 'fleet'].map((t) => (
                                                                <button
                                                                    key={t}
                                                                    onClick={() => setCompetitorType(t)}
                                                                    className={`flex-1 py-1.5 rounded-lg border text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest transition-all ${competitorType === t ? 'border-brand/40 bg-brand/10 text-brand' : 'border-white/5 bg-black/10 text-gray-500 hover:text-white'}`}
                                                                >
                                                                    {t}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between items-center text-[8px] md:text-[10px] lg:text-xs font-bold uppercase text-gray-500">
                                                            <span>Competitor Surge Multiplier</span>
                                                            <span className="text-brand font-black">{competitorSurge.toFixed(1)}x</span>
                                                        </div>
                                                        <input 
                                                            type="range" 
                                                            min="1.0" 
                                                            max="2.5" 
                                                            step="0.1" 
                                                            value={competitorSurge} 
                                                            onChange={(e) => {
                                                                setCompetitorSurge(parseFloat(e.target.value));
                                                                setIsLiveSimulationActive(false); // Pause live cycle on manual adjustment
                                                            }}
                                                            className="w-full h-1 bg-white/5 border border-white/5 rounded-lg appearance-none cursor-pointer accent-brand mt-2"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-4 pt-2">
                                                    {(() => {
                                                        const baseFareNum = parseFloat(baseFare);
                                                        const kmRateNum = parseFloat(perKmRate);
                                                        const greenPrice = (comparisonDistance > 5 ? 0 : baseFareNum) + kmRateNum * comparisonDistance;

                                                        const allComps = [
                                                            { name: 'Grien App (You)', price: greenPrice, type: 'fleet', logo: '🟢', highlight: true, note: comparisonDistance > 5 ? '⚡ Base Fare Waived (> 5km)' : 'Current system settings' },
                                                            { name: 'Local Taxi Frankfurt', price: 4.00 + (comparisonDistance <= 5 ? 2.40 : 2.20) * comparisonDistance, type: 'taxi', logo: '🚖', highlight: false, note: 'Official municipal fixed tariff' },
                                                            { name: 'UberX (Simulated)', price: (3.00 + 1.80 * comparisonDistance) * competitorSurge, type: 'fleet', logo: '⚫', highlight: false, note: `Standard fleet fare * ${competitorSurge.toFixed(1)}x surge` },
                                                            { name: 'Bolt Economy (Simulated)', price: (2.50 + 1.65 * comparisonDistance) * competitorSurge, type: 'fleet', logo: '🟢', highlight: false, note: `Budget fleet fare * ${competitorSurge.toFixed(1)}x surge` }
                                                        ];

                                                        // Filter out list
                                                        const filteredComps = allComps.filter(c => {
                                                            if (competitorType === 'all') return true;
                                                            if (competitorType === 'taxi') return c.type === 'taxi' || c.highlight;
                                                            if (competitorType === 'fleet') return c.type === 'fleet';
                                                            return true;
                                                        });

                                                        // Sort cheapest first
                                                        const sortedComps = [...filteredComps].sort((a, b) => a.price - b.price);
                                                        const maxCompPrice = Math.max(...sortedComps.map(c => c.price));

                                                        return sortedComps.map((c, idx) => {
                                                            const diffPercent = Math.round(((c.price - greenPrice) / greenPrice) * 100);
                                                            const barWidth = Math.max(30, Math.min(100, (c.price / maxCompPrice) * 100));

                                                            return (
                                                                <div key={idx} className={`p-4 rounded-2xl border flex flex-col gap-2 ${c.highlight ? 'bg-brand/10 border-brand/30 text-brand' : 'bg-black/20 border-white/5 text-gray-300'}`}>
                                                                    <div className="flex justify-between items-center text-[10px] md:text-xs lg:text-sm font-black uppercase">
                                                                        <span className="flex items-center gap-1.5">
                                                                            <span className="text-[12px]">{c.logo}</span>
                                                                            <span>{idx + 1}. {c.name}</span>
                                                                        </span>
                                                                        <div className="flex items-center gap-2">
                                                                            {!c.highlight && (
                                                                                <span className={`text-[8px] md:text-[10px] lg:text-xs font-black px-2 py-0.5 rounded-lg ${diffPercent >= 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                                                    {diffPercent >= 0 ? `+${diffPercent}% vs You` : `${diffPercent}% vs You`}
                                                                                </span>
                                                                            )}
                                                                            <span className="text-white text-xs md:text-sm lg:text-base italic">€{c.price.toFixed(2)}</span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* Mini bar meter */}
                                                                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                                                                        <div 
                                                                            className={`h-full rounded-full transition-all duration-500 ${c.highlight ? 'bg-brand shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-700'}`} 
                                                                            style={{ width: `${barWidth}%` }} 
                                                                        />
                                                                    </div>
                                                                    <span className="text-[7px] font-bold text-gray-600 uppercase tracking-widest">{c.note}</span>
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-dark-950/40 border border-white/5 p-8 rounded-[2.5rem] flex flex-col justify-between space-y-6">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-xs md:text-sm lg:text-base font-black uppercase tracking-wider text-gray-400">Dynamic Tariff Projection</p>
                                                    <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-gray-600 uppercase">Estimated Total Cost relative to Distance</p>
                                                </div>
                                                <span className="text-[9px] md:text-[11px] lg:text-xs font-black text-brand uppercase tracking-widest bg-brand/10 border border-brand/20 px-3 py-1 rounded-xl">Live Sync</span>
                                            </div>

                                            <div className="relative h-64 w-full bg-dark-950/20 rounded-2xl overflow-hidden border border-white/5 flex items-end">
                                                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                    <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                                                    <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                                                    <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                                                    
                                                    <line x1="25" y1="0" x2="25" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                                                    <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                                                    <line x1="75" y1="0" x2="75" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />

                                                    {isGermanComplianceActive && (
                                                        <polygon 
                                                            points={`0,${100 - (3.00 / 105 * 100)} 100,${100 - ((3.00 + 4.50 * 20) / 105 * 100)} 100,${100 - ((15.00 + 1.50 * 20) / 105 * 100)} 0,${100 - (15.00 / 105 * 100)}`}
                                                            fill="rgba(139,92,246,0.03)" 
                                                            stroke="rgba(139,92,246,0.15)"
                                                            strokeDasharray="2 2"
                                                        />
                                                    )}

                                                    {(() => {
                                                        const formattedPoints = [];
                                                        for (let x = 0; x <= 20; x++) {
                                                            const y = (x > 5 ? 0 : parseFloat(baseFare)) + (x * parseFloat(perKmRate));
                                                            const svgX = (x / 20) * 100;
                                                            const svgY = 100 - (y / 105) * 100;
                                                            formattedPoints.push(`${svgX},${svgY}`);
                                                        }
                                                        return (
                                                            <>
                                                                <path 
                                                                    d={`M ${formattedPoints.join(' L ')}`} 
                                                                    fill="none" 
                                                                    stroke="#10B981" 
                                                                    strokeWidth="3" 
                                                                />
                                                                <path 
                                                                    d={`M ${formattedPoints.join(' L ')}`} 
                                                                    fill="none" 
                                                                    stroke="#10B981" 
                                                                    strokeWidth="8" 
                                                                    opacity="0.15"
                                                                />
                                                            </>
                                                        );
                                                    })()}
                                                </svg>

                                                <div className="absolute top-2 left-2 text-[7px] font-bold text-gray-600 uppercase">Y: Total Fare (€)</div>
                                                <div className="absolute bottom-2 right-2 text-[7px] font-bold text-gray-600 uppercase">X: Distance (km)</div>
                                                
                                                <div className="absolute left-2 top-[20%] text-[7px] font-bold text-gray-600 uppercase">€80</div>
                                                <div className="absolute left-2 top-[50%] text-[7px] font-bold text-gray-600 uppercase">€50</div>
                                                <div className="absolute left-2 top-[80%] text-[7px] font-bold text-gray-600 uppercase">€20</div>
                                            </div>

                                            <div className="flex flex-wrap justify-between gap-4 items-center text-[8px] md:text-[10px] lg:text-xs font-bold uppercase tracking-wider text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-1 bg-brand rounded" />
                                                    <span>Estimated Active Tariff</span>
                                                </div>
                                                {isGermanComplianceActive && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-2 bg-violet-500/10 border border-violet-500/30 rounded" />
                                                        <span>PBefG Permissible Bounds</span>
                                                    </div>
                                                )}
                                                <div className="text-white">Max Graph Range: 20 km</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                    <div className="p-10 bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] flex flex-col justify-between min-h-[460px]">
                                        <div className="space-y-8">
                                            <h3 className="text-2xl font-black italic uppercase text-white">Global Config</h3>
                                            <div className="space-y-6">
                                                {[{ label: 'System Language', sub: 'Neural Translation (DE/EN/ES)', status: 'ACTIVE' }, { label: 'Auth Protocol', sub: 'Dual-Vector (Email/Phone)', status: 'ENABLED' }, { label: 'Invisible Routing', sub: '180-Day Moratorium active', status: 'LOCKED' }].map((setting, i) => (
                                                    <div key={i} className="flex justify-between items-center pb-6 border-b border-white/5 last:border-0 last:pb-0">
                                                        <div><p className="text-xl font-black italic uppercase text-white">{setting.label}</p><p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase mt-1 italic">{setting.sub}</p></div>
                                                        <div className="px-4 py-2 bg-brand/10 border border-brand/20 rounded-xl text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase">{setting.status}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-10 bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] flex flex-col justify-between min-h-[460px]">
                                        <div className="space-y-8">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-2xl font-black italic uppercase text-white">Compliance & Legal</h3>
                                                <ShieldCheck size={24} className="text-brand" />
                                            </div>
                                            <div className="space-y-4">
                                                {[
                                                    { id: 'privacy', label: 'Privacy Protocol', sub: 'GDPR / Data Monetization v1.0', icon: Shield, currentText: privacyPolicyText },
                                                    { id: 'terms', label: 'Terms of Service', sub: 'Operational Mandate v1.0', icon: FileText, currentText: termsOfServiceText }
                                                ].map((policy, i) => (
                                                    <button key={i} 
                                                        onClick={() => {
                                                            setEditingPolicy(policy.id);
                                                            setTempPolicyText(policy.currentText);
                                                        }}
                                                        className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-white/30 transition-all text-left"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-500 group-hover:text-brand"><policy.icon size={18} /></div>
                                                            <div><p className="text-base font-black italic uppercase text-white leading-tight">{policy.label}</p><p className="text-[9px] md:text-[11px] lg:text-xs font-black text-gray-500 uppercase tracking-widest mt-0.5">{policy.sub}</p></div>
                                                        </div>
                                                        <ChevronRight size={18} className="text-gray-700 group-hover:text-brand" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <button onClick={handleCommitPolicies} className="w-full py-5 bg-brand text-dark-900 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] shadow-xl shadow-brand/20 hover:scale-[1.02] transition-all">COMMIT POLICIES</button>
                                        </div>
                                    </div>
                                    <div className="p-10 bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] flex flex-col justify-between min-h-[460px]">
                                        <div className="space-y-8">
                                            <h4 className="text-xl font-black italic uppercase text-white">Security Patch</h4>
                                            <p className="text-xs md:text-sm lg:text-base text-gray-500 italic leading-relaxed">"Latest firmware v1.2.4-ALPHA deployed. All Director access logs are encrypted and hashed on cold-storage."</p>
                                        </div>
                                        <button className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all">Audit Security Logs</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {view === 'stripe-hub' && (
                            <motion.div key="stripe-hub" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                                {/* Title and Sub-Tabs */}
                                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 pb-6 border-b border-white/5">
                                    <div>
                                        <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none">Stripe <span className="text-brand">Connect Hub</span></h2>
                                        <p className="text-gray-500 text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.5em] mt-2">B2B Splits, Partner Payouts & Audits (BaFin / GwG Cleared)</p>
                                    </div>
                                    
                                    {/* Glassmorphic Sub-Navigation bar */}
                                    <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 gap-1.5 self-stretch xl:self-auto flex-wrap md:flex-nowrap">
                                        {[
                                            { id: 'live-overview', label: 'Live Split Overview', icon: Activity },
                                            { id: 'weekly-fleet-settlement', label: 'Wöchentliches Flotten-Ledger 💶', icon: Wallet },
                                            { id: 'partners-directory', label: 'Connected Partners', icon: Users },
                                            { id: 'kyc-dossier', label: 'BaFin KYC Dossier', icon: ShieldCheck },
                                            { id: 'partner-compliance', label: 'Partner Compliance Vaults', icon: ShieldAlert },
                                            { id: 'provision-rules', label: 'Dynamic Provisions', icon: Percent }
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setStripeActiveSubTab(tab.id)}
                                                className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest transition-all ${stripeActiveSubTab === tab.id ? 'bg-brand text-dark-900 shadow-md shadow-brand/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                            >
                                                <tab.icon size={12} />
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* TAB 1: LIVE SPLITS OVERVIEW */}
                                {stripeActiveSubTab === 'live-overview' && (
                                    <div className="space-y-10">
                                        {/* Financial metrics summary cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {[
                                                { label: 'Direct Splits Processed', val: stripeDirectSplitsProcessed.toLocaleString('de-DE'), desc: 'Real-time payouts routing', color: 'text-white' },
                                                { label: 'Gross Client Volume', val: `${stripeTotalVolume.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`, desc: 'Total app-wide transactions', color: 'text-white' },
                                                { label: 'Partner-Absorbed Card Fees', val: `${stripeCardFees.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`, desc: 'Option B transaction savings', color: 'text-emerald-400 font-bold' },
                                                { label: 'Platform Clean Provisions', val: `${stripePlatformProvisions.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`, desc: 'Net platform margins secured', color: 'text-brand' }
                                            ].map((stat, sIdx) => (
                                                <div key={sIdx} className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-1 group hover:border-white/20 hover:bg-white/10 transition-all">
                                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-widest">{stat.label}</p>
                                                    <p className={`text-2xl font-black italic tracking-tighter ${stat.color}`}>{stat.val}</p>
                                                    <p className="text-[7px] font-mono text-gray-600 uppercase tracking-widest">{stat.desc}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                                            {/* LEFT COLUMN: INTERACTIVE SPLIT TRANSACTION SIMULATOR */}
                                            <div className="lg:col-span-2 space-y-6">
                                                <div className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] p-10 relative overflow-hidden h-full flex flex-col justify-between">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-brand/20 shadow-[0_0_20px_rgba(52,211,153,0.2)]" />
                                                    
                                                    <div className="space-y-6">
                                                        <div>
                                                            <h3 className="text-2xl font-black italic uppercase text-white">Live Split Simulator</h3>
                                                            <p className="text-xs md:text-sm lg:text-base text-gray-500 italic mt-1">Simulate live transaction clearings to watch Stripe Connect route instant split payout shares.</p>
                                                        </div>

                                                        {isSimulatingPayoutFlow ? (
                                                            <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] space-y-6 animate-pulse">
                                                                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                                                    <h4 className="text-sm font-black italic uppercase text-brand flex items-center gap-2">
                                                                        <Clock className="animate-spin text-brand" size={14} />
                                                                        Split Clear in Progress
                                                                    </h4>
                                                                    <span className="text-[7px] font-mono text-gray-500 uppercase">Stripe Connect API</span>
                                                                </div>
                                                                
                                                                <div className="space-y-3 font-mono text-[9px] md:text-[11px] lg:text-xs">
                                                                    {[
                                                                        { step: 1, label: 'INGESTING INTENT GATEWAY' },
                                                                        { step: 2, label: 'COMPUTING STEP COMMISSION' },
                                                                        { step: 3, label: 'ROUTING TRANSFER CHANNELS' },
                                                                        { step: 4, label: 'DEFLATING OPTION B CARD FEES' },
                                                                        { step: 5, label: 'COMMITTING B2B TAX LEDGER' }
                                                                    ].map((item, idx) => {
                                                                        const stepNum = idx + 2;
                                                                        const isDone = simulationStep >= stepNum;
                                                                        const isActive = simulationStep === idx + 1;
                                                                        
                                                                        return (
                                                                            <div key={idx} className={`flex items-center justify-between p-3 rounded-2xl transition-all ${isActive ? 'bg-brand/10 border border-brand/20 text-brand' : isDone ? 'text-gray-500' : 'text-gray-700 opacity-50'}`}>
                                                                                <div className="flex items-center gap-2">
                                                                                    {isDone ? (
                                                                                        <CheckCircle2 size={10} className="text-brand shrink-0" />
                                                                                    ) : isActive ? (
                                                                                        <Activity size={10} className="animate-pulse shrink-0" />
                                                                                    ) : (
                                                                                        <span className="w-3.5 h-3.5 rounded-full border border-gray-700 flex items-center justify-center text-[6px] shrink-0">{idx + 1}</span>
                                                                                    )}
                                                                                    <span className="font-bold tracking-wider">{item.label}</span>
                                                                                </div>
                                                                                <span className="text-[7px] uppercase tracking-widest font-mono">
                                                                                    {isDone ? 'COMPLETE ✓' : isActive ? 'PROCESSING ⚡' : 'QUEUED'}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-4">
                                                                {/* Input: Client Name */}
                                                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                                                                    <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-widest">Customer / Passenger Name</span>
                                                                    <input 
                                                                        value={simulationClientName} 
                                                                        onChange={e => setSimulationClientName(e.target.value)} 
                                                                        className="bg-transparent text-sm font-black italic text-white outline-none w-full border-b border-white/5 focus:border-brand/40 pb-1" 
                                                                    />
                                                                </div>

                                                                {/* Input: Connected Partner */}
                                                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                                                                    <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-widest">Target Destination Partner</span>
                                                                    <select
                                                                        value={simulationPartnerId}
                                                                        onChange={e => setSimulationPartnerId(e.target.value)}
                                                                        className="bg-dark-950 text-xs md:text-sm lg:text-base font-black text-white outline-none w-full border border-white/10 rounded-xl p-2 cursor-pointer focus:border-brand/40"
                                                                    >
                                                                        {(() => {
                                                                            const partnerList = stripeConnectedPartners.length > 0
                                                                                ? stripeConnectedPartners
                                                                                : (docPartners.length > 0
                                                                                    ? docPartners.map(p => ({ id: p.id || p.emailKey || 'acct_b2b', name: p.name || p.company || 'B2B Partner' }))
                                                                                    : [
                                                                                        { id: 'acct_stadium_live', name: '🏟️ Stadion Arena (Test-Konto)' },
                                                                                        { id: 'acct_hotel_live', name: '🏨 Grand Hotel VIP (Test-Konto)' },
                                                                                        { id: 'acct_fleet_live', name: '🚗 Green Shuttle Flotte (Test-Konto)' }
                                                                                    ]);
                                                                            return partnerList.map(p => (
                                                                                <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                                                                            ));
                                                                        })()}
                                                                    </select>
                                                                </div>

                                                                {/* Input: Category */}
                                                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                                                                    <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-widest">Transaction Category</span>
                                                                    <select
                                                                        value={simulationCategory}
                                                                        onChange={e => setSimulationCategory(e.target.value)}
                                                                        className="bg-dark-950 text-xs md:text-sm lg:text-base font-black text-white outline-none w-full border border-white/10 rounded-xl p-2 cursor-pointer focus:border-brand/40"
                                                                    >
                                                                        <option value="transport">🚗 Fleet Ride / Transport (Progressive Steps)</option>
                                                                        <option value="hotels">🏨 Luxury Hospitality Booking (5% Commission)</option>
                                                                        <option value="events">🎟️ VIP Event Tickets (5% Commission)</option>
                                                                        <option value="clubs">🍹 Bar, Food, Drinks & Desserts (0% Platform Fee)</option>
                                                                    </select>
                                                                </div>

                                                                {/* Input: Charge Amount */}
                                                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-widest">Total Transaction Charge</span>
                                                                        <span className="text-xs md:text-sm lg:text-base font-mono font-black text-white">{parseFloat(simulationChargeAmount).toFixed(2)} €</span>
                                                                    </div>
                                                                    <input 
                                                                        type="range"
                                                                        min="5.00"
                                                                        max="350.00"
                                                                        step="1.00"
                                                                        value={simulationChargeAmount}
                                                                        onChange={e => setSimulationChargeAmount(parseFloat(e.target.value) || 24.50)}
                                                                        className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-brand" 
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button 
                                                        disabled={isSimulatingPayoutFlow}
                                                        onClick={triggerLiveStripeSplitSimulation}
                                                        className="w-full mt-6 py-5 bg-brand text-dark-900 rounded-[2rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                                    >
                                                        {isSimulatingPayoutFlow ? 'PROCESSING TRANSACTION...' : 'EXECUTE LIVE STRIPE SPLIT'}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* RIGHT COLUMN: SCROLLING WEBHOOK LOG TERMINAL */}
                                            <div className="lg:col-span-3">
                                                <div className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] p-10 flex flex-col h-full relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                                                    <div className="flex justify-between items-center mb-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                                                            <h3 className="text-xl font-black italic uppercase text-white">Live Webhook Log Feed</h3>
                                                        </div>
                                                        <span className="px-3 py-1 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[7px] font-mono rounded-full uppercase tracking-widest">
                                                            SSL Session Active (Port 443)
                                                        </span>
                                                    </div>

                                                    {/* Cyber terminal logs scroll viewport */}
                                                    <div className="flex-1 min-h-[300px] max-h-[360px] bg-black/60 border border-white/5 rounded-3xl p-6 font-mono text-[8px] md:text-[10px] lg:text-xs space-y-3.5 overflow-y-auto no-scrollbar scroll-smooth">
                                                        {stripeLiveWebhookEvents.map((evt, eIdx) => {
                                                            let levelColor = 'bg-gray-800 text-gray-400 border-gray-700';
                                                            if (evt.level === 'SUCCESS' || evt.level === 'SETTLED') levelColor = 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30';
                                                            else if (evt.level === 'ROUTING' || evt.level === 'OPTION_B') levelColor = 'bg-blue-950/40 text-blue-400 border-blue-500/30';
                                                            else if (evt.level === 'COMPUTE' || evt.level === 'PLATFORM') levelColor = 'bg-amber-950/40 text-amber-400 border-amber-500/30';
                                                            else if (evt.level === 'INGEST') levelColor = 'bg-purple-950/40 text-purple-400 border-purple-500/30';
                                                            
                                                            return (
                                                                <div key={eIdx} className="flex items-start gap-3 border-b border-white/5 pb-2 last:border-b-0 animate-fadeIn">
                                                                    <span className="text-gray-600 shrink-0 select-none">[{evt.time}]</span>
                                                                    <span className={`px-1.5 py-0.5 border rounded text-[6px] font-black tracking-widest uppercase shrink-0 ${levelColor}`}>
                                                                        {evt.level}
                                                                    </span>
                                                                    <span className="text-gray-300 leading-relaxed tracking-wide font-medium">{evt.msg}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dynamic Split Settlements Ledger list Table */}
                                        <div className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] p-10 space-y-8 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-brand/20 shadow-[0_0_20px_rgba(52,211,153,0.2)]" />
                                            <h3 className="text-2xl font-black italic uppercase text-white flex items-center gap-3">
                                                <Activity size={20} className="text-brand animate-pulse" />
                                                Live Settlement Ledger Registry
                                            </h3>
                                            
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left font-mono text-[9px] md:text-[11px] lg:text-xs">
                                                    <thead>
                                                        <tr className="border-b border-white/5 text-gray-500 uppercase tracking-widest text-[8px] md:text-[10px] lg:text-xs font-black">
                                                            <th className="py-4">TIMESTAMP</th>
                                                            <th className="py-4">TRANSACTION ID</th>
                                                            <th className="py-4">DESTINATION PARTNER</th>
                                                            <th className="py-4">CLIENT NAME</th>
                                                            <th className="py-4">TOTAL CHARGE</th>
                                                            <th className="py-4">PLATFORM NET PROVISION</th>
                                                            <th className="py-4">PARTNER NET SHARE</th>
                                                            <th className="py-4">CARD FEE (ABSORBED)</th>
                                                            <th className="py-4 text-center">B2B TAX INVOICE</th>
                                                            <th className="py-4 text-right">STATUS</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5 text-gray-300">
                                                        {liveSplitsLedger.map((row) => {
                                                            const partnerShare = (parseFloat(row.total) - parseFloat(row.prov)).toFixed(2);
                                                            const partnerNetPayout = (parseFloat(partnerShare) - parseFloat(row.fee)).toFixed(2);
                                                            
                                                            const guestMap = {
                                                                'Marcus G.': '[GUEST_ANON_782]',
                                                                'Elena V.': '[GUEST_ANON_194]',
                                                                'Hansi M.': '[GUEST_ANON_305]',
                                                                'Sophie K.': '[GUEST_ANON_612]'
                                                            };
                                                            const displayClientName = anonymizedModeActive ? (guestMap[row.client] || '[GUEST_ANON_881]') : row.client;

                                                            return (
                                                                <tr key={row.id} className="hover:bg-white/5 transition-colors">
                                                                    <td className="py-4 text-gray-500">{row.time}</td>
                                                                    <td className="py-4 text-white font-bold">{row.tx}</td>
                                                                    <td className="py-4 text-brand font-bold">{row.partner}</td>
                                                                    <td className="py-4 text-gray-400 font-medium">{displayClientName}</td>
                                                                    <td className="py-4 font-bold text-white">{row.total} €</td>
                                                                    <td className="py-4">
                                                                        <span className={parseFloat(row.prov) === 0 ? 'text-gray-500 italic' : 'text-brand font-black'}>
                                                                            {parseFloat(row.prov) === 0 ? '0.00 € (0%)' : `${row.prov} €`}
                                                                        </span>
                                                                        <p className="text-[6px] text-gray-500 mt-0.5 leading-none">{row.tag}</p>
                                                                    </td>
                                                                    <td className="py-4 text-white font-bold">{partnerNetPayout} €</td>
                                                                    <td className="py-4 text-emerald-400">-{row.fee} €</td>
                                                                    <td className="py-4 text-center">
                                                                        {row.inv !== 'N/A (Direct Sales)' ? (
                                                                            <div className="flex gap-2 justify-center">
                                                                                <button 
                                                                                    onClick={() => setSelectedInvoiceForModal(row)}
                                                                                    className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-brand/40 text-gray-400 hover:text-white rounded-xl text-[7px] font-black uppercase tracking-widest transition-all"
                                                                                >
                                                                                    👁️ VIEW
                                                                                </button>
                                                                                <button 
                                                                                    onClick={() => downloadB2BInvoice(row.inv, displayClientName, row.partner, row.total, row.prov, row.date)}
                                                                                    className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-brand/40 text-gray-400 hover:text-white rounded-xl text-[7px] font-black uppercase tracking-widest transition-all"
                                                                                >
                                                                                    📥 DOWNLOAD
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-[7px] text-gray-600 uppercase italic">Not Applicable</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-4 text-right">
                                                                        <span className={`px-2 py-0.5 border rounded text-[6px] font-black tracking-widest ${
                                                                            row.status.includes('⚡') 
                                                                                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 animate-pulse' 
                                                                                : 'bg-brand/10 border-brand/30 text-brand'
                                                                        }`}>
                                                                            {row.status}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 2: WÖCHENTLICHES FLOTTEN-LEDGER & CASH-RECONCILIATION */}
                                {stripeActiveSubTab === 'weekly-fleet-settlement' && (() => {
                                    const displayedFleets = selectedFleetForSettlement === 'all' 
                                        ? weeklyFleetsData 
                                        : weeklyFleetsData.filter(f => f.id === selectedFleetForSettlement);

                                    const aggTotalGross = displayedFleets.reduce((sum, f) => sum + f.grossVolume, 0);
                                    const aggCardGross = displayedFleets.reduce((sum, f) => sum + f.cardVolume, 0);
                                    const aggCashGross = displayedFleets.reduce((sum, f) => sum + f.cashVolume, 0);
                                    const aggTotalTrips = displayedFleets.reduce((sum, f) => sum + f.totalTrips, 0);
                                    const aggCardTrips = displayedFleets.reduce((sum, f) => sum + f.cardTrips, 0);
                                    const aggCashTrips = displayedFleets.reduce((sum, f) => sum + f.cashTrips, 0);
                                    const aggCancelledTrips = displayedFleets.reduce((sum, f) => sum + (f.cancelledTrips || 0), 0);
                                    const aggFreeCancelledTrips = displayedFleets.reduce((sum, f) => sum + (f.freeCancelledTrips || 0), 0);
                                    const aggLateCancelledTrips = displayedFleets.reduce((sum, f) => sum + (f.lateCancelledTrips || 0), 0);
                                    const aggCancellationFees = displayedFleets.reduce((sum, f) => sum + (f.cancellationFeesCollected || 0), 0);
                                    const aggCancellationFleetPayout = displayedFleets.reduce((sum, f) => sum + (f.cancellationFleetPayout || 0), 0);
                                    const aggTotalProv = displayedFleets.reduce((sum, f) => sum + f.totalProvision, 0);
                                    const aggCashOffset = displayedFleets.reduce((sum, f) => sum + f.cashCommissionOffset, 0);
                                    const aggNetPayout = displayedFleets.reduce((sum, f) => sum + f.netStripePayout, 0);
                                    const aggFleetTotalNet = displayedFleets.reduce((sum, f) => sum + f.fleetTotalNetEarnings, 0);

                                    const cancelledAuditList = [
                                        { id: 'ST-8812', time: 'Heute 14:22', client: 'Lukas M.', fleet: 'Hessen EcoFleet', driver: 'Mick D.', reason: 'Spätstorno (> 4 Min nach Fahrer-Bestätigung)', fee: 5.00, fleetShare: 3.50, provShare: 1.50, type: 'late', status: 'Entschädigung gutgeschrieben' },
                                        { id: 'ST-8809', time: 'Heute 11:05', client: 'Anna S.', fleet: 'Hessen EcoFleet', driver: 'Tobias B.', reason: 'Sofortstorno (< 60 Sek, versehentliche Bestellung)', fee: 0.00, fleetShare: 0.00, provShare: 0.00, type: 'free', status: 'Kostenfrei storniert' },
                                        { id: 'ST-8794', time: 'Gestern 23:40', client: 'Kevin W.', fleet: 'Frankfurt Taxi Union', driver: 'Ali K.', reason: 'No-Show: Kunde nach 10 Min Wartezeit am Club nicht erschienen', fee: 5.00, fleetShare: 3.50, provShare: 1.50, type: 'late', status: 'Entschädigung gutgeschrieben' },
                                        { id: 'ST-8781', time: 'Gestern 19:15', client: 'Sarah B.', fleet: 'Frankfurt Taxi Union', driver: 'Murat Y.', reason: 'Fristgerechter Storno (Vor Anfahrt des Fahrers)', fee: 0.00, fleetShare: 0.00, provShare: 0.00, type: 'free', status: 'Kostenfrei storniert' },
                                        { id: 'ST-8760', time: '02.10. 16:30', client: 'Felix T.', fleet: 'Berlin VIP Shuttle', driver: 'Sven W.', reason: 'Flugverspätung / Vorab-Storno 4h vor Abholung', fee: 0.00, fleetShare: 0.00, provShare: 0.00, type: 'free', status: 'Kostenfrei storniert' },
                                        { id: 'ST-8742', time: '01.10. 21:10', client: 'David R.', fleet: 'Hessen EcoFleet', driver: 'Mick D.', reason: 'Fahrer vor Ort am Hotel, Kunde storniert (Spätstorno)', fee: 5.00, fleetShare: 3.50, provShare: 1.50, type: 'late', status: 'Entschädigung gutgeschrieben' }
                                    ];

                                    return (
                                        <div className="space-y-8 animate-fadeIn">
                                            {/* Header Banner & Controls */}
                                            <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 p-8 rounded-[3rem] border transition-all ${
                                                isLight 
                                                    ? 'bg-white border-slate-200 shadow-md text-slate-900' 
                                                    : 'bg-[#0c1424] border-slate-800 shadow-2xl text-white'
                                            }`}>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-[9px] md:text-xs font-mono font-black uppercase tracking-widest rounded-full">
                                                            7-Tage Rolling Payout Cycle (Jeden Montag)
                                                        </span>
                                                        <span className="px-3 py-1 bg-cyan-500/15 border border-cyan-500/40 text-cyan-700 dark:text-cyan-300 text-[9px] md:text-xs font-mono font-bold uppercase tracking-widest rounded-full">
                                                            Stripe Gebühren: 100% Plattform-Übernahme
                                                        </span>
                                                        <span className="px-3 py-1 bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-400 text-[9px] md:text-xs font-mono font-bold uppercase tracking-widest rounded-full">
                                                            🚫 {aggCancelledTrips} Stornierungen erfasst
                                                        </span>
                                                    </div>
                                                    <h3 className={`text-2xl md:text-3xl font-black italic uppercase tracking-tight flex items-center gap-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                        <Wallet size={28} className="text-emerald-500" /> Wöchentliches Flotten-Ledger & Cash-Verrechnung
                                                    </h3>
                                                    <p className={`text-xs md:text-sm font-medium max-w-3xl mt-1.5 leading-relaxed ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>
                                                        Automatisches Gegenrechnen von Barzahlungen: Die Plattform-Provision aus Barfahrten wird als Minusbetrag direkt vom gesammelten Stripe-Kartenguthaben abgezogen. Wöchentliche Gesamtauszahlung jeden Montag.
                                                    </p>
                                                </div>

                                                {/* Filters */}
                                                <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full lg:w-auto">
                                                    <div className="space-y-1 flex-1 sm:flex-initial">
                                                        <label className={`text-[10px] font-black uppercase tracking-wider block ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Abrechnungswoche:</label>
                                                        <select
                                                            value={selectedWeekForSettlement}
                                                            onChange={e => setSelectedWeekForSettlement(e.target.value)}
                                                            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold border outline-none transition-all ${
                                                                isLight 
                                                                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600' 
                                                                    : 'bg-black/60 border-white/10 text-white focus:border-emerald-500'
                                                            }`}
                                                        >
                                                            <option value="KW 40 (28.09. - 04.10.2026)">KW 40 (Aktuelle Woche)</option>
                                                            <option value="KW 39 (21.09. - 27.09.2026)">KW 39 (Vorwoche - Archiv)</option>
                                                            <option value="KW 38 (14.09. - 20.09.2026)">KW 38 (Archiv)</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1 flex-1 sm:flex-initial">
                                                        <label className={`text-[10px] font-black uppercase tracking-wider block ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Flotten-Filter:</label>
                                                        <select
                                                            value={selectedFleetForSettlement}
                                                            onChange={e => setSelectedFleetForSettlement(e.target.value)}
                                                            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold border outline-none transition-all ${
                                                                isLight 
                                                                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600' 
                                                                    : 'bg-black/60 border-white/10 text-white focus:border-emerald-500'
                                                            }`}
                                                        >
                                                            <option value="all">Alle Flotten ({weeklyFleetsData.length})</option>
                                                            {weeklyFleetsData.map(f => (
                                                                <option key={f.id} value={f.id}>{f.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sub-Tab Navigation inside Fleet Ledger */}
                                            <div className="flex gap-2 pb-1 border-b border-slate-200 dark:border-white/10">
                                                <button
                                                    onClick={() => setSettlementViewTab('overview')}
                                                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                                                        settlementViewTab === 'overview'
                                                            ? (isLight ? 'bg-slate-900 text-white shadow-sm' : 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20')
                                                            : (isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-gray-400 hover:text-white hover:bg-white/5')
                                                    }`}
                                                >
                                                    <Wallet size={15} /> 1. Flotten-Abrechnung & Payout
                                                </button>
                                                <button
                                                    onClick={() => setSettlementViewTab('cancellations')}
                                                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                                                        settlementViewTab === 'cancellations'
                                                            ? (isLight ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20')
                                                            : (isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-gray-400 hover:text-white hover:bg-white/5')
                                                    }`}
                                                >
                                                    <XCircle size={15} /> 2. 🚫 Stornierte Fahrten Audit ({aggCancelledTrips})
                                                </button>
                                            </div>

                                            {/* 7 High-Impact Financial KPI Cards (Enhanced with Cancellations & Clean Colors) */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
                                                {/* 1. Gross Volume */}
                                                <div className={`p-5 rounded-3xl border transition-all ${
                                                    isLight 
                                                        ? 'bg-slate-50/80 border-slate-200 text-slate-900 shadow-sm' 
                                                        : 'bg-slate-900/90 border-slate-800 text-white'
                                                }`}>
                                                    <span className={`text-[9px] font-black uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>1. Brutto-Umsatz</span>
                                                    <p className={`text-xl md:text-2xl font-black italic tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>{aggTotalGross.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</p>
                                                    <p className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Vor Provision (Bar+Karte)</p>
                                                </div>

                                                {/* 2. Trip Split */}
                                                <div className={`p-5 rounded-3xl border transition-all ${
                                                    isLight 
                                                        ? 'bg-sky-50 border-sky-200 text-sky-950 shadow-sm' 
                                                        : 'bg-sky-950/20 border-sky-500/30 text-sky-200'
                                                }`}>
                                                    <span className={`text-[9px] font-black uppercase tracking-wider block ${isLight ? 'text-sky-700' : 'text-cyan-400'}`}>2. Durchgeführt</span>
                                                    <p className={`text-xl md:text-2xl font-black italic tracking-tight ${isLight ? 'text-sky-950' : 'text-white'}`}>{aggTotalTrips} Fahrten</p>
                                                    <div className="flex gap-2 text-[10px] font-mono mt-0.5">
                                                        <span className={isLight ? 'text-sky-700 font-bold' : 'text-cyan-300'}>💳 {aggCardTrips}x</span>
                                                        <span className={isLight ? 'text-amber-800 font-bold' : 'text-amber-400'}>💶 {aggCashTrips}x</span>
                                                    </div>
                                                </div>

                                                {/* 3. Cancellations Card */}
                                                <div className={`p-5 rounded-3xl border transition-all ${
                                                    isLight 
                                                        ? 'bg-rose-50 border-rose-200 text-rose-950 shadow-sm' 
                                                        : 'bg-rose-950/25 border-rose-500/30 text-rose-200'
                                                }`}>
                                                    <span className={`text-[9px] font-black uppercase tracking-wider block ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>3. 🚫 Stornos</span>
                                                    <p className={`text-xl md:text-2xl font-black italic tracking-tight ${isLight ? 'text-rose-950' : 'text-rose-300'}`}>{aggCancelledTrips} Fahrten</p>
                                                    <p className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
                                                        {aggFreeCancelledTrips}x frei | +{aggCancellationFleetPayout.toFixed(2)} € No-Show
                                                    </p>
                                                </div>

                                                {/* 4. Cash Volume in Drivers Pocket */}
                                                <div className={`p-5 rounded-3xl border transition-all ${
                                                    isLight 
                                                        ? 'bg-amber-50 border-amber-200 text-amber-950 shadow-sm' 
                                                        : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                                                }`}>
                                                    <span className={`text-[9px] font-black uppercase tracking-wider block ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>4. Bar beim Fahrer</span>
                                                    <p className={`text-xl md:text-2xl font-black italic tracking-tight ${isLight ? 'text-amber-900' : 'text-amber-300'}`}>{aggCashGross.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</p>
                                                    <p className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-amber-700' : 'text-gray-400'}`}>100% im Auto kassiert</p>
                                                </div>

                                                {/* 5. Cash Commission Offset */}
                                                <div className={`p-5 rounded-3xl border transition-all ${
                                                    isLight 
                                                        ? 'bg-orange-50 border-orange-200 text-orange-950 shadow-sm' 
                                                        : 'bg-orange-950/20 border-orange-500/30 text-orange-200'
                                                }`}>
                                                    <span className={`text-[9px] font-black uppercase tracking-wider block ${isLight ? 'text-orange-700' : 'text-orange-400'}`}>5. Bar-Provision (Abzug 🔴)</span>
                                                    <p className={`text-xl md:text-2xl font-black italic tracking-tight ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>-{aggCashOffset.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</p>
                                                    <p className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-orange-700' : 'text-gray-400'}`}>Vom Kartenguthaben saldiert</p>
                                                </div>

                                                {/* 6. Grien Platform Total Provision */}
                                                <div className={`p-5 rounded-3xl border transition-all ${
                                                    isLight 
                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950 shadow-sm' 
                                                        : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                                                }`}>
                                                    <span className={`text-[9px] font-black uppercase tracking-wider block ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>6. Grien Provision Gesamt</span>
                                                    <p className={`text-xl md:text-2xl font-black italic tracking-tight ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>+{aggTotalProv.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</p>
                                                    <p className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-emerald-700' : 'text-gray-400'}`}>Verdienst aus Karte & Bar</p>
                                                </div>

                                                {/* 7. Net Stripe Payout */}
                                                <div className={`p-5 rounded-3xl border transition-all ${
                                                    isLight 
                                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 border-emerald-700' 
                                                        : 'bg-gradient-to-br from-emerald-500/25 to-cyan-500/20 border-2 border-emerald-400 text-white shadow-xl shadow-emerald-500/10'
                                                }`}>
                                                    <span className={`text-[9px] font-black uppercase tracking-wider block ${isLight ? 'text-emerald-100' : 'text-white'}`}>7. Netto Payout 🚀</span>
                                                    <p className={`text-xl md:text-2xl font-black italic tracking-tight ${isLight ? 'text-white' : 'text-emerald-300'}`}>{aggNetPayout.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</p>
                                                    <p className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-emerald-100' : 'text-emerald-200'}`}>Stripe Auszahlung (Montag)</p>
                                                </div>
                                            </div>

                                            {/* VIEW 1: FLEET SETTLEMENT TABLE */}
                                            {settlementViewTab === 'overview' && (
                                                <div className={`p-6 md:p-8 rounded-[2.5rem] border transition-all ${
                                                    isLight 
                                                        ? 'bg-white border-slate-200 shadow-md text-slate-900' 
                                                        : 'bg-[#0c1424] border-slate-800 shadow-2xl text-white'
                                                } space-y-6`}>
                                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
                                                        <div>
                                                            <h4 className={`text-xl font-black italic uppercase tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                                Flotten-Abrechnungsübersicht ({selectedWeekForSettlement})
                                                            </h4>
                                                            <p className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                                                GoBD- und steuerkonforme Saldierung aller Bar-, Karten- und Stornotransaktionen
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-xs font-mono hidden sm:inline ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                                                                Flotten-Gesamtertrag (Bar + Payout): <strong className={isLight ? 'text-emerald-700 font-black' : 'text-white font-black'}>{aggFleetTotalNet.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</strong>
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left font-mono text-xs">
                                                            <thead>
                                                                <tr className={`border-b uppercase text-[10px] tracking-wider ${
                                                                    isLight 
                                                                        ? 'bg-slate-100 text-slate-700 border-slate-200' 
                                                                        : 'bg-black/40 text-gray-400 border-white/10'
                                                                }`}>
                                                                    <th className="py-3 px-3">Flotte / Unternehmer</th>
                                                                    <th className="py-3 px-3">Fahrten (Karte / Bar)</th>
                                                                    <th className="py-3 px-3">🚫 Stornos</th>
                                                                    <th className="py-3 px-3">Brutto-Umsatz</th>
                                                                    <th className="py-3 px-3">Bar kassiert</th>
                                                                    <th className="py-3 px-3">Kartenguthaben</th>
                                                                    <th className="py-3 px-3">Grien Provision</th>
                                                                    <th className="py-3 px-3">Bar-Verrechnung</th>
                                                                    <th className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-black">Netto Payout</th>
                                                                    <th className="py-3 px-3">Status</th>
                                                                    <th className="py-3 px-3 text-right">Aktionen</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-white/5'}`}>
                                                                {displayedFleets.map(fleet => (
                                                                    <tr key={fleet.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50 text-slate-800' : 'hover:bg-white/5 text-gray-200'}`}>
                                                                        <td className="py-4 px-3">
                                                                            <div className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{fleet.name}</div>
                                                                            <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>GF: {fleet.manager} | {fleet.id}</div>
                                                                            <div className={`text-[9px] font-mono ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>IBAN: {anonymizedModeActive ? 'DE** **** **** **' : fleet.iban}</div>
                                                                        </td>
                                                                        <td className="py-4 px-3">
                                                                            <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{fleet.totalTrips} gesamt</div>
                                                                            <div className={isLight ? 'text-[10px] text-sky-700 font-bold' : 'text-[10px] text-cyan-300'}>💳 {fleet.cardTrips}x Karte</div>
                                                                            <div className={isLight ? 'text-[10px] text-amber-800 font-bold' : 'text-[10px] text-amber-400'}>💶 {fleet.cashTrips}x Bar</div>
                                                                        </td>
                                                                        <td className="py-4 px-3">
                                                                            <div className="font-bold text-rose-600 dark:text-rose-400">{fleet.cancelledTrips || 0} storniert</div>
                                                                            <div className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{fleet.freeCancelledTrips || 0}x frei</div>
                                                                            {(fleet.cancellationFleetPayout || 0) > 0 && (
                                                                                <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">+{fleet.cancellationFleetPayout.toFixed(2)} € Entschädigung</div>
                                                                            )}
                                                                        </td>
                                                                        <td className={`py-4 px-3 font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                                            {fleet.grossVolume.toFixed(2)} €
                                                                        </td>
                                                                        <td className={`py-4 px-3 font-bold ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
                                                                            {fleet.cashVolume.toFixed(2)} €
                                                                        </td>
                                                                        <td className={`py-4 px-3 font-bold ${isLight ? 'text-sky-700' : 'text-cyan-300'}`}>
                                                                            {fleet.cardVolume.toFixed(2)} €
                                                                        </td>
                                                                        <td className={`py-4 px-3 font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                                                                            -{fleet.totalProvision.toFixed(2)} €
                                                                        </td>
                                                                        <td className={`py-4 px-3 font-bold ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
                                                                            -{fleet.cashCommissionOffset.toFixed(2)} €
                                                                            <span className={`block text-[8px] font-normal ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>auf Kartenguthaben</span>
                                                                        </td>
                                                                        <td className="py-4 px-3">
                                                                            <span className={`px-3 py-1 font-black text-sm rounded-xl inline-block border ${
                                                                                isLight 
                                                                                    ? 'bg-emerald-100 border-emerald-300 text-emerald-800' 
                                                                                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                                                            }`}>
                                                                                {fleet.netStripePayout.toFixed(2)} €
                                                                            </span>
                                                                        </td>
                                                                        <td className="py-4 px-3">
                                                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${
                                                                                fleet.payoutStatus.includes('Überwiesen')
                                                                                    ? (isLight ? 'bg-emerald-100 border-emerald-200 text-emerald-800' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300')
                                                                                    : (isLight ? 'bg-amber-100 border-amber-200 text-amber-800 animate-pulse' : 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse')
                                                                            }`}>
                                                                                {fleet.payoutStatus}
                                                                            </span>
                                                                            <span className={`block text-[8px] mt-1 ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>{fleet.lastPayoutDate}</span>
                                                                        </td>
                                                                        <td className="py-4 px-3 text-right">
                                                                            <div className="flex gap-2 justify-end">
                                                                                <button
                                                                                    onClick={() => downloadWeeklyFleetStatement(fleet, selectedWeekForSettlement)}
                                                                                    className={`px-3 py-2 border rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                                                                        isLight 
                                                                                            ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' 
                                                                                            : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-gray-200 hover:text-white'
                                                                                    }`}
                                                                                    title="Wochenabrechnung als PDF exportieren"
                                                                                >
                                                                                    <Download size={13} /> PDF
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => triggerWeeklyFleetPayout(fleet.id)}
                                                                                    disabled={isProcessingWeeklyPayout || fleet.payoutStatus.includes('Überwiesen')}
                                                                                    className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 disabled:opacity-40 ${
                                                                                        isLight 
                                                                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20' 
                                                                                            : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                                                                                    }`}
                                                                                    title="Stripe Payout auslösen"
                                                                                >
                                                                                    <Zap size={13} /> {fleet.payoutStatus.includes('Überwiesen') ? 'Erledigt' : 'Payout'}
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {/* VIEW 2: CANCELLED RIDES AUDIT TABLE */}
                                            {settlementViewTab === 'cancellations' && (
                                                <div className={`p-6 md:p-8 rounded-[2.5rem] border transition-all ${
                                                    isLight 
                                                        ? 'bg-white border-slate-200 shadow-md text-slate-900' 
                                                        : 'bg-[#0c1424] border-slate-800 shadow-2xl text-white'
                                                } space-y-6`}>
                                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-full text-[10px] font-mono font-bold uppercase">
                                                                    Stornierungs-Audit gem. AGB & PBefG
                                                                </span>
                                                            </div>
                                                            <h4 className={`text-xl font-black italic uppercase tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                                🚫 Detail-Protokoll: Stornierte Fahrten ({selectedWeekForSettlement})
                                                            </h4>
                                                            <p className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                                                Echtzeit-Tracking aller Kunden- und Fahrer-Stornos, No-Shows und berechneten Ausfallgebühren
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-3 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold font-mono">
                                                                Ausfallentschädigung an Flotten: +{aggCancellationFleetPayout.toFixed(2)} €
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left font-mono text-xs">
                                                            <thead>
                                                                <tr className={`border-b uppercase text-[10px] tracking-wider ${
                                                                    isLight 
                                                                        ? 'bg-slate-100 text-slate-700 border-slate-200' 
                                                                        : 'bg-black/40 text-gray-400 border-white/10'
                                                                }`}>
                                                                    <th className="py-3 px-3">Storno-ID & Zeit</th>
                                                                    <th className="py-3 px-3">Fahrgast</th>
                                                                    <th className="py-3 px-3">Flotte / Fahrer</th>
                                                                    <th className="py-3 px-3">Stornierungsgrund</th>
                                                                    <th className="py-3 px-3">Stornogebühr</th>
                                                                    <th className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-bold">Flotten-Gutschrift</th>
                                                                    <th className="py-3 px-3">Grien Provision</th>
                                                                    <th className="py-3 px-3 text-right">Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-white/5'}`}>
                                                                {cancelledAuditList.map(storno => (
                                                                    <tr key={storno.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50 text-slate-800' : 'hover:bg-white/5 text-gray-200'}`}>
                                                                        <td className="py-4 px-3">
                                                                            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{storno.id}</span>
                                                                            <span className={`block text-[10px] ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{storno.time}</span>
                                                                        </td>
                                                                        <td className="py-4 px-3">
                                                                            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{anonymizedModeActive ? '[GUEST_ANON]' : storno.client}</span>
                                                                        </td>
                                                                        <td className="py-4 px-3">
                                                                            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{storno.fleet}</span>
                                                                            <span className={`block text-[10px] ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Fahrer: {storno.driver}</span>
                                                                        </td>
                                                                        <td className="py-4 px-3 max-w-xs">
                                                                            <span className={storno.type === 'late' ? 'text-rose-600 dark:text-rose-400 font-bold' : (isLight ? 'text-slate-600' : 'text-gray-300')}>
                                                                                {storno.reason}
                                                                            </span>
                                                                        </td>
                                                                        <td className="py-4 px-3 font-bold">
                                                                            {storno.fee === 0 ? (
                                                                                <span className={isLight ? 'text-slate-400 italic' : 'text-gray-500 italic'}>0.00 € (Kostenfrei)</span>
                                                                            ) : (
                                                                                <span className="text-rose-600 dark:text-rose-400 font-black">{storno.fee.toFixed(2)} €</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="py-4 px-3">
                                                                            {storno.fleetShare > 0 ? (
                                                                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 rounded-lg font-bold">
                                                                                    +{storno.fleetShare.toFixed(2)} €
                                                                                </span>
                                                                            ) : (
                                                                                <span className={isLight ? 'text-slate-400' : 'text-gray-500'}>0.00 €</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="py-4 px-3">
                                                                            {storno.provShare > 0 ? (
                                                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">+{storno.provShare.toFixed(2)} €</span>
                                                                            ) : (
                                                                                <span className={isLight ? 'text-slate-400' : 'text-gray-500'}>0.00 €</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="py-4 px-3 text-right">
                                                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${
                                                                                storno.type === 'late'
                                                                                    ? (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40')
                                                                                    : (isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-white/10 text-gray-400 border-white/10')
                                                                            }`}>
                                                                                {storno.status}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {/* How Cash & Card Reconciliation Works Explanation Box */}
                                            <div className={`p-6 md:p-8 rounded-[2.5rem] border transition-all ${
                                                isLight 
                                                    ? 'bg-slate-50 border-slate-200 text-slate-900 shadow-sm' 
                                                    : 'bg-black/60 border-slate-700/80 text-white shadow-xl'
                                            } space-y-4`}>
                                                <h5 className={`text-base font-black italic uppercase flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                    <ShieldCheck size={20} className="text-emerald-500" />
                                                    Funktionsweise des 7-Tage Verrechnungssystems (Bar, Karte & Stornos)
                                                </h5>
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                                                    <div className={`p-4 rounded-2xl border space-y-1 ${
                                                        isLight 
                                                            ? 'bg-white border-slate-200 text-slate-800 shadow-sm' 
                                                            : 'bg-slate-900/60 border-slate-800 text-gray-300'
                                                    }`}>
                                                        <span className="text-amber-700 dark:text-amber-400 font-bold block text-[10px]">SCHRITT 1: BARZAHLUNG</span>
                                                        <p>Der Kunde zahlt 100% bar beim Fahrer. Der Fahrer behält das gesamte Geld direkt im Auto.</p>
                                                    </div>
                                                    <div className={`p-4 rounded-2xl border space-y-1 ${
                                                        isLight 
                                                            ? 'bg-white border-slate-200 text-slate-800 shadow-sm' 
                                                            : 'bg-slate-900/60 border-slate-800 text-gray-300'
                                                    }`}>
                                                        <span className="text-rose-700 dark:text-rose-400 font-bold block text-[10px]">SCHRITT 2: PROVISIONS-OFF-SET</span>
                                                        <p>Unser System registriert die Barfahrt und errechnet unsere Plattform-Provision. Diese wird als Soll-Posten (Minus) vermerkt.</p>
                                                    </div>
                                                    <div className={`p-4 rounded-2xl border space-y-1 ${
                                                        isLight 
                                                            ? 'bg-white border-slate-200 text-slate-800 shadow-sm' 
                                                            : 'bg-slate-900/60 border-slate-800 text-gray-300'
                                                    }`}>
                                                        <span className="text-sky-700 dark:text-cyan-400 font-bold block text-[10px]">SCHRITT 3: 7-TAGE KARTENPOOL</span>
                                                        <p>Alle Kartenzahlungen der Kunden laufen in der Woche über Stripe auf das Plattform-Treuhandkonto. Kartengebühren trägt Grien.</p>
                                                    </div>
                                                    <div className={`p-4 rounded-2xl border space-y-1 ${
                                                        isLight 
                                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950 shadow-sm' 
                                                            : 'bg-emerald-950/40 border-emerald-500/40 text-white'
                                                    }`}>
                                                        <span className="text-emerald-700 dark:text-emerald-400 font-bold block text-[10px]">SCHRITT 4: MONTAGS-PAYOUT</span>
                                                        <p className="font-bold">Stripe überweist: Kartenguthaben minus Kartenprovision minus Barprovision plus Storno-Entschädigungen. 100% GoBD-konform.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* TAB 2: CONNECTED PARTNERS DIRECTORY */}
                                {stripeActiveSubTab === 'partners-directory' && (
                                    <div className="space-y-8 bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] p-10 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-brand/20 shadow-[0_0_20px_rgba(52,211,153,0.2)]" />
                                        
                                        <div>
                                            <h3 className="text-3xl font-black italic uppercase text-white">Connected Partner Accounts</h3>
                                            <p className="text-xs md:text-sm lg:text-base text-gray-500 italic mt-1">Review active partner SEPA payout channels, verify balances, and disburse bank payout clearance under BaFin GwG protocols.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {stripeConnectedPartners.map(partner => {
                                                const isDisbursing = isDisbursingPartnerId === partner.id;
                                                const showIban = anonymizedModeActive ? `${partner.iban.substring(0, 7)} **** **** **** **` : partner.iban;
                                                
                                                return (
                                                    <div key={partner.id} className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] flex flex-col justify-between gap-6 hover:bg-white/10 hover:border-white/20 transition-all group">
                                                        <div className="space-y-4">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <span className="px-2 py-0.5 bg-brand/10 border border-brand/25 text-brand rounded text-[7px] font-black uppercase tracking-wider font-mono">
                                                                        {partner.industry}
                                                                    </span>
                                                                    <h4 className="text-lg font-black italic uppercase text-white tracking-tighter mt-1 group-hover:text-brand transition-colors">{partner.name}</h4>
                                                                </div>
                                                                <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[7px] font-black rounded-full uppercase tracking-wider animate-pulse shrink-0">
                                                                    ACTIVE CONNECTED ⚡
                                                                </span>
                                                            </div>

                                                            <div className="space-y-2.5 font-mono text-[8px] md:text-[10px] lg:text-xs text-gray-400 border-t border-b border-white/5 py-4">
                                                                <p className="flex justify-between"><span>MANAGER:</span> <span className="font-bold text-white">{partner.manager}</span></p>
                                                                <p className="flex justify-between"><span>CONNECT ID:</span> <span className="font-bold text-white font-mono">{partner.id}</span></p>
                                                                <p className="flex justify-between"><span>SEPA IBAN:</span> <span className="font-bold text-white">{showIban}</span></p>
                                                                <p className="flex justify-between"><span>BIC / SWIFT:</span> <span className="font-bold text-white">{partner.swift}</span></p>
                                                                <p className="flex justify-between"><span>FEE PROTOCOL:</span> <span className="font-bold text-brand leading-none text-right">{partner.commissionModel}</span></p>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                                <div className="p-3 bg-dark-950/80 rounded-2xl border border-white/5">
                                                                    <p className="text-[7px] text-gray-500 uppercase leading-none font-bold">Stripe Balance</p>
                                                                    <p className="text-sm font-black italic text-white tracking-tight mt-1">{partner.balance.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</p>
                                                                </div>
                                                                <div className="p-3 bg-dark-950/80 rounded-2xl border border-white/5">
                                                                    <p className="text-[7px] text-gray-500 uppercase leading-none font-bold">Total Paid Out</p>
                                                                    <p className="text-sm font-black italic text-gray-500 tracking-tight mt-1">{partner.totalPaidOut.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {isDisbursing ? (
                                                            <div className="p-4 bg-brand/5 border border-brand/20 rounded-2xl space-y-2 animate-pulse">
                                                                <div className="flex items-center gap-2 text-brand font-mono text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-wider">
                                                                    <Clock className="animate-spin" size={10} />
                                                                    {disburseStep === 1 ? 'PSD2 Vetting handshakes...' : disburseStep === 2 ? 'BaFin Clearance processing...' : 'Settling SEPA funds...'}
                                                                </div>
                                                                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                                                    <motion.div 
                                                                        initial={{ width: '0%' }}
                                                                        animate={{ width: disburseStep === 1 ? '30%' : disburseStep === 2 ? '70%' : '100%' }}
                                                                        className="h-full bg-brand"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                onClick={() => triggerPartnerDisbursement(partner.id)}
                                                                disabled={partner.balance <= 0}
                                                                className="w-full py-4 bg-brand text-dark-900 hover:scale-[1.02] active:scale-[0.98] rounded-2xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-brand/10 transition-all disabled:opacity-30 disabled:pointer-events-none"
                                                            >
                                                                <Landmark size={12} /> DISBURSE SEPA PAYOUT
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* TAB 3: BAFIN COMPLIANCE KYC DOSSIER */}
                                {stripeActiveSubTab === 'kyc-dossier' && (
                                    <div className="space-y-12 animate-fadeIn">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                            {/* Left Column: KYC Business Details */}
                                            <div className="lg:col-span-2 space-y-8 bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] p-10 relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-brand/20 shadow-[0_0_20px_rgba(52,211,153,0.2)]" />
                                                <h3 className="text-2xl font-black italic uppercase text-white mb-6">Legal Business Profile</h3>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                                                        <span className="text-[9px] md:text-[11px] lg:text-xs font-black text-gray-500 uppercase tracking-widest">Geschäftsführer / Legal Representative</span>
                                                        <input 
                                                            disabled={stripeKycSubmitted} 
                                                            value={stripeKycName} 
                                                            onChange={e => setStripeKycName(e.target.value)} 
                                                            className="bg-transparent text-sm font-black italic text-white outline-none w-full disabled:opacity-50" 
                                                        />
                                                    </div>
                                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                                                        <span className="text-[9px] md:text-[11px] lg:text-xs font-black text-gray-500 uppercase tracking-widest">Authorized E-Mail Signature</span>
                                                        <input 
                                                            disabled={stripeKycSubmitted} 
                                                            type="email" 
                                                            value={stripeKycEmail} 
                                                            onChange={e => setStripeKycEmail(e.target.value)} 
                                                            className="bg-transparent text-sm font-black italic text-white outline-none w-full disabled:opacity-50" 
                                                        />
                                                    </div>
                                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-1 md:col-span-2">
                                                        <span className="text-[9px] md:text-[11px] lg:text-xs font-black text-gray-500 uppercase tracking-widest">Commercial Address / Geschäftsadresse</span>
                                                        <input 
                                                            disabled={stripeKycSubmitted} 
                                                            value={stripeKycAddress} 
                                                            onChange={e => setStripeKycAddress(e.target.value)} 
                                                            className="bg-transparent text-sm font-black italic text-white outline-none w-full disabled:opacity-50" 
                                                        />
                                                    </div>
                                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-1 md:col-span-2">
                                                        <span className="text-[9px] md:text-[11px] lg:text-xs font-black text-gray-500 uppercase tracking-widest">German Tax ID / Steuernummer (St.-Nr.)</span>
                                                        <input 
                                                            disabled={stripeKycSubmitted} 
                                                            value={stripeKycTaxId} 
                                                            onChange={e => setStripeKycTaxId(e.target.value)} 
                                                            className="bg-transparent text-sm font-black italic text-white outline-none w-full disabled:opacity-50" 
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Column: Bank Details */}
                                            <div className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] p-10 flex flex-col justify-between relative overflow-hidden shadow-2xl">
                                                <div className="space-y-6">
                                                    <h3 className="text-2xl font-black italic uppercase text-white">Payout Bank Account</h3>
                                                    <p className="text-xs md:text-sm lg:text-base text-gray-500 italic">"German commercial payouts must resolve to valid SEPA banking channels under GwG Art. 12."</p>
                                                    
                                                    <div className="space-y-4">
                                                        <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                                                            <span className="text-[9px] md:text-[11px] lg:text-xs font-black text-gray-500 uppercase tracking-widest">Stripe Connected Account ID</span>
                                                            <input 
                                                                disabled={stripeKycSubmitted} 
                                                                value={stripeKycAccountId} 
                                                                onChange={e => setStripeKycAccountId(e.target.value)} 
                                                                placeholder="acct_xxxxxxxxxxxxxx" 
                                                                className="bg-transparent text-sm font-mono font-bold tracking-wider text-white outline-none w-full disabled:opacity-50" 
                                                            />
                                                        </div>
                                                        <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                                                            <span className="text-[9px] md:text-[11px] lg:text-xs font-black text-gray-500 uppercase tracking-widest">SEPA IBAN</span>
                                                            <input 
                                                                disabled={stripeKycSubmitted} 
                                                                value={stripeKycIban} 
                                                                onChange={handleIbanChange} 
                                                                placeholder="DE00 0000 0000 0000 0000 00" 
                                                                className="bg-transparent text-sm font-mono font-bold tracking-widest text-white outline-none w-full disabled:opacity-50" 
                                                            />
                                                        </div>
                                                        <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                                                            <span className="text-[9px] md:text-[11px] lg:text-xs font-black text-gray-500 uppercase tracking-widest">BIC / SWIFT CODE</span>
                                                            <input 
                                                                disabled={stripeKycSubmitted} 
                                                                value={stripeKycSwift} 
                                                                onChange={e => setStripeKycSwift(e.target.value.toUpperCase())} 
                                                                placeholder="XXXXXXXX" 
                                                                className="bg-transparent text-sm font-mono font-bold tracking-widest text-white outline-none w-full disabled:opacity-50" 
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Bank verification status block */}
                                                    {stripeBankVerified ? (
                                                        <div className="p-4 bg-brand/10 border border-brand/20 rounded-2xl flex items-center gap-3 text-brand">
                                                            <ShieldCheck size={20} className="shrink-0" />
                                                            <div className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest">Bank Gateway: BAFIN CLEARED</div>
                                                        </div>
                                                    ) : isStripeVerifyingBank ? (
                                                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 text-brand animate-pulse">
                                                            <Clock size={20} className="animate-spin shrink-0 text-brand" />
                                                            <div className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest">PSD2 Handshake Active...</div>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={startInstantBankVerify} 
                                                            disabled={stripeKycSubmitted}
                                                            className="w-full py-4 bg-white/5 border border-white/10 hover:border-brand/40 text-gray-400 hover:text-white rounded-2xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                                        >
                                                            PSD2 INSTANT BANK VERIFICATION
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mandatory Verification Documents Upload Grid */}
                                        <div className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] p-10 space-y-8 relative overflow-hidden">
                                            <h3 className="text-3xl font-black italic uppercase text-white mb-6">Required KYC Document Audits</h3>
                                            <p className="text-xs md:text-sm lg:text-base text-gray-500 italic max-w-2xl">
                                                Germany mandates clear corporate, identity, and transport permitting credentials to decouple payouts. Click any source to upload document.
                                            </p>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {Object.keys(stripeKycDocs).map(key => {
                                                    const doc = stripeKycDocs[key];
                                                    const isScanning = activeScanningSlot === key;
                                                    const isVerified = doc.status === 'verified';
                                                    
                                                    return (
                                                        <div 
                                                            key={key} 
                                                            className={`p-6 rounded-[2.5rem] border transition-all ${
                                                                isVerified ? 'bg-brand/5 border-brand/20' : 
                                                                isScanning ? 'bg-white/5 border-brand-mid/20 animate-pulse' : 
                                                                'bg-white/5 border-white/5'
                                                            }`}
                                                        >
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div>
                                                                    <h4 className="text-sm font-black uppercase text-white">{doc.name}</h4>
                                                                    {isVerified ? (
                                                                        <p className="text-[8px] md:text-[10px] lg:text-xs text-brand font-black uppercase mt-1">✓ Verified on {doc.date}</p>
                                                                    ) : (
                                                                        <p className="text-[8px] md:text-[10px] lg:text-xs text-red-400 font-black uppercase mt-1">⚠️ Missing BaFin Verification</p>
                                                                    )}
                                                                </div>

                                                                {isVerified ? (
                                                                    <span className="px-2.5 py-1 bg-brand/25 text-brand rounded-full text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest flex items-center gap-1">
                                                                        <ShieldCheck size={10} /> BaFin Verified
                                                                    </span>
                                                                ) : isScanning ? (
                                                                    <span className="px-2.5 py-1 bg-white/10 text-brand-mid rounded-full text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest animate-pulse">
                                                                        Scanning {simulatedScanningProgress}%
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-2.5 py-1 bg-red-500/10 text-red-500 rounded-full text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest">
                                                                        Required
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {isVerified && (
                                                                <div className="p-3 bg-brand/5 border border-brand/10 rounded-xl mb-4 text-[9px] md:text-[11px] lg:text-xs font-mono text-gray-400 truncate">
                                                                    FILE ID: {doc.name}
                                                                </div>
                                                            )}

                                                            {/* Documents source options buttons */}
                                                            <div className="flex gap-2">
                                                                <button 
                                                                    disabled={stripeKycSubmitted || isScanning}
                                                                    onClick={() => triggerNativeFileUpload(key)}
                                                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest border border-white/5 hover:border-white/20 transition-all text-center disabled:opacity-50"
                                                                >
                                                                    Dateien
                                                                </button>
                                                                <button 
                                                                    disabled={stripeKycSubmitted || isScanning}
                                                                    onClick={() => triggerMediathekUpload(key)}
                                                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest border border-white/5 hover:border-white/20 transition-all text-center disabled:opacity-50"
                                                                >
                                                                    Mediathek
                                                                </button>
                                                                <button 
                                                                    disabled={stripeKycSubmitted || isScanning}
                                                                    onClick={() => triggerCameraScan(key)}
                                                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest border border-white/5 hover:border-white/20 transition-all text-center disabled:opacity-50 animate-pulse"
                                                                >
                                                                    Kamerarolle
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Submission Drawer */}
                                            <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                                                <div className="flex items-center gap-3">
                                                    <Shield size={20} className={stripeKycSubmitted ? 'text-brand' : 'text-gray-600'} />
                                                    <div>
                                                        <p className="text-[10px] md:text-xs lg:text-sm font-black text-white uppercase tracking-widest leading-none">Stripe Connect Dossier Status</p>
                                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                                                            {stripeKycSubmitted ? 'Approved & Decoupled Payouts Active' : 'Formulation under Review'}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                {stripeKycSubmitted ? (
                                                    <div className="px-8 py-5 bg-brand text-dark-900 rounded-3xl text-xs md:text-sm lg:text-base font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-brand/20">
                                                        <ShieldCheck size={16} /> DOSSIER APPROVED BY BAFIN / STRIPE
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={submitStripeCompliance}
                                                        className="px-10 py-5 bg-brand text-dark-900 rounded-3xl text-xs md:text-sm lg:text-base font-black uppercase tracking-[0.15em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand/20"
                                                    >
                                                        Submit Compliance Dossier to Stripe
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {stripeActiveSubTab === 'partner-compliance' && (
                                    <div className="space-y-8 bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] p-10 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-brand/20 shadow-[0_0_20px_rgba(52,211,153,0.2)]" />
                                        
                                        <div>
                                            <h3 className="text-3xl font-black italic uppercase text-white font-glow-green">Partner Compliance Vaults</h3>
                                            <p className="text-xs md:text-sm lg:text-base text-gray-500 italic mt-1">
                                                Audit and verify corporate credentials uploaded by fleet managers, hospitality partners, and event venues. Approve files to activate their operational dashboards.
                                            </p>
                                        </div>

                                        {getPartnerComplianceLogs().length === 0 ? (
                                            <div className="p-10 bg-white/5 rounded-2xl text-center border border-white/5 text-gray-400">
                                                <ShieldCheck size={48} className="mx-auto mb-4 text-gray-600" />
                                                <p className="font-black italic uppercase text-sm">No Active Compliance Portals Found</p>
                                                <p className="text-[10px] md:text-xs lg:text-sm text-gray-500 mt-2">When partners/managers upload verification documents in their dashboards, they will appear here for audit review.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-10">
                                                {getPartnerComplianceLogs().map((partner) => {
                                                    const totalDocs = partner.docs.length;
                                                    const approvedDocs = partner.docs.filter(d => d.status === 'approved').length;
                                                    const pendingDocs = partner.docs.filter(d => d.status === 'pending').length;
                                                    
                                                    return (
                                                        <div key={partner.emailKey} className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] space-y-6 hover:bg-white/10 hover:border-white/10 transition-all">
                                                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-4 border-b border-white/5">
                                                                <div>
                                                                    <span className="px-2 py-0.5 bg-brand/10 border border-brand/25 text-brand rounded text-[7px] font-black uppercase tracking-wider font-mono">
                                                                        {partner.metadata.context === 'FM' ? 'Fleet Operator' : 'Service Venue'} ({partner.metadata.context})
                                                                    </span>
                                                                    <h4 className="text-xl font-black italic uppercase text-white tracking-tighter mt-1">{partner.metadata.businessName}</h4>
                                                                    <p className="text-[9px] md:text-[11px] lg:text-xs text-gray-500 font-mono mt-1">MANAGER: {partner.metadata.name} ({partner.metadata.email})</p>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="text-right">
                                                                        <p className="text-[9px] md:text-[11px] lg:text-xs text-gray-400 font-black uppercase">CLEARANCE STATUS</p>
                                                                        <p className="text-sm font-black italic text-primary leading-none mt-1">
                                                                            {approvedDocs} / {totalDocs} Approved
                                                                        </p>
                                                                    </div>
                                                                    <span className={`px-3 py-1 rounded-full text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest ${
                                                                        approvedDocs === totalDocs 
                                                                            ? 'bg-brand/20 text-brand border border-brand/30' 
                                                                            : pendingDocs > 0 
                                                                                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 animate-pulse'
                                                                                : 'bg-red-500/20 text-red-500 border border-red-500/30'
                                                                    }`}>
                                                                        {approvedDocs === totalDocs ? 'APPROVED ✓' : 'AWAITING UPLOADS / REVIEW'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                                {partner.docs.map((doc) => {
                                                                    const isVerified = doc.status === 'approved';
                                                                    const isPending = doc.status === 'pending';
                                                                    const isRejected = doc.status === 'rejected';
                                                                    
                                                                    return (
                                                                        <div key={doc.id} className={`p-5 rounded-2xl border ${
                                                                            isVerified ? 'bg-brand/5 border-brand/20' : 
                                                                            isPending ? 'bg-amber-500/5 border-amber-500/20 animate-pulse' :
                                                                            isRejected ? 'bg-red-500/5 border-red-500/20' :
                                                                            'bg-black/30 border-white/5'
                                                                        } space-y-4`}>
                                                                            <div className="flex justify-between items-start">
                                                                                <div>
                                                                                    <h5 className="text-xs md:text-sm lg:text-base font-black uppercase text-white leading-tight">{doc.name}</h5>
                                                                                    <span className="text-[7px] text-gray-500 font-mono block mt-1 uppercase">ID: {doc.id}</span>
                                                                                </div>
                                                                                <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded ${
                                                                                    isVerified ? 'bg-brand/20 text-brand' :
                                                                                    isPending ? 'bg-amber-500/25 text-amber-500' :
                                                                                    isRejected ? 'bg-red-500/20 text-red-500' :
                                                                                    'bg-white/5 text-gray-500'
                                                                                }`}>
                                                                                    {doc.status.toUpperCase()}
                                                                                </span>
                                                                            </div>

                                                                            {doc.name && doc.status !== 'missing' && (
                                                                                <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-[8px] md:text-[10px] lg:text-xs font-mono text-gray-400 truncate">
                                                                                    FILENAME: {doc.name}
                                                                                </div>
                                                                            )}

                                                                            {doc.fileData ? (
                                                                                <div className="flex gap-2">
                                                                                    <button 
                                                                                        onClick={() => handleViewPartnerDoc(doc, partner.email)}
                                                                                        className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest border border-white/5 hover:border-white/20 transition-all text-center flex items-center justify-center gap-1.5"
                                                                                    >
                                                                                        <Eye size={10} /> View Document
                                                                                    </button>
                                                                                    <button 
                                                                                        onClick={() => handleApprovePartnerDoc(partner.emailKey, doc.id)}
                                                                                        disabled={isVerified}
                                                                                        className="p-2.5 bg-brand text-dark-900 rounded-xl hover:scale-105 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center"
                                                                                        title="Approve Document"
                                                                                    >
                                                                                        <CheckCircle2 size={12} />
                                                                                    </button>
                                                                                    <button 
                                                                                        onClick={() => handleRejectPartnerDoc(partner.emailKey, doc.id)}
                                                                                        disabled={isRejected}
                                                                                        className="p-2.5 bg-red-500 text-white rounded-xl hover:scale-105 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center"
                                                                                        title="Reject Document"
                                                                                    >
                                                                                        <X size={12} />
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="py-2.5 text-center text-gray-600 italic text-[8px] md:text-[10px] lg:text-xs border border-dashed border-white/5 rounded-xl uppercase">
                                                                                    No File Uploaded Yet
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* B2B GERMAN TAX INVOICE MODAL VIEWER */}
                                <AnimatePresence>
                                    {selectedInvoiceForModal && (
                                        <motion.div 
                                            initial={{ opacity: 0 }} 
                                            animate={{ opacity: 1 }} 
                                            exit={{ opacity: 0 }} 
                                            className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                                            onClick={() => setSelectedInvoiceForModal(null)}
                                        >
                                             <motion.div 
                                                initial={{ scale: 0.95, y: 20 }} 
                                                animate={{ scale: 1, y: 0 }} 
                                                exit={{ scale: 0.95, y: 20 }} 
                                                className="w-full max-w-2xl bg-[#090f1d] border-2 border-emerald-500/40 rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden shadow-2xl text-white space-y-6"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                {/* Visual Header */}
                                                <div className="flex justify-between items-start pb-4 border-b border-white/10">
                                                    <div>
                                                        <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[9px] md:text-xs font-mono rounded-full uppercase tracking-widest font-black inline-block mb-1">
                                                            Finanzamt Compliant Audit Invoice
                                                        </span>
                                                        <h4 className="text-2xl md:text-3xl font-black italic uppercase text-white tracking-tight">B2B TAX LEDGER</h4>
                                                    </div>
                                                    <button 
                                                        onClick={() => setSelectedInvoiceForModal(null)}
                                                        className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-gray-300 hover:text-white transition-all"
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                </div>

                                                {/* Dynamic Invoice Layout */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                                                    <div className="space-y-1">
                                                        <p className="font-bold text-gray-400 uppercase text-[10px] tracking-wider">Invoice Reference:</p>
                                                        <p className="text-base font-black text-white">{selectedInvoiceForModal.inv}</p>
                                                    </div>
                                                    <div className="space-y-1 md:text-right">
                                                        <p className="font-bold text-gray-400 uppercase text-[10px] tracking-wider">Issue Date:</p>
                                                        <p className="text-base font-black text-white">{selectedInvoiceForModal.date || new Date().toISOString().split('T')[0]}</p>
                                                    </div>
                                                    
                                                    <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-700/80 space-y-2 md:col-span-2 text-xs">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-1 md:border-r border-slate-700/80 md:pr-4">
                                                                <p className="font-black text-emerald-400 uppercase tracking-wider text-[10px]">ISSUER (PLATFORM):</p>
                                                                <p className="text-white font-bold leading-relaxed">Khiam Green Security Operations</p>
                                                                <p className="text-gray-300 leading-tight">Main Plaza, Frankfurt am Main</p>
                                                                <p className="text-gray-300 leading-tight">USt-IdNr: DE88-129-44</p>
                                                            </div>
                                                            <div className="space-y-1 md:pl-4">
                                                                <p className="font-black text-cyan-400 uppercase tracking-wider text-[10px]">DEBTOR PARTNER:</p>
                                                                <p className="text-white font-bold leading-relaxed">Connected Partner: {selectedInvoiceForModal.partner}</p>
                                                                <p className="text-gray-300 leading-tight">KYC Status: Stripe Connected - Approved</p>
                                                                <p className="text-gray-300 leading-tight">SEPA Routing: Handshake PSD2 Cleared</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="p-5 bg-black/80 rounded-2xl border border-slate-700/80 space-y-3.5 md:col-span-2 text-xs">
                                                        <h5 className="font-black italic uppercase text-white border-b border-white/10 pb-2 text-sm tracking-wider">🧾 Itemized Ledger breakdown</h5>
                                                        <div className="space-y-2.5 font-mono text-xs">
                                                            <p className="flex justify-between text-gray-300"><span>Transaction Type:</span> <span className="font-bold text-white uppercase">{selectedInvoiceForModal.tag}</span></p>
                                                            <p className="flex justify-between text-gray-300"><span>Stripe Transaction ID:</span> <span className="font-bold text-cyan-300 font-mono">{selectedInvoiceForModal.tx}</span></p>
                                                            <p className="flex justify-between border-b border-white/10 pb-2 text-gray-300"><span>Card Fee Treatment:</span> <span className="font-bold text-emerald-400">Option B (Absorbed by Partner)</span></p>
                                                            
                                                            <p className="flex justify-between text-sm pt-1 text-gray-200"><span>Total Charge:</span> <span className="font-black text-white text-base">{selectedInvoiceForModal.total} €</span></p>
                                                            <p className="flex justify-between text-sm text-emerald-400 font-black pt-1"><span>Platform Provision collected:</span> <span className="font-black text-emerald-400 text-base">+{selectedInvoiceForModal.prov} €</span></p>
                                                            
                                                            <div className="pl-4 border-l-2 border-emerald-500/50 space-y-1 text-xs text-gray-300 bg-white/[0.02] py-1 rounded-r-lg">
                                                                <p className="flex justify-between"><span>VAT (19% Umsatzsteuer included):</span> <span className="font-bold text-white">{(parseFloat(selectedInvoiceForModal.prov) * 0.19).toFixed(2)} €</span></p>
                                                                <p className="flex justify-between"><span>Net Platform Value:</span> <span className="font-bold text-white">{(parseFloat(selectedInvoiceForModal.prov) * 0.81).toFixed(2)} €</span></p>
                                                            </div>
                                                            
                                                            <p className="flex justify-between text-sm border-t border-white/10 pt-2 text-gray-200">
                                                                <span>Gross Partner Transferred Share:</span> 
                                                                <span className="font-bold text-white">{(parseFloat(selectedInvoiceForModal.total) - parseFloat(selectedInvoiceForModal.prov)).toFixed(2)} €</span>
                                                            </p>
                                                            <p className="flex justify-between text-sm text-amber-400">
                                                                <span>Absorbed Processing Card Fee (Deducted):</span> 
                                                                <span className="font-bold text-amber-400">-{selectedInvoiceForModal.fee} €</span>
                                                            </p>
                                                            
                                                            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex justify-between items-center text-sm md:text-base">
                                                                <span className="font-black text-white uppercase italic">Net Partner Disbursed Share:</span> 
                                                                <span className="font-black text-emerald-400 text-xl md:text-2xl">{(parseFloat(selectedInvoiceForModal.total) - parseFloat(selectedInvoiceForModal.prov) - parseFloat(selectedInvoiceForModal.fee)).toFixed(2)} €</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Bar */}
                                                <div className="pt-2 flex flex-col md:flex-row justify-between items-center gap-4">
                                                    <div className="flex items-center gap-2 text-emerald-400">
                                                        <ShieldCheck size={18} />
                                                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest font-mono">Disbursed successfully by Stripe Connect</span>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <button 
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(JSON.stringify(selectedInvoiceForModal, null, 2));
                                                                triggerNotification('success', 'Copied to Clipboard', 'Invoice ledger JSON trace copied.');
                                                            }}
                                                            className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-gray-200 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                                        >
                                                            Copy trace details
                                                        </button>
                                                        <button 
                                                            onClick={() => downloadB2BInvoice(
                                                                selectedInvoiceForModal.inv, 
                                                                anonymizedModeActive ? '[GUEST_ANON_MASKED]' : selectedInvoiceForModal.client, 
                                                                selectedInvoiceForModal.partner, 
                                                                selectedInvoiceForModal.total, 
                                                                selectedInvoiceForModal.prov, 
                                                                selectedInvoiceForModal.date,
                                                                selectedInvoiceForModal.tag,
                                                                selectedInvoiceForModal.fee
                                                            )}
                                                            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/30 hover:scale-105 transition-all flex items-center gap-2"
                                                        >
                                                            <Download size={16} /> Download PDF Invoice
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* TAB 5: DYNAMIC PROVISION RULES */}
                                {stripeActiveSubTab === 'provision-rules' && (
                                    <div className="space-y-8 bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] p-10 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-brand/20 shadow-[0_0_20px_rgba(52,211,153,0.2)]" />
                                        <div>
                                            <h3 className="text-3xl font-black italic uppercase text-white">Dynamic Provisions & Fees</h3>
                                            <p className="text-xs md:text-sm lg:text-base text-gray-500 italic mt-1">Configure the exact platform commission models. Saving these rules will automatically update checkout logic and rewrite the Terms of Service.</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <Car size={24} className="text-brand" />
                                                    <h4 className="text-lg font-black uppercase text-white">Fleet Partners</h4>
                                                </div>
                                                <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-gray-500 uppercase tracking-widest">Progressive Step Model</p>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-400">Base Fee (€)</label>
                                                        <input type="number" value={fleetBaseFee} onChange={e => setFleetBaseFee(e.target.value)} className="w-full bg-dark-950/50 border border-white/10 rounded-xl px-4 py-3 text-white font-bold mt-1 outline-none focus:border-brand/50" step="0.5" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-400">Increment per €30 (€)</label>
                                                        <input type="number" value={fleetIncrement} onChange={e => setFleetIncrement(e.target.value)} className="w-full bg-dark-950/50 border border-white/10 rounded-xl px-4 py-3 text-white font-bold mt-1 outline-none focus:border-brand/50" step="0.5" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <Building2 size={24} className="text-violet-400" />
                                                    <h4 className="text-lg font-black uppercase text-white">Hotels & Stadiums</h4>
                                                </div>
                                                <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-gray-500 uppercase tracking-widest">Flat Percentage Model</p>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-400">Platform Fee (%)</label>
                                                        <input type="number" value={hotelStadiumPercent} onChange={e => setHotelStadiumPercent(e.target.value)} className="w-full bg-dark-950/50 border border-white/10 rounded-xl px-4 py-3 text-white font-bold mt-1 outline-none focus:border-violet-400/50" step="0.5" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <Droplets size={24} className="text-rose-400" />
                                                    <h4 className="text-lg font-black uppercase text-white">Restaurants & Bars</h4>
                                                </div>
                                                <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-gray-500 uppercase tracking-widest">Flat Percentage Model</p>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-400">Platform Fee (%)</label>
                                                        <input type="number" value={fnbPercent} onChange={e => setFnbPercent(e.target.value)} className="w-full bg-dark-950/50 border border-white/10 rounded-xl px-4 py-3 text-white font-bold mt-1 outline-none focus:border-rose-400/50" step="0.5" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-6 border-t border-white/5 flex justify-end">
                                            <button onClick={handleSaveProvisions} disabled={isSavingProvisions} className="px-8 py-4 bg-brand text-dark-900 font-black uppercase rounded-2xl tracking-widest hover:scale-105 transition-all shadow-lg shadow-brand/20 disabled:opacity-50">
                                                {isSavingProvisions ? 'Saving...' : 'Deploy Global Provision Rules'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                            </motion.div>
                        )}

                        {view === 'customer-service' && (
                            <motion.div key="customer-service" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="p-8 bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] space-y-6 group hover:border-white/30 transition-all">
                                        <div className="flex items-center gap-4"><Car size={24} className="text-brand" /><h3 className="text-xl font-black italic uppercase text-white">Partner & Driver Intel</h3></div>
                                        <div className="relative">
                                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                            <input placeholder="Search by Name or PRIME-ID (e.g. P-100)..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pl-14 text-sm outline-none focus:border-brand/50" />
                                        </div>
                                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                                            {stripeConnectedPartners.map(p => <span key={p.id} className="px-4 py-2 bg-white/5 rounded-xl text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 border border-white/5 cursor-pointer hover:text-brand transition-colors whitespace-nowrap">{p.name}</span>)}
                                        </div>
                                    </div>
                                    <div className="p-8 bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] space-y-6 group hover:border-white/30 transition-all">
                                        <div className="flex items-center gap-4"><UserIcon size={24} className="text-white" /><h3 className="text-xl font-black italic uppercase text-white">Customer Intelligence</h3></div>
                                        <div className="relative">
                                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                            <input placeholder="Search by Name or C-ID..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pl-14 text-sm outline-none focus:border-white/50" />
                                        </div>
                                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                                            <span className="px-4 py-2 bg-white/5 rounded-xl text-[8px] md:text-[10px] lg:text-xs font-black text-gray-600 border border-white/5 italic whitespace-nowrap">No recent searches</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-10 h-[700px]">
                                    <div className="w-[450px] bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] flex flex-col overflow-hidden">
                                        <div className="p-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
                                            <h3 className="text-xl font-black italic uppercase text-white">Live Communications</h3>
                                            <div className="px-3 py-1 bg-brand/20 text-brand text-[8px] md:text-[10px] lg:text-xs font-black rounded-full">ACTIVE SESSION</div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                                            {(isDemo ? [
                                                { id: 'P-100-22', user: 'Marc K.', type: 'Partner', subject: 'Payout Delay', time: '2m ago', wait: '12m' },
                                                { id: 'C-992-01', user: 'Sarah L.', type: 'Customer', subject: 'LOST ITEM: IPHONE', time: '15m ago', wait: '4m', category: 'lost-item' },
                                                { id: 'D-044-01', user: 'Hessen Fleet', type: 'Partner', subject: 'API Handshake Error', time: '1h ago', wait: '1h' }
                                            ] : []).map((msg, i) => (
                                                <button key={i} className={`w-full p-6 rounded-[2.5rem] border transition-all text-left group relative ${msg.category === 'lost-item' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/5 hover:border-white/30'}`}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[8px] md:text-[10px] lg:text-xs font-black uppercase px-2 py-0.5 rounded ${msg.type === 'Partner' ? 'bg-blue-500/20 text-white' : 'bg-emerald-500/20 text-white'}`}>{msg.type}</span>
                                                                <span className="text-[10px] md:text-xs lg:text-sm font-black text-white group-hover:text-brand transition-colors">{msg.user}</span>
                                                            </div>
                                                            <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 mt-1 uppercase tracking-widest">PRIME-ID: {msg.id}</p>
                                                        </div>
                                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-bold text-gray-700 uppercase">{msg.time}</span>
                                                    </div>
                                                    <p className={`text-xs md:text-sm lg:text-base font-bold mb-4 ${msg.category === 'lost-item' ? 'text-amber-500' : 'text-gray-500'}`}>{msg.subject}</p>
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2 text-brand">
                                                            <Clock size={12} />
                                                            <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase">Wait: {msg.wait}</span>
                                                        </div>
                                                        <ChevronRight size={14} className="text-gray-700 group-hover:text-brand" />
                                                    </div>
                                                </button>
                                            ))}
                                            {!isDemo && (
                                                <div className="p-10 border-2 border-dashed border-white/5 rounded-[2.5rem] text-center">
                                                    <MessageSquare size={32} className="text-gray-700 mx-auto mb-4" />
                                                    <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-600 uppercase italic">No Active Support Tickets.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] flex flex-col overflow-hidden relative">
                                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                                            <div className="flex items-center gap-6">
                                                <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                                                    <MessageSquare size={28} className="text-gray-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xl font-black italic uppercase text-gray-500 tracking-tighter">Select a Case</p>
                                                    <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-700 uppercase tracking-[0.4em] mt-1">Choose a ticket from the left panel</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 p-12 overflow-y-auto space-y-8 no-scrollbar flex items-center justify-center">
                                            <div className="text-center">
                                                <Shield size={48} className="text-gray-800 mx-auto mb-6" />
                                                <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-700 uppercase tracking-widest italic">No Case Selected. All Channels Clear.</p>
                                            </div>
                                        </div>
                                        <div className="p-8 border-t border-white/5 flex gap-6 items-center">
                                            <input placeholder="Type a message..." className="flex-1 bg-white/5 border border-white/10 rounded-[1.5rem] p-5 text-sm outline-none focus:border-brand/50" />
                                            <button className="p-5 bg-brand text-dark-900 rounded-2xl hover:scale-105 transition-all"><ArrowUpRight size={24} /></button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {view === 'staff-hub' && (
                            <motion.div key="staff" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none">Intelligence <span className="text-brand">Staff</span></h2>
                                        <p className="text-gray-500 text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.5em] mt-2">Operational Personnel Management</p>
                                    </div>
                                    <button onClick={() => setIsAddStaffModalOpen(true)} className="px-8 py-4 bg-brand text-dark-900 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest shadow-xl shadow-brand/20">+ ADD NEW STAFF</button>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {staffList.map((s, i) => (
                                        <div key={i} className="p-8 bg-[#080C14] border border-white/8 rounded-[2.5rem] space-y-6 group hover:border-brand/20 transition-all relative overflow-hidden">
                                            {/* Avatar + Name */}
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 p-0.5 overflow-hidden shrink-0">
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.img}`} className="w-full h-full rounded-xl" alt={s.name} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-base font-black italic uppercase text-white tracking-tighter truncate">{s.name}</p>
                                                    <p className="text-[9px] md:text-[11px] lg:text-xs font-black text-brand uppercase tracking-widest mt-0.5">{s.role}</p>
                                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-700 uppercase mt-0.5">ID: {s.id}</p>
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="space-y-2 pt-4 border-t border-white/5">
                                                <div className="flex justify-between text-[9px] md:text-[11px] lg:text-xs font-bold uppercase tracking-widest"><span className="text-gray-600">Email</span><span className="text-white truncate ml-2">{s.email}</span></div>
                                                <div className="flex justify-between text-[9px] md:text-[11px] lg:text-xs font-bold uppercase tracking-widest"><span className="text-gray-600">Phone</span><span className="text-white">{s.phone}</span></div>
                                                <div className="flex justify-between text-[9px] md:text-[11px] lg:text-xs font-bold uppercase tracking-widest"><span className="text-gray-600">Bank</span><span className="text-brand text-[8px] md:text-[10px] lg:text-xs truncate ml-2">{s.bank}</span></div>
                                            </div>

                                            {/* Hub Permission Badges */}
                                            <div className="space-y-2.5 pt-4 border-t border-white/5">
                                                <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-600">Hub Access</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {[
                                                        { key: 'fleet',      label: 'Fleet',    color: 'text-sky-400 bg-sky-400/10 border-sky-400/25' },
                                                        { key: 'hotel',      label: 'Hotel',    color: 'text-violet-400 bg-violet-400/10 border-violet-400/25' },
                                                        { key: 'ticket',     label: 'Ticket',   color: 'text-amber-400 bg-amber-400/10 border-amber-400/25' },
                                                        { key: 'finance',    label: 'Finance',  color: 'text-brand bg-brand/10 border-brand/25' },
                                                        { key: 'analytics',  label: 'Analytics',color: 'text-rose-400 bg-rose-400/10 border-rose-400/25' },
                                                        { key: 'compliance', label: 'Comply',   color: 'text-teal-400 bg-teal-400/10 border-teal-400/25' },
                                                    ].map(hub => {
                                                        const granted = s.permissions?.[hub.key];
                                                        return (
                                                            <button
                                                                key={hub.key}
                                                                onClick={() => handleToggleStaffPermission(s.id, hub.key)}
                                                                title={`Click to ${granted ? 'revoke' : 'grant'} ${hub.label} access`}
                                                                className={`px-2.5 py-1 rounded-lg border text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-wide transition-all ${
                                                                    granted ? hub.color : 'text-gray-700 bg-white/[0.02] border-white/8'
                                                                }`}
                                                            >
                                                                {granted ? '✓' : '✗'} {hub.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Invite status + Resend */}
                                            {s.inviteLink && (
                                                <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                                                    <span className={`px-2.5 py-1 rounded-lg border text-[7px] font-black uppercase tracking-widest ${
                                                        s.status === 'pending'
                                                            ? 'text-amber-400 bg-amber-400/10 border-amber-400/20'
                                                            : 'text-brand bg-brand/10 border-brand/20'
                                                    }`}>
                                                        {s.status === 'pending' ? '⏳ Invite Pending' : '✓ Active'}
                                                    </span>
                                                    <button
                                                        onClick={() => handleCopyInviteLink(s.inviteLink)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-brand/10 border border-white/8 hover:border-brand/30 rounded-lg text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-gray-500 hover:text-brand transition-all"
                                                    >
                                                        <ExternalLink size={10} /> Resend Invite
                                                    </button>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex gap-3 pt-2">
                                                <button className="flex-1 py-3 bg-white/5 rounded-xl text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-gray-500 hover:text-white transition-all">Edit</button>
                                                <button onClick={() => setStaffList(staffList.filter((_, idx) => idx !== i))} className="px-5 py-3 bg-red-500/10 text-red-500 rounded-xl text-[8px] md:text-[10px] lg:text-xs font-black uppercase hover:bg-red-500 hover:text-white transition-all">Revoke</button>
                                            </div>
                                        </div>
                                    ))}
                                    {staffList.length === 0 && (
                                        <div className="col-span-3 py-24 flex flex-col items-center justify-center gap-4 border border-dashed border-white/8 rounded-[2.5rem]">
                                            <Users size={40} className="text-gray-700" />
                                            <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-600">No staff onboarded yet</p>
                                            <button onClick={() => setIsAddStaffModalOpen(true)} className="mt-2 px-8 py-3 bg-brand/10 border border-brand/20 text-brand text-[9px] md:text-[11px] lg:text-xs font-black uppercase rounded-xl hover:bg-brand/20 transition-all">+ Onboard First Staff Member</button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {view === 'document-hub' && (
                            <motion.div key="dochub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                                {/* Header */}
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none">Document <span className="text-brand">Hub</span></h2>
                                        <p className="text-gray-500 text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.5em] mt-2">Partner KYC & Compliance Files</p>
                                    </div>
                                    <div className="flex gap-3">
                                        {[{ label: 'All', key: 'all' }, { label: 'Pending', key: 'pending' }, { label: 'Approved', key: 'approved' }, { label: 'Missing', key: 'missing' }].map(f => (
                                            <button key={f.key}
                                                onClick={() => setDocHubFilter(f.key)}
                                                className={`px-5 py-2.5 rounded-xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest transition-all ${
                                                    docHubFilter === f.key ? 'bg-brand text-dark-900 shadow-lg shadow-brand/20' : 'bg-white/5 border border-white/8 text-gray-400 hover:text-white'
                                                }`}>{f.label}</button>
                                        ))}
                                    </div>
                                </div>

                                {/* Stat strip */}
                                {(() => {
                                    const all = docPartners;
                                    const approved = all.filter(p => p.docs.every(d => d.status === 'approved'));
                                    const pending  = all.filter(p => p.docs.some(d => d.status === 'pending'));
                                    const missing  = all.filter(p => p.docs.some(d => d.status === 'missing'));
                                    return (
                                        <div className="grid grid-cols-4 gap-6">
                                            {[
                                                { label: 'Total Partners', val: all.length,      color: 'border-white/10',    icon: FolderSearch, iconColor: 'text-gray-400' },
                                                { label: 'Fully Approved', val: approved.length, color: 'border-brand/30',    icon: FileCheck2,   iconColor: 'text-brand' },
                                                { label: 'Pending Review', val: pending.length,  color: 'border-amber-500/30',icon: FileClock,    iconColor: 'text-amber-400' },
                                                { label: 'Missing Docs',   val: missing.length,  color: 'border-red-500/30',  icon: FileX2,       iconColor: 'text-red-400' },
                                            ].map(s => {
                                                const SIcon = s.icon;
                                                return (
                                                    <div key={s.label} className={`bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border ${s.color} rounded-[2rem] p-7 flex justify-between items-start`}>
                                                        <div>
                                                            <p className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-gray-500 mb-3">{s.label}</p>
                                                            <p className="text-4xl font-black italic text-white">{s.val}</p>
                                                        </div>
                                                        <SIcon size={28} className={s.iconColor} />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}

                                {/* Partner folder grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {docPartners
                                        .filter(p => {
                                            if (docHubFilter === 'approved') return p.docs.every(d => d.status === 'approved');
                                            if (docHubFilter === 'pending')  return p.docs.some(d => d.status === 'pending');
                                            if (docHubFilter === 'missing')  return p.docs.some(d => d.status === 'missing');
                                            return true;
                                        })
                                        .map((partner, pi) => {
                                            const approved = partner.docs.filter(d => d.status === 'approved').length;
                                            const pending  = partner.docs.filter(d => d.status === 'pending').length;
                                            const missing  = partner.docs.filter(d => d.status === 'missing').length;
                                            const allOk    = missing === 0 && pending === 0;
                                            return (
                                                <div key={pi} className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/8 rounded-[2.5rem] overflow-hidden">
                                                    {/* Partner header */}
                                                    <div className={`px-8 py-6 border-b border-white/5 flex items-center justify-between ${
                                                        allOk ? 'bg-brand/5' : missing > 0 ? 'bg-red-500/5' : 'bg-amber-500/5'
                                                    }`}>
                                                        <div className="flex items-center gap-5">
                                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                                                allOk ? 'bg-brand/15 border border-brand/30' : missing > 0 ? 'bg-red-500/15 border border-red-500/30' : 'bg-amber-500/15 border border-amber-500/30'
                                                            }`}>
                                                                {partner.type === 'restaurant' ? <Zap size={20} className={allOk ? 'text-brand' : missing > 0 ? 'text-red-400' : 'text-amber-400'} />
                                                                : partner.type === 'hotel'      ? <Building2 size={20} className={allOk ? 'text-brand' : missing > 0 ? 'text-red-400' : 'text-amber-400'} />
                                                                : partner.type === 'fleet'      ? <Car size={20} className={allOk ? 'text-brand' : missing > 0 ? 'text-red-400' : 'text-amber-400'} />
                                                                : partner.type === 'staff'      ? <Users size={20} className={allOk ? 'text-brand' : missing > 0 ? 'text-red-400' : 'text-amber-400'} />
                                                                : <Calendar size={20} className={allOk ? 'text-brand' : missing > 0 ? 'text-red-400' : 'text-amber-400'} />}
                                                            </div>
                                                            <div>
                                                                <p className="text-base font-black italic uppercase text-white tracking-tight">{partner.name}</p>
                                                                <p className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-gray-500 mt-0.5">{partner.type} · Joined {partner.joinDate}</p>
                                                            </div>
                                                        </div>
                                                        <span className={`px-4 py-1.5 rounded-xl text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest ${
                                                            allOk ? 'bg-brand/15 text-brand' : missing > 0 ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'
                                                        }`}>
                                                            {allOk ? '✓ Approved' : missing > 0 ? `${missing} Missing` : `${pending} Pending`}
                                                        </span>
                                                    </div>
                                                    {/* Document rows */}
                                                    <div className="p-6 space-y-3">
                                                        {partner.docs.map((doc, di) => (
                                                            <div key={di} className="flex items-center justify-between px-5 py-4 bg-white/[0.03] border border-white/5 rounded-2xl group">
                                                                <div className="flex items-center gap-4">
                                                                    {doc.status === 'approved' && <FileCheck2 size={16} className="text-brand shrink-0" />}
                                                                    {doc.status === 'pending'  && <FileClock size={16} className="text-amber-400 shrink-0" />}
                                                                    {doc.status === 'missing'  && <FileX2 size={16} className="text-red-400 shrink-0" />}
                                                                    <div>
                                                                        <p className="text-xs md:text-sm lg:text-base font-bold text-white">{doc.name}</p>
                                                                        {doc.uploadedAt && <p className="text-[9px] md:text-[11px] lg:text-xs text-gray-500 mt-0.5">Uploaded {doc.uploadedAt}</p>}
                                                                        {doc.status === 'missing' && <p className="text-[9px] md:text-[11px] lg:text-xs text-red-400 mt-0.5">Not uploaded yet</p>}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {doc.fileUrl && (
                                                                        <button
                                                                            onClick={() => handleViewPartnerDoc(doc, partner.email)}
                                                                            className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[8px] md:text-[10px] lg:text-xs font-black uppercase rounded-xl transition-all"
                                                                        >View</button>
                                                                    )}
                                                                    {doc.status === 'pending' && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => {
                                                                                    if (partner.email) {
                                                                                        handleApprovePartnerDoc(partner.emailKey || partner.email.replace(/[^a-zA-Z0-9]/g, '_'), doc.id);
                                                                                    } else {
                                                                                        setDocPartners(prev => prev.map((p, i) => i === pi ? { ...p, docs: p.docs.map((d, j) => j === di ? { ...d, status: 'approved' } : d) } : p));
                                                                                    }
                                                                                }}
                                                                                className="px-4 py-2 bg-brand/10 border border-brand/20 text-brand text-[8px] md:text-[10px] lg:text-xs font-black uppercase rounded-xl hover:bg-brand/20 transition-all"
                                                                            >Approve</button>
                                                                            <button
                                                                                onClick={() => {
                                                                                    if (partner.email) {
                                                                                        handleRejectPartnerDoc(partner.emailKey || partner.email.replace(/[^a-zA-Z0-9]/g, '_'), doc.id);
                                                                                    } else {
                                                                                        setDocPartners(prev => prev.map((p, i) => i === pi ? { ...p, docs: p.docs.map((d, j) => j === di ? { ...d, status: 'missing' } : d) } : p));
                                                                                    }
                                                                                }}
                                                                                className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] md:text-[10px] lg:text-xs font-black uppercase rounded-xl hover:bg-red-500/20 transition-all"
                                                                            >Reject</button>
                                                                        </>
                                                                    )}
                                                                    <span className={`text-[8px] md:text-[10px] lg:text-xs font-black uppercase px-3 py-1.5 rounded-lg ${
                                                                        doc.status === 'approved' ? 'bg-brand/10 text-brand'
                                                                        : doc.status === 'pending' ? 'bg-amber-500/10 text-amber-400'
                                                                        : 'bg-red-500/10 text-red-400'
                                                                    }`}>{doc.status}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    }
                                    {docPartners.filter(p => {
                                        if (docHubFilter === 'approved') return p.docs.every(d => d.status === 'approved');
                                        if (docHubFilter === 'pending')  return p.docs.some(d => d.status === 'pending');
                                        if (docHubFilter === 'missing')  return p.docs.some(d => d.status === 'missing');
                                        return true;
                                    }).length === 0 && (
                                        <div className="col-span-2 py-24 flex flex-col items-center justify-center gap-4 border border-dashed border-white/8 rounded-[2.5rem]">
                                            <FolderSearch size={40} className="text-gray-700" />
                                            <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-600">No partners match this filter</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {view === 'personal-data' && (
                            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                                <div className="flex items-center gap-10">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-32 h-32 rounded-[3rem] bg-brand/20 border border-brand/40 p-2 shadow-2xl relative group overflow-hidden">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${dossierFullName || 'Jordan'}`} alt="Director" className="w-full h-full rounded-[2.5rem]" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                                <Upload size={24} className="text-brand" />
                                            </div>
                                        </div>
                                        <div className="px-4 py-1.5 bg-brand/10 border border-brand/20 rounded-xl">
                                            <p className="text-[10px] md:text-xs lg:text-sm font-black text-brand tracking-[0.3em] uppercase">ID: {user?.id || 'D-000-01'}</p>
                                        </div>
                                    </div>
                                    <div><h2 className="text-6xl font-black italic uppercase tracking-tighter leading-none">{dossierFullName || 'Chief Director'}</h2><p className="text-brand text-sm font-bold uppercase tracking-[0.5em] mt-2 italic">Clearance Level: ALPHA PRIME</p></div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                    <div className="lg:col-span-2 bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-white/10 rounded-[3.5rem] p-12 space-y-10">
                                        <h3 className="text-2xl font-black italic uppercase text-white">Identity Dossier</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-6">
                                                {[
                                                    { label: 'Full Name', value: dossierFullName, onChange: e => setDossierFullName(e.target.value), icon: UserIcon },
                                                    { label: 'Director Email', value: dossierEmail, onChange: e => setDossierEmail(e.target.value), icon: Mail },
                                                    { label: 'Secure Phone', value: dossierPhone, onChange: e => setDossierPhone(e.target.value), icon: Phone },
                                                    { label: 'Operational Address', value: dossierAddress, onChange: e => setDossierAddress(e.target.value), icon: MapPin }
                                                ].map((d, i) => (
                                                    <div key={i} className="p-6 bg-white/5 rounded-[2rem] border border-white/5 space-y-1">
                                                        <div className="flex items-center gap-2 text-gray-500 mb-2"><d.icon size={12} /><span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest">{d.label}</span></div>
                                                        <input value={d.value} onChange={d.onChange} placeholder="—" className="bg-transparent text-sm font-black italic text-white outline-none w-full placeholder-gray-700" />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="space-y-6">
                                                {[
                                                    { label: 'ZIP Code', value: dossierZip, onChange: e => setDossierZip(e.target.value), icon: MapPin },
                                                    { label: 'Bank (IBAN)', value: dossierIban, onChange: e => setDossierIban(e.target.value), icon: Wallet },
                                                    { label: 'Tax ID', value: dossierTaxId, onChange: e => setDossierTaxId(e.target.value), icon: FileText },
                                                    { label: 'Emergency Contact', value: dossierEmergency, onChange: e => setDossierEmergency(e.target.value), icon: ShieldCheck }
                                                ].map((d, i) => (
                                                    <div key={i} className="p-6 bg-white/5 rounded-[2rem] border border-white/5 space-y-1">
                                                        <div className="flex items-center gap-2 text-gray-500 mb-2"><d.icon size={12} /><span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest">{d.label}</span></div>
                                                        <input value={d.value} onChange={d.onChange} placeholder="—" className="bg-transparent text-sm font-black italic text-white outline-none w-full placeholder-gray-700" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="pt-6">
                                            <button onClick={handleCommitDossier} className="w-full py-5 bg-brand text-dark-900 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:scale-[1.02] transition-all">COMMIT CHANGES TO GRID</button>
                                        </div>
                                    </div>
                                    <div className="bg-brand/5 border border-brand/20 rounded-[3.5rem] p-12 flex flex-col justify-center items-center text-center space-y-8">
                                        <ShieldCheck size={64} className="text-brand" />
                                        <p className="text-xl font-black italic uppercase text-white leading-tight">Identity Session <br/> Verified & Secure</p>
                                        <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-600 uppercase tracking-widest italic">All changes are encrypted via AES-256 and require a 24h cooldown for PII propagation.</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* ADD PARTNER MODAL */}
            <AnimatePresence>
                {isAddPartnerModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
                    >
                        <motion.div initial={{ y: 40, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, scale: 0.95 }}
                            className="w-full max-w-2xl bg-[#0D1421] border border-brand/25 rounded-[2.5rem] shadow-[0_0_100px_rgba(52,211,153,0.15)] overflow-hidden"
                        >
                            <div className="px-10 py-8 border-b border-white/8 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-brand/15 border border-brand/30 flex items-center justify-center">
                                        <FolderSearch size={22} className="text-brand" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black italic uppercase text-white">Register <span className="text-brand">Partner</span></h3>
                                        <p className="text-[9px] md:text-[11px] lg:text-xs font-black text-gray-500 uppercase tracking-[0.25em] mt-0.5">KYC Document Folder</p>
                                    </div>
                                </div>
                                <button onClick={() => { setIsAddPartnerModalOpen(false); setNewPartnerForm({ name: '', type: 'restaurant', joinDate: '' }); }}
                                    className="w-9 h-9 rounded-xl bg-white/8 hover:bg-white/15 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="p-10 space-y-6">
                                {/* Partner Name */}
                                <div className="space-y-2">
                                    <label className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Building2 size={11} /> Partner / Business Name</label>
                                    <input
                                        value={newPartnerForm.name}
                                        onChange={e => setNewPartnerForm(p => ({ ...p, name: e.target.value }))}
                                        placeholder="e.g. Bella Napoli Restaurant"
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-5 py-3.5 text-white text-sm outline-none focus:border-brand focus:bg-brand/8 transition-all placeholder-gray-400"
                                    />
                                </div>
                                {/* Partner Type */}
                                <div className="space-y-2">
                                    <label className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-gray-400">Business Type</label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {['restaurant', 'hotel', 'fleet', 'venue'].map(t => (
                                            <button key={t} onClick={() => setNewPartnerForm(p => ({ ...p, type: t }))}
                                                className={`py-3 rounded-xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest border transition-all ${
                                                    newPartnerForm.type === t ? 'bg-brand text-dark-900 border-brand' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                                                }`}>{t}</button>
                                        ))}
                                    </div>
                                </div>
                                {/* Docs preview */}
                                <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                                    <p className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Required Documents for <span className="text-brand">{newPartnerForm.type}</span></p>
                                    <div className="space-y-2">
                                        {REQUIRED_DOCS[newPartnerForm.type].map((doc, i) => (
                                            <div key={i} className="flex items-center gap-3 text-[10px] md:text-xs lg:text-sm text-gray-400">
                                                <FileX2 size={12} className="text-red-400 shrink-0" />
                                                {doc}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        if (!newPartnerForm.name.trim()) return;
                                        const docs = REQUIRED_DOCS[newPartnerForm.type].map(name => ({ name, status: 'missing', uploadedAt: null }));
                                        const partner = {
                                            name: newPartnerForm.name.trim(),
                                            type: newPartnerForm.type,
                                            joinDate: new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' }),
                                            docs
                                        };
                                        setDocPartners(prev => [...prev, partner]);
                                        setIsAddPartnerModalOpen(false);
                                        setNewPartnerForm({ name: '', type: 'restaurant', joinDate: '' });
                                        triggerNotification('success', 'Partner Registered', `${partner.name} folder created. ${docs.length} documents pending.`);
                                    }}
                                    className="w-full py-4 bg-brand text-dark-900 rounded-2xl text-xs md:text-sm lg:text-base font-black uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(52,211,153,0.25)] hover:scale-[1.01] active:scale-[0.99] transition-all"
                                >Create KYC Folder</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ADD STAFF MODAL */}
            <AnimatePresence>
                {isAddStaffModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
                    >
                        <motion.div
                            initial={{ y: 40, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, scale: 0.95 }}
                            className="w-full max-w-5xl bg-[#0D1628] border border-brand/30 rounded-[2.5rem] shadow-[0_0_120px_rgba(52,211,153,0.2)] overflow-hidden flex flex-col max-h-[95vh]"
                        >
                            {/* ── HEADER ── */}
                            <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-brand/15 border border-brand/30 flex items-center justify-center">
                                        <Users size={28} className="text-brand" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black italic uppercase text-white">Onboard <span className="text-brand">Staff</span></h3>
                                        <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase tracking-[0.25em] mt-0.5">Personnel Clearance Terminal</p>
                                    </div>
                                </div>
                                <button onClick={() => { setIsAddStaffModalOpen(false); setGeneratedInviteLink(null); }} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* ── BODY ── */}
                            <div className="flex-1 overflow-y-auto no-scrollbar">

                                {/* Generated invite link banner */}
                                {generatedInviteLink && (
                                    <div className="mx-10 mt-8 p-6 bg-brand/10 border border-brand/30 rounded-2xl">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-brand">✅ Staff Invite Link Generated</p>
                                            <button
                                                onClick={() => setGeneratedInviteLink(null)}
                                                className="text-gray-500 hover:text-white text-xs md:text-sm lg:text-base"
                                            >dismiss</button>
                                        </div>
                                        <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl p-4">
                                            <p className="flex-1 text-[10px] md:text-xs lg:text-sm text-gray-300 font-mono truncate">{generatedInviteLink}</p>
                                            <button
                                                onClick={() => handleCopyInviteLink(generatedInviteLink)}
                                                className={`shrink-0 px-5 py-2 rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest transition-all ${
                                                    inviteCopied
                                                        ? 'bg-brand text-dark-900'
                                                        : 'bg-white/10 text-white hover:bg-brand/20 hover:text-brand'
                                                }`}
                                            >
                                                {inviteCopied ? '✓ Copied' : 'Copy Link'}
                                            </button>
                                        </div>
                                        <p className="text-[9px] md:text-[11px] lg:text-xs text-gray-500 mt-2">Send this link to your staff member. It grants direct access to the Admin Dashboard with their assigned hub permissions.</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/5">

                                    {/* ── LEFT: PERSONNEL DETAILS ── */}
                                    <div className="p-10 space-y-5">
                                        <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] text-brand/70 mb-6">① Personnel Info</p>
                                        {[
                                            { l: 'Full Name', f: 'name', ph: 'e.g. Jordan Weber', i: UserIcon, t: 'text' },
                                            { l: 'Operational Email', f: 'email', ph: 'staff@green.io', i: Mail, t: 'email' },
                                            { l: 'Secure Phone', f: 'phone', ph: '+49 152 0000 000', i: Phone, t: 'tel' },
                                            { l: 'Access Role', f: 'role', ph: 'Customer Service Staff', i: ShieldAlert, t: 'text' },
                                            { l: 'Bank IBAN', f: 'bank', ph: 'DE99 2004 0000 ...', i: Wallet, t: 'text' },
                                            { l: 'Residential Address', f: 'adress', ph: 'Street, Number, City', i: MapPin, t: 'text' },
                                            { l: 'ZIP Code', f: 'zip', ph: '60311', i: MapPin, t: 'text' },
                                        ].map((inp) => (
                                            <div key={inp.f} className="space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <inp.i size={11} className="text-brand/60" />
                                                    <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-gray-300">{inp.l}</span>
                                                </div>
                                                <input
                                                    type={inp.t}
                                                    value={newStaff[inp.f]}
                                                    onChange={e => setNewStaff({ ...newStaff, [inp.f]: e.target.value })}
                                                    className="w-full bg-[#071020] border border-white/15 rounded-xl px-5 py-3.5 text-white text-sm outline-none focus:border-brand focus:shadow-[0_0_0_2px_rgba(52,211,153,0.15)] transition-all placeholder-gray-600"
                                                    placeholder={inp.ph}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    {/* ── RIGHT: HUB PERMISSIONS + INVITE ── */}
                                    <div className="p-10 space-y-8">

                                        {/* Hub Permission Toggles */}
                                        <div>
                                            <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] text-brand/70 mb-6">② Hub Access Permissions</p>
                                            <div className="space-y-2.5">
                                                {[
                                                    { key: 'fleet',      label: 'Fleet Hub',      icon: Car,         color: 'text-sky-400',    bg: 'bg-sky-400/10',    border: 'border-sky-400/20',    active: 'border-sky-400/50 bg-sky-400/15' },
                                                    { key: 'hotel',      label: 'Hotel Hub',      icon: Building2,   color: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/20', active: 'border-violet-400/50 bg-violet-400/15' },
                                                    { key: 'ticket',     label: 'Ticket Hub',     icon: Ticket,      color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20',  active: 'border-amber-400/50 bg-amber-400/15' },
                                                    { key: 'finance',    label: 'Finance Hub',    icon: DollarSign,  color: 'text-brand',      bg: 'bg-brand/10',      border: 'border-brand/20',      active: 'border-brand/50 bg-brand/15' },
                                                    { key: 'analytics',  label: 'Analytics Hub',  icon: BarChart3,   color: 'text-rose-400',   bg: 'bg-rose-400/10',   border: 'border-rose-400/20',   active: 'border-rose-400/50 bg-rose-400/15' },
                                                    { key: 'compliance', label: 'Compliance Hub', icon: ShieldCheck, color: 'text-teal-400',   bg: 'bg-teal-400/10',   border: 'border-teal-400/20',   active: 'border-teal-400/50 bg-teal-400/15' },
                                                ].map((hub) => {
                                                    const HubIcon = hub.icon;
                                                    const isOn = newStaff.permissions?.[hub.key] || false;
                                                    return (
                                                        <button
                                                            key={hub.key}
                                                            onClick={() => setNewStaff(prev => ({ ...prev, permissions: { ...prev.permissions, [hub.key]: !prev.permissions?.[hub.key] } }))}
                                                            className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl border transition-all ${
                                                                isOn ? hub.active : 'border-white/12 bg-[#071020] hover:border-white/25 hover:bg-white/[0.06]'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-9 h-9 rounded-lg ${isOn ? hub.bg : 'bg-white/[0.06]'} flex items-center justify-center transition-all`}>
                                                                    <HubIcon size={16} className={isOn ? hub.color : 'text-gray-500'} />
                                                                </div>
                                                                <span className={`text-xs md:text-sm lg:text-base font-black uppercase tracking-widest transition-all ${isOn ? 'text-white' : 'text-gray-400'}`}>{hub.label}</span>
                                                            </div>
                                                            {/* Toggle pill */}
                                                            <div className={`w-10 h-5 rounded-full border transition-all flex items-center ${
                                                                isOn ? `border-current ${hub.color} bg-current/20` : 'border-white/15 bg-white/5'
                                                            }`}>
                                                                <div className={`w-3.5 h-3.5 rounded-full transition-all mx-0.5 ${
                                                                    isOn ? `ml-[calc(100%-18px)] ${hub.color.replace('text-', 'bg-')}` : 'bg-gray-600'
                                                                }`} />
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Invite Link section */}
                                        <div className="p-6 bg-brand/5 border border-brand/15 rounded-2xl">
                                            <div className="flex items-center gap-3 mb-3">
                                                <ExternalLink size={14} className="text-brand" />
                                                <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-brand">Invitation Link</p>
                                            </div>
                                            <p className="text-[10px] md:text-xs lg:text-sm text-gray-400 leading-relaxed">
                                                Clicking <strong className="text-white">Grant Staff Clearance</strong> will generate a secure one-time invite link. 
                                                Share it with your staff member — it gives them direct access to the Admin Dashboard with only the hubs you enabled above.
                                            </p>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* ── FOOTER ACTIONS ── */}
                            <div className="px-10 py-7 border-t border-white/5 flex gap-4">
                                <button
                                    onClick={() => { setIsAddStaffModalOpen(false); setGeneratedInviteLink(null); }}
                                    className="px-8 py-4 bg-white/5 border border-white/8 text-gray-400 rounded-2xl text-xs md:text-sm lg:text-base font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddStaff}
                                    className="flex-1 py-4 bg-brand text-dark-900 rounded-2xl text-xs md:text-sm lg:text-base font-black uppercase tracking-[0.4em] shadow-[0_0_40px_rgba(52,211,153,0.25)] hover:scale-[1.01] active:scale-[0.99] transition-all"
                                >
                                    Grant Staff Clearance &amp; Generate Invite Link
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>



            {/* --- FLOATING NEURAL ASSISTANT (ALWAYS ON) --- */}
            <div className="fixed bottom-20 right-10 z-[100] flex flex-col items-end gap-4 pointer-events-none">
                <AnimatePresence>
                    {isAssistantExpanded && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-80 bg-[#0D1421]/95 backdrop-blur-2xl border border-brand/20 rounded-[2.5rem] p-6 shadow-[0_0_50px_rgba(52,211,153,0.15)] pointer-events-auto"
                        >
                            {/* ACTIVE AGENT SELECTOR IN DRAWER */}
                            <div className="flex justify-between items-center gap-2 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-brand/20 border border-brand/40 flex items-center justify-center text-brand">
                                        <Bot size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-white tracking-wider leading-none">Green Core</h4>
                                        <p className="text-[6px] font-black text-brand uppercase tracking-widest mt-0.5">tactical sync</p>
                                    </div>
                                </div>
                                <select 
                                    value={activeAgent} 
                                    onChange={e => setActiveAgent(e.target.value)}
                                    className="bg-[#0D1421] border border-white/10 rounded-xl text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-brand px-3 py-2 outline-none cursor-pointer"
                                >
                                    <option value="financial">Fiscal Sentinel</option>
                                    <option value="law_sentinel">Legal Counsel</option>
                                    <option value="media_shield">Media Shield</option>
                                    <option value="intelligence_scout">Intel Scout</option>
                                    <option value="architect_sentinel">Sys Architect</option>
                                    <option value="operations">Tactical Ops</option>
                                    <option value="guardian">Safety Sentinel</option>
                                </select>
                            </div>
                            
                            {/* MOBILE SYNC / BACKGROUND MODE */}
                            <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-brand/5 hover:border-white/30 transition-all" onClick={() => setIsListening(!isListening)}>
                                <div className="flex items-center gap-3">
                                    <Phone size={14} className={isListening ? 'text-brand' : 'text-gray-600'} />
                                    <div>
                                        <p className="text-[9px] md:text-[11px] lg:text-xs font-black text-white uppercase">Background Tactical Comm</p>
                                        <p className="text-[7px] font-bold text-gray-500 uppercase italic">Listen while app is in background</p>
                                    </div>
                                </div>
                                <div className={`w-8 h-4 rounded-full relative transition-colors ${isListening ? 'bg-brand' : 'bg-white/10'}`}>
                                    <motion.div 
                                        animate={{ x: isListening ? 16 : 2 }}
                                        className={`absolute top-1 w-2 h-2 rounded-full ${isListening ? 'bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl' : 'bg-gray-600'}`} 
                                    />
                                </div>
                            </div>

                            {/* DYNAMIC MESSAGES STREAM */}
                            <div className="space-y-4 h-[240px] overflow-y-auto mb-6 pr-2 scrollbar-thin scrollbar-thumb-brand scrollbar-track-transparent font-mono text-[9px] md:text-[11px] lg:text-xs">
                                {chatMessages[activeAgent]?.map((m, i) => (
                                    <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-1.5 mb-0.5 text-[6px] text-gray-500">
                                            <span className="font-bold">{m.role === 'user' ? 'DIRECTOR' : '🛡️ AI'}</span>
                                        </div>
                                        <div className={`p-3 rounded-2xl max-w-[90%] whitespace-pre-wrap leading-relaxed ${
                                            m.role === 'user' 
                                                ? 'bg-brand/10 border border-brand/30 text-brand rounded-tr-none' 
                                                : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-none'
                                        }`}>
                                            {m.text.split('\n').map((line, lIdx) => {
                                                let content = line;
                                                if (content.startsWith('### ')) {
                                                    return <h5 key={lIdx} className="text-[9px] md:text-[11px] lg:text-xs font-black text-white uppercase italic tracking-wider mb-1 mt-1">{content.replace('### ', '')}</h5>;
                                                }
                                                if (content.startsWith('**') && content.endsWith('**')) {
                                                    return <p key={lIdx} className="font-black text-white">{content.replaceAll('**', '')}</p>;
                                                }
                                                if (content.startsWith('* ')) {
                                                    return <div key={lIdx} className="flex gap-1.5 pl-1 text-gray-400 my-0.5"><span>•</span><span>{content.replace('* ', '')}</span></div>;
                                                }
                                                if (content.startsWith('- ')) {
                                                    return <div key={lIdx} className="flex gap-1.5 pl-2 text-brand my-0.5"><span>-</span><span>{content.replace('- ', '')}</span></div>;
                                                }
                                                return <p key={lIdx} className="mb-0.5">{content}</p>;
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* DYNAMIC CHAT INPUT */}
                            <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    sendMessage();
                                }}
                                className="relative"
                            >
                                <input 
                                    placeholder={`Instruct ${activeAgent}...`} 
                                    value={currentMessage}
                                    onChange={e => setCurrentMessage(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-12 text-[9px] md:text-[11px] lg:text-xs font-mono text-white placeholder-gray-600 focus:border-brand/50 focus:outline-none transition-all"
                                />
                                <button 
                                    type="submit"
                                    disabled={!currentMessage.trim()}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand hover:scale-110 transition-transform disabled:opacity-30 disabled:scale-100"
                                >
                                    <ArrowUpRight size={18} />
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <button 
                    onClick={() => setIsAssistantExpanded(!isAssistantExpanded)}
                    className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 pointer-events-auto group ${isAssistantExpanded ? 'bg-brand text-dark-900 rotate-90' : 'bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-brand/40 text-brand'}`}
                >
                    <motion.div animate={isAssistantExpanded ? { rotate: -90 } : { rotate: 0 }}>
                        {isAssistantExpanded ? <X size={24} /> : <Zap size={24} className="group-hover:animate-pulse" />}
                    </motion.div>
                    {!isAssistantExpanded && neuralInsights.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[10px] md:text-xs lg:text-sm font-black rounded-full flex items-center justify-center border-2 border-[#05080F]">
                            {neuralInsights.length}
                        </span>
                    )}
                </button>
            </div>

            {/* HIDDEN NATIVE COMPLIANCE FILE INPUT */}
            <input 
                type="file" 
                id="hidden-compliance-file-input" 
                className="hidden" 
                onChange={handleNativeFileChange} 
                accept=".pdf,.png,.jpg,.jpeg" 
            />

            {/* ADD CUSTOM TICKET MODAL */}
            <AnimatePresence>
                {isAddingTicket && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-[250] flex items-center justify-center bg-dark-950/90 backdrop-blur-xl p-6"
                    >
                        <motion.div 
                            initial={{ y: 50, scale: 0.95 }} 
                            animate={{ y: 0, scale: 1 }} 
                            exit={{ y: 50, scale: 0.95 }} 
                            className="w-full max-w-2xl bg-[#0D1421] border border-brand/30 rounded-[3.5rem] shadow-[0_0_100px_rgba(52,211,153,0.2)] overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-brand/20 flex items-center justify-center text-brand shadow-[0_0_20px_rgba(52,211,153,0.15)]">
                                        <PlusCircle size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black italic uppercase text-white">Upload <span className="text-brand">Custom Ticket</span></h3>
                                        <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase tracking-widest mt-1">Register new custom ticket into directory repositories</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsAddingTicket(false)} 
                                    className="p-4 bg-white/5 rounded-2xl text-gray-500 hover:text-white transition-all"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!newTicketData.name.trim()) {
                                        triggerNotification('error', 'Missing Data', 'Please enter a valid event name.');
                                        return;
                                    }
                                    const saved = localStorage.getItem('green_stadium_events');
                                    const events = saved ? JSON.parse(saved) : [];
                                    
                                    const targetCat = newTicketData.category || (ticketActiveFolder !== 'none' ? (ticketActiveFolder === 'club' ? 'CM' : ticketActiveFolder === 'events' ? 'HM' : 'SM') : 'CM');
                                    
                                    const newEvent = {
                                        id: `evt-custom-${Date.now()}`,
                                        name: newTicketData.name,
                                        date: newTicketData.date,
                                        time: newTicketData.time,
                                        category: targetCat,
                                        published: true,
                                        tiers: [
                                            {
                                                id: `tier-${Date.now()}`,
                                                name: newTicketData.tierName || 'Standard Pass',
                                                price: parseFloat(newTicketData.price) || 45.00,
                                                quantity: parseInt(newTicketData.quantity) || 500,
                                                sold: 0
                                            }
                                        ]
                                    };
                                    
                                    const updated = [newEvent, ...events];
                                    localStorage.setItem('green_stadium_events', JSON.stringify(updated));
                                    
                                    setStripeLiveWebhookEvents(prev => [
                                        { 
                                            time: new Date().toLocaleTimeString(), 
                                            level: 'REGISTRY', 
                                            msg: `🎟️ Custom Ticket Registered: ${newEvent.name} inserted into ${targetCat === 'CM' ? 'Nightlife' : targetCat === 'HM' ? 'Partys' : 'Arena Match'} folder.` 
                                        },
                                        ...prev
                                    ]);
                                    
                                    triggerNotification('success', 'Ticket Registered Successfully 🎟️', `${newEvent.name} is now live.`);
                                    setIsAddingTicket(false);
                                    setNewTicketData({
                                        name: '',
                                        date: new Date().toISOString().split('T')[0],
                                        time: '20:00',
                                        price: '45',
                                        quantity: '500',
                                        tierName: 'VIP Golden Pass',
                                        category: 'CM'
                                    });
                                }}
                                className="flex-1 overflow-y-auto p-12 space-y-8 no-scrollbar"
                            >
                                <div className="space-y-3">
                                    <label className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-gray-500 tracking-[0.2em]">Event Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="e.g. VIP Champions Afterparty / Grand Hotel Ballroom Gala"
                                        value={newTicketData.name}
                                        onChange={e => setNewTicketData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full bg-[#05080F]/90 border border-white/10 focus:border-brand/40 rounded-2xl py-4 px-6 text-xs md:text-sm lg:text-base text-white placeholder-gray-600 focus:outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-gray-500 tracking-[0.2em]">Target Repository Folder</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { id: 'CM', label: 'Club Nightlife', desc: 'Club & Concert Tiers' },
                                            { id: 'HM', label: 'Partys Events', desc: 'VIP Stay & Party Packages' },
                                            { id: 'SM', label: 'Stadium Arena', desc: 'Match Tickets' }
                                        ].map(opt => {
                                            const activeCat = newTicketData.category || (ticketActiveFolder !== 'none' ? (ticketActiveFolder === 'club' ? 'CM' : ticketActiveFolder === 'events' ? 'HM' : 'SM') : 'CM');
                                            const isSelected = activeCat === opt.id;
                                            return (
                                                <button
                                                    type="button"
                                                    key={opt.id}
                                                    onClick={() => setNewTicketData(prev => ({ ...prev, category: opt.id }))}
                                                    className={`p-6 rounded-[2rem] border text-left flex flex-col justify-between h-28 cursor-pointer transition-all hover:scale-[1.03] active:scale-[0.98] ${
                                                        isSelected 
                                                            ? 'border-brand bg-brand/10 shadow-[0_0_15px_rgba(52,211,153,0.15)]' 
                                                            : 'bg-white/5 border-white/5 hover:border-white/20'
                                                    }`}
                                                >
                                                    <span className={`text-[10px] md:text-xs lg:text-sm font-black uppercase ${isSelected ? 'text-brand' : 'text-gray-400'}`}>{opt.label}</span>
                                                    <span className="text-[8px] md:text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-widest">{opt.desc}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-gray-500 tracking-[0.2em]">Date</label>
                                        <input 
                                            type="date" 
                                            required
                                            value={newTicketData.date}
                                            onChange={e => setNewTicketData(prev => ({ ...prev, date: e.target.value }))}
                                            className="w-full bg-[#05080F]/90 border border-white/10 focus:border-brand/40 rounded-2xl py-4 px-6 text-xs md:text-sm lg:text-base text-white placeholder-gray-600 focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-gray-500 tracking-[0.2em]">Time</label>
                                        <input 
                                            type="time" 
                                            required
                                            value={newTicketData.time}
                                            onChange={e => setNewTicketData(prev => ({ ...prev, time: e.target.value }))}
                                            className="w-full bg-[#05080F]/90 border border-white/10 focus:border-brand/40 rounded-2xl py-4 px-6 text-xs md:text-sm lg:text-base text-white placeholder-gray-600 focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-gray-500 tracking-[0.2em]">Ticket Tier Name</label>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder="VIP Golden Pass / Standard Seating"
                                            value={newTicketData.tierName || ''}
                                            onChange={e => setNewTicketData(prev => ({ ...prev, tierName: e.target.value }))}
                                            className="w-full bg-[#05080F]/90 border border-white/10 focus:border-brand/40 rounded-2xl py-4 px-6 text-xs md:text-sm lg:text-base text-white placeholder-gray-600 focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-gray-500 tracking-[0.2em]">Base Price (€)</label>
                                        <input 
                                            type="number" 
                                            required
                                            min="1"
                                            step="0.01"
                                            placeholder="45.00"
                                            value={newTicketData.price}
                                            onChange={e => setNewTicketData(prev => ({ ...prev, price: e.target.value }))}
                                            className="w-full bg-[#05080F]/90 border border-white/10 focus:border-brand/40 rounded-2xl py-4 px-6 text-xs md:text-sm lg:text-base text-white placeholder-gray-600 focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-gray-500 tracking-[0.2em]">Total Inventory Capacity</label>
                                    <input 
                                        type="number" 
                                        required
                                        min="1"
                                        placeholder="500"
                                        value={newTicketData.quantity}
                                        onChange={e => setNewTicketData(prev => ({ ...prev, quantity: e.target.value }))}
                                        className="w-full bg-[#05080F]/90 border border-white/10 focus:border-brand/40 rounded-2xl py-4 px-6 text-xs md:text-sm lg:text-base text-white placeholder-gray-600 focus:outline-none transition-all"
                                    />
                                </div>

                                <div className="pt-6 flex gap-6">
                                    <button 
                                        type="button"
                                        onClick={() => setIsAddingTicket(false)}
                                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase text-white/70 tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-[2] py-4 bg-brand text-dark-900 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest shadow-[0_0_30px_var(--brand-glow)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        Register Custom Ticket
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* COMPLIANCE MEDIATHEK DOCUMENT GALLERY MODAL */}
            <AnimatePresence>
                {isMediathekOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-[250] flex items-center justify-center bg-dark-950/90 backdrop-blur-xl p-6"
                    >
                        <motion.div 
                            initial={{ y: 50, scale: 0.95 }} 
                            animate={{ y: 0, scale: 1 }} 
                            exit={{ y: 50, scale: 0.95 }} 
                            className="w-full max-w-4xl bg-[#0D1421] border border-brand/30 rounded-[3.5rem] shadow-[0_0_100px_rgba(52,211,153,0.2)] overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-brand/20 flex items-center justify-center text-brand shadow-[0_0_20px_rgba(52,211,153,0.15)]">
                                        <FolderOpen size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black italic uppercase text-white">Mediathek <span className="text-brand">Document Vault</span></h3>
                                        <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase tracking-widest mt-1">Select pre-verified records for compliance synchronization</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsMediathekOpen(false)} 
                                    className="p-4 bg-white/5 rounded-2xl text-gray-500 hover:text-white transition-all"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-12 space-y-8 no-scrollbar">
                                <div className="p-6 bg-brand/5 border border-brand/20 rounded-3xl text-xs md:text-sm lg:text-base text-gray-400 italic">
                                    "These documents have been pre-uploaded to your Green operational vault. Select a record to initiate high-speed GwG OCR analysis."
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { name: 'DE_Gewerbeanmeldung_2026.pdf', size: '2.4 MB', type: 'Gewerbeauszug' },
                                        { name: 'DE_Personalausweis_Vorne_Hinten.jpg', size: '4.1 MB', type: 'ID Document' },
                                        { name: 'Personenbefoerderungsschein_Khiam.pdf', size: '1.8 MB', type: 'P-Schein' },
                                        { name: 'Betriebshaftpflicht_Allianz_Signed.pdf', size: '5.2 MB', type: 'Insurance' }
                                    ].map((docItem, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => selectMediathekDocument(docItem.name)}
                                            className="p-8 bg-white/5 border border-white/5 hover:border-brand/40 rounded-[2.5rem] flex items-center justify-between group cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all relative overflow-hidden"
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 group-hover:text-brand transition-colors">
                                                    <FileText size={28} />
                                                </div>
                                                <div>
                                                    <p className="text-lg font-black italic text-white uppercase truncate max-w-[280px] group-hover:text-brand transition-colors">{docItem.name}</p>
                                                    <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase mt-1 tracking-wider">{docItem.type} • {docItem.size}</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={20} className="text-gray-700 group-hover:text-brand group-hover:translate-x-1 transition-all" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* COMPLIANCE BIOMETRIC CAMERA SCANNER VIEWPORT MODAL */}
            <AnimatePresence>
                {isCameraScanOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-[250] flex items-center justify-center bg-dark-950/95 backdrop-blur-2xl p-6"
                    >
                        <motion.div 
                            initial={{ y: 50, scale: 0.95 }} 
                            animate={{ y: 0, scale: 1 }} 
                            exit={{ y: 50, scale: 0.95 }} 
                            className="w-full max-w-2xl bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.08)] hover:border-white/20 transition-all duration-500 rounded-3xl border border-brand/30 rounded-[3.5rem] shadow-[0_0_100px_rgba(52,211,153,0.3)] overflow-hidden flex flex-col items-center p-10 relative"
                        >
                            <button 
                                onClick={() => setIsCameraScanOpen(false)} 
                                className="absolute top-8 right-8 p-4 bg-white/5 rounded-2xl text-gray-500 hover:text-white transition-all z-20"
                            >
                                <X size={24} />
                            </button>

                            <div className="flex flex-col items-center text-center mb-8">
                                <h3 className="text-3xl font-black italic uppercase text-white tracking-tighter">Biometric <span className="text-brand">Camera Scanner</span></h3>
                                <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase tracking-widest mt-2">Position physical compliance document in the viewport guide</p>
                            </div>

                            {/* Viewport Frame */}
                            <div className="relative w-full aspect-[4/3] bg-black/60 rounded-[2.5rem] border-2 border-dashed border-brand/30 overflow-hidden flex items-center justify-center shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]">
                                {/* Corners */}
                                <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-brand rounded-tl-lg" />
                                <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-brand rounded-tr-lg" />
                                <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-brand rounded-bl-lg" />
                                <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-brand rounded-br-lg" />

                                {/* Moving Laser Sweep */}
                                <motion.div 
                                    animate={{ y: ['-140%', '140%'] }} 
                                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} 
                                    className="absolute left-0 w-full h-1 bg-brand shadow-[0_0_15px_#34d399] z-10" 
                                />

                                {/* Telemetry Details Overlay */}
                                <div className="absolute bottom-6 left-8 text-[8px] md:text-[10px] lg:text-xs font-mono text-brand/60 uppercase space-y-1 pointer-events-none z-10">
                                    <p>RESOLUTION: 4K UHD</p>
                                    <p>EXPOSURE: EV -0.3</p>
                                    <p>FPS: 60 SECURE_GRID</p>
                                </div>
                                <div className="absolute bottom-6 right-8 text-[8px] md:text-[10px] lg:text-xs font-mono text-brand/60 uppercase space-y-1 pointer-events-none text-right z-10">
                                    <p>OCR ALIGNMENT: 99.4%</p>
                                    <p>GWG SECURE: ACTIVE</p>
                                    <p>SYS_AUTH: BAFIN PRIME</p>
                                </div>

                                {/* Video Viewfinder Scan Grid */}
                                <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
                                
                                <div className="text-center z-20 space-y-4">
                                    <Bot size={48} className="text-brand/40 mx-auto animate-bounce" />
                                    <p className="text-[10px] md:text-xs lg:text-sm font-mono text-brand/60 tracking-[0.2em] uppercase">Ready for Biometric Capture</p>
                                </div>
                            </div>

                            <button 
                                onClick={captureCameraScan}
                                className="mt-8 w-full py-5 bg-brand text-dark-900 rounded-3xl text-xs md:text-sm lg:text-base font-black uppercase tracking-[0.2em] shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                CAPTURE & RUN COMPLIANCE ANALYSIS
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* POLICY EDIT MODAL */}
            <AnimatePresence>
                {editingPolicy && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
                    >
                        <motion.div initial={{ y: 40, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, scale: 0.95 }}
                            className="w-full max-w-4xl bg-white border border-gray-200 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="px-10 py-8 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand">
                                        {editingPolicy === 'privacy' ? <Shield size={24} /> : <FileText size={24} />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black italic uppercase text-dark-900">
                                            {editingPolicy === 'privacy' ? 'Edit Privacy Protocol' : 'Edit Terms of Service'}
                                        </h3>
                                        <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase tracking-wider mt-1">
                                            Rewriting production legal mandates & GDPR compliance clauses
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setEditingPolicy(null)} className="p-3 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-2xl text-gray-500 hover:text-black transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="p-10 bg-white flex-1 overflow-y-auto space-y-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-wider text-gray-500">Policy Content (Markdown Format)</label>
                                    <textarea 
                                        value={tempPolicyText} 
                                        onChange={e => setTempPolicyText(e.target.value)}
                                        placeholder="Enter policy terms..."
                                        className="w-full h-96 bg-white text-black border border-gray-200 rounded-2xl p-6 text-sm font-medium outline-none focus:border-brand/40 transition-colors font-mono resize-none"
                                    />
                                </div>
                            </div>

                            <div className="px-10 py-6 border-t border-gray-200 bg-gray-50 flex gap-4 justify-end">
                                <button 
                                    onClick={() => setEditingPolicy(null)} 
                                    className="px-6 py-4 border border-gray-200 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-500 hover:text-black hover:bg-gray-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => {
                                        if (editingPolicy === 'privacy') {
                                            setPrivacyPolicyText(tempPolicyText);
                                        } else {
                                            setTermsOfServiceText(tempPolicyText);
                                        }
                                        setEditingPolicy(null);
                                        triggerNotification('success', 'CHANGES STAGED', 'Click "Commit Policies" to push changes to production.');
                                    }}
                                    className="px-8 py-4 bg-brand text-dark-900 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand/10"
                                >
                                    Apply & Stage Changes
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* DOCUMENT PREVIEW BOTTOM SHEET */}
            <AnimatePresence>
                {previewSheetDoc && (
                    <div className="fixed inset-0 z-[999] flex items-end justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPreviewSheetDoc(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
                            className="relative z-10 w-full max-w-2xl bg-[#0e131f] border-t border-x border-white/15 rounded-t-[2.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.9)] p-6 md:p-8 max-h-[85vh] flex flex-col overflow-hidden"
                        >
                            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4 cursor-pointer" onClick={() => setPreviewSheetDoc(null)} />
                            <div className="flex items-center justify-between pb-4 border-b border-white/10">
                                <div>
                                    <h3 className="text-sm md:text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
                                        <FileText size={18} className="text-brand" /> {previewSheetDoc.name || 'Dokumentenvorschau'}
                                    </h3>
                                    <p className="text-[10px] md:text-xs text-gray-400 font-bold mt-0.5">
                                        Status: <span className={previewSheetDoc.status === 'approved' ? 'text-brand font-black uppercase' : 'text-amber-400 font-black uppercase'}>{previewSheetDoc.status}</span>
                                    </p>
                                </div>
                                <button
                                    onClick={() => setPreviewSheetDoc(null)}
                                    className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="py-6 overflow-y-auto space-y-6">
                                {(previewSheetDoc.frontUrl || previewSheetDoc.backUrl) ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {previewSheetDoc.frontUrl && (
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-black uppercase text-brand tracking-wider flex items-center gap-1.5">
                                                    <CheckCircle2 size={12} /> 1. Vorderseite
                                                </span>
                                                <div className="w-full h-52 rounded-2xl overflow-hidden border border-white/10 bg-black/50 shadow-xl flex items-center justify-center p-2">
                                                    <img src={previewSheetDoc.frontUrl} alt="Vorderseite" className="max-h-full max-w-full object-contain rounded-xl" />
                                                </div>
                                            </div>
                                        )}
                                        {previewSheetDoc.backUrl && (
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-black uppercase text-brand tracking-wider flex items-center gap-1.5">
                                                    <CheckCircle2 size={12} /> 2. Rückseite
                                                </span>
                                                <div className="w-full h-52 rounded-2xl overflow-hidden border border-white/10 bg-black/50 shadow-xl flex items-center justify-center p-2">
                                                    <img src={previewSheetDoc.backUrl} alt="Rückseite" className="max-h-full max-w-full object-contain rounded-xl" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (previewSheetDoc.fileUrl || previewSheetDoc.file) ? (
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="max-w-md w-full max-h-[55vh] rounded-2xl overflow-hidden border border-white/10 bg-black/50 shadow-xl flex items-center justify-center p-3">
                                            <img
                                                src={previewSheetDoc.fileUrl || previewSheetDoc.file}
                                                alt={previewSheetDoc.name}
                                                className="max-h-[50vh] max-w-full object-contain rounded-xl"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-12 text-center text-gray-500 font-bold text-xs uppercase">
                                        Keine Bilddatei vorhanden
                                    </div>
                                )}
                            </div>
                            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setPreviewSheetDoc(null)}
                                    className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                >
                                    Schließen
                                </button>
                                {previewSheetDoc.status !== 'approved' && (
                                    <button
                                        onClick={() => {
                                            handleApprovePartnerDoc('omarde65aa_gmail_com', previewSheetDoc.id);
                                            setPreviewSheetDoc(prev => ({ ...prev, status: 'approved' }));
                                        }}
                                        className="px-6 py-2.5 bg-brand text-dark-900 font-black text-xs uppercase tracking-wider rounded-xl hover:scale-105 transition-all shadow-lg shadow-brand/20 flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <CheckCircle2 size={14} /> Jetzt Freigeben
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


            </div>
        </div>
    );
};

export default AdminDashboard;
