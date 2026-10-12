import React, { useState } from 'react';
import Button from './Button';

const ConsentBanner = () => {
    const [isVisible, setIsVisible] = useState(() => {
        return !localStorage.getItem('green-app-consent');
    });


    const handleAccept = () => {
        localStorage.setItem('green-app-consent', 'true');
        setIsVisible(false);
    };

    const handleDecline = () => {
        // In real app, disable tracking
        localStorage.setItem('green-app-consent', 'false');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-white/10 p-6 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="max-w-2xl mx-auto">
                <h3 className="text-lg font-bold text-white mb-2">Wir respektieren Ihre Privatsphäre (DSGVO)</h3>
                <p className="text-gray-400 text-sm mb-4">
                    Wir verwenden Cookies und ähnliche Technologien, um Ihr Erlebnis zu verbessern, Inhalte zu personalisieren und unseren Datenverkehr zu analysieren.
                    Durch Klicken auf "Akzeptieren" stimmen Sie unserer <a href="/privacy" className="text-brand underline">Datenschutzerklärung</a> zu.
                </p>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={handleDecline} className="flex-1 py-3 text-sm">Ablehnen</Button>
                    <Button onClick={handleAccept} className="flex-1 py-3 text-sm">Akzeptieren</Button>
                </div>
            </div>
        </div>
    );
};

export default ConsentBanner;



