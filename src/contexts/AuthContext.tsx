import React, { createContext, useContext, useEffect, useState } from 'react';

export interface User {
    id: string;
    email: string;
    role: string;
}

export const GUEST_USER: User = {
    id: 'guest_local',
    email: 'guest@godspeedgrader.local',
    role: 'guest'
};

interface AuthContextType {
    currentUser: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, user: User) => Promise<void>;
    loginAsGuest: () => void;
    logout: () => void;
}

import { migrateGuestDataToUser } from '../services/db';

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('godspeed_jwt_token');
        const storedUser = localStorage.getItem('godspeed_user_data');

        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setCurrentUser(JSON.parse(storedUser));
            } catch (error) {
                console.error("Failed to parse stored auth data:", error);
                localStorage.removeItem('godspeed_jwt_token');
                localStorage.removeItem('godspeed_user_data');
            }
        } else if (storedUser) {
            // Handle guest user who has no token
            try {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser.role === 'guest') {
                    setCurrentUser(parsedUser);
                }
            } catch (error) {
                console.error("Failed to parse guest data:", error);
                localStorage.removeItem('godspeed_user_data');
            }
        }

        setIsLoading(false);
    }, []);

    const login = async (newToken: string, user: User) => {
        // If they were previously a guest, migrate their local data to their new real account
        if (currentUser?.role === 'guest') {
            await migrateGuestDataToUser(user.email);
        }

        localStorage.setItem('godspeed_jwt_token', newToken);
        localStorage.setItem('godspeed_user_data', JSON.stringify(user));
        setToken(newToken);
        setCurrentUser(user);
    };

    const loginAsGuest = () => {
        // We do not set a token for guest
        localStorage.setItem('godspeed_user_data', JSON.stringify(GUEST_USER));
        setCurrentUser(GUEST_USER);
    };

    const logout = () => {
        localStorage.removeItem('godspeed_jwt_token');
        localStorage.removeItem('godspeed_user_data');
        setToken(null);
        setCurrentUser(null);
    };

    return (
        <AuthContext.Provider value={{ currentUser, token, isLoading, login, loginAsGuest, logout }}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};