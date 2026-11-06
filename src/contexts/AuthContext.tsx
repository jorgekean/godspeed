import React, { createContext, useContext, useEffect, useState } from 'react';
import { migrateGuestDataToUser } from '../services/db';

export interface User {
    id: string;
    name?: string;
    email: string;
    school?: string;
    role: string;
}

export const DEFAULT_USER: User = {
    id: 'local_teacher',
    name: 'Teacher',
    email: 'guest@godspeedgrader.local',
    school: 'My School',
    role: 'teacher'
};

export const GUEST_USER: User = DEFAULT_USER;

interface AuthContextType {
    currentUser: User | null;
    token: string | null;
    isLoading: boolean;
    updateProfile: (updates: Partial<User>) => Promise<void>;
    login: (token: string, user: User) => Promise<void>;
    loginAsGuest: () => void;
    logout: () => void;
}

const STORAGE_KEY_PROFILE = 'godspeed_user_profile';
const STORAGE_KEY_LEGACY = 'godspeed_user_data';

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User>(() => {
        const storedProfile = localStorage.getItem(STORAGE_KEY_PROFILE) || localStorage.getItem(STORAGE_KEY_LEGACY);
        if (storedProfile) {
            try {
                const parsed = JSON.parse(storedProfile);
                return {
                    ...DEFAULT_USER,
                    ...parsed,
                    // If previously guest role, give teacher role locally
                    role: parsed.role === 'guest' ? 'guest' : parsed.role || 'teacher'
                };
            } catch (err) {
                console.error('Failed to parse stored profile:', err);
            }
        }
        return DEFAULT_USER;
    });

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Ensure local profile is persisted
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(currentUser));
        setIsLoading(false);
    }, [currentUser]);

    const updateProfile = async (updates: Partial<User>) => {
        const previousEmail = currentUser.email;
        const newEmail = updates.email?.trim() || previousEmail;

        if (newEmail && newEmail !== previousEmail) {
            await migrateGuestDataToUser(newEmail);
        }

        const updated: User = {
            ...currentUser,
            ...updates,
            email: newEmail
        };

        setCurrentUser(updated);
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updated));
    };

    const login = async (_newToken: string, user: User) => {
        await updateProfile(user);
    };

    const loginAsGuest = () => {
        setCurrentUser(DEFAULT_USER);
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(DEFAULT_USER));
    };

    const logout = () => {
        // Reset to default offline teacher
        setCurrentUser(DEFAULT_USER);
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(DEFAULT_USER));
    };

    return (
        <AuthContext.Provider
            value={{
                currentUser,
                token: 'offline_local_token',
                isLoading,
                updateProfile,
                login,
                loginAsGuest,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
