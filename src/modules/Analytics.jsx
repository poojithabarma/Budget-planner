
import { useEffect, useMemo, useState } from "react";
import "../styles/Analytics.css";

function readStorage(key, fallback) {
    try {
        const data = JSON.parse(localStorage.getItem(key));
        return data ?? fallback;
    } catch {
        return fallback;
    }
}

function getArray(key) {
    const data = readStorage(key, []);
    return Array.isArray(data) ? data : [];
}

function money(value) {
    return `₹${(Number(value) || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 0
    })}`;
}

function parseDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function getCategoryName(category) {
    if (typeof category === "string") return category;
    if (category && typeof category === "object") {
        return category.name || category.categoryName || category.title || "Others";
    }
    return "Others";
}

function Analytics() {
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        const update = () => setRefresh(value => value + 1);

        const events = [
            "focus",
            "storage",
            "budgetExpensesUpdated",
            "budgetIncomesUpdated",
            "budgetCategoriesUpdated",
            "budgetPlanUpdated"
        ];

        events.forEach(event => window.addEventListener(event, update));

        return () => {
            events.forEach(event => window.removeEventListener(event, update));
        };
    }, []);

    const incomes = getArray("budgetIncomes");
    const expenses = getArray("budgetExpenses");
    const goals = getArray("budgetSavingsGoals");
    const categories = getArray("budgetCategories");
    const plan = readStorage("budgetMonthlyPlan", {});

    const totalIncome = incomes.reduce(
        (sum, item) => sum + (Number(item.amount) || 0), 0
    );

    const totalExpenses = expenses.reduce(
        (sum, item) => sum + (Number(item.amount) || 0), 0
    );

    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0
        ? Math.max(0, (balance / totalIncome) * 100)
        : 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthExpenses = expenses.filter(item => {
        const date = parseDate(item.date);
        return date &&
            date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear;
    });

    const currentMonthIncome = incomes.filter(item => {
        const date = parseDate(item.date);
        return date &&
            date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear;
    });

    const monthIncome = currentMonthIncome.reduce(
        (sum, item) => sum + (Number(item.amount) || 0), 0
    );

    const monthExpenses = currentMonthExpenses.reduce(
        (sum, item) => sum + (Number(item.amount) || 0), 0
    );

    const categoryData = useMemo(() => {
        const totals = {};

        expenses.forEach(item => {
            const name = getCategoryName(item.category);
            totals[name] = (totals[name] || 0) + (Number(item.amount) || 0);
        });

        return Object.entries(totals)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount);
    }, [refresh]);

    const categoryColors = [
        "#1E9B83", "#6EE7C8", "#4B9CD3", "#A78BFA",
        "#F4B860", "#E87979", "#65A6A0", "#A9C1C0"
    ];

    let pieStart = 0;
    const pieGradient = categoryData.length
        ? `conic-gradient(${categoryData.map((item, index) => {
            const percent = totalExpenses > 0
                ? (item.amount / totalExpenses) * 100
                : 0;
            const start = pieStart;
            pieStart += percent;
            return `${categoryColors[index % categoryColors.length]} ${start}% ${pieStart}%`;
        }).join(", ")})`
        : "#263B40";

    const monthlyData = Array.from({ length: 6 }, (_, index) => {
        const date = new Date(currentYear, currentMonth - 5 + index, 1);
        const month = date.getMonth();
        const year = date.getFullYear();

        const income = incomes.reduce((sum, item) => {
            const itemDate = parseDate(item.date);
            return itemDate &&
                itemDate.getMonth() === month &&
                itemDate.getFullYear() === year
                ? sum + (Number(item.amount) || 0)
                : sum;
        }, 0);

        const expense = expenses.reduce((sum, item) => {
            const itemDate = parseDate(item.date);
            return itemDate &&
                itemDate.getMonth() === month &&
                itemDate.getFullYear() === year
                ? sum + (Number(item.amount) || 0)
                : sum;
        }, 0);

        return {
            label: date.toLocaleString("en-IN", { month: "short" }),
            income,
            expense
        };
    });

    const maxMonthlyValue = Math.max(
        1,
        ...monthlyData.flatMap(item => [item.income, item.expense])
    );

    const spendingPoints = monthlyData.map((item, index) => {
        const x = 30 + index * 100;
        const y = 155 - (item.expense / maxMonthlyValue) * 125;
        return `${x},${y}`;
    }).join(" ");

    const monthlyGoalSavings = goals.reduce(
        (sum, goal) => sum + (Number(goal.monthlySaving) || 0), 0
    );

    const goalTarget = goals.reduce(
        (sum, goal) => sum + (Number(goal.targetAmount) || 0), 0
    );

    const plannedIncome = Number(plan.income) || 0;
    const categoryPool = plan.hasGoals
        ? Math.max(0, plannedIncome - monthlyGoalSavings)
        : plannedIncome * 0.8;

    const plannedCategories = categories.map(getCategoryName);
    const allocationEntries = Object.entries(plan.allocations || {});

    const budgetData = allocationEntries.map(([name, percentage]) => {
        const budget = categoryPool * (Number(percentage) || 0) / 100;
        const spent = currentMonthExpenses
            .filter(item =>
                getCategoryName(item.category).toLowerCase() === name.toLowerCase()
            )
            .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

        return { name, budget, spent };
    });

    const highestCategory = categoryData[0];

    return (
        <div className="analytics-page">
            <div className="analytics-heading">
                <div>
                    <p className="analytics-label">FINANCIAL REPORTS</p>
                    <h1>Analytics & Reporting</h1>
                    <p>Understand your money with visual insights and reports.</p>
                </div>
                <span className="analytics-period">
                    {now.toLocaleString("en-IN", { month: "long", year: "numeric" })}
                </span>
            </div>

            <section className="analytics-summary">
                <div className="analytics-stat">
                    <span>Total Income</span>
                    <h2>{money(totalIncome)}</h2>
                    <small>All recorded income</small>
                </div>
                <div className="analytics-stat">
                    <span>Total Expenses</span>
                    <h2>{money(totalExpenses)}</h2>
                    <small>All recorded expenses</small>
                </div>
                <div className="analytics-stat">
                    <span>Available Balance</span>
                    <h2>{money(balance)}</h2>
                    <small>Income minus expenses</small>
                </div>
                <div className="analytics-stat">
                    <span>Savings Rate</span>
                    <h2>{savingsRate.toFixed(1)}%</h2>
                    <small>Based on recorded totals</small>
                </div>
            </section>

            <section className="analytics-grid">
                <div className="analytics-card">
                    <div className="analytics-card-heading">
                        <h3>Expense Distribution</h3>
                        <span>Pie Chart</span>
                    </div>

                    <div className="pie-layout">
                        <div className="pie-chart" style={{ background: pieGradient }}>
                            <div className="pie-hole">
                                <strong>{money(totalExpenses)}</strong>
                                <small>Total Spent</small>
                            </div>
                        </div>

                        <div className="pie-legend">
                            {categoryData.length ? categoryData.map((item, index) => (
                                <div className="legend-item" key={item.name}>
                                    <span
                                        className="legend-dot"
                                        style={{ background: categoryColors[index % categoryColors.length] }}
                                    />
                                    <span>{item.name}</span>
                                    <strong>{money(item.amount)}</strong>
                                </div>
                            )) : <p className="analytics-empty">No expense data available yet.</p>}
                        </div>
                    </div>
                </div>

                <div className="analytics-card">
                    <div className="analytics-card-heading">
                        <h3>Income vs Expenses</h3>
                        <span>Last 6 Months</span>
                    </div>

                    <div className="bar-chart">
                        {monthlyData.map(item => (
                            <div className="bar-group" key={item.label}>
                                <div className="bar-pair">
                                    <div
                                        className="bar income-bar"
                                        style={{ height: `${(item.income / maxMonthlyValue) * 150}px` }}
                                        title={`Income: ${money(item.income)}`}
                                    />
                                    <div
                                        className="bar expense-bar"
                                        style={{ height: `${(item.expense / maxMonthlyValue) * 150}px` }}
                                        title={`Expenses: ${money(item.expense)}`}
                                    />
                                </div>
                                <small>{item.label}</small>
                            </div>
                        ))}
                    </div>

                    <div className="chart-legend">
                        <span><i className="income-dot" /> Income</span>
                        <span><i className="expense-dot" /> Expenses</span>
                    </div>
                </div>

                <div className="analytics-card">
                    <div className="analytics-card-heading">
                        <h3>Spending Trends</h3>
                        <span>Line Graph</span>
                    </div>

                    <div className="line-chart">
                        <svg viewBox="0 0 560 190" role="img" aria-label="Monthly spending trend">
                            <line x1="25" y1="155" x2="535" y2="155" className="chart-axis" />
                            <line x1="25" y1="95" x2="535" y2="95" className="chart-gridline" />
                            <line x1="25" y1="35" x2="535" y2="35" className="chart-gridline" />
                            <polyline points={spendingPoints} className="spending-line" />
                            {monthlyData.map((item, index) => {
                                const x = 30 + index * 100;
                                const y = 155 - (item.expense / maxMonthlyValue) * 125;
                                return (
                                    <g key={item.label}>
                                        <circle cx={x} cy={y} r="5" className="spending-point" />
                                        <text x={x} y="180" textAnchor="middle">{item.label}</text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                    <p className="chart-note">Monthly expenses based on transaction dates.</p>
                </div>

                <div className="analytics-card">
                    <div className="analytics-card-heading">
                        <h3>Monthly Financial Summary</h3>
                        <span>This Month</span>
                    </div>

                    <div className="monthly-report-row">
                        <span>Income</span>
                        <strong className="report-income">{money(monthIncome)}</strong>
                    </div>
                    <div className="monthly-report-row">
                        <span>Expenses</span>
                        <strong className="report-expense">{money(monthExpenses)}</strong>
                    </div>
                    <div className="monthly-report-row">
                        <span>Remaining Balance</span>
                        <strong>{money(monthIncome - monthExpenses)}</strong>
                    </div>
                    <div className="monthly-report-row">
                        <span>Transactions</span>
                        <strong>{currentMonthIncome.length + currentMonthExpenses.length}</strong>
                    </div>
                    <div className="monthly-report-row">
                        <span>Highest Expense Category</span>
                        <strong>{highestCategory?.name || "—"}</strong>
                    </div>
                </div>

                <div className="analytics-card">
                    <div className="analytics-card-heading">
                        <h3>Savings Goals Overview</h3>
                        <span>{goals.length} Goals</span>
                    </div>

                    {goals.length ? goals.map(goal => {
                        const target = Number(goal.targetAmount) || 0;
                        const monthly = Number(goal.monthlySaving) || 0;
                        const months = monthly > 0 ? Math.ceil(target / monthly) : null;

                        return (
                            <div className="goal-report" key={goal.id || goal.name}>
                                <div className="goal-report-heading">
                                    <strong>{goal.name}</strong>
                                    <span>{money(target)}</span>
                                </div>
                                <p>
                                    Planned monthly saving: {money(monthly)}
                                    {" · "}
                                    {months ? `${months} months estimated` : "Add monthly saving"}
                                </p>
                            </div>
                        );
                    }) : (
                        <p className="analytics-empty">
                            No savings goals added yet. Add goals in Smart Budget & Savings.
                        </p>
                    )}

                    <div className="goal-total">
                        <span>Total Goal Target</span>
                        <strong>{money(goalTarget)}</strong>
                        <span>Planned monthly contributions: {money(monthlyGoalSavings)}</span>
                    </div>
                </div>

                <div className="analytics-card budget-report-card">
                    <div className="analytics-card-heading">
                        <h3>Budget vs Actual Spending</h3>
                        <span>This Month</span>
                    </div>

                    {!plan.generated ? (
                        <p className="analytics-empty">
                            Generate a plan in Smart Budget & Savings to compare budgets with actual expenses.
                        </p>
                    ) : budgetData.length ? budgetData.map(item => {
                        const percent = item.budget > 0
                            ? Math.min(100, (item.spent / item.budget) * 100)
                            : 0;

                        return (
                            <div className="budget-report-item" key={item.name}>
                                <div className="budget-report-heading">
                                    <strong>{item.name}</strong>
                                    <span>{money(item.spent)} / {money(item.budget)}</span>
                                </div>
                                <div className="budget-track">
                                    <div
                                        className="budget-fill"
                                        style={{
                                            width: `${percent}%`,
                                            background: item.spent > item.budget ? "#E87979" : "#1E9B83"
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    }) : (
                        <p className="analytics-empty">
                            No category allocations found in your budget plan.
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
}

export default Analytics;