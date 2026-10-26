import React from 'react';
import { MapPin, Navigation, LocateFixed } from 'lucide-react';

const SearchSheet = () => {
    return (
        <div className="space-y-6 pb-8">
            <h3 className="text-xl font-black italic tracking-tighter text-brand uppercase">Where to?</h3>

            <div className="space-y-4">
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand">
                        <MapPin size={20} />
                    </div>
                    <input
                        placeholder="Current Location"
                        className="w-full bg-dark-900 border border-white/5 rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:border-brand/30 font-bold text-sm"
                    />
                    <button className="absolute right-4 top-1/2 -translate-y-1/2 text-brand hover:scale-110 transition-transform">
                        <LocateFixed size={20} />
                    </button>
                </div>

                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                        <Navigation size={20} />
                    </div>
                    <input
                        placeholder="Set Destination"
                        className="w-full bg-dark-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand/30 font-bold text-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button className="p-4 bg-dark-900 border border-white/5 rounded-2xl text-left hover:border-brand/20 transition-all">
                    <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-600 uppercase mb-1">Recent</p>
                    <p className="font-bold text-sm">Airport Terminal 2</p>
                </button>
                <button className="p-4 bg-dark-900 border border-white/5 rounded-2xl text-left hover:border-brand/20 transition-all">
                    <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-600 uppercase mb-1">Recent</p>
                    <p className="font-bold text-sm">Downtown Office</p>
                </button>
            </div>
        </div>
    );
};

export default SearchSheet;



