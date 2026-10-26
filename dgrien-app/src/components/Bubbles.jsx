import React from 'react';

const Bubbles = () => {
    return (
        <div className="bubbles-container">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="bubble" />
            ))}
        </div>
    );
};

export default Bubbles;
