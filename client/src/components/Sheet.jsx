import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const Sheet = ({ isOpen, onClose, children, position = 'bottom', className }) => {
    const variants = {
        hidden: {
            y: position === 'bottom' ? '100%' : 0,
            x: position === 'left' ? '-100%' : 0,
            opacity: 0
        },
        visible: {
            y: 0,
            x: 0,
            opacity: 1,
            transition: { type: 'spring', damping: 28, stiffness: 220, mass: 0.8 }
        },
        exit: {
            y: position === 'bottom' ? '100%' : 0,
            x: position === 'left' ? '-100%' : 0,
            opacity: 0,
            transition: { duration: 0.2, ease: 'easeOut' }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
                    />
                    <motion.div
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        drag={position === 'bottom' ? 'y' : false}
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0.05, bottom: 0.7 }}
                        onDragEnd={(e, { offset, velocity }) => {
                            // If dragged down past 80px or with downward flick velocity
                            if (offset.y > 80 || velocity.y > 350) {
                                onClose();
                            }
                        }}
                        className={clsx(
                            "fixed z-50 shadow-2xl p-6",
                            "border border-[var(--border-main)]",
                            position === 'bottom'
                                ? 'bottom-0 left-0 right-0 rounded-t-[3.5rem] min-h-[45vh] max-h-[92vh] flex flex-col overflow-hidden pb-4'
                                : 'top-0 left-0 bottom-0 w-80 overflow-y-auto',
                            className
                        )}
                        style={{
                            background: 'var(--glass-bg)',
                            backdropFilter: 'blur(30px)',
                            WebkitBackdropFilter: 'blur(30px)'
                        }}
                    >
                        {/* Drag handle - interactive touch area */}
                        {position === 'bottom' && (
                            <div 
                                className="w-full py-2 -mt-2 mb-4 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none group"
                                onClick={onClose}
                                title="Nach unten wischen zum Schließen"
                            >
                                <div className="w-14 h-1.5 rounded-full bg-white/40 group-hover:bg-white/70 group-active:bg-brand transition-all shadow-sm" />
                            </div>
                        )}

                        {/* Scrollable sheet body with smooth vertical scrolling */}
                        <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default Sheet;
