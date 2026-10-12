import React, { useRef, useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';

const MapController = ({ campaignLat, campaignLng, handleMapSelect }) => {
    const map = useMap();
    const timeoutRef = useRef(null);
    const lastPosRef = useRef({ lat: campaignLat, lng: campaignLng });

    useEffect(() => {
        if (lastPosRef.current.lat !== campaignLat || lastPosRef.current.lng !== campaignLng) {
            lastPosRef.current = { lat: campaignLat, lng: campaignLng };
            map.setView([campaignLat, campaignLng]);
        }
    }, [campaignLat, campaignLng, map]);

    useMapEvents({
        click(e) {
            handleMapSelect(e.latlng.lat, e.latlng.lng);
        },
        dblclick(e) {
            handleMapSelect(e.latlng.lat, e.latlng.lng);
        },
        dragstart() {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        },
        dragend() {
            timeoutRef.current = setTimeout(() => {
                map.setView([lastPosRef.current.lat, lastPosRef.current.lng]);
            }, 5000);
        }
    });

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return null;
};

export default MapController;
