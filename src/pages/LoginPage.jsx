
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Auth.css";

function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [error, setError] = useState("");

    function handleChange(e) {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError("");
    }

    function handleSubmit(e) {
        e.preventDefault();

        const result = login(
            formData.email.trim().toLowerCase(),
            formData.password
        );

        if (result.success) {
            alert("Login successful!");

            // Role-based dashboard navigation
            if (result.user.role === "admin") {
                navigate("/admin-dashboard");
            } else {
                navigate("/dashboard");
            }
        } else {
            setError(result.message);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-container">

                <div className="auth-left">
                    <h1>Budget Planner</h1>
                    <h2>Welcome Back!</h2>
                    <h3>Your Money, Your Control.</h3>

                    <p>
                        Manage your income, track expenses,
                        set budgets and achieve your financial goals
                        with Budget Planner.
                    </p>

                    <div className="auth-decoration">
                        PLAN • TRACK • GROW
                    </div>
                </div>

                <div className="auth-right">
                    <h2>Login</h2>

                    <p className="auth-subtitle">
                        Enter your details to access your account.
                    </p>

                    {error && (
                        <p className="auth-error">{error}</p>
                    )}

                    <form onSubmit={handleSubmit}>
                        <label>Email Address</label>

                        <input
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />

                        <label>Password</label>

                        <input
                            type="password"
                            name="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />

                        <button type="submit">
                            Login to Account
                        </button>
                    </form>

                    <p className="auth-switch">
                        Don't have an account?
                        {" "}
                        <Link to="/register">Sign Up</Link>
                    </p>

                    <Link className="back-home" to="/">
                        ← Back to Home
                    </Link>
                </div>

            </div>
        </div>
    );
}

export default LoginPage;