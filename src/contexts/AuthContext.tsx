import React, { createContext, useContext, useEffect, useState } from 'react';

// 1. Define the User type based on your backend response
export interface User {
    id: string;
    email: string;
    role: string;
    // Add any other fields your Prisma user model returns
}

interface AuthContextType {
    currentUser: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 2. On mount, check localStorage to restore the session
        const storedToken = localStorage.getItem('godspeed_jwt_token');
        const storedUser = localStorage.getItem('godspeed_user_data');

        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setCurrentUser(JSON.parse(storedUser));
            } catch (error) {
                console.error("Failed to parse stored auth data:", error);
                // Clear corrupted data
                localStorage.removeItem('godspeed_jwt_token');
                localStorage.removeItem('godspeed_user_data');
            }
        }

        setIsLoading(false);
    }, []);

    // 3. Call this method after a successful response from your /login endpoint
    const login = (newToken: string, user: User) => {
        localStorage.setItem('godspeed_jwt_token', newToken);
        localStorage.setItem('godspeed_user_data', JSON.stringify(user));
        setToken(newToken);
        setCurrentUser(user);
    };

    // 4. Clear storage and state on logout
    const logout = () => {
        localStorage.removeItem('godspeed_jwt_token');
        localStorage.removeItem('godspeed_user_data');
        setToken(null);
        setCurrentUser(null);
    };

    return (
        <AuthContext.Provider value={{ currentUser, token, isLoading, login, logout }}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};