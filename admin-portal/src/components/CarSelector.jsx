import React from 'react';
import clsx from 'clsx';
import { Car, Zap, ShieldCheck } from 'lucide-react';

const cars = [
    { id: 'standard', name: 'Green Basic', icon: Car, price: '€12.50', time: '4 min' },
    { id: 'premium', name: 'Green Premium', icon: ShieldCheck, price: '€18.00', time: '6 min' },
    { id: 'electric', name: 'Green Electric', icon: Zap, price: '€14.20', time: '5 min' },
];

const CarSelector = ({ selected, onSelect }) => {
    return (
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {cars.map((car) => {
                const Icon = car.icon;
                const isSelected = selected === car.id;
                return (
                    <button
                        key={car.id}
                        onClick={() => onSelect(car.id)}
                        className={clsx(
                            "flex flex-col items-center min-w-[120px] p-4 rounded-2xl border transition-all",
                            isSelected
                                ? "bg-brand/20 border-brand shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                : "bg-white/5 border-white/10 hover:bg-white/10"
                        )}
                    >
                        <div className={clsx("p-3 rounded-full mb-3", isSelected ? "bg-brand text-white" : "bg-dark-700 text-gray-400")}>
                            <Icon size={24} />
                        </div>
                        <h3 className="text-sm font-medium text-white mb-1">{car.name}</h3>
                        <p className="text-xs md:text-sm lg:text-base text-gray-400 mb-2">{car.time}</p>
                        <span className="text-brand font-bold">{car.price}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default CarSelector;



