import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { licenseService, type LicenseStatus } from '../services/licenseService';
import { toast } from 'sonner';

interface LicenseContextType {
    licenseStatus: LicenseStatus;
    isPaywallOpen: boolean;
    paywallTriggerReason: string;
    openPaywall: (reason?: string) => void;
    closePaywall: () => void;
    purchaseLifetime: () => Promise<boolean>;
    restorePurchases: () => Promise<boolean>;
    simulateExpireTrial: () => void;
    resetTrial: () => void;
    refreshLicense: () => void;
}

const LicenseContext = createContext<LicenseContextType>({} as LicenseContextType);

export const useLicense = () => useContext(LicenseContext);

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [licenseStatus, setLicenseStatus] = useState<LicenseStatus>(() => licenseService.getLicenseStatus());
    const [isPaywallOpen, setIsPaywallOpen] = useState(false);
    const [paywallTriggerReason, setPaywallTriggerReason] = useState('');

    const refreshLicense = useCallback(() => {
        setLicenseStatus(licenseService.getLicenseStatus());
    }, []);

    useEffect(() => {
        licenseService.initialize().then(() => {
            refreshLicense();
        });
    }, [refreshLicense]);

    const openPaywall = useCallback((reason: string = '') => {
        setPaywallTriggerReason(reason);
        setIsPaywallOpen(true);
    }, []);

    const closePaywall = useCallback(() => {
        setIsPaywallOpen(false);
        setPaywallTriggerReason('');
    }, []);

    const purchaseLifetime = useCallback(async (): Promise<boolean> => {
        try {
            const result = await licenseService.purchaseLifetime();
            if (result.success) {
                refreshLicense();
                setIsPaywallOpen(false);
                toast.success('🎉 Lifetime Access Unlocked!', {
                    description: 'Thank you for supporting Godspeed Grader. Enjoy unlimited grading forever.'
                });
                return true;
            } else if (result.error) {
                toast.error(result.error);
            }
            return false;
        } catch (err: any) {
            toast.error(err.message || 'Purchase could not be completed.');
            return false;
        }
    }, [refreshLicense]);

    const restorePurchases = useCallback(async (): Promise<boolean> => {
        try {
            const result = await licenseService.restorePurchases();
            refreshLicense();
            if (result.restored) {
                setIsPaywallOpen(false);
                toast.success('Purchases Restored!', {
                    description: result.message
                });
                return true;
            } else {
                toast.info('Restore Purchases', {
                    description: result.message
                });
                return false;
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to restore purchases.');
            return false;
        }
    }, [refreshLicense]);

    const simulateExpireTrial = useCallback(() => {
        licenseService.simulateExpireTrial();
        refreshLicense();
        toast.info('Simulated Trial Expired', {
            description: 'You can now test the paywall and scanner lockout behavior.'
        });
    }, [refreshLicense]);

    const resetTrial = useCallback(() => {
        licenseService.resetTrial();
        refreshLicense();
        toast.success('Trial Reset', {
            description: '90 days remaining restored.'
        });
    }, [refreshLicense]);

    return (
        <LicenseContext.Provider
            value={{
                licenseStatus,
                isPaywallOpen,
                paywallTriggerReason,
                openPaywall,
                closePaywall,
                purchaseLifetime,
                restorePurchases,
                simulateExpireTrial,
                resetTrial,
                refreshLicense
            }}
        >
            {children}
        </LicenseContext.Provider>
    );
};
