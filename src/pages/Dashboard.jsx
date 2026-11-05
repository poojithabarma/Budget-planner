
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar.jsx";
import IncomeManagement from "../modules/Income.jsx";
import ExpenseManagement from "../modules/ExpenseManagement.jsx";
import ExpenseCategories from "../modules/ExpenseCategories.jsx";
import TransactionHistory from "../modules/TransactionHistory.jsx";
import BudgetSavings from "../modules/BudgetSavings.jsx";
import OverspendingAlerts from "../modules/OverspendingAlerts.jsx";
import Analytics from "../modules/Analytics.jsx";
import Profile from "../modules/Profile.jsx";

import "../styles/Dashboard.css";

// Safely read Local Storage
function readStorage(key, fallback) {
    try {
        const data = JSON.parse(localStorage.getItem(key));
        return data ?? fallback;
    } catch {
        return fallback;
    }
}

// Read only array data
function getStoredArray(key) {
    const data = readStorage(key, []);
    return Array.isArray(data) ? data : [];
}

function Dashboard() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const [activePage, setActivePage] = useState("Dashboard");
    const [mobileOpen, setMobileOpen] = useState(false);

    // Used to refresh dashboard data without remounting modules
    const [, setRefresh] = useState(0);

    // Keep Dashboard profile details updated
    const [profileUser, setProfileUser] = useState(() =>
        readStorage("budgetPlannerCurrentUser", currentUser || {})
    );

    const name =
        profileUser?.name ||
        profileUser?.fullName ||
        profileUser?.username ||
        currentUser?.name ||
        currentUser?.fullName ||
        "User";

    const initial = name.charAt(0).toUpperCase();

    // Update profile details when profile is edited
    useEffect(() => {
        const updateProfile = () => {
            setProfileUser(
                readStorage("budgetPlannerCurrentUser", currentUser || {})
            );
        };

        updateProfile();

        window.addEventListener("budgetProfileUpdated", updateProfile);

        return () => {
            window.removeEventListener("budgetProfileUpdated", updateProfile);
        };
    }, [currentUser]);

    // Refresh dashboard whenever financial data changes
    useEffect(() => {
        const updateDashboard = () => {
            setRefresh(previous => previous + 1);
        };

        const events = [
            "focus",
            "storage",
            "budgetExpensesUpdated",
            "budgetIncomesUpdated",
            "budgetCategoriesUpdated",
            "budgetPlanUpdated"
        ];

        events.forEach(event => {
            window.addEventListener(event, updateDashboard);
        });

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, updateDashboard);
            });
        };
    }, []);

    // Read financial data
    const incomes = getStoredArray("budgetIncomes");
    const expenses = getStoredArray("budgetExpenses");
    const savingsGoals = getStoredArray("budgetSavingsGoals");
    const monthlyPlan = readStorage("budgetMonthlyPlan", {});

    // Calculate total income
    const totalIncome = incomes.reduce(
        (sum, item) => sum + (Number(item.amount) || 0),
        0
    );

    // Calculate total expenses
    const totalExpenses = expenses.reduce(
        (sum, item) => sum + (Number(item.amount) || 0),
        0
    );

    // Available balance
    const availableBalance = totalIncome - totalExpenses;

    // Purchase goal calculations
    const totalMonthlyGoalSavings = savingsGoals.reduce(
        (sum, goal) => sum + (Number(goal.monthlySaving) || 0),
        0
    );

    const totalSavingsTarget = savingsGoals.reduce(
        (sum, goal) => sum + (Number(goal.targetAmount) || 0),
        0
    );

    const goalDetails = savingsGoals.map(goal => {
        const target = Number(goal.targetAmount) || 0;
        const monthlySaving = Number(goal.monthlySaving) || 0;

        const months = monthlySaving > 0
            ? Math.ceil(target / monthlySaving)
            : null;

        return {
            ...goal,
            target,
            monthlySaving,
            months
        };
    });

    // General savings when there are no purchase goals
    const plannedIncome = Number(monthlyPlan.income) || 0;

    const generalSavings =
        monthlyPlan.generated && monthlyPlan.hasGoals === false
            ? plannedIncome * 0.2
            : 0;

    // Recent transactions
    const recentTransactions = [
        ...incomes.map((item, index) => ({
            id: item.id || index,
            title: item.source || item.title || "Income",
            amount: Number(item.amount) || 0,
            category: item.category || "Income",
            date: item.date || "",
            type: "income"
        })),

        ...expenses.map((item, index) => ({
            id: item.id || index,
            title: item.title || item.description || "Expense",
            amount: Number(item.amount) || 0,
            category: item.category || "Expense",
            date: item.date || "",
            type: "expense"
        }))
    ]
        .sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;

            return dateB - dateA;
        })
        .slice(0, 5);

    // Logout
    function handleLogout() {
        logout();
        navigate("/");
    }

    // Navigation
    function handleNavigation(page) {
        if (
            page === "Monthly Budget Planner" ||
            page === "Savings Goals"
        ) {
            page = "Smart Budget & Savings";
        }

        setActivePage(page);
        setMobileOpen(false);
    }

    // Render selected page
    function renderContent() {

        // DASHBOARD HOME
        if (activePage === "Dashboard") {
            return (
                <>
                    <section className="welcome">
                        <h1>
                            Welcome, <span>{name}</span>
                        </h1>
                        <p>Here's an overview of your finances.</p>
                    </section>

                    {/* FINANCIAL SUMMARY */}
                    <section className="summary-grid">

                        <div className="summary-card">
                            <div className="summary-top">
                                <span className="summary-title">
                                    Total Income
                                </span>
                            </div>

                            <h2>
                                ₹{totalIncome.toLocaleString("en-IN")}
                            </h2>

                            <p>Recorded income</p>
                        </div>

                        <div className="summary-card">
                            <div className="summary-top">
                                <span className="summary-title">
                                    Total Expenses
                                </span>
                            </div>

                            <h2>
                                ₹{totalExpenses.toLocaleString("en-IN")}
                            </h2>

                            <p>Recorded expenses</p>
                        </div>

                        <div className="summary-card">
                            <div className="summary-top">
                                <span className="summary-title">
                                    Available Balance
                                </span>
                            </div>

                            <h2>
                                ₹{availableBalance.toLocaleString("en-IN")}
                            </h2>

                            <p>Income minus expenses</p>
                        </div>

                        <div className="summary-card">
                            <div className="summary-top">
                                <span className="summary-title">
                                    {savingsGoals.length > 0
                                        ? "Monthly Goal Savings"
                                        : "General Savings"}
                                </span>
                            </div>

                            <h2>
                                ₹{(
                                    savingsGoals.length > 0
                                        ? totalMonthlyGoalSavings
                                        : generalSavings
                                ).toLocaleString("en-IN")}
                            </h2>

                            <p>
                                {savingsGoals.length > 0
                                    ? `${savingsGoals.length} purchase goals`
                                    : "Planned monthly savings"}
                            </p>
                        </div>

                    </section>

                    {/* FINANCIAL OVERVIEW AND QUICK ACTIONS */}
                    <section className="dashboard-grid">

                        <div className="dashboard-card">
                            <div className="card-header">
                                <h3>Financial Overview</h3>
                            </div>

                            <div className="budget-amount">
                                <strong>
                                    ₹{availableBalance.toLocaleString("en-IN")}
                                </strong>
                                <span>Available balance</span>
                            </div>

                            <div className="budget-info">
                                <span>
                                    Income: ₹{totalIncome.toLocaleString("en-IN")}
                                </span>

                                <span>
                                    Expenses: ₹{totalExpenses.toLocaleString("en-IN")}
                                </span>
                            </div>
                        </div>

                        <div className="dashboard-card">
                            <div className="card-header">
                                <h3>Quick Actions</h3>
                            </div>

                            <div className="quick-actions">
                                <button
                                    onClick={() =>
                                        handleNavigation("Income Management")
                                    }
                                >
                                    + Add Income
                                </button>

                                <button
                                    onClick={() =>
                                        handleNavigation("Expense Management")
                                    }
                                >
                                    + Add Expense
                                </button>

                                <button
                                    onClick={() =>
                                        handleNavigation("Transaction History")
                                    }
                                >
                                    View Transactions
                                </button>
                            </div>
                        </div>

                    </section>

                    {/* PURCHASE GOALS OVERVIEW */}
                    <section className="dashboard-card">
                        <div className="card-header">
                            <h3>Purchase Goals Overview</h3>

                            <button
                                onClick={() =>
                                    handleNavigation("Smart Budget & Savings")
                                }
                            >
                                Manage Goals →
                            </button>
                        </div>

                        {goalDetails.length > 0 ? (
                            <>
                                <div className="budget-info">
                                    <span>
                                        Total Purchase Target: ₹
                                        {totalSavingsTarget.toLocaleString("en-IN")}
                                    </span>

                                    <span>
                                        Monthly Goal Savings: ₹
                                        {totalMonthlyGoalSavings.toLocaleString("en-IN")}
                                    </span>
                                </div>

                                <div className="recent-transactions">
                                    {goalDetails.map((goal, index) => (
                                        <div
                                            className="recent-transaction"
                                            key={goal.id || index}
                                        >
                                            <div>
                                                <strong>{goal.name}</strong>

                                                <p>
                                                    Target: ₹
                                                    {goal.target.toLocaleString("en-IN")}
                                                </p>

                                                <p>
                                                    Monthly Saving: ₹
                                                    {goal.monthlySaving.toLocaleString("en-IN")}
                                                </p>
                                            </div>

                                            <span className="income-value">
                                                {goal.months !== null
                                                    ? `${goal.months} ${goal.months === 1 ? "month" : "months"}`
                                                    : "Add savings"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="empty-state">
                                <p>
                                    You haven't added any purchase goals yet.
                                    Add your goals to see estimated purchase times.
                                </p>

                                <button
                                    onClick={() =>
                                        handleNavigation("Smart Budget & Savings")
                                    }
                                >
                                    + Create Purchase Goal
                                </button>
                            </div>
                        )}
                    </section>

                    {/* GENERAL SAVINGS OVERVIEW */}
                    {savingsGoals.length === 0 && (
                        <section className="dashboard-card">
                            <div className="card-header">
                                <h3>Monthly Budget Overview</h3>

                                <button
                                    onClick={() =>
                                        handleNavigation("Smart Budget & Savings")
                                    }
                                >
                                    View Planner →
                                </button>
                            </div>

                            <div className="budget-info">
                                <span>
                                    Planned Monthly Income: ₹
                                    {plannedIncome.toLocaleString("en-IN")}
                                </span>

                                <span>
                                    General Savings: ₹
                                    {generalSavings.toLocaleString("en-IN")}
                                </span>
                            </div>

                            <p>
                                {monthlyPlan.generated
                                    ? "Your normal monthly budget plan has been generated."
                                    : "Create your monthly budget plan in Smart Budget & Savings."}
                            </p>
                        </section>
                    )}

                    {/* RECENT TRANSACTIONS */}
                    <section className="dashboard-card recent-card">
                        <div className="card-header">
                            <h3>Recent Transactions</h3>

                            <button
                                onClick={() =>
                                    handleNavigation("Transaction History")
                                }
                            >
                                View All →
                            </button>
                        </div>

                        {recentTransactions.length > 0 ? (
                            <div className="recent-transactions">
                                {recentTransactions.map((item, index) => (
                                    <div
                                        className="recent-transaction"
                                        key={`${item.type}-${item.id}-${index}`}
                                    >
                                        <div>
                                            <strong>{item.title}</strong>

                                            <p>
                                                {item.category} · {item.date}
                                            </p>
                                        </div>

                                        <span
                                            className={
                                                item.type === "income"
                                                    ? "income-value"
                                                    : "expense-value"
                                            }
                                        >
                                            {item.type === "income" ? "+" : "-"}
                                            ₹{item.amount.toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>
                                    No transactions yet. Add your first income
                                    or expense!
                                </p>
                            </div>
                        )}
                    </section>
                </>
            );
        }

        // FINANCIAL MODULES
        if (activePage === "Income Management") {
            return <IncomeManagement />;
        }

        if (activePage === "Expense Management") {
            return <ExpenseManagement />;
        }

        if (activePage === "Expense Categories") {
            return <ExpenseCategories />;
        }

        if (activePage === "Transaction History") {
            return <TransactionHistory />;
        }

        // BUDGET AND SAVINGS
        if (activePage === "Smart Budget & Savings") {
            return <BudgetSavings />;
        }

        if (activePage === "Overspending Alerts") {
            return <OverspendingAlerts />;
        }

        // ANALYTICS AND REPORTING
        if (activePage === "Analytics & Reporting") {
            return <Analytics />;
        }

        // PROFILE
        if (activePage === "Profile") {
            return <Profile />;
        }

        return (
            <section className="module-content">
                <h1>Page Not Found</h1>
                <p>Please select a valid module from the sidebar.</p>
            </section>
        );
    }

    return (
        <div className="dashboard-layout">

            <Sidebar
                onNavigate={handleNavigation}
                onLogout={handleLogout}
                mobileOpen={mobileOpen}
                closeMobile={() => setMobileOpen(false)}
            />

            <main className="main">

                <header className="topbar">

                    <button
                        className="mobile-menu"
                        onClick={() => setMobileOpen(true)}
                    >
                        ☰
                    </button>

                    <div className="top-right">
                        <div className="profile">
                            <div className="profile-icon">
                                {initial}
                            </div>

                            <span>{name}</span>
                        </div>
                    </div>

                </header>

                {renderContent()}

                <footer className="dashboard-footer">
                    Budget Planner © 2026 | Manage your money smarter.
                </footer>

            </main>
        </div>
    );
}

export default Dashboard;