/**
 * Safe localStorage setItem helper that gracefully handles QuotaExceededError
 * by purging non-essential cache items (heavy video posts, compliance docs, etc.)
 * and truncating older lists if storage space is tight.
 */
export const safeSetItem = (key, value) => {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn(`[Storage Quota Exceeded] Attempting recovery to save '${key}'...`, e);
        try {
            // Priority 1: Clear large video / image cache entries
            const heavyKeys = [
                'green_global_posts',
                'driver_compliance_docs',
                'driver_vehicle_docs',
                'green_admin_stripe_docs'
            ];
            
            Object.keys(localStorage).forEach(k => {
                if (k !== key && heavyKeys.some(hk => k.startsWith(hk))) {
                    try { localStorage.removeItem(k); } catch (_) {}
                }
            });

            localStorage.setItem(key, value);
        } catch (retryErr1) {
            console.warn(`[Storage Quota Exceeded] Trimming key list array for '${key}'...`, retryErr1);
            try {
                // Priority 2: Truncate array values if saving orders/tickets
                let strValue = value;
                try {
                    const parsed = JSON.parse(value);
                    if (Array.isArray(parsed) && parsed.length > 5) {
                        strValue = JSON.stringify(parsed.slice(0, 5));
                    }
                } catch (_) {}

                // Clear all non-critical keys
                Object.keys(localStorage).forEach(k => {
                    if (k !== key && !k.startsWith('green_user_') && !k.includes('token')) {
                        try { localStorage.removeItem(k); } catch (_) {}
                    }
                });

                localStorage.setItem(key, strValue);
            } catch (retryErr2) {
                console.error(`[Storage Quota Exceeded] Failed to write key '${key}':`, retryErr2);
            }
        }
    }
};
