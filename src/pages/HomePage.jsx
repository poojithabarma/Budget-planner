
import { Link } from "react-router-dom";
import "../styles/HomePage.css";

function HomePage() {
    return (
        <div className="home-page">

            {/* NAVBAR */}
            <nav className="navbar">
                <div className="logo">
                    <span className="logo-icon">₹</span>
                    <span>Budget<span className="mint">Planner</span></span>
                </div>

                <div className="nav-links">
                    <a href="#home">Home</a>
                    <a href="#about">About</a>
                    <a href="#features">Features</a>
                </div>

                <div className="nav-buttons">
                    <Link to="/login" className="login-btn">Login</Link>
                    <Link to="/register" className="signup-btn">Sign Up</Link>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="hero-section" id="home">
                <div className="hero-content">
                    <p className="hero-tag">SMART MONEY MANAGEMENT</p>

                    <h1>
                        Take Control of Your
                        <span> Financial Future.</span>
                    </h1>

                    <p className="hero-description">
                        Manage your income, track expenses, set savings goals
                        and make smarter financial decisions — all in one place.
                    </p>

                    <div className="hero-buttons">
                        <Link to="/register" className="primary-btn">
                            Get Started →
                        </Link>

                        <a href="#about" className="secondary-btn">
                            Learn More
                        </a>
                    </div>

                    <div className="hero-stats">
                        <div>
                            <h3>100%</h3>
                            <p>Financial Control</p>
                        </div>
                        <div>
                            <h3>24/7</h3>
                            <p>Track Anytime</p>
                        </div>
                        <div>
                            <h3>Easy</h3>
                            <p>To Get Started</p>
                        </div>
                    </div>
                </div>

                {/* FINANCE PREVIEW CARD */}
                <div className="hero-visual">
                    <div className="finance-card">
                        <div className="card-top">
                            <div>
                                <p>Total Balance</p>
                                <h2>₹45,850.00</h2>
                            </div>
                            <span className="balance-icon">↗</span>
                        </div>

                        <div className="card-divider"></div>

                        <div className="money-details">
                            <div className="money-item">
                                <span className="money-icon income-icon">↗</span>
                                <div>
                                    <p>Income</p>
                                    <h3>₹60,000</h3>
                                </div>
                            </div>

                            <div className="money-item">
                                <span className="money-icon expense-icon">↘</span>
                                <div>
                                    <p>Expenses</p>
                                    <h3>₹14,150</h3>
                                </div>
                            </div>
                        </div>

                        <div className="budget-preview">
                            <div className="budget-heading">
                                <span>Monthly Budget</span>
                                <span>75%</span>
                            </div>
                            <div className="progress-track">
                                <div className="progress-fill"></div>
                            </div>
                            <p>Keep going! You're managing well.</p>
                        </div>
                    </div>

                    <div className="floating-note">
                        <span>✦</span> Save smarter, live better!
                    </div>
                </div>
            </section>

            {/* ABOUT SECTION */}
            <section className="about-section" id="about">
                <p className="section-tag">ABOUT OUR PLATFORM</p>
                <h2>Make Your Money Work For You</h2>
                <p>
                    Budget Planner helps you understand where your money goes.
                    Organize your finances, control spending and build better
                    saving habits with a simple dashboard.
                </p>
            </section>

            {/* FEATURES SECTION */}
            <section className="features-section" id="features">
                <p className="section-tag">WHAT WE OFFER</p>
                <h2>Everything You Need To Manage Money</h2>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">↗</div>
                        <h3>Income Tracking</h3>
                        <p>Record and monitor all your income sources easily.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">↘</div>
                        <h3>Expense Management</h3>
                        <p>Track your daily spending and understand expenses.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">◎</div>
                        <h3>Budget Planning</h3>
                        <p>Create budgets and stay within your spending limits.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">▥</div>
                        <h3>Financial Analytics</h3>
                        <p>Understand your financial habits through insights.</p>
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION */}
            <section className="cta-section">
                <h2>Ready To Take Charge Of Your Money?</h2>
                <p>Start building smarter financial habits today.</p>
                <Link to="/register" className="primary-btn">
                    Create Your Account →
                </Link>
            </section>

            {/* FOOTER */}
            <footer className="footer">
                <div className="logo">
                    <span className="logo-icon">₹</span>
                    <span>Budget<span className="mint">Planner</span></span>
                </div>
                <p>Plan Smart. Spend Wise. Save More.</p>
                <p className="copyright">
                    © 2026 Budget Planner. All rights reserved.
                </p>
            </footer>

        </div>
    );
}

export default HomePage;