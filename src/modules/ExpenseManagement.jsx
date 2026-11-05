
import { useState, useEffect } from "react";
import "../styles/ExpenseManagement.css";

const DEFAULT_CATEGORIES = [
    { id: 1, name: "Food", icon: "🍔" },
    { id: 2, name: "Transport", icon: "🚗" },
    { id: 3, name: "Shopping", icon: "🛍️" },
    { id: 4, name: "Education", icon: "📚" },
    { id: 5, name: "Healthcare", icon: "🏥" },
    { id: 6, name: "Rent", icon: "🏠" },
    { id: 7, name: "Entertainment", icon: "🎬" },
    { id: 8, name: "Others", icon: "📦" }
];

function ExpenseManagement() {
    const [expenses, setExpenses] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("budgetExpenses")) || [];
        } catch {
            return [];
        }
    });

    const [categories, setCategories] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem("budgetCategories"));
            return Array.isArray(saved) && saved.length > 0
                ? saved
                : DEFAULT_CATEGORIES;
        } catch {
            return DEFAULT_CATEGORIES;
        }
    });

    const [form, setForm] = useState({
        title: "",
        amount: "",
        category: "Food",
        date: new Date().toISOString().slice(0, 10),
        paymentMethod: "Cash"
    });

    const [editingId, setEditingId] = useState(null);

    // Save expenses and notify other modules
    useEffect(() => {
        localStorage.setItem("budgetExpenses", JSON.stringify(expenses));

        window.dispatchEvent(new Event("budgetExpensesUpdated"));
    }, [expenses]);

    function handleChange(e) {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    }

    function handleSubmit(e) {
        e.preventDefault();

        const expense = {
            id: editingId || Date.now(),
            title: form.title.trim(),
            amount: Number(form.amount),
            category: form.category,
            date: form.date,
            paymentMethod: form.paymentMethod
        };

        if (editingId) {
            setExpenses(prev =>
                prev.map(item =>
                    item.id === editingId ? expense : item
                )
            );
        } else {
            setExpenses(prev => [expense, ...prev]);
        }

        resetForm();
    }

    function editExpense(expense) {
        setEditingId(expense.id);

        setForm({
            title: expense.title,
            amount: String(expense.amount),
            category: expense.category,
            date: expense.date,
            paymentMethod: expense.paymentMethod || "Cash"
        });
    }

    function deleteExpense(id) {
        if (window.confirm("Do you want to delete this expense?")) {
            setExpenses(prev => prev.filter(item => item.id !== id));
        }
    }

    function resetForm() {
        setForm({
            title: "",
            amount: "",
            category: categories[0]?.name || "",
            date: new Date().toISOString().slice(0, 10),
            paymentMethod: "Cash"
        });

        setEditingId(null);
    }

    const totalExpenses = expenses.reduce(
        (total, item) => total + Number(item.amount), 0
    );

    return (
        <div className="expense-page">
            <div className="expense-heading">
                <div>
                    <p className="expense-label">FINANCIAL MANAGEMENT</p>
                    <h1>Expense Management</h1>
                    <p>Track and manage your daily expenses.</p>
                </div>
            </div>

            <div className="expense-total-card">
                <div>
                    <p>Total Expenses</p>
                    <h2>₹{totalExpenses.toLocaleString("en-IN")}</h2>
                    <span>{expenses.length} expense records</span>
                </div>
                <div className="expense-total-icon">💸</div>
            </div>

            <div className="expense-form-card">
                <h2>{editingId ? "Edit Expense" : "Add New Expense"}</h2>

                <form onSubmit={handleSubmit}>
                    <div className="expense-form-grid">
                        <div className="expense-field">
                            <label>Expense Name</label>
                            <input
                                type="text"
                                name="title"
                                placeholder="Enter expense name"
                                value={form.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="expense-field">
                            <label>Amount (₹)</label>
                            <input
                                type="number"
                                name="amount"
                                placeholder="Enter amount"
                                min="1"
                                step="0.01"
                                value={form.amount}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="expense-field">
                            <label>Category</label>
                            <select
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                required
                            >
                                {categories.map(category => (
                                    <option
                                        key={category.id}
                                        value={category.name}
                                    >
                                        {category.icon} {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="expense-field">
                            <label>Date</label>
                            <input
                                type="date"
                                name="date"
                                value={form.date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="expense-field">
                            <label>Payment Method</label>
                            <select
                                name="paymentMethod"
                                value={form.paymentMethod}
                                onChange={handleChange}
                            >
                                <option>Cash</option>
                                <option>UPI</option>
                                <option>Debit Card</option>
                                <option>Credit Card</option>
                                <option>Net Banking</option>
                            </select>
                        </div>
                    </div>

                    <div className="expense-form-actions">
                        <button type="submit" className="expense-submit">
                            {editingId ? "Update Expense" : "Add Expense"}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                className="expense-cancel"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="expense-history-card">
                <h2>Expense History</h2>

                {expenses.length === 0 ? (
                    <div className="expense-empty">
                        <span>🧾</span>
                        <h3>No expenses recorded yet</h3>
                        <p>Add your first expense using the form above.</p>
                    </div>
                ) : (
                    <div className="expense-table-wrapper">
                        <table className="expense-table">
                            <thead>
                                <tr>
                                    <th>Expense</th>
                                    <th>Category</th>
                                    <th>Date</th>
                                    <th>Payment</th>
                                    <th>Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {expenses.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.title}</td>
                                        <td>{item.category}</td>
                                        <td>{item.date}</td>
                                        <td>{item.paymentMethod || "Cash"}</td>
                                        <td className="expense-amount">
                                            ₹{Number(item.amount).toLocaleString("en-IN")}
                                        </td>
                                        <td>
                                            <div className="expense-actions">
                                                <button onClick={() => editExpense(item)}>
                                                    Edit
                                                </button>
                                                <button onClick={() => deleteExpense(item.id)}>
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ExpenseManagement;