
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegistrationPage from "./pages/RegistrationPage";
import Dashboard from "./pages/Dashboard";

// Admin Dashboard (next step lo create chestham)
import AdminDashboard from "./pages/AdminDashboard";

import { useAuth } from "./context/AuthContext";

// User Route Protection
function UserRoute({ children }) {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (currentUser.role === "admin") {
        return <Navigate to="/admin-dashboard" replace />;
    }

    return children;
}

// Admin Route Protection
function AdminRoute({ children }) {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (currentUser.role !== "admin") {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

function AppRoutes() {
    const { currentUser } = useAuth();

    return (
        <Routes>
            <Route
                path="/"
                element={
                    currentUser
                        ? <Navigate to={currentUser.role === "admin" ? "/admin-dashboard" : "/dashboard"} replace />
                        : <HomePage />
                }
            />

            <Route path="/login" element={<LoginPage />} />

            <Route
                path="/register"
                element={<RegistrationPage />}
            />

            <Route
                path="/dashboard"
                element={
                    <UserRoute>
                        <Dashboard />
                    </UserRoute>
                }
            />

            <Route
                path="/admin-dashboard"
                element={
                    <AdminRoute>
                        <AdminDashboard />
                    </AdminRoute>
                }
            />

            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    );
}

export default App;