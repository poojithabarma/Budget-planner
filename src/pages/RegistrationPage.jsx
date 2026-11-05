
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Auth.css";

function RegistrationPage() {

    const navigate = useNavigate();
    const { signup } = useAuth();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
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

        const { name, email, password, confirmPassword } = formData;

        if (name.trim() === "") {
            setError("Please enter your full name.");
            return;
        }

        if (password.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        if (!/[0-9]/.test(password)) {
            setError("Password must contain at least one number.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        const result = signup({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: password,
            role: "user"
        });

        if (result.success) {
            alert("Registration successful! Please login.");
            navigate("/login");
        } else {
            setError(result.message);
        }
    }

    return (
        <div className="auth-page">

            <div className="auth-container">

                <div className="auth-left">

                    <h1>Budget Planner</h1>

                    <h2>Start Your Journey</h2>

                    <h3>Build a Better Financial Future</h3>

                    <p>
                        Take control of your money.
                        Track expenses, manage budgets
                        and achieve your savings goals.
                    </p>

                    <div className="auth-decoration">
                        PLAN • TRACK • GROW
                    </div>

                </div>

                <div className="auth-right">

                    <h2>Create Account</h2>

                    <p className="auth-subtitle">
                        Register to get started with Budget Planner.
                    </p>

                    {error && (
                        <p className="auth-error">{error}</p>
                    )}

                    <form onSubmit={handleSubmit}>

                        <label>Full Name</label>
                        <input
                            type="text"
                            name="name"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />

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
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />

                        <label>Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />

                        <button type="submit">
                            Create Account
                        </button>

                    </form>

                    <p className="auth-switch">
                        Already have an account?
                        {" "}
                        <Link to="/login">Login</Link>
                    </p>

                    <Link className="back-home" to="/">
                        ← Back to Home
                    </Link>

                </div>

            </div>

        </div>
    );
}

export default RegistrationPage;