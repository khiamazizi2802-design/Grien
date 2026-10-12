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
            transition: { type: 'spring', damping: 30, stiffness: 180, mass: 0.8 }
        },
        exit: {
            y: position === 'bottom' ? '100%' : 0,
            x: position === 'left' ? '-100%' : 0,
            opacity: 0
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
                        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
                    />
                    <motion.div
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={clsx(
                            "fixed z-50 shadow-2xl p-6",
                            "border border-[var(--border-main)]",
                            position === 'bottom'
                                ? 'bottom-0 left-0 right-0 rounded-t-[3rem] min-h-[40vh] max-h-[95vh] overflow-y-auto'
                                : 'top-0 left-0 bottom-0 w-80 overflow-y-auto',
                            className
                        )}
                        style={{
                            background: 'var(--glass-bg)',
                            backdropFilter: 'blur(30px)',
                            WebkitBackdropFilter: 'blur(30px)'
                        }}
                    >
                        {/* Drag handle */}
                        <div className="w-12 h-1.5 rounded-full mx-auto mb-6 cursor-grab active:cursor-grabbing"
                            style={{ background: 'var(--accent-primary)', opacity: 0.2 }} />
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default Sheet;



