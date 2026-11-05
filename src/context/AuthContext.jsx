
import { createContext, useContext, useState } from "react";

import {
    registerUser as saveUser,
    loginUser as checkLogin,
    getCurrentUser,
    logoutUser as clearSession,
    updateAdminCredentials as saveAdminCredentials
} from "../utils/storage";

const AuthContext = createContext();

export function AuthProvider({ children }) {

    const [currentUser, setCurrentUser] = useState(
        getCurrentUser()
    );

    // Registration
    function signup(userData) {
        return saveUser(userData);
    }

    // Login
    function login(email, password) {
        const result = checkLogin(email, password);

        if (result.success) {
            setCurrentUser(result.user);
        }

        return result;
    }

    // Update Admin credentials
    function updateAdminAccount(credentials) {
        const result = saveAdminCredentials(credentials);

        if (result.success) {
            setCurrentUser(result.user);
        }

        return result;
    }

    // Logout
    function logout() {
        clearSession();
        setCurrentUser(null);
    }

    const value = {
        currentUser,
        isAuthenticated: Boolean(currentUser),
        signup,
        login,
        logout,
        updateAdminAccount
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Access authentication anywhere
export function useAuth() {
    return useContext(AuthContext);
}