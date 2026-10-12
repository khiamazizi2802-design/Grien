import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';

const AdvancedRadar = ({ selectedFilter }) => {
    const { drivers } = useSocket();

    const brands = [
        { name: 'VW', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg' },
        { name: 'Toyota', logo: 'https://www.vectorlogo.zone/logos/toyota/toyota-icon.svg' },
        { name: 'Ford', logo: 'https://www.vectorlogo.zone/logos/ford/ford-icon.svg' },
        { name: 'Peugeot', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Peugeot_Logo.svg' },
        { name: 'Opel', logo: 'https://www.logo.wine/a/logo/Opel/Opel-Logo.wine.svg' },
        { name: 'Tesla', logo: 'https://www.vectorlogo.zone/logos/tesla/tesla-icon.svg' },
        { name: 'Mercedes', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg' },
        { name: 'BMW', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg' }
    ];

    // Map drivers to radar markers
    const markers = drivers
        .filter(d => !selectedFilter || d.brand === selectedFilter)
        .map(driver => {
            const brand = brands.find(b => b.name === driver.brand) || brands[0];
            
            // Calculate visual coordinates based on lat/lng relative to center (mock center)
            const CENTER_LAT = 52.52;
            const CENTER_LNG = 13.405;
            
            // Scaled distance for the radar view (max radius ~250px)
            const latDiff = (driver.lat - CENTER_LAT) * 10000;
            const lngDiff = (driver.lng - CENTER_LNG) * 10000;
            const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
            const angle = Math.atan2(lngDiff, latDiff) * (180 / Math.PI);

            return {
                id: driver.id,
                brand: driver.brand,
                logo: brand.logo,
                angle: angle,
                distance: Math.min(distance, 250),
                scale: 1,
                status: driver.status
            };
        });

    return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">

            {/* Ambient radial glow */}
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(52,211,153,0.06) 0%, transparent 70%)' }} />

            {/* Radar Grid Rings */}
            <div className="relative w-[500px] h-[500px] rounded-full flex items-center justify-center z-10 pointer-events-none">
                {[50, 100, 150, 200, 250].map((radius, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1, duration: 0.6 }}
                        className="absolute rounded-full"
                        style={{
                            width: radius * 2,
                            height: radius * 2,
                            border: `1px solid rgba(52,211,153,${0.04 + i * 0.015})`,
                            boxShadow: i === 4 ? 'inset 0 0 60px rgba(52,211,153,0.02)' : undefined,
                        }}
                    >
                        {/* Ring label */}
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[7px] font-black uppercase tracking-[0.2em] italic"
                            style={{ color: 'rgba(5,150,105,0.3)' }}>
                            {i + 1} KM
                        </span>
                    </motion.div>
                ))}

                {/* Cross-hairs */}
                <div className="absolute w-full h-[1px] pointer-events-none" style={{ background: 'rgba(5,150,105,0.05)' }} />
                <div className="absolute w-[1px] h-full pointer-events-none" style={{ background: 'rgba(5,150,105,0.05)' }} />
            </div>

            {/* Sweep Beam — slow rotation, 90s */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
                className="absolute top-1/2 left-1/2 w-[520px] h-[520px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            >
                {/* Wide soft cone */}
                <div className="absolute top-0 left-1/2 w-[60px] h-1/2 -translate-x-1/2 origin-bottom opacity-30"
                    style={{
                        background: 'conic-gradient(from -15deg at 50% 100%, rgba(52,211,153,0.15), transparent 40%)',
                        filter: 'blur(6px)',
                    }} />
                {/* Sharp beam */}
                <div className="absolute top-0 left-1/2 w-[3px] h-1/2 -translate-x-1/2 blur-[3px]"
                    style={{ background: 'linear-gradient(to top, var(--brand) 0%, var(--brand-end) 60%, transparent 100%)' }} />
                <div className="absolute top-0 left-1/2 w-[1px] h-1/2 -translate-x-1/2"
                    style={{ background: 'linear-gradient(to top, #ffffff 0%, rgba(52,211,153,0.6) 70%, transparent 100%)' }} />
                {/* Tip dot */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                    style={{ background: '#059669', boxShadow: '0 0 12px #059669, 0 0 20px rgba(5,150,105,0.5)' }} />
            </motion.div>

            {/* Vehicle Markers */}
            <AnimatePresence>
                {markers.map((marker) => {
                    const x = marker.distance * Math.cos((marker.angle * Math.PI) / 180);
                    const y = marker.distance * Math.sin((marker.angle * Math.PI) / 180);

                    return (
                        <motion.div
                            key={marker.id}
                            initial={{ opacity: 0, scale: 0, filter: 'blur(8px)' }}
                            animate={{ opacity: 1, scale: marker.scale, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 0, filter: 'blur(8px)' }}
                            transition={{ duration: 0.5 }}
                            className="absolute top-1/2 left-1/2 z-20 group cursor-pointer"
                            style={{ x: `calc(-50% + ${x}px)`, y: `calc(-50% + ${y}px)` }}
                        >
                            {/* Outer ping glow */}
                            <motion.div
                                animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
                                className="absolute inset-[-4px] rounded-xl pointer-events-none"
                                style={{ background: 'rgba(5,150,105,0.2)', filter: 'blur(4px)' }}
                            />

                            {/* Glass tile — white bg so logo is always visible */}
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden transition-all group-hover:scale-125"
                                style={{
                                    background: 'rgba(255,255,255,0.92)',
                                    border: '1.5px solid var(--brand)',
                                    boxShadow: '0 0 14px var(--brand-glow), 0 4px 12px rgba(0,0,0,0.4)',
                                }}>
                                <img
                                    src={marker.logo}
                                    alt={marker.brand}
                                    className="w-full h-full object-contain p-1.5"
                                />
                            </div>

                            {/* Tooltip */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none"
                                style={{ background: 'rgba(11,14,17,0.95)', border: '1px solid rgba(5,150,105,0.3)' }}>
                                <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest" style={{ color: '#059669' }}>
                                    {marker.brand}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {/* Center Hub */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center">
                {/* Expanding broadcast ring */}
                <motion.div
                    initial={{ width: 0, height: 0, opacity: 0.8 }}
                    animate={{ width: 480, height: 480, opacity: 0 }}
                    transition={{ duration: 7, repeat: Infinity, ease: 'easeOut' }}
                    className="absolute rounded-full pointer-events-none"
                    style={{ border: '1.5px solid rgba(52,211,153,0.3)', boxShadow: '0 0 20px rgba(52,211,153,0.1)' }}
                />
                <motion.div
                    initial={{ width: 0, height: 0, opacity: 0.6 }}
                    animate={{ width: 480, height: 480, opacity: 0 }}
                    transition={{ duration: 7, repeat: Infinity, ease: 'easeOut', delay: 3.5 }}
                    className="absolute rounded-full pointer-events-none"
                    style={{ border: '1px solid rgba(6,78,59,0.25)' }}
                />

                {/* Core dot */}
                <div className="w-4 h-4 rounded-full relative"
                    style={{
                        background: 'linear-gradient(135deg, var(--brand), var(--brand-end))',
                        boxShadow: '0 0 20px var(--brand-glow), 0 0 40px rgba(52,211,153,0.3)',
                    }}>
                    <div className="absolute inset-[3px] rounded-full bg-white/80" />
                </div>
            </div>
        </div>
    );
};

export default AdvancedRadar;



