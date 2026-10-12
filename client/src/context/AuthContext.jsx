/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth as fbAuth, db as fbDb } from '../config/firebase';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    sendEmailVerification,
    RecaptchaVerifier,
    linkWithPhoneNumber
} from 'firebase/auth';
import { 
    doc, 
    getDoc, 
    setDoc,
    onSnapshot
} from 'firebase/firestore';

const AuthContext = createContext();

const getScopedKey = (key) => {
    const globalKeys = [
        'green_users', 
        'theme', 
        'green_user_email', 
        'green_role', 
        'green_verified', 
        'green_jwt_token', 
        'green_business_type'
    ];
    if (globalKeys.includes(key)) return key;

    // 1. Try URL search parameter first (explicit query override)
    const params = new URLSearchParams(window.location.search);
    let role = params.get('role');
    
    // 2. Try pathname mapping next to avoid cross-iframe sessionStorage collision
    if (!role) {
        const path = window.location.pathname;
        if (path.startsWith('/driver') || path === '/ride') {
            role = 'driver';
        } else if (
            path.startsWith('/manager') || 
            path.startsWith('/night-crew') || 
            path.startsWith('/history/settlement')
        ) {
            role = 'manager';
        } else if (path.startsWith('/admin')) {
            role = 'super_admin';
        } else if (
            path.startsWith('/home') || 
            path.startsWith('/green-ride') || 
            path.startsWith('/greens') || 
            path.startsWith('/venue') || 
            path.startsWith('/partner') || 
            path.startsWith('/discovery') || 
            path.startsWith('/stadium') || 
            path.startsWith('/friends') || 
            path.startsWith('/profile') || 
            path.startsWith('/my-profile') || 
            path.startsWith('/receipts') || 
            path.startsWith('/order') || 
            path.startsWith('/mission-control') || 
            path.startsWith('/safety') || 
            path.startsWith('/payment') || 
            path.startsWith('/account') || 
            path.startsWith('/family-hub')
        ) {
            role = 'passenger';
        }
    }
    
    // 3. Fall back to sessionStorage if not matching any specific path or query
    if (!role) {
        role = sessionStorage.getItem('simulator_active_role');
    }
    
    // 4. Default fallback if still unresolved
    if (!role) {
        role = 'passenger';
    }
    
    // Save resolved role to sessionStorage for viewport state tracking
    sessionStorage.setItem('simulator_active_role', role);
    
    return `${role}_${key}`;
};

const scopedStorage = {
    getItem: (key) => localStorage.getItem(getScopedKey(key)),
    setItem: (key, val) => localStorage.setItem(getScopedKey(key), val),
    removeItem: (key) => localStorage.removeItem(getScopedKey(key)),
};

const demoEmails = [
    'passenger@green.de',
    'driver@green.de',
    'staff@green.de',
    'staff.fleet@green.de',
    'staff.restaurant@green.de',
    'staff.club@green.de',
    'staff.hotel@green.de',
    'staff.stadium@green.de',
    'manager@green.de',
    'admin@green.de',
    'restaurant@green.de',
    'club@green.de',
    'hotel@green.de',
    'stadium@green.de'
];
const isDemoEmail = (email) => {
    return false; // Disabled for production
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isVerified, setIsVerified] = useState(false);

    const defaultUsers = [
        { name: 'Alex Passenger', email: 'passenger@green.de', password: 'green2026', role: 'passenger', greenFlags: 124, redFlags: 0 },
        { name: 'Mick Driver', email: 'driver@green.de', password: 'green2026', role: 'driver', greenId: 'GRN-MICK-DRIV', greenFlags: 842, redFlags: 1, onboarded: true },
        { 
            name: 'Sam Personnel (Universal Staff)', 
            email: 'staff@green.de', 
            password: 'green2026', 
            role: 'staff', 
            businessType: 'ALL', 
            greenId: 'GRN-STAFF-ALL', 
            onboarded: true, 
            permissions: ['overview', 'orders', 'stadium-seats', 'hotel-rooms', 'staff', 'finance', 'documents', 'feed', 'reputation', 'strategic-hub', 'fleet-control', 'sitting', 'menu'], 
            greenFlags: 45, 
            redFlags: 0 
        },
        { name: 'Fleet Staff', email: 'staff.fleet@green.de', password: 'green2026', role: 'staff', businessType: 'FM', greenId: 'GRN-STAFF-FLET', onboarded: true, permissions: ['overview', 'orders', 'staff', 'fleet-control', 'sitting'], greenFlags: 12, redFlags: 0 },
        { name: 'Restaurant Staff', email: 'staff.restaurant@green.de', password: 'green2026', role: 'staff', businessType: 'RM', greenId: 'GRN-STAFF-REST', onboarded: true, permissions: ['overview', 'orders', 'staff', 'menu', 'sitting'], greenFlags: 15, redFlags: 0 },
        { name: 'Club Staff', email: 'staff.club@green.de', password: 'green2026', role: 'staff', businessType: 'CM', greenId: 'GRN-STAFF-CLUB', onboarded: true, permissions: ['overview', 'orders', 'stadium-seats', 'staff', 'menu', 'sitting'], greenFlags: 18, redFlags: 0 },
        { name: 'Hotel Staff', email: 'staff.hotel@green.de', password: 'green2026', role: 'staff', businessType: 'HM', greenId: 'GRN-STAFF-HOTL', onboarded: true, permissions: ['overview', 'orders', 'hotel-rooms', 'staff', 'menu', 'sitting'], greenFlags: 20, redFlags: 0 },
        { name: 'Stadium Staff', email: 'staff.stadium@green.de', password: 'green2026', role: 'staff', businessType: 'SM', greenId: 'GRN-STAFF-STAD', onboarded: true, permissions: ['overview', 'orders', 'stadium-seats', 'staff', 'sitting'], greenFlags: 25, redFlags: 0 },
        { name: 'Casey Manager', email: 'manager@green.de', password: 'green2026', role: 'manager', businessType: 'FM', greenFlags: 2150, redFlags: 1 },
        { name: 'Jordan Personnel', email: 'admin@green.de', password: 'green2026', role: 'super_admin', greenFlags: 5000, redFlags: 0 },
        { name: 'Ravi Restaurant', email: 'restaurant@green.de', password: 'green2026', role: 'manager', businessType: 'RM', greenFlags: 980, redFlags: 0 },
        { name: 'Carlo Club', email: 'club@green.de', password: 'green2026', role: 'manager', businessType: 'CM', greenFlags: 1540, redFlags: 0 },
        { name: 'Heidi Hotel', email: 'hotel@green.de', password: 'green2026', role: 'manager', businessType: 'HM', greenFlags: 3410, redFlags: 0 },
        { name: 'Stephan Stadium', email: 'stadium@green.de', password: 'green2026', role: 'manager', businessType: 'SM', greenFlags: 4500, redFlags: 0 },
    ];

    // Asynchronous Auto-Seeder for Default Accounts
    const seedDefaultUsers = async () => {
        console.log("🌱 Firebase Auto-Seeder: Checking database directories...");
        for (const defUser of defaultUsers) {
            try {
                // Check if account already exists by signing in
                await signInWithEmailAndPassword(fbAuth, defUser.email, defUser.password);
                
                // Ensure Firestore profile document is synced
                const docRef = doc(fbDb, 'users', defUser.email.toLowerCase());
                const docSnap = await getDoc(docRef);
                if (!docSnap.exists()) {
                    const profile = { ...defUser };
                    delete profile.password;
                    await setDoc(docRef, profile);
                }
            } catch (error) {
                // If user doesn't exist in Auth directory, sign them up!
                if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                    try {
                        await createUserWithEmailAndPassword(fbAuth, defUser.email, defUser.password);
                        const docRef = doc(fbDb, 'users', defUser.email.toLowerCase());
                        const profile = { ...defUser };
                        delete profile.password;
                        await setDoc(docRef, profile);
                        console.log(`🌱 Firebase Auto-Seeder: Successfully provisioned default account: ${defUser.email}`);
                    } catch (createErr) {
                        console.error(`Failed to seed ${defUser.email}:`, createErr.message);
                    }
                }
            }
        }
        console.log("🌱 Firebase Auto-Seeder: Database sync cycle completed.");
    };

    useEffect(() => {
        let unsubscribeDoc = null;
        
        // Core Authentication Listener (Synched with Live Firebase Auth State)
        const unsubscribeAuth = onAuthStateChanged(fbAuth, async (firebaseUser) => {
            if (unsubscribeDoc) {
                unsubscribeDoc();
                unsubscribeDoc = null;
            }

            if (firebaseUser) {
                const email = firebaseUser.email.toLowerCase();
                const docRef = doc(fbDb, 'users', email);
                
                unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const profile = docSnap.data();
                        setUser({ ...profile, isDemo: isDemoEmail(profile.email) });
                        sessionStorage.setItem('simulator_active_role', profile.role);
                        scopedStorage.setItem('green_user_email', profile.email);
                        scopedStorage.setItem('green_role', profile.role);
                        if (profile.businessType) {
                            scopedStorage.setItem('green_business_type', profile.businessType);
                        }
                        if (scopedStorage.getItem('green_verified') === 'true') {
                            setIsVerified(true);
                        }
                    } else {
                        // Fallback user profile in case Firestore profile not initialized
                        const fallbackUser = {
                            name: firebaseUser.displayName || 'Authorized Member',
                            email: firebaseUser.email,
                            role: 'passenger',
                            greenFlags: 0,
                            redFlags: 0
                        };
                        setUser({ ...fallbackUser, isDemo: isDemoEmail(fallbackUser.email) });
                    }
                    setLoading(false);
                }, (error) => {
                    console.error('Failed to sync user profile from Firestore:', error);
                    setLoading(false);
                });
            } else {
                setUser(null);
                setIsVerified(false);
                setLoading(false);
            }
        });

        // Auto-login from query parameter
        const params = new URLSearchParams(window.location.search);
        const autoLoginEmail = params.get('autoLogin');
        if (autoLoginEmail) {
            if (!fbAuth.currentUser || fbAuth.currentUser.email !== autoLoginEmail) {
                console.log(`[Simulator] Auto-login triggered for ${autoLoginEmail}`);
                signInWithEmailAndPassword(fbAuth, autoLoginEmail, 'green2026').catch(err => {
                    console.error("[Simulator] Auto-login failed:", err);
                });
            }
        }

        return () => {
            unsubscribeAuth();
            if (unsubscribeDoc) unsubscribeDoc();
        };
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(fbAuth, email, password);
            const firebaseUser = userCredential.user;
            const userEmail = firebaseUser.email.toLowerCase();

            // Fetch profile data from Firestore
            const docRef = doc(fbDb, 'users', userEmail);
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
                setLoading(false);
                return { success: false, message: 'Profile mismatch in Firestore registry.' };
            }

            let profile = docSnap.data();
            
            // Hardcode Mick Driver to be pre-onboarded in Firestore on every login!
            if (userEmail === 'driver@green.de' && profile.onboarded !== true) {
                profile = { ...profile, onboarded: true };
                try {
                    await setDoc(doc(fbDb, 'users', userEmail), profile);
                } catch (err) {
                    console.error('Failed to force sync Mick Driver onboarding in Firestore:', err);
                }
            }

            sessionStorage.setItem('simulator_active_role', profile.role);
            setUser(profile);

            scopedStorage.setItem('green_jwt_token', 'firebase_jwt_' + firebaseUser.uid);
            scopedStorage.removeItem('green_explicit_logout');
            scopedStorage.setItem('green_role', profile.role);
            if (profile.businessType) {
                scopedStorage.setItem('green_business_type', profile.businessType);
            }
            scopedStorage.setItem('green_user_email', profile.email);
            
            // Auto-verify test accounts
            const isTestAccount = profile.email.includes('@green.de') || profile.email.includes('kh5c');
            
            if ((firebaseUser.emailVerified && profile.phoneVerified) || isTestAccount) {
                setIsVerified(true);
                scopedStorage.setItem('green_verified', 'true');
            } else {
                setIsVerified(false);
                scopedStorage.removeItem('green_verified');
            }
            setLoading(false);
            return { success: true, user: profile };
        } catch (error) {
            console.error('Firebase Auth sign in failed:', error);
            setLoading(false);
            let message = 'Signal not matched in the database.';
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                message = 'Access Password invalid.';
            } else if (error.code === 'auth/user-not-found') {
                message = 'Signal not matched in the neural directory.';
            }
            return { success: false, error: error.code, message };
        }
    };

    const register = async (newUserData) => {
        setLoading(true);

        const calculateAge = (dobString) => {
            if (!dobString) return null;
            const today = new Date();
            const birthDate = new Date(dobString);
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        };

        if (newUserData.role === 'passenger') {
            const age = newUserData.age ? parseInt(newUserData.age) : (newUserData.dob ? calculateAge(newUserData.dob) : null);
            if (age !== null) {
                if (age < 16) {
                    setLoading(false);
                    return { success: false, message: 'Registrierung verweigert: Die Nutzung der App ist für Personen unter 16 Jahren aus Jugendschutzgründen strengstens untersagt.' };
                }
                if (age >= 16 && age < 18) {
                    const allInvites = JSON.parse(localStorage.getItem('green_parent_invitations') || '[]');
                    const pendingInvite = allInvites.find(inv => 
                        inv.childEmail.toLowerCase() === newUserData.email.toLowerCase() && 
                        inv.status === 'pending'
                    );

                    if (!pendingInvite) {
                        setLoading(false);
                        return { 
                            success: false, 
                            message: 'Registrierung verweigert: Jugendliche im Alter von 16 und 17 Jahren benötigen eine offizielle elterliche Einladung. Bitte lassen Sie sich von Ihren Eltern per E-Mail einladen.' 
                        };
                    }

                    const updatedInvites = allInvites.map(inv => {
                        if (inv.id === pendingInvite.id) {
                            return { ...inv, status: 'registered', registeredAt: new Date().toISOString() };
                        }
                        return inv;
                    });
                    localStorage.setItem('green_parent_invitations', JSON.stringify(updatedInvites));

                    newUserData.invitedByParent = true;
                    newUserData.parentEmail = pendingInvite.parentEmail;
                }
            }
        }

        try {
            // Register in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(fbAuth, newUserData.email, newUserData.password);
            const firebaseUser = userCredential.user;
            const email = firebaseUser.email.toLowerCase();

            // Send email verification right after creation
            try {
                await sendEmailVerification(firebaseUser);
            } catch (err) {
                console.error("Failed to send verification email:", err);
            }

            const createdUser = {
                name: newUserData.name,
                email: email,
                role: newUserData.role,
                address: newUserData.address || '',
                zip: newUserData.zip || '',
                phone: newUserData.phone || '',
                age: newUserData.age || null,
                businessType: newUserData.businessType || null,
                greenFlags: 0,
                redFlags: 0,
                gdprAccepted: true,
                gdprAcceptedAt: new Date().toISOString()
            };

            // Generate unique Green ID for staff and driver roles
            if (newUserData.role === 'staff' || newUserData.role === 'driver') {
                const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                const seg1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                const seg2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                createdUser.greenId = `GRN-${seg1}-${seg2}`;
                
                if (newUserData.invitedByManager) {
                    createdUser.onboarded = true;
                    createdUser.managerId = newUserData.invitedByManager.toLowerCase();
                    // Auto-resolve business details client-side
                    try {
                        const managerSnap = await getDoc(doc(fbDb, 'users', createdUser.managerId));
                        if (managerSnap.exists()) {
                            const managerData = managerSnap.data();
                            createdUser.businessName = managerData.businessName || 'Green Fleet Ops';
                            createdUser.businessType = managerData.businessType || 'FM';
                        } else {
                            createdUser.businessName = 'Green Fleet Ops';
                            createdUser.businessType = 'FM';
                        }
                    } catch (e) {
                        createdUser.businessName = 'Green Fleet Ops';
                        createdUser.businessType = 'FM';
                    }

                    // Add to manager's local staff list directly so the manager's dashboard updates immediately
                    try {
                        const managerKey = createdUser.managerId.replace(/[^a-zA-Z0-9]/g, '_');
                        const managerStaffListKey = `green_staff_list_${managerKey}`;
                        const existingStaff = JSON.parse(localStorage.getItem(managerStaffListKey) || '[]');
                        const newMember = {
                            id: createdUser.greenId,
                            name: createdUser.name,
                            role: createdUser.role === 'driver' ? 'Driver / Pilot' : 'Staff Member',
                            status: 'Pending First Login',
                            avatar: createdUser.name,
                            permissions: createdUser.role === 'driver' ? ['orders', 'compliance'] : ['orders', 'feed', 'finance', 'terminal'],
                            greenId: createdUser.greenId,
                            email: createdUser.email
                        };
                        if (!existingStaff.some(s => s.email === createdUser.email)) {
                            localStorage.setItem(managerStaffListKey, JSON.stringify([...existingStaff, newMember]));
                        }
                    } catch (e) {
                        console.error('Error updating manager local staff list:', e);
                    }
                } else {
                    createdUser.onboarded = false; // awaiting manager onboarding
                }

                // Save to Firebase Firestore pending_staff collection
                const pendingRef = doc(fbDb, 'pending_staff', createdUser.greenId);
                await setDoc(pendingRef, {
                    greenId: createdUser.greenId,
                    name: createdUser.name,
                    email: createdUser.email,
                    role: createdUser.role,
                    phone: createdUser.phone || '',
                    registeredAt: new Date().toISOString(),
                    onboarded: createdUser.onboarded,
                    managerId: createdUser.managerId || null,
                    businessName: createdUser.businessName || null,
                    businessType: createdUser.businessType || null
                });

                localStorage.setItem('green_pending_id', createdUser.greenId);
            }

            // Create Firestore profile document
            const docRef = doc(fbDb, 'users', email);
            await setDoc(docRef, createdUser);

            sessionStorage.setItem('simulator_active_role', createdUser.role);
            setUser({ ...createdUser, isDemo: false });

            scopedStorage.setItem('green_jwt_token', 'firebase_jwt_' + firebaseUser.uid);
            scopedStorage.removeItem('green_explicit_logout');
            scopedStorage.setItem('green_role', createdUser.role);
            if (createdUser.businessType) {
                scopedStorage.setItem('green_business_type', createdUser.businessType);
            }
            scopedStorage.setItem('green_user_email', createdUser.email);
            setIsVerified(false);
            scopedStorage.removeItem('green_verified');
            setLoading(false);
            return { success: true, user: createdUser };
        } catch (error) {
            console.error('Firebase Auth sign up failed:', error);
            setLoading(false);
            let message = `Secure registration gateway offline: ${error.message || error.code || error}`;
            if (error.code === 'auth/email-already-in-use') {
                message = 'Email signature already registered in network.';
            } else if (error.code === 'auth/weak-password') {
                message = 'Password strength insufficient. Minimum 6 characters required.';
            }
            return { success: false, message };
        }
    };

    const verify = () => {
        setIsVerified(true);
        scopedStorage.setItem('green_verified', 'true');
    };

    const setupRecaptcha = (containerId) => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(fbAuth, containerId, {
                size: 'invisible',
                callback: () => {
                    // reCAPTCHA solved
                }
            });
        }
        return window.recaptchaVerifier;
    };

    const sendVerificationSMS = async (phoneNumber, appVerifier) => {
        if (!fbAuth.currentUser) throw new Error("No user signed in.");
        // Format phone number to E.164 format if not already
        let formattedPhone = phoneNumber;
        if (!formattedPhone.startsWith('+')) {
            // Default to +49 (Germany) if no country code provided, just as an example.
            // A real app should ensure the user inputs the + country code.
            formattedPhone = formattedPhone.startsWith('0') 
                ? '+49' + formattedPhone.substring(1) 
                : '+49' + formattedPhone;
        }
        const confirmationResult = await linkWithPhoneNumber(fbAuth.currentUser, formattedPhone, appVerifier);
        return confirmationResult;
    };

    const confirmSMS = async (confirmationResult, code) => {
        const result = await confirmationResult.confirm(code);
        
        // Update Firestore to mark phone as verified
        if (result.user && user) {
            const docRef = doc(fbDb, 'users', user.email.toLowerCase());
            await setDoc(docRef, { phoneVerified: true }, { merge: true });
            setUser(prev => ({ ...prev, phoneVerified: true }));
        }
        
        return result.user;
    };

    const logout = async () => {
        setUser(null);
        setIsVerified(false);
        try {
            await signOut(fbAuth);
        } catch (e) {
            console.error('Firebase Auth sign out failed:', e);
        }
        
        const role = sessionStorage.getItem('simulator_active_role') || 'passenger';
        const prefix = `${role}_`;
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                localStorage.removeItem(key);
            }
        }

        localStorage.removeItem('green_user_email');
        localStorage.removeItem('green_jwt_token');
        localStorage.removeItem('green_role');
        localStorage.removeItem('green_verified');
        localStorage.removeItem('green_business_type');
        sessionStorage.clear();
        
        try {
            const url = new URL(window.location.href);
            url.searchParams.delete('role');
            url.searchParams.delete('businessType');
            url.searchParams.delete('autoLogin');
            window.history.replaceState({}, '', url.pathname + url.search);
        } catch (e) {
            console.error('Failed to strip URL parameters:', e);
        }
        
        scopedStorage.setItem('green_explicit_logout', 'true');
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, logout, isVerified, verify, register, setupRecaptcha, sendVerificationSMS, confirmSMS }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
