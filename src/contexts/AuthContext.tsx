import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

interface AuthContextType {
    currentUser: User | null;
    isLoading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Prevents flickering on reload

    useEffect(() => {
        // Firebase automatically checks local storage for a session
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setIsLoading(false);
        });

        return unsubscribe; // Cleanup listener on unmount
    }, []);

    const logout = async () => {
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ currentUser, isLoading, logout }}>
            {/* Don't render the app until Firebase checks the session */}
            {!isLoading && children}
        </AuthContext.Provider>
    );
};