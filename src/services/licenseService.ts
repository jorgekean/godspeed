import { registerPlugin, Capacitor } from '@capacitor/core';

interface NativeStoreKitPlugin {
    purchaseProduct(options: { productId: string }): Promise<{ success: boolean; productId?: string; transactionId?: string; pending?: boolean }>;
    restorePurchases(): Promise<{ success: boolean; restored: boolean }>;
    checkPurchases(): Promise<{ isLifetime: boolean }>;
}

// Native Apple StoreKit 2 Plugin Bridge
const NativeStoreKit = registerPlugin<NativeStoreKitPlugin>('NativeStoreKit');

const STORAGE_KEY_TRIAL_START = 'godspeed_trial_start_time';
const STORAGE_KEY_LIFETIME = 'godspeed_lifetime_unlocked';
const STORAGE_KEY_SIMULATED_EXPIRED = 'godspeed_trial_simulated_expired';

export const TRIAL_DURATION_DAYS = 90; // 3 months free trial
export const MONTHLY_FREE_SCANS_AFTER_TRIAL = 100; // Free scans per month after 90-day trial expires
export const LIFETIME_PRODUCT_ID = 'com.godspeedgrader.lifetime';
export const LIFETIME_PRICE_DISPLAY = '$8.99';

const STORAGE_KEY_MONTHLY_SCANS_PREFIX = 'godspeed_scans_m_';

export interface LicenseStatus {
    isLifetime: boolean;
    isInTrial: boolean;
    daysRemaining: number;
    daysElapsed: number;
    trialDurationDays: number;
    trialStartDate: Date;
    canScan: boolean;
    priceDisplay: string;
    isSimulatedExpired?: boolean;
    monthlyScansUsed: number;
    monthlyScanLimit: number;
    monthlyScansRemaining: number;
    isMonthlyQuotaActive: boolean;
}

class LicenseService {
    private isInitialized = false;

    /**
     * Initializes StoreKit and checks existing Apple ID entitlements
     */
    async initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        // Ensure trial start date is initialized on first launch
        this.getTrialStartDate();

        if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
            await this.syncNativeStoreKitStatus();
        }
    }

    /**
     * Retrieves or records the first launch timestamp for the 90-day trial
     */
    getTrialStartDate(): Date {
        const stored = localStorage.getItem(STORAGE_KEY_TRIAL_START);
        if (stored) {
            const date = new Date(parseInt(stored, 10));
            if (!isNaN(date.getTime())) {
                return date;
            }
        }

        const now = new Date();
        localStorage.setItem(STORAGE_KEY_TRIAL_START, now.getTime().toString());
        return now;
    }

    /**
     * Gets the current month key for scan tracking, e.g. "2026_11"
     */
    getCurrentMonthKey(): string {
        const d = new Date();
        return `${d.getFullYear()}_${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    }

    /**
     * Gets the number of scans performed in the current calendar month
     */
    getMonthlyScansUsed(): number {
        const key = `${STORAGE_KEY_MONTHLY_SCANS_PREFIX}${this.getCurrentMonthKey()}`;
        const val = localStorage.getItem(key);
        return val ? parseInt(val, 10) : 0;
    }

    /**
     * Records a completed exam scan and increments the monthly count
     */
    recordScan(): number {
        const key = `${STORAGE_KEY_MONTHLY_SCANS_PREFIX}${this.getCurrentMonthKey()}`;
        const current = this.getMonthlyScansUsed();
        const next = current + 1;
        localStorage.setItem(key, next.toString());
        return next;
    }

    /**
     * Resets current month scan count (for testing)
     */
    resetMonthlyScans() {
        const key = `${STORAGE_KEY_MONTHLY_SCANS_PREFIX}${this.getCurrentMonthKey()}`;
        localStorage.removeItem(key);
    }

    /**
     * Sets current month scans to the 100 limit (for testing limit reached state)
     */
    simulateReachMonthlyLimit() {
        const key = `${STORAGE_KEY_MONTHLY_SCANS_PREFIX}${this.getCurrentMonthKey()}`;
        localStorage.setItem(key, MONTHLY_FREE_SCANS_AFTER_TRIAL.toString());
    }

    /**
     * Returns the full license and trial status
     */
    getLicenseStatus(): LicenseStatus {
        const isLifetime = localStorage.getItem(STORAGE_KEY_LIFETIME) === 'true';
        const isSimulatedExpired = localStorage.getItem(STORAGE_KEY_SIMULATED_EXPIRED) === 'true';
        const monthlyScansUsed = this.getMonthlyScansUsed();
        const monthlyScansRemaining = Math.max(0, MONTHLY_FREE_SCANS_AFTER_TRIAL - monthlyScansUsed);

        if (isLifetime) {
            return {
                isLifetime: true,
                isInTrial: false,
                daysRemaining: 0,
                daysElapsed: TRIAL_DURATION_DAYS,
                trialDurationDays: TRIAL_DURATION_DAYS,
                trialStartDate: this.getTrialStartDate(),
                canScan: true,
                priceDisplay: LIFETIME_PRICE_DISPLAY,
                isSimulatedExpired: false,
                monthlyScansUsed,
                monthlyScanLimit: MONTHLY_FREE_SCANS_AFTER_TRIAL,
                monthlyScansRemaining: Infinity,
                isMonthlyQuotaActive: false
            };
        }

        if (isSimulatedExpired) {
            return {
                isLifetime: false,
                isInTrial: false,
                daysRemaining: 0,
                daysElapsed: TRIAL_DURATION_DAYS,
                trialDurationDays: TRIAL_DURATION_DAYS,
                trialStartDate: this.getTrialStartDate(),
                canScan: monthlyScansRemaining > 0,
                priceDisplay: LIFETIME_PRICE_DISPLAY,
                isSimulatedExpired: true,
                monthlyScansUsed,
                monthlyScanLimit: MONTHLY_FREE_SCANS_AFTER_TRIAL,
                monthlyScansRemaining,
                isMonthlyQuotaActive: true
            };
        }

        const startDate = this.getTrialStartDate();
        const now = new Date();
        const diffMs = now.getTime() - startDate.getTime();
        const daysElapsed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        const daysRemaining = Math.max(0, TRIAL_DURATION_DAYS - daysElapsed);
        const isInTrial = daysRemaining > 0;

        // If trial is still active, unlimited scans. If expired, allow 100 scans per month.
        const canScan = isInTrial || (monthlyScansRemaining > 0);

        return {
            isLifetime: false,
            isInTrial,
            daysRemaining,
            daysElapsed,
            trialDurationDays: TRIAL_DURATION_DAYS,
            trialStartDate: startDate,
            canScan,
            priceDisplay: LIFETIME_PRICE_DISPLAY,
            isSimulatedExpired: false,
            monthlyScansUsed,
            monthlyScanLimit: MONTHLY_FREE_SCANS_AFTER_TRIAL,
            monthlyScansRemaining: isInTrial ? Infinity : monthlyScansRemaining,
            isMonthlyQuotaActive: !isInTrial
        };
    }

    /**
     * Checks native Apple StoreKit 2 transactions for active lifetime purchase
     */
    private async syncNativeStoreKitStatus(): Promise<boolean> {
        try {
            if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
                const res = await NativeStoreKit.checkPurchases();
                if (res.isLifetime) {
                    localStorage.setItem(STORAGE_KEY_LIFETIME, 'true');
                    return true;
                }
            }
        } catch (err) {
            console.warn('Native StoreKit check error:', err);
        }
        return false;
    }

    /**
     * Triggers the real native Apple StoreKit 2 purchase sheet ($8.99 lifetime)
     */
    async purchaseLifetime(): Promise<{ success: boolean; error?: string }> {
        // Native iOS StoreKit 2
        if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
            try {
                const result = await NativeStoreKit.purchaseProduct({
                    productId: LIFETIME_PRODUCT_ID
                });

                if (result.success) {
                    localStorage.setItem(STORAGE_KEY_LIFETIME, 'true');
                    localStorage.removeItem(STORAGE_KEY_SIMULATED_EXPIRED);
                    return { success: true };
                } else if (result.pending) {
                    return { success: false, error: 'Purchase pending approval (Ask to Buy).' };
                }
            } catch (err: any) {
                if (err.code === 'USER_CANCELLED' || err.message?.includes('cancelled')) {
                    return { success: false, error: 'Purchase cancelled.' };
                }
                return { success: false, error: err.message || 'StoreKit purchase could not be completed.' };
            }
        }

        // Web or development simulation fallback
        localStorage.setItem(STORAGE_KEY_LIFETIME, 'true');
        localStorage.removeItem(STORAGE_KEY_SIMULATED_EXPIRED);
        return { success: true };
    }

    /**
     * Restores existing purchases via Apple StoreKit 2 (Mandatory Guideline 3.1.1)
     */
    async restorePurchases(): Promise<{ success: boolean; restored: boolean; message: string }> {
        if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
            try {
                const result = await NativeStoreKit.restorePurchases();
                if (result.restored) {
                    localStorage.setItem(STORAGE_KEY_LIFETIME, 'true');
                    localStorage.removeItem(STORAGE_KEY_SIMULATED_EXPIRED);
                    return { success: true, restored: true, message: 'Lifetime license successfully restored!' };
                } else {
                    return { success: true, restored: false, message: 'No prior purchases found for this Apple ID.' };
                }
            } catch (err: any) {
                return { success: false, restored: false, message: err.message || 'Failed to connect to App Store.' };
            }
        }

        // Web mode fallback
        const isLifetime = localStorage.getItem(STORAGE_KEY_LIFETIME) === 'true';
        if (isLifetime) {
            return { success: true, restored: true, message: 'Lifetime license verified and restored!' };
        }
        return { success: true, restored: false, message: 'No previous license found on this device.' };
    }

    /**
     * Developer / Reviewer test helper: simulates an expired trial immediately
     */
    simulateExpireTrial() {
        localStorage.setItem(STORAGE_KEY_SIMULATED_EXPIRED, 'true');
        localStorage.removeItem(STORAGE_KEY_LIFETIME);
    }

    /**
     * Resets trial back to day 1 with 90 days remaining
     */
    resetTrial() {
        localStorage.setItem(STORAGE_KEY_TRIAL_START, Date.now().toString());
        localStorage.removeItem(STORAGE_KEY_LIFETIME);
        localStorage.removeItem(STORAGE_KEY_SIMULATED_EXPIRED);
    }
}

export const licenseService = new LicenseService();
