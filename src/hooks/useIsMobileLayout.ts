import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Returns true if the app should render in mobile/tablet layout
 * (bottom navigation bar, mobile header, mobile manage menu)
 * instead of the desktop sidebar web layout.
 *
 * Ensures iPad, iPad mini, and mobile devices always use the mobile view.
 */
export function useIsMobileLayout(): boolean {
    const checkIsMobile = (): boolean => {
        if (typeof window === 'undefined') return false;

        // 1. Native Capacitor app on iOS or Android (iPhone or iPad) -> always mobile view
        if (Capacitor.isNativePlatform()) {
            return true;
        }

        // 2. iPad / iPad mini detection (including iPadOS 13+ which reports MacIntel with touch points)
        const isIPad = /iPad/.test(navigator.userAgent) || 
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        if (isIPad) {
            return true;
        }

        // 3. Other mobile and tablet devices
        if (/iPhone|iPod|Android|Mobile|Tablet/i.test(navigator.userAgent)) {
            return true;
        }

        // 4. Any touch device with tablet/mobile dimensions (covers all iPad sizes up to 12.9" Pro in landscape)
        if (navigator.maxTouchPoints > 1 && window.innerWidth <= 1366) {
            return true;
        }

        // 5. Desktop browser window resizing fallback (smaller than 1024px uses mobile view)
        return window.innerWidth < 1024;
    };

    const [isMobile, setIsMobile] = useState<boolean>(checkIsMobile);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(checkIsMobile());
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    return isMobile;
}
