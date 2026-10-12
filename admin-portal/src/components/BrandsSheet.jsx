import React from 'react';
import { X } from 'lucide-react';

const BrandsSheet = () => {
    const brands = [
        { name: 'Tesla', icon: '⚡' },
        { name: 'BMW', icon: '🏎️' },
        { name: 'Audi', icon: '⭕' },
        { name: 'Lucid', icon: '💎' },
        { name: 'Porsche', icon: '🚀' },
    ];

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-black italic tracking-tighter text-brand uppercase">Select Brand</h3>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {brands.map((brand) => (
                    <div key={brand.name} className="relative flex-shrink-0 group">
                        <div className="w-20 h-20 rounded-2xl bg-dark-900 border border-white/5 flex flex-col items-center justify-center hover:border-brand/40 transition-all cursor-pointer">
                            <span className="text-2xl mb-1">{brand.icon}</span>
                            <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-500">{brand.name}</span>
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-dark-800 scale-0 group-hover:scale-100 transition-transform">
                            <X size={12} className="text-white" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BrandsSheet;



