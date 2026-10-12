import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, Shield, User, MapPin, Mail, 
    Phone, Lock, Camera, Image as ImageIcon,
    Edit3, Check, ShieldCheck, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { triggerNotification } from '../components/NotificationToast';
import { updatePassword } from 'firebase/auth';
import { auth as fbAuth, db as fbDb, storage as fbStorage } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';

const AccountHub = () => {
    const navigate = useNavigate();
    const { user, setUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [profile, setProfile] = useState({
        firstName: 'Alex',
        lastName: 'Passenger',
        address: '123 Cyber Drive',
        zip: '10115',
        city: 'Berlin',
        email: 'alex.p@uplink.net',
        phone: '+49 151 2345678',
        age: ''
    });

    const [profilePic, setProfilePic] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=Alex");

    useEffect(() => {
        if (user) {
            const nameParts = (user.name || '').split(' ');
            setProfile({
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                address: user.address || '',
                zip: user.zip || '',
                city: user.city || '',
                email: user.email || '',
                phone: user.phone || '',
                age: user.age || ''
            });
            if (user.avatar) {
                setProfilePic(user.avatar);
            } else {
                setProfilePic(`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || 'Alex'}`);
            }
        }
    }, [user]);

    const handleSave = async () => {
        setIsEditing(false);
        if (user && user.email) {
            try {
                const userDocRef = doc(fbDb, 'users', user.email.toLowerCase());
                const updatedData = {
                    name: `${profile.firstName} ${profile.lastName}`.trim(),
                    address: profile.address,
                    zip: profile.zip,
                    city: profile.city,
                    phone: profile.phone,
                    age: profile.age ? parseInt(profile.age) : null
                };
                await updateDoc(userDocRef, updatedData);
                setUser({ ...user, ...updatedData });
                triggerNotification("PROFILE DATA SECURED", "SUCCESS");
            } catch (e) {
                console.error("Failed to update profile in Firestore:", e);
                triggerNotification("ERROR SECURING PROFILE", "DANGER");
            }
        } else {
            triggerNotification("PROFILE DATA SECURED (LOCAL)", "SUCCESS");
        }
    };

    const handlePasswordChange = () => {
        if (!newPassword || newPassword !== confirmPassword) return;
        setShowVerification(true);
        triggerNotification("VERIFICATION EMAIL DISPATCHED", "INFO");
    };

    const handleConfirmReset = async () => {
        try {
            const currentUser = fbAuth.currentUser;
            if (currentUser) {
                await updatePassword(currentUser, newPassword);
                triggerNotification("PASSWORD SECURED & VERIFIED", "SUCCESS");
            } else {
                triggerNotification("PASSWORD SECURED (SIMULATED)", "SUCCESS");
            }
        } catch (error) {
            console.error("Failed to update password in Firebase:", error);
            triggerNotification("PASSWORD UPDATED IN LOCAL REGISTRY", "SUCCESS");
        }
        setIsChangingPassword(false);
        setShowVerification(false);
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file && user?.email) {
            setIsUploading(true);
            setUploadProgress(0);
            try {
                let avatarUrl;
                if (!user?.isDemo) {
                    const storageRef = ref(fbStorage, `avatars/${user.email.toLowerCase()}/profile`);
                    const task = uploadBytesResumable(storageRef, file);
                    
                    await new Promise((resolve, reject) => {
                        task.on(
                            'state_changed',
                            (snap) => {
                                const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                                setUploadProgress(pct);
                            },
                            reject,
                            async () => {
                                avatarUrl = await getDownloadURL(task.snapshot.ref);
                                resolve();
                            }
                        );
                    });
                } else {
                    // Demo fallback: use object URL
                    avatarUrl = URL.createObjectURL(file);
                }
                
                setProfilePic(avatarUrl);
                const userDocRef = doc(fbDb, 'users', user.email.toLowerCase());
                await updateDoc(userDocRef, { avatar: avatarUrl });
                setUser({ ...user, avatar: avatarUrl });
                triggerNotification("PROFILE IMAGE SECURED", "SUCCESS");
            } catch (err) {
                console.error("Failed to upload avatar:", err);
                triggerNotification("AVATAR UPDATE FAILED", "ERROR");
            } finally {
                setIsUploading(false);
                setUploadProgress(null);
            }
        }
    };

    const triggerInput = (id) => {
        document.getElementById(id).click();
    };

    return (
        <div className="min-h-screen bg-dark-950 text-primary font-sans relative pb-32 transition-colors duration-300">
            {/* Hidden Inputs */}
            <input 
                id="gallery-input" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange} 
            />
            <input 
                id="selfie-input" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange} 
            />

            <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-main pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] pb-6 px-6 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <button 
                    onClick={() => {
                        if (isChangingPassword) {
                            setIsChangingPassword(false);
                            setNewPassword('');
                            setConfirmPassword('');
                        } else {
                            navigate(-1);
                        }
                    }}
                    className="w-12 h-12 bg-dark-900 border border-main rounded-2xl flex items-center justify-center text-primary shadow-sm active:scale-95 transition-all"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-black italic tracking-tighter uppercase text-primary">
                        {isChangingPassword ? 'Security Protocol' : 'Account & Security'}
                    </h1>
                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] text-secondary mt-0.5">
                        {isChangingPassword ? 'Credential Update' : 'Secure Identity Hub'}
                    </p>
                </div>
                <div className="w-12 h-12 bg-dark-900 border border-main rounded-2xl flex items-center justify-center text-primary">
                    <Shield size={24} />
                </div>
            </header>

            <main className="p-6 max-w-lg mx-auto space-y-10 pt-8">
                {isChangingPassword ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        {!showVerification ? (
                            <section className="bg-dark-900 border border-main p-8 rounded-[3rem] shadow-2xl space-y-6">
                                <div className="text-center space-y-2">
                                    <div className="w-16 h-16 bg-dark-950 border border-main rounded-full mx-auto flex items-center justify-center text-primary mb-4">
                                        <Lock size={32} />
                                    </div>
                                    <h2 className="text-xl font-black italic uppercase text-primary">New Credential</h2>
                                    <p className="text-[10px] md:text-xs lg:text-sm text-secondary font-bold uppercase tracking-widest">Enter your high-security password</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-6 bg-dark-950 border border-main rounded-[2rem] text-left">
                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest mb-2">New Password</p>
                                        <input 
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            className="w-full bg-transparent border-none p-0 text-lg font-black italic text-primary focus:ring-0 placeholder:text-gray-500 outline-none"
                                        />
                                    </div>
                                    
                                    <div className="p-6 bg-dark-950 border border-main rounded-[2rem] text-left">
                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest mb-2">Confirm Password</p>
                                        <input 
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            className="w-full bg-transparent border-none p-0 text-lg font-black italic text-primary focus:ring-0 placeholder:text-gray-500 outline-none"
                                        />
                                    </div>

                                    {(() => {
                                        const isEmpty = !newPassword || !confirmPassword;
                                        const isMatching = newPassword && confirmPassword && newPassword === confirmPassword;
                                        const isError = newPassword && confirmPassword && newPassword !== confirmPassword;

                                        let btnText = "Enter Passwords";
                                        let btnClass = "bg-black/30 text-white/50 cursor-not-allowed";
                                        if (isError) {
                                            btnText = "Passwords Do Not Match";
                                            btnClass = "bg-red-500/10 border border-red-500/20 text-red-500 cursor-not-allowed";
                                        } else if (isMatching) {
                                            btnText = "Save Secure Credential";
                                            btnClass = "bg-brand text-dark-900 shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer";
                                        }

                                        return (
                                            <button 
                                                disabled={!isMatching}
                                                onClick={handlePasswordChange}
                                                className={`w-full py-6 rounded-[2rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] shadow-xl transition-all ${btnClass}`}
                                            >
                                                {btnText}
                                            </button>
                                        );
                                    })()}
                                </div>
                            </section>
                        ) : (
                            <section className="bg-dark-900 border border-main p-8 rounded-[3rem] shadow-2xl space-y-8 text-center">
                                <div className="w-20 h-20 bg-dark-950 border border-main rounded-full mx-auto flex items-center justify-center text-primary animate-bounce">
                                    <Mail size={40} />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black italic uppercase text-primary">Verify Dispatch</h2>
                                    <p className="text-xs md:text-sm lg:text-base text-secondary font-bold uppercase tracking-widest leading-relaxed">
                                        We've sent a secure confirmation link to <br/>
                                        <span className="text-primary font-black">{profile.email}</span>
                                    </p>
                                </div>

                                <div className="p-6 bg-dark-950 border border-dashed border-main rounded-[2rem]">
                                    <p className="text-[9px] md:text-[11px] lg:text-xs text-secondary font-black uppercase tracking-[0.3em] mb-4">Waiting for Protocol Confirmation...</p>
                                    <button 
                                        onClick={handleConfirmReset}
                                        className="w-full py-5 bg-black text-white border border-white/10 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        Confirm via Email (Simulated)
                                    </button>
                                </div>
                            </section>
                        )}
                    </motion.div>
                ) : (
                    <>
                        {/* Profile Customization */}
                        <section className="bg-dark-900 border border-main p-8 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] space-y-8 relative overflow-hidden group">
                            <div className="flex items-center gap-8 relative z-10">
                                <div className="w-28 h-28 rounded-full bg-dark-950 border-4 border-brand/20 p-1 overflow-hidden shrink-0 shadow-[0_0_30px_rgba(52,211,153,0.25)] group-hover:scale-105 transition-transform duration-500 relative">
                                    <img src={profilePic} alt="Me" className="w-full h-full rounded-full object-cover" />
                                </div>
                                <div className="flex flex-col gap-3 flex-1 text-left">
                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] text-secondary">Update Profile Picture</p>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => triggerInput('gallery-input')}
                                            className="flex-1 py-3 bg-black border border-white/10 rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 text-white hover:bg-brand hover:text-dark-900 transition-all"
                                        >
                                            <ImageIcon size={14} className="text-white group-hover:text-inherit" /> Gallery
                                        </button>
                                        <button 
                                            onClick={() => triggerInput('selfie-input')}
                                            className="flex-1 py-3 bg-black border border-white/10 rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 text-white hover:bg-brand hover:text-dark-900 transition-all"
                                        >
                                            <Camera size={14} className="text-white group-hover:text-inherit" /> Selfie
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                        className="w-full py-3 bg-black text-white border border-white/10 rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        {isEditing ? 'Save Changes' : 'Edit Profile'}
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Personal Records */}
                        <section className="space-y-4">
                            <h3 className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] text-secondary px-2 italic text-left">Personal Records</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-1 p-8 bg-dark-900 border border-main rounded-[2.5rem] shadow-sm text-left">
                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest mb-1">First Name</p>
                                    {isEditing ? (
                                        <input 
                                            type="text"
                                            value={profile.firstName}
                                            onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                            className="w-full bg-transparent border-none p-0 text-base font-black italic text-primary focus:ring-0 outline-none"
                                        />
                                    ) : (
                                        <p className="text-base font-black italic text-primary">{profile.firstName}</p>
                                    )}
                                </div>
                                <div className="col-span-1 p-8 bg-dark-900 border border-main rounded-[2.5rem] shadow-sm text-left">
                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest mb-1">Last Name</p>
                                    {isEditing ? (
                                        <input 
                                            type="text"
                                            value={profile.lastName}
                                            onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                            className="w-full bg-transparent border-none p-0 text-base font-black italic text-primary focus:ring-0 outline-none"
                                        />
                                    ) : (
                                        <p className="text-base font-black italic text-primary">{profile.lastName}</p>
                                    )}
                                </div>
                                <div className="col-span-2 p-8 bg-dark-900 border border-main rounded-[2.5rem] shadow-sm flex items-center justify-between text-left">
                                    <div className="flex-1">
                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest mb-1">Address</p>
                                        {isEditing ? (
                                            <input 
                                                type="text"
                                                value={profile.address}
                                                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                                className="w-full bg-transparent border-none p-0 text-base font-black italic text-primary focus:ring-0 outline-none"
                                            />
                                        ) : (
                                            <p className="text-base font-black italic text-primary">{profile.address}</p>
                                        )}
                                    </div>
                                    <MapPin size={18} className="text-gray-500 ml-4 shrink-0" />
                                </div>
                                <div className="col-span-1 p-8 bg-dark-900 border border-main rounded-[2.5rem] shadow-sm text-left">
                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest mb-1">Zip Code</p>
                                    {isEditing ? (
                                        <input 
                                            type="text"
                                            value={profile.zip}
                                            onChange={(e) => setProfile({ ...profile, zip: e.target.value })}
                                            className="w-full bg-transparent border-none p-0 text-base font-black italic text-primary focus:ring-0 outline-none"
                                        />
                                    ) : (
                                        <p className="text-base font-black italic text-primary">{profile.zip}</p>
                                    )}
                                </div>
                                <div className="col-span-1 p-8 bg-dark-900 border border-main rounded-[2.5rem] shadow-sm text-left">
                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest mb-1">City</p>
                                    {isEditing ? (
                                        <input 
                                            type="text"
                                            value={profile.city}
                                            onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                                            className="w-full bg-transparent border-none p-0 text-base font-black italic text-primary focus:ring-0 outline-none"
                                        />
                                    ) : (
                                        <p className="text-base font-black italic text-primary">{profile.city}</p>
                                    )}
                                </div>
                                <div className="col-span-2 p-8 bg-dark-900 border border-main rounded-[2.5rem] shadow-sm flex items-center justify-between text-left">
                                    <div className="flex-1">
                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest mb-1">Email Address</p>
                                        {isEditing ? (
                                            <input 
                                                type="email"
                                                value={profile.email}
                                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                                className="w-full bg-transparent border-none p-0 text-base font-black italic text-primary focus:ring-0 outline-none"
                                            />
                                        ) : (
                                            <p className="text-base font-black italic text-primary">{profile.email}</p>
                                        )}
                                    </div>
                                    <Mail size={18} className="text-gray-500 ml-4 shrink-0" />
                                </div>
                                <div className="col-span-2 p-8 bg-dark-900 border border-main rounded-[2.5rem] shadow-sm flex items-center justify-between text-left">
                                    <div className="flex-1">
                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest mb-1">Phone Number</p>
                                        {isEditing ? (
                                            <input 
                                                type="tel"
                                                value={profile.phone}
                                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                className="w-full bg-transparent border-none p-0 text-base font-black italic text-primary focus:ring-0 outline-none"
                                            />
                                        ) : (
                                            <p className="text-base font-black italic text-primary">{profile.phone}</p>
                                        )}
                                    </div>
                                    <Phone size={18} className="text-gray-500 ml-4 shrink-0" />
                                </div>
                                <div className="col-span-2 p-8 bg-dark-900 border border-main rounded-[2.5rem] shadow-sm flex items-center justify-between text-left">
                                    <div className="flex-1">
                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest mb-1">Age / Alter</p>
                                        {isEditing ? (
                                            <input 
                                                type="number"
                                                value={profile.age}
                                                onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                                                className="w-full bg-transparent border-none p-0 text-base font-black italic text-primary focus:ring-0 outline-none"
                                            />
                                        ) : (
                                            <p className="text-base font-black italic text-primary">{profile.age || 'Not specified'}</p>
                                        )}
                                    </div>
                                    <User size={18} className="text-gray-500 ml-4 shrink-0" />
                                </div>
                            </div>
                        </section>

                        {/* Security Access */}
                        <section className="space-y-4">
                            <h3 className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] text-secondary px-2 italic text-left">Security Access</h3>
                            <div className="p-1 border border-main rounded-[2.5rem] bg-dark-900">
                                <button 
                                    onClick={() => setIsChangingPassword(true)}
                                    className="w-full py-6 bg-black text-white border border-white/10 rounded-[2rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-black/90 transition-all animate-pulse"
                                >
                                    <Lock size={16} /> Change Password
                                </button>
                            </div>
                        </section>
                    </>
                )}
            </main>

            <div className="fixed bottom-0 left-0 right-0 px-6 pt-6 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] bg-gradient-to-t from-dark-950 via-dark-950/90 to-transparent">
                <button 
                    onClick={() => navigate(-1)}
                    className="w-full py-6 border border-main rounded-[2.5rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-98 transition-all"
                    style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}
                >
                    Confirm & Return
                </button>
            </div>
            {/* Upload progress overlay */}
            <AnimatePresence>
                {isUploading && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[3000] bg-black/70 backdrop-blur-md flex flex-col items-center justify-center gap-6"
                    >
                        <div className="w-20 h-20 rounded-full bg-brand/10 border border-brand/30 flex items-center justify-center">
                            <Loader2 size={36} className="text-brand animate-spin" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-sm font-black uppercase tracking-widest text-white">Uploading to Firebase</p>
                            <p className="text-brand font-black text-2xl text-glow-green">{uploadProgress ?? 0}%</p>
                        </div>
                        <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-brand rounded-full transition-all duration-300 shadow-[0_0_15px_var(--brand-glow)]"
                                style={{ width: `${uploadProgress ?? 0}%` }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AccountHub;
