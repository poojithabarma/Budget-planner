
import { useEffect, useMemo, useState } from "react";
import "../styles/BudgetSavings.css";

const readStorage = (key, fallback) => {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
};

const money = (amount) =>
    Number(amount || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 0
    });

const getCategoryName = (item) => {
    if (typeof item === "string") return item;

    return (
        item?.name ||
        item?.categoryName ||
        item?.category ||
        item?.title ||
        ""
    );
};

const getSalaryRules = (salary) => {
    if (salary <= 20000) {
        return { needs: 65, wants: 25, savings: 10 };
    }

    if (salary <= 50000) {
        return { needs: 55, wants: 30, savings: 15 };
    }

    return { needs: 50, wants: 30, savings: 20 };
};

const getCategoryType = (name) => {
    const category = name.toLowerCase();

    if (
        /rent|house|housing|home|accommodation|food|grocery|groceries|bill|utility|utilities|electricity|water|transport|travel|fuel|petrol|bus|vehicle|health|medical|medicine|hospital|education|college|course|study|insurance/.test(category)
    ) {
        return "needs";
    }

    if (
        /shopping|clothing|fashion|entertainment|movie|game|recreation|restaurant|dining|vacation|holiday|subscription|hobby/.test(category)
    ) {
        return "wants";
    }

    return "wants";
};

const getCategoryWeight = (name) => {
    const category = name.toLowerCase();

    if (/rent|house|housing|home|accommodation/.test(category)) return 1.5;
    if (/food|grocery|groceries/.test(category)) return 1.3;
    if (/health|medical|medicine|hospital/.test(category)) return 1.2;
    if (/bill|utility|utilities|electricity|water/.test(category)) return 1.1;
    if (/transport|travel|fuel|petrol|bus|vehicle/.test(category)) return 1.0;
    if (/education|college|course|study/.test(category)) return 0.9;
    if (/insurance/.test(category)) return 1.1;
    if (/shopping|clothing|fashion/.test(category)) return 0.8;
    if (/entertainment|movie|game|recreation/.test(category)) return 0.6;
    if (/restaurant|dining|vacation|holiday/.test(category)) return 0.5;

    return 0.7;
};

// Calculate recommendations using salary range and category types.
const getDefaultAllocations = (names, salary, categoryBudgetPool) => {
    const result = {};

    names.forEach((name) => {
        result[name] = 0;
    });

    if (!names.length || salary <= 0 || categoryBudgetPool <= 0) {
        return result;
    }

    const rules = getSalaryRules(salary);
    const totalPlanningPercentage = rules.needs + rules.wants;

    const needsPool =
        categoryBudgetPool * rules.needs / totalPlanningPercentage;

    const wantsPool =
        categoryBudgetPool * rules.wants / totalPlanningPercentage;

    const needsCategories = names.filter(
        (name) => getCategoryType(name) === "needs"
    );

    const wantsCategories = names.filter(
        (name) => getCategoryType(name) === "wants"
    );

    const distribute = (categoryNames, availableAmount) => {
        if (!categoryNames.length) return;

        const totalWeight = categoryNames.reduce(
            (sum, name) => sum + getCategoryWeight(name),
            0
        );

        categoryNames.forEach((name) => {
            const categoryAmount =
                availableAmount *
                getCategoryWeight(name) /
                totalWeight;

            result[name] = Number(
                (categoryAmount / categoryBudgetPool * 100).toFixed(2)
            );
        });
    };

    distribute(needsCategories, needsPool);
    distribute(wantsCategories, wantsPool);

    return result;
};

const getSavedAllocations = (names, saved) => {
    const result = {};
    let remaining = 100;

    names.forEach((name) => {
        const requested = Math.max(0, Number(saved?.[name]) || 0);
        const allowed = Math.min(requested, remaining);

        result[name] = Number(allowed.toFixed(2));
        remaining -= allowed;
    });

    return result;
};

// Check whether a saved plan has actual category allocations.
const hasPositiveAllocation = (allocations = {}) => {
    return Object.values(allocations).some(
        (value) => Number(value) > 0
    );
};

function BudgetSavings() {
    const savedPlan = readStorage("budgetMonthlyPlan", {});
    const savedGoals = readStorage("budgetSavingsGoals", []);
    const savedCategories = readStorage("budgetCategories", []);

    const initialCategories = [
        ...new Set(
            savedCategories.map(getCategoryName).filter(Boolean)
        )
    ];

    // A previously generated plan containing only zero allocations
    // should NOT be treated as a customized plan.
    const hasValidSavedAllocations =
        Boolean(savedPlan.generated) &&
        hasPositiveAllocation(savedPlan.allocations);

    const [income, setIncome] = useState(
        savedPlan.income ? String(savedPlan.income) : ""
    );

    const [hasGoals, setHasGoals] = useState(
        savedPlan.hasGoals ?? savedGoals.length > 0
    );

    const [categories, setCategories] = useState(initialCategories);

    const [goals, setGoals] = useState(() =>
        savedGoals.map((goal) => ({
            ...goal,
            monthlySaving: Number(goal.monthlySaving || 0)
        }))
    );

    const [allocations, setAllocations] = useState(() => {
        if (hasValidSavedAllocations) {
            return getSavedAllocations(
                initialCategories,
                savedPlan.allocations || {}
            );
        }

        return {};
    });

    const [allocationsCustomized, setAllocationsCustomized] = useState(
        hasValidSavedAllocations
    );

    const [goalName, setGoalName] = useState("");
    const [goalAmount, setGoalAmount] = useState("");
    const [goalMonthlySaving, setGoalMonthlySaving] = useState("");

    const [planGenerated, setPlanGenerated] = useState(
        hasValidSavedAllocations
    );

    const [message, setMessage] = useState("");

    const salary = Number(income) || 0;

    const goalDetails = useMemo(() => {
        return goals.map((goal) => {
            const target = Number(goal.targetAmount || 0);
            const monthlySaving = Number(goal.monthlySaving || 0);

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
    }, [goals]);

    const totalGoalSavings = goalDetails.reduce(
        (sum, goal) => sum + goal.monthlySaving,
        0
    );

    const availableAfterGoals = Math.max(
        0,
        salary - (hasGoals ? totalGoalSavings : 0)
    );

    const rules = getSalaryRules(salary);

    const generalSavings = hasGoals
        ? 0
        : salary * rules.savings / 100;

    const categoryBudgetPool = hasGoals
        ? availableAfterGoals
        : salary - generalSavings;

    // Automatically calculate recommendations until the user
    // manually customizes their allocations.
    useEffect(() => {
        if (allocationsCustomized) return;

        setAllocations(
            getDefaultAllocations(
                categories,
                salary,
                categoryBudgetPool
            )
        );
    }, [
        salary,
        categoryBudgetPool,
        categories,
        allocationsCustomized
    ]);

    // Listen for category changes from Expense Categories.
    useEffect(() => {
        const updateCategories = () => {
            const stored = readStorage("budgetCategories", []);

            const names = [
                ...new Set(
                    stored.map(getCategoryName).filter(Boolean)
                )
            ];

            setCategories(names);

            setAllocations((previous) => {
                if (!allocationsCustomized) {
                    return getDefaultAllocations(
                        names,
                        salary,
                        categoryBudgetPool
                    );
                }

                const updated = {};

                names.forEach((name) => {
                    updated[name] =
                        previous[name] !== undefined
                            ? previous[name]
                            : 0;
                });

                return getSavedAllocations(names, updated);
            });

            setPlanGenerated(false);
        };

        window.addEventListener(
            "budgetCategoriesUpdated",
            updateCategories
        );

        return () => {
            window.removeEventListener(
                "budgetCategoriesUpdated",
                updateCategories
            );
        };
    }, [
        allocationsCustomized,
        salary,
        categoryBudgetPool
    ]);

    // Save purchase goals.
    useEffect(() => {
        localStorage.setItem(
            "budgetSavingsGoals",
            JSON.stringify(goals)
        );
    }, [goals]);

    const categoryPercentageTotal = Number(
        categories.reduce(
            (sum, category) =>
                sum + Number(allocations[category] || 0),
            0
        ).toFixed(2)
    );

    const categoryBudgetTotal =
        categoryBudgetPool * categoryPercentageTotal / 100;

    const unallocatedPercentage = Math.max(
        0,
        Number((100 - categoryPercentageTotal).toFixed(2))
    );

    const unallocatedAmount = Math.max(
        0,
        categoryBudgetPool - categoryBudgetTotal
    );

    const categoryRows = categories.map((category) => {
        const percentage = Number(allocations[category] || 0);

        return {
            name: category,
            percentage,
            amount: categoryBudgetPool * percentage / 100,
            type: getCategoryType(category)
        };
    });

    function addGoal(event) {
        event.preventDefault();

        if (!goalName.trim()) {
            setMessage("Please enter the purchase name.");
            return;
        }

        if (Number(goalAmount) <= 0) {
            setMessage("Please enter a valid purchase amount.");
            return;
        }

        if (Number(goalMonthlySaving) <= 0) {
            setMessage("Please enter a valid monthly saving amount.");
            return;
        }

        const newGoal = {
            id: Date.now(),
            name: goalName.trim(),
            targetAmount: Number(goalAmount),
            monthlySaving: Number(goalMonthlySaving)
        };

        setGoals((previous) => [...previous, newGoal]);

        setGoalName("");
        setGoalAmount("");
        setGoalMonthlySaving("");
        setMessage("Purchase goal added successfully!");
        setPlanGenerated(false);
    }

    function updateGoalSaving(id, value) {
        const amount = Math.max(0, Number(value) || 0);

        setGoals((previous) =>
            previous.map((goal) =>
                goal.id === id
                    ? { ...goal, monthlySaving: amount }
                    : goal
            )
        );

        setPlanGenerated(false);
    }

    function deleteGoal(id) {
        setGoals((previous) =>
            previous.filter((goal) => goal.id !== id)
        );

        setPlanGenerated(false);
    }

    // Edit only the selected category.
    function updateAllocation(category, value) {
        const otherTotal = categories.reduce(
            (sum, name) =>
                name === category
                    ? sum
                    : sum + Number(allocations[name] || 0),
            0
        );

        const maximumAllowed = Math.max(0, 100 - otherTotal);

        const requested = value === ""
            ? 0
            : Number(value);

        if (!Number.isFinite(requested) || requested < 0) {
            setMessage("Please enter a valid percentage.");
            return;
        }

        if (requested > maximumAllowed) {
            setMessage(
                `Maximum allocation for ${category} is ${maximumAllowed.toFixed(2)}%.`
            );
            return;
        }

        setAllocations((previous) => ({
            ...previous,
            [category]: Number(requested.toFixed(2))
        }));

        setAllocationsCustomized(true);
        setMessage("");
        setPlanGenerated(false);
    }

    function generatePlan() {
        if (salary <= 0) {
            setMessage("Please enter your monthly salary.");
            return;
        }

        if (categories.length === 0) {
            setMessage(
                "Please add expense categories before generating your budget."
            );
            return;
        }

        if (hasGoals && goals.length === 0) {
            setMessage("Please add at least one purchase goal.");
            return;
        }

        if (
            hasGoals &&
            goalDetails.some((goal) => goal.monthlySaving <= 0)
        ) {
            setMessage(
                "Enter a monthly saving amount for every purchase goal."
            );
            return;
        }

        if (totalGoalSavings > salary) {
            setMessage(
                "Your total monthly goal savings exceed your salary. Reduce the amounts."
            );
            return;
        }

        // IMPORTANT FIX:
        // If the plan has no allocations and the user has not
        // customized them, calculate recommendations now.
        const currentTotal = categories.reduce(
            (sum, name) =>
                sum + Number(allocations[name] || 0),
            0
        );

        const finalAllocations =
            currentTotal === 0 && !allocationsCustomized
                ? getDefaultAllocations(
                    categories,
                    salary,
                    categoryBudgetPool
                )
                : { ...allocations };

        const percentageTotal = categories.reduce(
            (sum, name) =>
                sum + Number(finalAllocations[name] || 0),
            0
        );

        if (percentageTotal > 100.001) {
            setMessage(
                "Category allocation cannot exceed 100%. Please adjust it."
            );
            return;
        }

        if (percentageTotal === 0 && categoryBudgetPool > 0) {
            setMessage(
                "Unable to calculate category recommendations. Please check your categories."
            );
            return;
        }

        const plan = {
            income: salary,
            hasGoals,
            allocations: finalAllocations,
            generated: true,
            generatedAt: new Date().toISOString()
        };

        // Update the UI and Local Storage with the calculated values.
        setAllocations(finalAllocations);
        setAllocationsCustomized(true);

        localStorage.setItem(
            "budgetMonthlyPlan",
            JSON.stringify(plan)
        );

        setPlanGenerated(true);
        setMessage("Your smart budget plan has been generated!");
    }

    function changeGoalChoice(value) {
        setHasGoals(value);
        setPlanGenerated(false);
        setMessage("");

        if (!value) {
            setGoals([]);
        }
    }

    return (
        <div className="budget-planner">

            <div className="budget-header">
                <p className="budget-label">
                    SMART FINANCIAL PLANNING
                </p>

                <h1>Smart Budget & Savings Planner</h1>

                <p>
                    Plan your monthly expenses and achieve your
                    purchase goals with a personalized budget.
                </p>
            </div>

            {/* STEP 1: SALARY */}
            <section className="budget-card">
                <div className="step-heading">
                    <span className="step-number">1</span>

                    <div>
                        <h2>Enter Your Monthly Salary</h2>
                        <p>
                            Enter your monthly income to start planning.
                        </p>
                    </div>
                </div>

                <div className="salary-input">
                    <label>Monthly Salary (₹)</label>

                    <input
                        type="number"
                        min="1"
                        placeholder="Example: 40000"
                        value={income}
                        onChange={(event) => {
                            setIncome(event.target.value);
                            setPlanGenerated(false);
                        }}
                    />
                </div>

                {salary > 0 && (
                    <p className="budget-success">
                        Your recommended savings rate is {rules.savings}%
                        based on your salary range.
                    </p>
                )}
            </section>

            {/* STEP 2: PURCHASE GOALS */}
            <section className="budget-card">
                <div className="step-heading">
                    <span className="step-number">2</span>

                    <div>
                        <h2>Do You Have Any Purchase Goals?</h2>

                        <p>
                            Tell us what you want to purchase.
                            You can add multiple goals.
                        </p>
                    </div>
                </div>

                <div className="goal-choice">
                    <button
                        type="button"
                        className={
                            hasGoals
                                ? "choice-button selected"
                                : "choice-button"
                        }
                        onClick={() => changeGoalChoice(true)}
                    >
                        Yes, I have goals
                    </button>

                    <button
                        type="button"
                        className={
                            !hasGoals
                                ? "choice-button selected"
                                : "choice-button"
                        }
                        onClick={() => changeGoalChoice(false)}
                    >
                        No, not right now
                    </button>
                </div>

                {!hasGoals && (
                    <div className="normal-plan-message">
                        <h3>Normal Budget Planning</h3>

                        <p>
                            Your savings amount is calculated according
                            to your salary range. The remaining amount
                            is available for expense categories.
                        </p>
                    </div>
                )}

                {hasGoals && (
                    <>
                        <form className="goal-form" onSubmit={addGoal}>
                            <h3>Add a Purchase Goal</h3>

                            <div className="goal-form-grid">
                                <div>
                                    <label>Purchase Name</label>

                                    <input
                                        type="text"
                                        placeholder="Example: Laptop"
                                        value={goalName}
                                        onChange={(event) =>
                                            setGoalName(event.target.value)
                                        }
                                    />
                                </div>

                                <div>
                                    <label>Purchase Amount (₹)</label>

                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Example: 60000"
                                        value={goalAmount}
                                        onChange={(event) =>
                                            setGoalAmount(event.target.value)
                                        }
                                    />
                                </div>

                                <div>
                                    <label>
                                        How Much Can You Save Monthly? (₹)
                                    </label>

                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Example: 5000"
                                        value={goalMonthlySaving}
                                        onChange={(event) =>
                                            setGoalMonthlySaving(event.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="secondary-button"
                            >
                                + Add Goal
                            </button>
                        </form>

                        {goalDetails.length > 0 && (
                            <div className="goals-list">
                                <h3>Your Purchase Goals</h3>

                                {goalDetails.map((goal) => (
                                    <div
                                        className="goal-item"
                                        key={goal.id}
                                    >
                                        <div className="goal-item-details">
                                            <strong>{goal.name}</strong>

                                            <p>
                                                Purchase amount: ₹
                                                {money(goal.target)}
                                            </p>

                                            <label>
                                                Monthly Saving Amount (₹)
                                            </label>

                                            <input
                                                type="number"
                                                min="0"
                                                value={goal.monthlySaving}
                                                onChange={(event) =>
                                                    updateGoalSaving(
                                                        goal.id,
                                                        event.target.value
                                                    )
                                                }
                                            />

                                            {goal.months !== null ? (
                                                <p className="goal-monthly">
                                                    You can purchase this in
                                                    approximately {goal.months}
                                                    {" "}
                                                    {goal.months === 1
                                                        ? "month"
                                                        : "months"}.
                                                </p>
                                            ) : (
                                                <p className="budget-warning">
                                                    Enter a monthly saving amount
                                                    to calculate the estimated time.
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            className="delete-goal"
                                            onClick={() => deleteGoal(goal.id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* STEP 3: CATEGORY PLANNING */}
            <section className="budget-card">
                <div className="step-heading">
                    <span className="step-number">3</span>

                    <div>
                        <h2>Plan Your Expense Categories</h2>

                        <p>
                            Recommendations are calculated from your salary
                            and the types of categories you have added.
                            You can edit any suggested allocation.
                        </p>
                    </div>
                </div>

                <div className="category-pool">
                    <span>Available for category planning</span>
                    <strong>₹{money(categoryBudgetPool)}</strong>
                </div>

                {categories.length > 0 ? (
                    <>
                        <div className="allocation-heading">
                            <span>Expense Category</span>
                            <span>Allocation (%)</span>
                            <span>Monthly Budget</span>
                        </div>

                        {categoryRows.map((item) => {
                            const otherTotal =
                                categoryPercentageTotal - item.percentage;

                            const maxAllowed = Math.max(
                                0,
                                100 - otherTotal
                            );

                            return (
                                <div
                                    className="allocation-row"
                                    key={item.name}
                                >
                                    <div>
                                        <strong>{item.name}</strong>
                                        <p className="category-type-label">
                                            {item.type === "needs"
                                                ? "Essential expense"
                                                : "Flexible expense"}
                                        </p>
                                    </div>

                                    <div className="allocation-controls">
                                        <input
                                            type="number"
                                            min="0"
                                            max={maxAllowed}
                                            step="0.01"
                                            value={item.percentage}
                                            onChange={(event) =>
                                                updateAllocation(
                                                    item.name,
                                                    event.target.value
                                                )
                                            }
                                        />

                                        <span>%</span>
                                    </div>

                                    <strong>
                                        ₹{money(item.amount)}
                                    </strong>
                                </div>
                            );
                        })}

                        <div className="allocation-total">
                            <span>
                                Total category allocation:
                                {" "}{categoryPercentageTotal}%
                            </span>

                            <strong>
                                ₹{money(categoryBudgetTotal)}
                            </strong>
                        </div>

                        <div className="unallocated-info">
                            Unallocated percentage: {unallocatedPercentage}%
                            <br />
                            Unallocated amount: ₹{money(unallocatedAmount)}
                        </div>
                    </>
                ) : (
                    <div className="empty-goals">
                        No expense categories found. Add categories
                        in Expense Categories first.
                    </div>
                )}
            </section>

            {/* STEP 4: SUMMARY */}
            <section className="budget-card">
                <div className="step-heading">
                    <span className="step-number">4</span>

                    <div>
                        <h2>Your Budget Summary</h2>
                        <p>
                            Review your monthly financial plan.
                        </p>
                    </div>
                </div>

                <div className="budget-summary-grid">
                    <div className="summary-card">
                        <span>Monthly Salary</span>
                        <strong>₹{money(salary)}</strong>
                    </div>

                    <div className="summary-card">
                        <span>Monthly Goal Savings</span>

                        <strong>
                            ₹{money(hasGoals ? totalGoalSavings : 0)}
                        </strong>
                    </div>

                    <div className="summary-card">
                        <span>Category Budget</span>
                        <strong>₹{money(categoryBudgetTotal)}</strong>
                    </div>

                    <div className="summary-card">
                        <span>General Savings</span>
                        <strong>₹{money(generalSavings)}</strong>
                    </div>
                </div>

                {hasGoals && goals.length > 0 && (
                    <div className="goal-plan-message">
                        <h3>Purchase Goal Summary</h3>

                        {totalGoalSavings > salary ? (
                            <p className="budget-warning">
                                Your goals require ₹
                                {money(totalGoalSavings)}
                                {" "}per month, which is more than your salary.
                                Reduce the monthly savings amounts to create
                                a feasible budget.
                            </p>
                        ) : (
                            <p className="budget-success">
                                Your selected monthly savings fit within
                                your salary. ₹
                                {money(availableAfterGoals)}
                                {" "}is available for expense categories.
                            </p>
                        )}

                        <div className="goal-summary-list">
                            {goalDetails.map((goal) => (
                                <div key={goal.id}>
                                    <span>{goal.name}</span>

                                    <strong>
                                        {goal.months === null
                                            ? "Not calculated"
                                            : `Approximately ${goal.months} months`}
                                    </strong>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    type="button"
                    className="primary-button"
                    onClick={generatePlan}
                >
                    Generate My Budget Plan
                </button>

                {message && (
                    <p className="budget-message">
                        {message}
                    </p>
                )}

                {planGenerated && (
                    <div className="budget-success">
                        Your monthly budget plan has been saved successfully!
                    </div>
                )}
            </section>

            <p className="budget-disclaimer">
                Note: Budget recommendations are estimates based on
                salary ranges and expense category types. Users can
                customize their allocations. This planner does not
                automatically transfer money or record bank transactions.
            </p>

        </div>
    );
}

export default BudgetSavings;