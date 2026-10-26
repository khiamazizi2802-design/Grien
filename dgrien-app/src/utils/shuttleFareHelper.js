// Utility for dynamic Shuttle Fare Calculation (Tiered Distance Formula)
// Default Rule: 9km = 10.00 €, every additional 3km = +1.50 €

export const DEFAULT_SHUTTLE_FARE_CONFIG = {
    basePrice: 10.00, // € for base distance
    baseKm: 9.0,      // km base threshold
    stepKm: 3.0,      // km interval for step increments
    stepFee: 1.50,    // € per step increment
    luggageFee: 3.00, // € per extra luggage / bag
    includedLuggage: 1 // number of free luggage items per passenger
};

export const getShuttleFareConfig = () => {
    try {
        const saved = localStorage.getItem('green_shuttle_fare_config');
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                basePrice: Number(parsed.basePrice) || DEFAULT_SHUTTLE_FARE_CONFIG.basePrice,
                baseKm: Number(parsed.baseKm) || DEFAULT_SHUTTLE_FARE_CONFIG.baseKm,
                stepKm: Number(parsed.stepKm) || DEFAULT_SHUTTLE_FARE_CONFIG.stepKm,
                stepFee: Number(parsed.stepFee) || DEFAULT_SHUTTLE_FARE_CONFIG.stepFee,
                luggageFee: parsed.luggageFee !== undefined ? Number(parsed.luggageFee) : (Number(localStorage.getItem('green_shuttle_luggage_fee')) || DEFAULT_SHUTTLE_FARE_CONFIG.luggageFee),
                includedLuggage: parsed.includedLuggage !== undefined ? Number(parsed.includedLuggage) : (Number(localStorage.getItem('green_shuttle_included_luggage')) || DEFAULT_SHUTTLE_FARE_CONFIG.includedLuggage)
            };
        }
    } catch (e) {
        console.error('Error reading shuttle fare config:', e);
    }
    const legacyLuggageFee = Number(localStorage.getItem('green_shuttle_luggage_fee'));
    const legacyIncludedLuggage = Number(localStorage.getItem('green_shuttle_included_luggage'));
    return {
        ...DEFAULT_SHUTTLE_FARE_CONFIG,
        luggageFee: !isNaN(legacyLuggageFee) && legacyLuggageFee >= 0 ? legacyLuggageFee : DEFAULT_SHUTTLE_FARE_CONFIG.luggageFee,
        includedLuggage: !isNaN(legacyIncludedLuggage) && legacyIncludedLuggage >= 0 ? legacyIncludedLuggage : DEFAULT_SHUTTLE_FARE_CONFIG.includedLuggage
    };
};

export const saveShuttleFareConfig = (config) => {
    try {
        const cleanConfig = {
            basePrice: Math.max(0, Number(config.basePrice) || DEFAULT_SHUTTLE_FARE_CONFIG.basePrice),
            baseKm: Math.max(1, Number(config.baseKm) || DEFAULT_SHUTTLE_FARE_CONFIG.baseKm),
            stepKm: Math.max(0.5, Number(config.stepKm) || DEFAULT_SHUTTLE_FARE_CONFIG.stepKm),
            stepFee: Math.max(0, Number(config.stepFee) || DEFAULT_SHUTTLE_FARE_CONFIG.stepFee),
            luggageFee: Math.max(0, Number(config.luggageFee ?? DEFAULT_SHUTTLE_FARE_CONFIG.luggageFee)),
            includedLuggage: Math.max(0, Number(config.includedLuggage ?? DEFAULT_SHUTTLE_FARE_CONFIG.includedLuggage))
        };
        localStorage.setItem('green_shuttle_fare_config', JSON.stringify(cleanConfig));
        localStorage.setItem('green_shuttle_luggage_fee', cleanConfig.luggageFee);
        localStorage.setItem('green_shuttle_included_luggage', cleanConfig.includedLuggage);
        // Dispatch custom event for real-time reactive sync across components
        window.dispatchEvent(new Event('shuttleFareConfigUpdated'));
        return cleanConfig;
    } catch (e) {
        console.error('Error saving shuttle fare config:', e);
        return DEFAULT_SHUTTLE_FARE_CONFIG;
    }
};

export const calculateShuttleFare = (distanceKm, overrideConfig = null, luggageCount = 0) => {
    const km = Math.max(0, Number(distanceKm) || 0);
    if (km <= 0) return 0;

    const config = overrideConfig || getShuttleFareConfig();
    const { basePrice, baseKm, stepKm, stepFee, luggageFee = 3.00, includedLuggage = 1 } = config;

    let distanceFare = basePrice;
    if (km > baseKm) {
        const extraKm = km - baseKm;
        const extraSteps = Math.ceil(extraKm / stepKm);
        distanceFare = basePrice + (extraSteps * stepFee);
    }

    const extraBags = Math.max(0, (Number(luggageCount) || 0) - (Number(includedLuggage) || 0));
    const luggageFare = extraBags * (Number(luggageFee) || 0);

    const totalFare = distanceFare + luggageFare;
    return Number(totalFare.toFixed(2));
};

export const calculateLuggageSurcharge = (luggageCount = 0, overrideConfig = null) => {
    const config = overrideConfig || getShuttleFareConfig();
    const { luggageFee = 3.00, includedLuggage = 1 } = config;
    const extraBags = Math.max(0, (Number(luggageCount) || 0) - (Number(includedLuggage) || 0));
    return Number((extraBags * (Number(luggageFee) || 0)).toFixed(2));
};

// Simple distance estimator helper for demo/geocoding fallback
export const estimateDistanceKm = (pickupAddress, destinationAddress) => {
    if (!pickupAddress || !destinationAddress) return 12; // default reasonable distance fallback
    
    const p = pickupAddress.toLowerCase();
    const d = destinationAddress.toLowerCase();
    
    if (p === d) return 0;
    
    // Hash string to deterministic semi-realistic distance between 4km and 28km
    let hash = 0;
    const combined = p + d;
    for (let i = 0; i < combined.length; i++) {
        hash = (hash << 5) - hash + combined.charCodeAt(i);
        hash |= 0;
    }
    const dist = 5 + (Math.abs(hash) % 22);
    return dist;
};
