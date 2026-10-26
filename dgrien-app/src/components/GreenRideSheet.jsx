import React from 'react';
import { MapPin, Navigation, LocateFixed, Car } from 'lucide-react';

const GreenRideSheet = ({ onExecute }) => {
    const [destination, setDestination] = React.useState('');
    const availableCars = [
        { id: 1, mark: 'Tesla Model 3', category: 'Premium', eta: '3 min', price: '$12.50', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tesla' },
        { id: 2, mark: 'BMW i4', category: 'Luxury', eta: '5 min', price: '$18.20', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BMW' },
        { id: 3, mark: 'Audi Q4 e-tron', category: 'SUV', eta: '7 min', price: '$15.00', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Audi' },
    ];

    return (
        <div className="space-y-8 pb-12">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-black italic tracking-tighter text-white uppercase leading-none">GreenRide</h3>
                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-brand uppercase tracking-[0.3em] mt-1 drop-shadow-[0_0_5px_var(--brand-glow)]">Next-Gen Mobility</p>
                </div>
                <div className="w-10 h-10 bg-dark-900 border border-brand/30 rounded-xl flex items-center justify-center text-brand shadow-[0_0_10px_var(--brand-glow)]">
                    <Navigation size={18} />
                </div>
            </div>

            {/* Address Inputs - Grid Flow */}
            <div className="space-y-3">
                <div className="p-4 bg-dark-900/50 backdrop-blur-md border border-white/5 rounded-2xl flex items-center gap-4 group hover:border-brand/30 transition-all">
                    <div className="w-10 h-10 bg-brand/10 border border-brand/20 rounded-xl flex items-center justify-center text-brand">
                        <MapPin size={20} />
                    </div>
                    <div className="flex-1">
                        <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Pick up location</p>
                        <p className="font-bold text-sm text-white">Main St 123 (Current)</p>
                    </div>
                </div>

                <div className="p-4 bg-dark-900/50 backdrop-blur-md border-2 border-brand rounded-2xl flex items-center gap-4 shadow-[0_0_15px_var(--brand-glow)]">
                    <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-dark-950">
                        <LocateFixed size={20} />
                    </div>
                    <div className="flex-1">
                        <p className="text-[7px] font-black text-dark-800 uppercase tracking-widest mb-0.5">Select Destination</p>
                        <input
                            placeholder="Set Target Coords"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            className="bg-transparent w-full focus:outline-none font-bold text-sm text-white placeholder:text-dark-800"
                        />
                    </div>
                </div>
            </div>

            {/* Available Cars Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h4 className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-widest">Available Fleet</h4>
                    <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-widest">3 Units Near</span>
                </div>
                <div className="space-y-4">
                    {availableCars.map((car) => (
                        <div key={car.id} className="p-5 bg-dark-900 border border-white/5 rounded-[1.5rem] flex items-center justify-between hover:border-brand/40 transition-all cursor-pointer group active:scale-95">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl border-2 border-brand/30 p-0.5 bg-dark-800 group-hover:border-brand transition-colors">
                                    <img src={car.avatar} alt="Car" className="w-full h-full rounded-xl object-contain opacity-80" />
                                </div>
                                <div>
                                    <p className="font-black text-base uppercase italic tracking-tighter text-white">{car.mark}</p>
                                    <p className="text-[8px] md:text-[10px] lg:text-xs text-gray-500 font-black uppercase tracking-widest mt-0.5">{car.category} • <span className="text-brand">{car.eta}</span></p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-xl text-brand italic tracking-tighter drop-shadow-[0_0_5px_var(--brand-glow)]">{car.price}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <button
                onClick={() => onExecute && onExecute(destination)}
                disabled={!destination}
                className="w-full py-6 bg-brand text-dark-950 rounded-3xl font-black uppercase tracking-[0.4em] italic text-sm shadow-[0_0_30px_rgba(50,205,50,0.3)] hover:shadow-[0_0_50px_var(--brand)] active:scale-[0.98] transition-all border-b-4 border-black/30 disabled:opacity-50 disabled:grayscale"
            >
                Execute Mission
            </button>
        </div>
    );
};

export default GreenRideSheet;



