
import { useState } from "react";
import "../styles/Sidebar.css";

function Sidebar({ onNavigate, onLogout, mobileOpen, closeMobile }) {
    const [expandedSections, setExpandedSections] = useState({
        financial: true,
        budget: true
    });

    function toggleSection(section) {
        setExpandedSections(previous => ({
            ...previous,
            [section]: !previous[section]
        }));
    }

    function handlePageClick(page) {
        onNavigate(page);

        if (closeMobile) {
            closeMobile();
        }
    }

    return (
        <>
            {mobileOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={closeMobile}
                />
            )}

            <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>

                {/* LOGO */}
                <div className="sidebar-header">
                    <div className="sidebar-logo">BP</div>

                    <div className="sidebar-brand">
                        <h2>Budget Planner</h2>
                        <p>Manage your money smarter</p>
                    </div>

                    <button
                        className="sidebar-close"
                        onClick={closeMobile}
                    >
                        ×
                    </button>
                </div>

                {/* MENU */}
                <nav className="sidebar-menu">

                    {/* DASHBOARD */}
                    <button
                        className="sidebar-item"
                        onClick={() => handlePageClick("Dashboard")}
                    >
                        Dashboard
                    </button>

                    {/* FINANCIAL MANAGEMENT */}
                    <div className="sidebar-section">

                        <button
                            className="sidebar-section-title"
                            onClick={() => toggleSection("financial")}
                        >
                            <span>Financial Management</span>
                            <span>
                                {expandedSections.financial ? "−" : "+"}
                            </span>
                        </button>

                        {expandedSections.financial && (
                            <div className="sidebar-submenu">
                                <button
                                    className="sidebar-subitem"
                                    onClick={() => handlePageClick("Income Management")}
                                >
                                    Income Management
                                </button>

                                <button
                                    className="sidebar-subitem"
                                    onClick={() => handlePageClick("Expense Management")}
                                >
                                    Expense Management
                                </button>

                                <button
                                    className="sidebar-subitem"
                                    onClick={() => handlePageClick("Expense Categories")}
                                >
                                    Expense Categories
                                </button>

                                <button
                                    className="sidebar-subitem"
                                    onClick={() => handlePageClick("Transaction History")}
                                >
                                    Transaction History
                                </button>
                            </div>
                        )}
                    </div>

                    {/* BUDGET AND SAVINGS */}
                    <div className="sidebar-section">

                        <button
                            className="sidebar-section-title"
                            onClick={() => toggleSection("budget")}
                        >
                            <span>Budget & Savings</span>
                            <span>
                                {expandedSections.budget ? "−" : "+"}
                            </span>
                        </button>

                        {expandedSections.budget && (
                            <div className="sidebar-submenu">
                                <button
                                    className="sidebar-subitem"
                                    onClick={() => handlePageClick("Smart Budget & Savings")}
                                >
                                    Smart Budget & Savings
                                </button>

                                <button
                                    className="sidebar-subitem"
                                    onClick={() => handlePageClick("Overspending Alerts")}
                                >
                                    Overspending Alerts
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ANALYTICS AND REPORTING */}
                    <button
                        className="sidebar-item"
                        onClick={() => handlePageClick("Analytics & Reporting")}
                    >
                        Analytics & Reporting
                    </button>

                    {/* ACCOUNT */}
                    <button
                        className="sidebar-item"
                        onClick={() => handlePageClick("Profile")}
                    >
                        Profile
                    </button>

                </nav>

                {/* LOGOUT */}
                <div className="sidebar-bottom">
                    <button
                        className="sidebar-logout"
                        onClick={onLogout}
                    >
                        Logout
                    </button>
                </div>

            </aside>
        </>
    );
}

export default Sidebar;