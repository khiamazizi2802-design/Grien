import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Smartphone, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { auth as fbAuth, db as fbDb } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const VerificationGateway = () => {
    const { user, verify, logout, setupRecaptcha, sendVerificationSMS, confirmSMS } = useAuth();
    const navigate = useNavigate();
    
    const [step, setStep] = useState(1); // 1 = Email, 2 = Phone
    const [emailVerified, setEmailVerified] = useState(false);
    const [phoneVerified, setPhoneVerified] = useState(false);
    
    // OTP State
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Initial Check
    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        
        // Setup Recaptcha
        setupRecaptcha('recaptcha-container');

        // Check if already phone verified in firestore (in case of refresh)
        const checkStatus = async () => {
            if (fbAuth.currentUser?.emailVerified) {
                setEmailVerified(true);
                setStep(2);
            }
            if (user?.phoneVerified) {
                setPhoneVerified(true);
            }
            if (fbAuth.currentUser?.emailVerified && user?.phoneVerified) {
                verify(); // Context verify
                navigate('/'); // Route based on role normally
            }
        };
        checkStatus();

        // Poll for email verification if step 1
        let interval;
        if (step === 1) {
            interval = setInterval(async () => {
                if (fbAuth.currentUser) {
                    await fbAuth.currentUser.reload();
                    if (fbAuth.currentUser.emailVerified) {
                        setEmailVerified(true);
                        setStep(2);
                        clearInterval(interval);
                    }
                }
            }, 3000);
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [user, step]);

    const handleSendSMS = async () => {
        setError('');
        setLoading(true);
        try {
            const phoneNumber = user.phone; // Entered during signup
            if (!phoneNumber) {
                throw new Error("No phone number found for user. Please contact support.");
            }
            const result = await sendVerificationSMS(phoneNumber, window.recaptchaVerifier);
            setConfirmationResult(result);
            setOtpSent(true);
        } catch (err) {
            console.error("SMS Error:", err);
            setError(err.message || "Failed to send SMS. Ensure number is in international format (e.g., +49...).");
        }
        setLoading(false);
    };

    const handleVerifyOTP = async () => {
        setError('');
        setLoading(true);
        try {
            await confirmSMS(confirmationResult, otpCode);
            setPhoneVerified(true);
            verify();
            navigate('/');
        } catch (err) {
            console.error("OTP Error:", err);
            setError("Invalid verification code.");
        }
        setLoading(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
            <div id="recaptcha-container"></div>
            
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/8 blur-[160px] rounded-full" />
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand/5 blur-[120px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl max-w-md w-full relative z-10"
            >
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center mb-4 shadow-xl">
                        <ShieldCheck className="text-brand" size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Security Verification</h1>
                    <p className="text-gray-500 mt-2 text-sm">Please verify your identity to access the Grien network.</p>
                </div>

                <div className="space-y-6">
                    {/* Step 1: Email */}
                    <div className={`p-4 rounded-2xl border ${emailVerified ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${emailVerified ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                                    {emailVerified ? <CheckCircle2 size={20} /> : <Mail size={20} />}
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-sm text-gray-900">Email Verification</h3>
                                    <p className="text-xs md:text-sm lg:text-base text-gray-500">{user?.email}</p>
                                </div>
                            </div>
                            {!emailVerified && <Loader2 className="animate-spin text-brand" size={18} />}
                        </div>
                        {!emailVerified && (
                            <div className="mt-3 text-xs md:text-sm lg:text-base text-gray-500 text-left">
                                We sent a verification link to your email. Click it to proceed. Waiting for confirmation...
                            </div>
                        )}
                    </div>

                    {/* Step 2: Phone */}
                    <div className={`p-4 rounded-2xl border ${step === 1 ? 'opacity-50 pointer-events-none' : ''} ${phoneVerified ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${phoneVerified ? 'bg-green-100 text-green-600' : 'bg-brand/10 text-brand'}`}>
                                    {phoneVerified ? <CheckCircle2 size={20} /> : <Smartphone size={20} />}
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-sm text-gray-900">Phone Verification</h3>
                                    <p className="text-xs md:text-sm lg:text-base text-gray-500">{user?.phone || 'No phone provided'}</p>
                                </div>
                            </div>
                        </div>

                        {step === 2 && !phoneVerified && !otpSent && (
                            <button
                                onClick={handleSendSMS}
                                disabled={loading || !user?.phone}
                                className="w-full bg-black text-white font-bold text-sm py-3 rounded-xl hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : "Send SMS Code"}
                            </button>
                        )}

                        {step === 2 && !phoneVerified && otpSent && (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Enter 6-digit code"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-center tracking-widest font-mono"
                                    maxLength={6}
                                />
                                <button
                                    onClick={handleVerifyOTP}
                                    disabled={loading || otpCode.length < 6}
                                    className="w-full bg-brand text-black font-black text-sm py-3 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={16} /> : "Verify Code"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs md:text-sm lg:text-base rounded-xl font-medium text-center">
                        {error}
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <button 
                        onClick={handleLogout}
                        className="text-xs md:text-sm lg:text-base text-gray-400 hover:text-gray-900 font-medium transition-colors"
                    >
                        Return to Login
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default VerificationGateway;
