import React, { useState } from 'react';
import { Star } from 'lucide-react';

const RatingComponent = () => {
    const [rating, setRating] = useState(0);
    const emojis = ['😴', '😐', '😊', '🤩', '🔥'];

    return (
        <div className="space-y-6 text-center py-4">
            <h3 className="text-xl font-black italic tracking-tighter text-primary uppercase">Rate your Mission</h3>

            <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                    <button
                        key={s}
                        onClick={() => setRating(s)}
                        className="p-1 transition-transform active:scale-90"
                    >
                        <Star
                            size={40}
                            className={`${s <= rating ? 'text-[var(--accent-primary)] fill-[var(--accent-primary)]' : 'text-gray-500'}`}
                        />
                    </button>
                ))}
            </div>

            {rating > 0 && (
                <div className="animate-in fade-in zoom-in duration-300">
                    <span className="text-6xl">{emojis[rating - 1]}</span>
                    <p className="mt-4 font-black italic text-[var(--accent-primary)] text-lg uppercase tracking-tight">
                        {rating === 5 ? 'System Perfect' : 'Mission Successful'}
                    </p>
                </div>
            )}

            <textarea
                placeholder="Any telemetry to report?"
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl p-4 focus:outline-none focus:border-[var(--accent-primary)]/30 font-bold text-sm min-h-[100px] resize-none text-primary placeholder:text-gray-500 shadow-inner"
            />
        </div>
    );
};

export default RatingComponent;



