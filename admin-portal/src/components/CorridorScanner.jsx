import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Users, Zap } from 'lucide-react';

const CorridorScanner = ({ pickup, destination, isPooling }) => {
    // Generate mock "matched" points along the corridor
    const matches = [
        { id: 1, pos: 0.25, name: 'Lukas M.', type: 'passenger' },
        { id: 2, pos: 0.55, name: 'Elena R.', type: 'driver' },
        { id: 3, pos: 0.8, name: 'Sarah L.', type: 'passenger' },
    ];

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-dark-950/40 rounded-[2.5rem]">
            {/* Ambient Depth Glow */}
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 50% 50%, rgba(0,230,118,0.08) 0%, transparent 70%)' }} />

            {/* Scanning Route Container */}
            <div className="relative w-full max-w-[280px] h-[400px] flex flex-col items-center justify-between py-12">
                
                {/* Vertical Route Line (The Spine) */}
                <div className="absolute top-12 bottom-12 left-1/2 -translate-x-1/2 w-[2px] overflow-hidden"
                    style={{ background: 'rgba(0,230,118,0.1)' }}>
                    <motion.div
                        animate={{ y: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="w-full h-1/2"
                        style={{ background: 'linear-gradient(to bottom, transparent, var(--brand), transparent)' }}
                    />
                </div>

                {/* Pickup Node */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative z-10 flex flex-col items-center"
                >
                    <div className="w-10 h-10 rounded-xl bg-dark-900 border border-brand/40 flex items-center justify-center shadow-[0_0_15px_var(--brand-glow)]">
                        <Navigation size={18} className="text-brand fill-brand/20" />
                    </div>
                    <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-brand mt-2">Origin</span>
                </motion.div>

                {/* The "Black Lines" Scan Effect (User Request) */}
                <div className="absolute inset-0 pointer-events-none">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ 
                                y: [50, 350], 
                                opacity: [0, 1, 1, 0],
                            }}
                            transition={{ 
                                duration: 2.5, 
                                repeat: Infinity, 
                                ease: 'linear',
                                delay: i * 0.8 
                            }}
                            className="absolute left-1/2 -translate-x-1/2 w-56 h-[2px]"
                            style={{ 
                                background: 'rgba(0,0,0,0.8)', // Real black lines as requested
                                borderTop: '1px solid rgba(0,230,118,0.3)',
                                borderBottom: '1px solid rgba(0,230,118,0.3)'
                            }}
                        >
                            {/* The "Tick Marks" from the user drawing */}
                            <div className="absolute inset-0 flex justify-between">
                                {[...Array(8)].map((_, j) => (
                                    <div key={j} className="w-[1.5px] h-4 -translate-y-1 bg-black shadow-[0_0_5px_rgba(0,230,118,0.2)]" />
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Corridor Match Indicators */}
                <AnimatePresence>
                    {matches.map((match) => (
                        <motion.div
                            key={match.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ 
                                opacity: [0, 1, 1, 0],
                                x: 0
                            }}
                            transition={{ 
                                duration: 2, 
                                delay: match.pos * 3,
                                repeat: Infinity,
                                repeatDelay: 1
                            }}
                            className="absolute left-1/2 z-20 flex items-center gap-2"
                            style={{ 
                                top: `${12 + match.pos * 76}%`, 
                                transform: `translateX(${match.id % 2 === 0 ? '-120%' : '20%'})` 
                            }}
                        >
                            <div className="w-8 h-8 rounded-lg bg-dark-900/80 backdrop-blur-md border border-brand/30 flex items-center justify-center relative">
                                {match.type === 'passenger' ? <Users size={12} className="text-brand" /> : <Zap size={12} className="text-accent" />}
                                <motion.div
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 rounded-lg bg-brand/20"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[7px] font-black uppercase tracking-tighter text-white">{match.name}</span>
                                <span className="text-[5px] font-bold uppercase tracking-widest text-brand/60">Matching Route...</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Destination Node */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative z-10 flex flex-col items-center"
                >
                    <div className="w-12 h-12 rounded-2xl bg-brand border border-white/20 flex items-center justify-center shadow-[0_0_25px_var(--brand-glow)]">
                        <MapPin size={22} className="text-dark-950 fill-dark-950/20" />
                    </div>
                    <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-[0.2em] text-white mt-2 italic">Target Locked</span>
                </motion.div>

                {/* Scanning Status Label */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
                    <motion.p
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.4em] text-brand"
                    >
                        {isPooling ? 'Pooling Corridors...' : 'Scanning Route Vector...'}
                    </motion.p>
                    <p className="text-[7px] text-white/30 font-bold uppercase tracking-widest mt-1">
                        Wait for Permission
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CorridorScanner;
