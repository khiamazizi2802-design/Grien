import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { db as fbDb } from '../config/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

const safeSetItem = (key, value) => {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn(`[Storage Quota Exceeded] Clearing heavy cache to save '${key}'...`, e);
        try {
            const heavyKeys = ['green_global_posts', 'driver_compliance_docs', 'driver_vehicle_docs', 'green_admin_stripe_docs'];
            heavyKeys.forEach(k => {
                if (k !== key) localStorage.removeItem(k);
            });
            localStorage.setItem(key, value);
        } catch (retryErr) {
            console.error(`[Storage Quota Exceeded] Unable to save '${key}':`, retryErr);
        }
    }
};

const RideContext = createContext();

export const RideProvider = ({ children }) => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const isDemo = user?.isDemo;
    const userEmailKey = user?.email ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : 'default';

    const [activeRides, setActiveRides] = useState([]); 
    const [isPoolingEnabled, setIsPoolingEnabled] = useState(() => localStorage.getItem('green_pooling_enabled') === 'true');
    const [isFTDOnly, setIsFTDOnly] = useState(false);
    const [serviceType, setServiceType] = useState(() => localStorage.getItem('green_service_type') || 'standard');
    
    const [allowDashboardView, setAllowDashboardView] = useState(false);
    const [friendRequests, setFriendRequests] = useState({}); // Outgoing: { riderId: 'pending' }
    const [incomingRequests, setIncomingRequests] = useState([]);
    
    useEffect(() => {
        if (isDemo) {
            setIncomingRequests([
                { id: 'cr-mock-1', name: 'Julian R.', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Julian', status: 'pending' }
            ]);
        } else {
            setIncomingRequests([]);
        }
    }, [isDemo]);

    const [mutualFriends, setMutualFriends] = useState([]);

    useEffect(() => {
        if (!user?.email) {
            setMutualFriends([]);
            return;
        }
        const emailKey = user.email.replace(/[^a-zA-Z0-9]/g, '_');
        const saved = localStorage.getItem(`green_mutual_friends_${emailKey}`);
        if (saved) {
            try {
                setMutualFriends(JSON.parse(saved));
            } catch (e) {
                setMutualFriends([]);
            }
        } else if (user?.isDemo) {
            const demoFriends = [
                { id: 'u1', name: 'Marcus V.', username: '@marcus_v', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus', status: 'Online', mutuals: 12, rank: 'Green' },
                { id: 'u2', name: 'Elena R.', username: '@elena_r', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena', status: 'Online', mutuals: 8, rank: 'Pioneer' },
                { id: 'u3', name: 'Julian K.', username: '@julian_k', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Julian', status: 'Offline', mutuals: 15, rank: 'Green' },
                { id: 'u4', name: 'Sophie L.', username: '@sophie_l', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie', status: 'Online', mutuals: 5, rank: 'New Member' },
                { id: 'u5', name: 'Alex M.', username: '@alex_m', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexM', status: 'Offline', mutuals: 21, rank: 'Legend' }
            ];
            setMutualFriends(demoFriends);
            safeSetItem(`green_mutual_friends_${emailKey}`, JSON.stringify(demoFriends));
        } else {
            setMutualFriends([]);
        }
    }, [user]);

    useEffect(() => {
        if (user?.email) {
            const emailKey = user.email.replace(/[^a-zA-Z0-9]/g, '_');
            safeSetItem(`green_mutual_friends_${emailKey}`, JSON.stringify(mutualFriends));
        }
    }, [mutualFriends, user]);
    
    // Global Ride Status for persistence
    const [rideStatus, setRideStatus] = useState(() => localStorage.getItem('green_ride_status') || 'idle');
    const [driverInfo, setDriverInfo] = useState(() => {
        const saved = localStorage.getItem('green_ride_driver');
        return saved ? JSON.parse(saved) : null;
    });

    const [venueTickets, setVenueTickets] = useState([]);

    useEffect(() => {
        if (user?.email) {
            const emailKey = user.email.replace(/[^a-zA-Z0-9]/g, '_');
            const saved = localStorage.getItem(`green_venue_tickets_${emailKey}`);
            if (saved) {
                try {
                    setVenueTickets(JSON.parse(saved));
                } catch (e) {
                    setVenueTickets([]);
                }
            } else {
                setVenueTickets([]);
            }
        } else {
            setVenueTickets([]);
        }
    }, [user]);

    useEffect(() => {
        if (user?.email) {
            const emailKey = user.email.replace(/[^a-zA-Z0-9]/g, '_');
            safeSetItem(`green_venue_tickets_${emailKey}`, JSON.stringify(venueTickets));
        }
    }, [venueTickets, user]);

    const addVenueTicket = (ticket) => {
        setVenueTickets(prev => [ticket, ...prev]);

        // Sync to active orders so that B2B dashboard sees it
        try {
            const managerOrders = JSON.parse(localStorage.getItem('green_active_orders') || '[]');
            
            const managerOrder = {
                id: ticket.id,
                guest: ticket.guestName || 'Anonymous Guest',
                items: [`${ticket.quantity}x ${ticket.event} (${ticket.tier})`],
                total: typeof ticket.price === 'number' ? ticket.price.toFixed(2) : String(ticket.price),
                status: 'Received',
                type: 'Stadium E-Ticket',
                time: 'Just now',
                payment: 'Online',
            };

            const updatedOrders = [managerOrder, ...managerOrders];
            localStorage.setItem('green_active_orders', JSON.stringify(updatedOrders));

            // Sync to stadium events sold counts
            const savedEvents = localStorage.getItem('green_stadium_events');
            if (savedEvents) {
                const events = JSON.parse(savedEvents);
                const updatedEvents = events.map(evt => {
                    if (evt.name === ticket.event || evt.title === ticket.event) {
                        return {
                            ...evt,
                            tiers: evt.tiers.map(t => {
                                if (t.name === ticket.tier) {
                                    return { ...t, sold: (t.sold || 0) + ticket.quantity };
                                }
                                return t;
                            })
                        };
                    }
                    return evt;
                });
                localStorage.setItem('green_stadium_events', JSON.stringify(updatedEvents));
            }

            // Dispatch cross-iframe events
            if (window.parent) {
                window.parent.dispatchEvent(new CustomEvent('green-orders-updated'));
                window.parent.dispatchEvent(new CustomEvent('green-stadium-events-updated'));
            }
        } catch (e) {
            console.error('Failed to sync ticket purchase with active orders:', e);
        }
    };

    useEffect(() => {
        localStorage.setItem('green_ride_status', rideStatus);
    }, [rideStatus]);
    
    useEffect(() => {
        localStorage.setItem('green_pooling_enabled', isPoolingEnabled);
    }, [isPoolingEnabled]);

    useEffect(() => {
        localStorage.setItem('green_service_type', serviceType);
    }, [serviceType]);

    useEffect(() => {
        if (driverInfo) {
            localStorage.setItem('green_ride_driver', JSON.stringify(driverInfo));
        } else {
            localStorage.removeItem('green_ride_driver');
        }
    }, [driverInfo]);

    // Dynamic pricing states
    const [baseFare, setBaseFare] = useState(() => parseFloat(localStorage.getItem('green_base_fare') || '2.00'));
    const [baseFareMax, setBaseFareMax] = useState(() => parseFloat(localStorage.getItem('green_base_fare_max') || '4.00'));
    const [baseFarePremium, setBaseFarePremium] = useState(() => parseFloat(localStorage.getItem('green_base_fare_premium') || '6.00'));
    const [baseFarePremiumMax, setBaseFarePremiumMax] = useState(() => parseFloat(localStorage.getItem('green_base_fare_premium_max') || '8.00'));
    const [baseFareShared, setBaseFareShared] = useState(() => parseFloat(localStorage.getItem('green_base_fare_shared') || '1.50'));

    const [perKmRate, setPerKmRate] = useState(() => parseFloat(localStorage.getItem('green_per_km_rate') || '2.50'));
    const [perKmRateMax, setPerKmRateMax] = useState(() => parseFloat(localStorage.getItem('green_per_km_rate_max') || '3.50'));
    const [perKmRatePremium, setPerKmRatePremium] = useState(() => parseFloat(localStorage.getItem('green_per_km_rate_premium') || '4.50'));
    const [perKmRatePremiumMax, setPerKmRatePremiumMax] = useState(() => parseFloat(localStorage.getItem('green_per_km_rate_premium_max') || '5.50'));
    const [perKmRateShared, setPerKmRateShared] = useState(() => parseFloat(localStorage.getItem('green_per_km_rate_shared') || '1.80'));

    useEffect(() => {
        localStorage.setItem('green_base_fare', String(baseFare));
    }, [baseFare]);

    useEffect(() => {
        localStorage.setItem('green_base_fare_max', String(baseFareMax));
    }, [baseFareMax]);

    useEffect(() => {
        localStorage.setItem('green_base_fare_premium', String(baseFarePremium));
    }, [baseFarePremium]);

    useEffect(() => {
        localStorage.setItem('green_base_fare_premium_max', String(baseFarePremiumMax));
    }, [baseFarePremiumMax]);

    useEffect(() => {
        localStorage.setItem('green_base_fare_shared', String(baseFareShared));
    }, [baseFareShared]);

    useEffect(() => {
        localStorage.setItem('green_per_km_rate', String(perKmRate));
    }, [perKmRate]);

    useEffect(() => {
        localStorage.setItem('green_per_km_rate_max', String(perKmRateMax));
    }, [perKmRateMax]);

    useEffect(() => {
        localStorage.setItem('green_per_km_rate_premium', String(perKmRatePremium));
    }, [perKmRatePremium]);

    useEffect(() => {
        localStorage.setItem('green_per_km_rate_premium_max', String(perKmRatePremiumMax));
    }, [perKmRatePremiumMax]);

    useEffect(() => {
        localStorage.setItem('green_per_km_rate_shared', String(perKmRateShared));
    }, [perKmRateShared]);

    // Live Firebase sync for global pricing
    useEffect(() => {
        const unsub = onSnapshot(doc(fbDb, 'system_config', 'pricing'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.baseFare !== undefined) setBaseFare(parseFloat(data.baseFare));
                if (data.baseFareMax !== undefined) setBaseFareMax(parseFloat(data.baseFareMax));
                if (data.baseFarePremium !== undefined) setBaseFarePremium(parseFloat(data.baseFarePremium));
                if (data.baseFarePremiumMax !== undefined) setBaseFarePremiumMax(parseFloat(data.baseFarePremiumMax));
                if (data.baseFareShared !== undefined) setBaseFareShared(parseFloat(data.baseFareShared));

                if (data.perKmRate !== undefined) setPerKmRate(parseFloat(data.perKmRate));
                if (data.perKmRateMax !== undefined) setPerKmRateMax(parseFloat(data.perKmRateMax));
                if (data.perKmRatePremium !== undefined) setPerKmRatePremium(parseFloat(data.perKmRatePremium));
                if (data.perKmRatePremiumMax !== undefined) setPerKmRatePremiumMax(parseFloat(data.perKmRatePremiumMax));
                if (data.perKmRateShared !== undefined) setPerKmRateShared(parseFloat(data.perKmRateShared));
            }
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('update-pricing', (data) => {
                if (data.baseFare !== undefined) setBaseFare(data.baseFare);
                if (data.baseFareMax !== undefined) setBaseFareMax(data.baseFareMax);
                if (data.baseFarePremium !== undefined) setBaseFarePremium(data.baseFarePremium);
                if (data.baseFarePremiumMax !== undefined) setBaseFarePremiumMax(data.baseFarePremiumMax);
                if (data.perKmRate !== undefined) setPerKmRate(data.perKmRate);
                if (data.perKmRateMax !== undefined) setPerKmRateMax(data.perKmRateMax);
                if (data.perKmRatePremium !== undefined) setPerKmRatePremium(data.perKmRatePremium);
                if (data.perKmRatePremiumMax !== undefined) setPerKmRatePremiumMax(data.perKmRatePremiumMax);
                console.log('Live pricing updated from Admin:', data);
            });
            return () => socket.off('update-pricing');
        }
    }, [socket]);

    const calculatePrice = (distance, passengerCount, customServiceType = null) => {
        const typeToUse = customServiceType || serviceType;
        
        let activeBaseFare = parseFloat(baseFare);
        if (typeToUse === 'max') activeBaseFare = parseFloat(baseFareMax);
        else if (typeToUse === 'premium') activeBaseFare = parseFloat(baseFarePremium);
        else if (typeToUse === 'premium_max' || typeToUse === 'premiumMax') activeBaseFare = parseFloat(baseFarePremiumMax);
        else if (typeToUse === 'shared') activeBaseFare = parseFloat(baseFareShared);

        let activeKmRate = parseFloat(perKmRate);
        if (typeToUse === 'max') activeKmRate = parseFloat(perKmRateMax);
        else if (typeToUse === 'premium') activeKmRate = parseFloat(perKmRatePremium);
        else if (typeToUse === 'premium_max' || typeToUse === 'premiumMax') activeKmRate = parseFloat(perKmRatePremiumMax);
        else if (typeToUse === 'shared') activeKmRate = parseFloat(perKmRateShared);

        const originalPrice = activeBaseFare + (distance * activeKmRate);
        let discount = 0;
        let driverMultiplier = 1.0;

        if (passengerCount === 2) {
            discount = 0.25;       // 25% Rabatt (jeder zahlt €15 statt €20)
            driverMultiplier = 1.25; // Fahrer erhält 125%
        } else if (passengerCount === 3) {
            discount = 0.375;      // 37.5% Rabatt (jeder zahlt €12.50 statt €20)
            driverMultiplier = 1.50; // Fahrer erhält 150%
        } else if (passengerCount === 4) {
            discount = 0.4375;     // 43.75% Rabatt (jeder zahlt €11.25 statt €20)
            driverMultiplier = 1.75; // Fahrer erhält 175%
        } else if (passengerCount >= 5) {
            discount = 0.50;       // 50% Rabatt (jeder zahlt €10 statt €20)
            driverMultiplier = 2.00; // Fahrer erhält 200%
        }

        const discountedPrice = originalPrice * (1 - discount);
        const savings = originalPrice - discountedPrice;
        const totalCollected = discountedPrice * passengerCount;
        const driverPayout = originalPrice * driverMultiplier;
        const platformShare = totalCollected - driverPayout;

        return {
            originalPrice: originalPrice.toFixed(2),
            discountedPrice: discountedPrice.toFixed(2),
            savings: savings.toFixed(2),
            discountPercent: String(discount * 100).replace(/\.0$/, ''),
            driverPayout: driverPayout.toFixed(2),
            platformShare: platformShare.toFixed(2),
            driverPercent: (driverMultiplier * 100).toFixed(0)
        };
    };

    const requestRide = (pickup, destination, distance, passengerCount, isPooled) => {
        const pricing = calculatePrice(distance, isPooled ? 2 : 1); // Mocking 2 if pooled for initial calculation
        const newRide = {
            id: `RIDE-${Date.now()}`,
            pickup,
            destination,
            distance,
            passengerCount,
            isPooled,
            status: 'searching',
            ...pricing
        };
        // In a real app, this would be sent to the server
        return newRide;
    };

    return (
        <RideContext.Provider value={{
            activeRides,
            setActiveRides,
            isPoolingEnabled,
            setIsPoolingEnabled,
            isFTDOnly,
            setIsFTDOnly,
            rideStatus,
            setRideStatus: (status) => {
                if (status === 'idle') setAllowDashboardView(false);
                setRideStatus(status);
            },
            driverInfo,
            setDriverInfo,
            venueTickets,
            setVenueTickets,
            addVenueTicket,
            allowDashboardView,
            setAllowDashboardView,
            calculatePrice,
            requestRide,
            serviceType,
            setServiceType,
            friendRequests,
            setFriendRequests,
            incomingRequests,
            setIncomingRequests,
            mutualFriends,
            setMutualFriends,
            baseFare,
            setBaseFare,
            baseFareMax,
            setBaseFareMax,
            baseFarePremium,
            setBaseFarePremium,
            baseFarePremiumMax,
            setBaseFarePremiumMax,
            baseFareShared,
            setBaseFareShared,
            perKmRate,
            setPerKmRate,
            perKmRateMax,
            setPerKmRateMax,
            perKmRatePremium,
            setPerKmRatePremium,
            perKmRatePremiumMax,
            setPerKmRatePremiumMax,
            perKmRateShared,
            setPerKmRateShared
        }}>
            {children}
        </RideContext.Provider>
    );
};

export const useRide = () => useContext(RideContext);



