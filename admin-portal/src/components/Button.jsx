import React from 'react';
import clsx from 'clsx';

const Button = ({ children, variant = 'primary', className, ...props }) => {
    return (
        <button
            className={clsx(
                "py-3 px-6 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2",
                variant === 'primary' && "bg-brand text-white shadow-lg shadow-brand/20 hover:bg-brand-dark",
                variant === 'outline' && "border border-white/20 text-white hover:bg-white/10",
                variant === 'ghost' && "text-white/70 hover:text-white hover:bg-white/5",
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;



