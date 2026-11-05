import { useEffect, useMemo, useState } from "react";
import "../styles/OverspendingAlerts.css";

const readStorage = (key, fallback) => {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value ?? fallback;
    } catch {
        return fallback;
    }
};

const money = (amount) =>
    Number(amount || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });

const getCategoryName = (item) => {
    if (typeof item === "string") return item.trim();

    return (
        item?.name ||
        item?.categoryName ||
        item?.category ||
        item?.title ||
        ""
    ).trim();
};

// Get the current month in local YYYY-MM format
const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}`;
};

// Check whether a date is a valid YYYY-MM-DD date
const isValidDate = (date) => {
    if (typeof date !== "string") return false;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

    const [year, month, day] = date.split("-").map(Number);
    const parsed = new Date(year, month - 1, day);

    return (
        parsed.getFullYear() === year &&
        parsed.getMonth() === month - 1 &&
        parsed.getDate() === day
    );
};

function OverspendingAlerts() {
    const [refresh, setRefresh] = useState(0);

    // Refresh whenever expenses or budget plan changes
    useEffect(() => {
        const updateData = () => {
            setRefresh((previous) => previous + 1);
        };

        window.addEventListener("budgetExpensesUpdated", updateData);
        window.addEventListener("budgetPlanUpdated", updateData);
        window.addEventListener("budgetCategoriesUpdated", updateData);
        window.addEventListener("storage", updateData);
        window.addEventListener("focus", updateData);

        return () => {
            window.removeEventListener("budgetExpensesUpdated", updateData);
            window.removeEventListener("budgetPlanUpdated", updateData);
            window.removeEventListener("budgetCategoriesUpdated", updateData);
            window.removeEventListener("storage", updateData);
            window.removeEventListener("focus", updateData);
        };
    }, []);

    const data = useMemo(() => {
        const plan = readStorage("budgetMonthlyPlan", {});
        const expenses = readStorage("budgetExpenses", []);
        const goals = readStorage("budgetSavingsGoals", []);
        const savedCategories = readStorage("budgetCategories", []);

        const hasPlan = Boolean(
            plan.generated &&
            Number(plan.income) > 0 &&
            plan.allocations &&
            typeof plan.allocations === "object"
        );

        const salary = Number(plan.income) || 0;
        const hasGoals = Boolean(plan.hasGoals);

        // Calculate monthly purchase-goal savings
        const totalGoalSavings = hasGoals
            ? goals.reduce(
                (total, goal) =>
                    total + Math.max(0, Number(goal.monthlySaving) || 0),
                0
            )
            : 0;

        // Calculate the amount available for category budgets
        const categoryBudgetPool = hasGoals
            ? Math.max(0, salary - totalGoalSavings)
            : salary * 0.8;

        const allocations =
            plan.allocations &&
            typeof plan.allocations === "object"
                ? plan.allocations
                : {};

        // Get planned categories from the saved budget plan
        const plannedCategories = Object.keys(allocations).filter(
            (category) => category.trim() !== ""
        );

        // Get categories from Expense Categories module
        const storedCategoryNames = Array.isArray(savedCategories)
            ? savedCategories.map(getCategoryName).filter(Boolean)
            : [];

        // Get current month's valid expenses only
        const currentMonth = getCurrentMonth();

        const currentMonthExpenses = Array.isArray(expenses)
            ? expenses.filter((expense) => {
                if (!isValidDate(expense.date)) return false;

                return expense.date.slice(0, 7) === currentMonth;
            })
            : [];

        // Calculate spending category-wise
        const spendingByCategory = {};

        currentMonthExpenses.forEach((expense) => {
            const category = getCategoryName(expense.category);
            const amount = Number(expense.amount);

            if (!category || !Number.isFinite(amount) || amount <= 0) {
                return;
            }

            const normalizedName = category.toLowerCase();

            spendingByCategory[normalizedName] =
                (spendingByCategory[normalizedName] || 0) + amount;
        });

        // Include planned categories and categories where expenses exist
        const allCategoryNames = [
            ...new Set([
                ...plannedCategories,
                ...storedCategoryNames,
                ...currentMonthExpenses
                    .map((expense) => getCategoryName(expense.category))
                    .filter(Boolean)
            ])
        ];

        const categoryRows = allCategoryNames.map((category) => {
            const percentage = Math.max(
                0,
                Number(allocations[category]) || 0
            );

            const budget = hasPlan
                ? categoryBudgetPool * percentage / 100
                : 0;

            const spent =
                spendingByCategory[category.toLowerCase()] || 0;

            const remaining = budget - spent;

            const usage = budget > 0
                ? (spent / budget) * 100
                : spent > 0
                    ? 100
                    : 0;

            let status = "Good";
            let statusType = "good";

            if (spent > budget && spent > 0) {
                status = "Overspent";
                statusType = "danger";
            } else if (budget > 0 && usage >= 80) {
                status = "Warning";
                statusType = "warning";
            } else if (budget === 0 && spent === 0) {
                status = "No budget";
                statusType = "neutral";
            }

            return {
                name: category,
                percentage,
                budget,
                spent,
                remaining,
                usage,
                progress: Math.min(100, usage),
                exceeded: Math.max(0, spent - budget),
                status,
                statusType
            };
        });

        // Total planned category budget
        const totalBudget = categoryRows.reduce(
            (total, item) => total + item.budget,
            0
        );

        // Total current-month spending, including unplanned categories
        const totalSpent = currentMonthExpenses.reduce(
            (total, expense) => {
                const amount = Number(expense.amount);

                return total +
                    (Number.isFinite(amount) && amount > 0 ? amount : 0);
            },
            0
        );

        const totalRemaining = totalBudget - totalSpent;

        const totalUsage = totalBudget > 0
            ? (totalSpent / totalBudget) * 100
            : totalSpent > 0
                ? 100
                : 0;

        const overspentCount = categoryRows.filter(
            (item) => item.statusType === "danger"
        ).length;

        const warningCount = categoryRows.filter(
            (item) => item.statusType === "warning"
        ).length;

        const unbudgetedCategories = categoryRows.filter(
            (item) => item.budget === 0 && item.spent > 0
        );

        return {
            hasPlan,
            salary,
            hasGoals,
            totalGoalSavings,
            categoryBudgetPool,
            currentMonthExpenses,
            categoryRows,
            totalBudget,
            totalSpent,
            totalRemaining,
            totalUsage,
            overspentCount,
            warningCount,
            unbudgetedCategories,
            currentMonth
        };
    }, [refresh]);

    const monthLabel = new Date(
        Number(data.currentMonth.slice(0, 4)),
        Number(data.currentMonth.slice(5, 7)) - 1
    ).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric"
    });

    const overallStatus = data.totalBudget === 0
        ? "No budget"
        : data.totalUsage >= 100
            ? "Budget exceeded"
            : data.totalUsage >= 80
                ? "Approaching limit"
                : "Within budget";

    const overallStatusType = data.totalBudget === 0
        ? "neutral"
        : data.totalUsage >= 100
            ? "danger"
            : data.totalUsage >= 80
                ? "warning"
                : "good";

    return (
        <div className="overspending-page">

            {/* PAGE HEADER */}
            <div className="overspending-header">
                <div>
                    <p className="overspending-label">
                        BUDGET MONITORING
                    </p>

                    <h1>Overspending Alerts</h1>

                    <p>
                        Track your monthly spending and stay within
                        your planned category budgets.
                    </p>
                </div>

                <div className="month-badge">
                    {monthLabel}
                </div>
            </div>

            {/* NO BUDGET PLAN */}
            {!data.hasPlan && (
                <div className="alert-message alert-info">
                    <div className="alert-icon">i</div>

                    <div>
                        <h3>No Budget Plan Found</h3>
                        <p>
                            Generate your monthly budget plan in
                            Smart Budget & Savings Planner to view
                            category-wise overspending alerts.
                        </p>
                    </div>
                </div>
            )}

            {/* SUMMARY CARDS */}
            <div className="overspending-summary">

                <div className="overspending-summary-card">
                    <span>Total Category Budget</span>
                    <strong>₹{money(data.totalBudget)}</strong>
                    <small>Planned monthly allocation</small>
                </div>

                <div className="overspending-summary-card">
                    <span>Total Amount Spent</span>
                    <strong>₹{money(data.totalSpent)}</strong>
                    <small>
                        {data.currentMonthExpenses.length} expenses this month
                    </small>
                </div>

                <div className="overspending-summary-card">
                    <span>Remaining Budget</span>
                    <strong className={
                        data.totalRemaining < 0 ? "negative-amount" : ""
                    }>
                        ₹{money(Math.abs(data.totalRemaining))}
                        {data.totalRemaining < 0 ? " exceeded" : ""}
                    </strong>
                    <small>
                        {data.totalRemaining < 0
                            ? "Amount above planned budget"
                            : "Amount available to spend"}
                    </small>
                </div>

                <div className="overspending-summary-card">
                    <span>Budget Usage</span>
                    <strong>{data.totalUsage.toFixed(1)}%</strong>
                    <small>
                        <span className={`status-text ${overallStatusType}`}>
                            {overallStatus}
                        </span>
                    </small>
                </div>

            </div>

            {/* OVERALL BUDGET PROGRESS */}
            <section className="overspending-card">
                <div className="overspending-section-heading">
                    <div>
                        <h2>Overall Budget Status</h2>
                        <p>
                            Your total spending compared with your
                            planned category budget.
                        </p>
                    </div>

                    <span className={`status-badge ${overallStatusType}`}>
                        {overallStatus}
                    </span>
                </div>

                <div className="overall-progress-details">
                    <span>
                        Spent: ₹{money(data.totalSpent)}
                    </span>

                    <span>
                        Budget: ₹{money(data.totalBudget)}
                    </span>
                </div>

                <div className="progress-track overall-track">
                    <div
                        className={`progress-fill ${overallStatusType}`}
                        style={{
                            width: `${Math.min(100, data.totalUsage)}%`
                        }}
                    />
                </div>

                <div className="progress-percentage">
                    {data.totalUsage.toFixed(1)}% of planned budget used
                </div>
            </section>

            {/* ALERT COUNTS */}
            <div className="alert-count-grid">

                <div className="alert-count-card warning-count">
                    <span>Categories Near Limit</span>
                    <strong>{data.warningCount}</strong>
                    <small>Reached 80% or more</small>
                </div>

                <div className="alert-count-card danger-count">
                    <span>Overspending Categories</span>
                    <strong>{data.overspentCount}</strong>
                    <small>Spent more than allocated</small>
                </div>

            </div>

            {/* CATEGORY-WISE SPENDING */}
            <section className="overspending-card">
                <div className="overspending-section-heading">
                    <div>
                        <h2>Category-wise Spending</h2>
                        <p>
                            Compare your actual expenses with each
                            category's planned budget.
                        </p>
                    </div>
                </div>

                {!data.hasPlan ? (
                    <div className="overspending-empty">
                        Generate a budget plan to see category budgets.
                    </div>
                ) : data.categoryRows.length === 0 ? (
                    <div className="overspending-empty">
                        No expense categories found. Add categories
                        and generate your budget plan.
                    </div>
                ) : (
                    <div className="category-alert-list">

                        {data.categoryRows.map((item) => (
                            <div className="category-alert-item" key={item.name}>

                                <div className="category-alert-top">
                                    <div>
                                        <h3>{item.name}</h3>

                                        <span className="category-allocation">
                                            Allocation: {item.percentage}%
                                        </span>
                                    </div>

                                    <span className={`status-badge ${item.statusType}`}>
                                        {item.status}
                                    </span>
                                </div>

                                <div className="category-money-details">
                                    <div>
                                        <span>Spent</span>
                                        <strong>₹{money(item.spent)}</strong>
                                    </div>

                                    <div>
                                        <span>Budget</span>
                                        <strong>₹{money(item.budget)}</strong>
                                    </div>

                                    <div>
                                        <span>
                                            {item.remaining < 0
                                                ? "Exceeded"
                                                : "Remaining"}
                                        </span>

                                        <strong className={
                                            item.remaining < 0
                                                ? "negative-amount"
                                                : "positive-amount"
                                        }>
                                            ₹{money(Math.abs(item.remaining))}
                                        </strong>
                                    </div>
                                </div>

                                <div className="progress-track">
                                    <div
                                        className={`progress-fill ${item.statusType}`}
                                        style={{
                                            width: `${item.progress}%`
                                        }}
                                    />
                                </div>

                                <div className="category-progress-footer">
                                    <span>
                                        {item.usage.toFixed(1)}% used
                                    </span>

                                    {item.statusType === "warning" && (
                                        <span className="warning-note">
                                            You have used at least 80% of this budget.
                                        </span>
                                    )}

                                    {item.statusType === "danger" && (
                                        <span className="danger-note">
                                            You exceeded this budget by ₹
                                            {money(item.exceeded)}.
                                        </span>
                                    )}

                                    {item.statusType === "neutral" && (
                                        <span>
                                            No budget allocated to this category.
                                        </span>
                                    )}
                                </div>

                            </div>
                        ))}

                    </div>
                )}
            </section>

            {/* ALERT MESSAGES */}
            <section className="overspending-card">
                <div className="overspending-section-heading">
                    <div>
                        <h2>Spending Alerts</h2>
                        <p>
                            Important notifications based on your
                            current month's expenses.
                        </p>
                    </div>
                </div>

                {!data.hasPlan ? (
                    <div className="alert-message alert-info">
                        <div className="alert-icon">i</div>
                        <div>
                            <h3>Budget plan required</h3>
                            <p>
                                Create a budget plan to activate
                                overspending alerts.
                            </p>
                        </div>
                    </div>
                ) : data.overspentCount > 0 ? (
                    <div className="alert-message alert-danger">
                        <div className="alert-icon">!</div>
                        <div>
                            <h3>Overspending detected!</h3>
                            <p>
                                You have exceeded the planned budget in
                                { " "}{data.overspentCount}{" "}
                                {data.overspentCount === 1
                                    ? "category"
                                    : "categories"}.
                                Review your expenses and adjust your spending.
                            </p>
                        </div>
                    </div>
                ) : data.warningCount > 0 ? (
                    <div className="alert-message alert-warning">
                        <div className="alert-icon">!</div>
                        <div>
                            <h3>Budget limit approaching</h3>
                            <p>
                                You have used at least 80% of the budget
                                in {data.warningCount}{" "}
                                {data.warningCount === 1
                                    ? "category"
                                    : "categories"}.
                                Be careful with your remaining expenses.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="alert-message alert-success">
                        <div className="alert-icon">✓</div>
                        <div>
                            <h3>Good job! Your spending is under control.</h3>
                            <p>
                                No category has reached the warning
                                limit. Continue following your budget plan.
                            </p>
                        </div>
                    </div>
                )}

                {data.unbudgetedCategories.length > 0 && (
                    <div className="alert-message alert-warning">
                        <div className="alert-icon">!</div>
                        <div>
                            <h3>Expenses in categories without a budget</h3>
                            <p>
                                You have recorded expenses in{" "}
                                {data.unbudgetedCategories
                                    .map((item) => item.name)
                                    .join(", ")}
                                . Allocate a budget for these categories
                                in Smart Budget & Savings Planner.
                            </p>
                        </div>
                    </div>
                )}
            </section>

            {/* NO EXPENSES */}
            {data.hasPlan && data.currentMonthExpenses.length === 0 && (
                <div className="overspending-empty">
                    No valid expenses recorded for {monthLabel}.
                    Add expenses in Expense Management to track your spending.
                </div>
            )}

            {/* FOOTER NOTE */}
            <p className="overspending-disclaimer">
                Note: Alerts are calculated using your saved monthly
                budget plan and valid expense dates for the current month.
                This module only monitors your records; it does not
                transfer money or block transactions.
            </p>

        </div>
    );
}

export default OverspendingAlerts;