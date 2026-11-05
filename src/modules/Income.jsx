
import { useState, useEffect } from "react";
import "../styles/Incomemanagement.css";

function IncomeManagement() {
    const [incomes, setIncomes] = useState(() => {
        try {
            const savedIncomes = JSON.parse(
                localStorage.getItem("budgetIncomes")
            );

            return Array.isArray(savedIncomes) ? savedIncomes : [];
        } catch {
            return [];
        }
    });

    const [form, setForm] = useState({
        source: "",
        amount: "",
        category: "Salary",
        date: new Date().toISOString().slice(0, 10)
    });

    const [editingId, setEditingId] = useState(null);

    // Save incomes and notify Dashboard and Analytics
    useEffect(() => {
        localStorage.setItem("budgetIncomes", JSON.stringify(incomes));

        window.dispatchEvent(new Event("budgetIncomesUpdated"));
    }, [incomes]);

    function handleChange(e) {
        const { name, value } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    }

    function handleSubmit(e) {
        e.preventDefault();

        if (!form.source.trim() || Number(form.amount) <= 0) {
            return;
        }

        const income = {
            id: editingId || Date.now(),
            source: form.source.trim(),
            amount: Number(form.amount),
            category: form.category,
            date: form.date
        };

        if (editingId !== null) {
            setIncomes(prev =>
                prev.map(item =>
                    item.id === editingId ? income : item
                )
            );
        } else {
            setIncomes(prev => [income, ...prev]);
        }

        resetForm();
    }

    function editIncome(income) {
        setEditingId(income.id);

        setForm({
            source: income.source,
            amount: String(income.amount),
            category: income.category,
            date: income.date
        });
    }

    function deleteIncome(id) {
        if (window.confirm("Do you want to delete this income?")) {
            setIncomes(prev =>
                prev.filter(item => item.id !== id)
            );

            if (editingId === id) {
                resetForm();
            }
        }
    }

    function resetForm() {
        setForm({
            source: "",
            amount: "",
            category: "Salary",
            date: new Date().toISOString().slice(0, 10)
        });

        setEditingId(null);
    }

    const totalIncome = incomes.reduce(
        (total, item) => total + Number(item.amount || 0),
        0
    );

    return (
        <div className="income-page">

            <div className="income-heading">
                <div>
                    <h1>Income Management</h1>
                    <p>Track and manage all your income sources.</p>
                </div>
            </div>

            <div className="income-summary">
                <div className="income-card">
                    <span>Total Income</span>
                    <h2>₹{totalIncome.toLocaleString("en-IN")}</h2>
                </div>

                <div className="income-card">
                    <span>Total Records</span>
                    <h2>{incomes.length}</h2>
                </div>
            </div>

            <div className="income-form-card">
                <h2>{editingId !== null ? "Edit Income" : "Add New Income"}</h2>

                <form onSubmit={handleSubmit}>
                    <div className="income-form-grid">

                        <div>
                            <label>Income Source</label>
                            <input
                                type="text"
                                name="source"
                                placeholder="e.g. Monthly Salary"
                                value={form.source}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
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

                        <div>
                            <label>Category</label>
                            <select
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                required
                            >
                                <option>Salary</option>
                                <option>Freelance</option>
                                <option>Business</option>
                                <option>Investment</option>
                                <option>Gift</option>
                                <option>Other</option>
                            </select>
                        </div>

                        <div>
                            <label>Date</label>
                            <input
                                type="date"
                                name="date"
                                value={form.date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                    </div>

                    <div className="income-buttons">
                        <button type="submit" className="income-save">
                            {editingId !== null ? "Update Income" : "Add Income"}
                        </button>

                        {editingId !== null && (
                            <button
                                type="button"
                                className="income-cancel"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="income-table-card">
                <h2>Income History</h2>

                <div className="income-table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Source</th>
                                <th>Category</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {incomes.map(income => (
                                <tr key={income.id}>
                                    <td>{income.source}</td>
                                    <td>{income.category}</td>
                                    <td>{income.date}</td>
                                    <td className="income-amount">
                                        ₹{Number(income.amount).toLocaleString("en-IN")}
                                    </td>
                                    <td>
                                        <button
                                            className="income-edit"
                                            onClick={() => editIncome(income)}
                                        >
                                            Edit
                                        </button>

                                        <button
                                            className="income-delete"
                                            onClick={() => deleteIncome(income.id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {incomes.length === 0 && (
                        <p className="income-empty">
                            No income records yet. Add your first income!
                        </p>
                    )}
                </div>
            </div>

        </div>
    );
}

export default IncomeManagement;