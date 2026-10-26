import React from 'react';
import { Star, Smile } from 'lucide-react';
import Button from './Button';

const DriverCard = ({ driver, onBook, onClose }) => {
    if (!driver) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-700 overflow-hidden relative border-2 border-brand">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.id}`} alt="Driver" className="w-full h-full object-cover" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Driver #{driver.id.toString().slice(-4)}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="flex items-center gap-1"><Star size={14} className="text-yellow-400" fill="currentColor" /> 4.8</span>
                        <span className="flex items-center gap-1"><Smile size={14} className="text-brand" /> Friendly</span>
                    </div>
                </div>
                <div className="ml-auto text-right">
                    <div className="text-2xl font-bold text-brand">3 min</div>
                    <div className="text-xs md:text-sm lg:text-base text-gray-400">Away</div>
                </div>
            </div>

            <div className="flex gap-2">
                <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
                    <div className="text-xs md:text-sm lg:text-base text-gray-400 uppercase">Car</div>
                    <div className="font-bold">Tesla Model 3</div>
                </div>
                <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
                    <div className="text-xs md:text-sm lg:text-base text-gray-400 uppercase">Plate</div>
                    <div className="font-bold">B-XY 1234</div>
                </div>
            </div>

            <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                <Button className="flex-[2]" onClick={onBook}>Book This Driver</Button>
            </div>
        </div>
    );
};

export default DriverCard;



