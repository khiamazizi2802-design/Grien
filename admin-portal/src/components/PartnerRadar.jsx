import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Car, Droplets, MapPin, User, Shield } from 'lucide-react';

const PartnerRadar = ({ partners, drivers }) => {
    // Generate static but random positions for partners/drivers for this session
    const getMarkers = () => {
        const markers = [];

        partners.forEach(p => {
            markers.push({
                ...p,
                id: `p-${p.id}`,
                angle: (p.id * 137.5) % 360,
                distance: 80 + (p.id * 40) % 150,
                icon: p.type === 'Parking' ? Building2 : Droplets
            });
        });

        drivers.forEach(d => {
            markers.push({
                ...d,
                id: `d-${d.id}`,
                type: 'Driver',
                angle: (d.id * 89) % 360,
                distance: 120 + (d.id * 30) % 100,
                avatar: d.avatar
            });
        });

        return markers;
    };

    const markers = getMarkers();

    return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Ambient radial glow */}
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(5,150,105,0.03) 0%, transparent 70%)' }} />

            {/* Radar Grid Rings */}
            <div className="relative w-[500px] h-[500px] rounded-full flex items-center justify-center z-10 pointer-events-none opacity-40">
                {[50, 100, 150, 200, 250].map((radius, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            width: radius * 2,
                            height: radius * 2,
                            border: `1px solid rgba(5,150,105,${0.03 + i * 0.01})`,
                        }}
                    />
                ))}
            </div>

            {/* Sweep Beam */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                className="absolute top-1/2 left-1/2 w-[520px] h-[520px] -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20"
            >
                <div className="absolute top-0 left-1/2 w-[2px] h-1/2 -translate-x-1/2"
                    style={{ background: 'linear-gradient(to top, #059669 0%, transparent 100%)' }} />
            </motion.div>

            {/* Partner & Driver Markers */}
            <AnimatePresence>
                {markers.map((marker) => {
                    const x = marker.distance * Math.cos((marker.angle * Math.PI) / 180);
                    const y = marker.distance * Math.sin((marker.angle * Math.PI) / 180);

                    return (
                        <motion.div
                            key={marker.id}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute top-1/2 left-1/2 z-20 group"
                            style={{ x: `calc(-50% + ${x}px)`, y: `calc(-50% + ${y}px)` }}
                        >
                            <div className="relative flex flex-col items-center">
                                {/* Ping */}
                                <motion.div
                                    animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="absolute inset-0 rounded-full"
                                    style={{ background: marker.type === 'Driver' ? 'rgba(5,150,105,0.2)' : 'rgba(155,89,255,0.2)' }}
                                />

                                <div className="w-8 h-8 rounded-lg flex items-center justify-center relative z-10 overflow-hidden shadow-lg border transition-all group-hover:scale-125"
                                    style={{
                                        background: 'rgba(13,18,28,0.9)',
                                        borderColor: marker.type === 'Driver' ? 'rgba(5,150,105,0.4)' : 'rgba(155,89,255,0.4)'
                                    }}>
                                    {marker.type === 'Driver' ? (
                                        <img src={marker.avatar} alt={marker.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <marker.icon size={16} className={marker.type === 'Parking' ? 'text-blue-400' : 'text-brand'} />
                                    )}
                                </div>

                                {/* Label */}
                                <div className="mt-1 px-1.5 py-0.5 rounded backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ background: 'rgba(0,0,0,0.6)', border: '0.5px solid rgba(255,255,255,0.1)' }}>
                                    <span className="text-[6px] font-black uppercase tracking-widest text-white/80">{marker.name}</span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

export default PartnerRadar;



