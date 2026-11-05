
import { useEffect, useState } from "react";
import "../styles/ExpenseCategories.css";

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

function ExpenseCategories() {
    const [categories, setCategories] = useState([]);
    const [categoryName, setCategoryName] = useState("");
    const [categoryIcon, setCategoryIcon] = useState("📁");
    const [editId, setEditId] = useState(null);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const storedCategories = JSON.parse(
            localStorage.getItem("budgetCategories")
        );

        if (storedCategories === null) {
            setCategories(DEFAULT_CATEGORIES);
            localStorage.setItem(
                "budgetCategories",
                JSON.stringify(DEFAULT_CATEGORIES)
            );
        } else {
            setCategories(storedCategories);
        }
    }, []);

    function updateCategories(updatedCategories) {
        setCategories(updatedCategories);

        localStorage.setItem(
            "budgetCategories",
            JSON.stringify(updatedCategories)
        );

        // Notify Monthly Budget Planner immediately
        window.dispatchEvent(
            new Event("budgetCategoriesUpdated")
        );
    }

    function handleSubmit(e) {
        e.preventDefault();

        const trimmedName = categoryName.trim();

        if (!trimmedName) {
            setMessage("Please enter a category name.");
            return;
        }

        const duplicate = categories.some(
            (category) =>
                category.name.toLowerCase() === trimmedName.toLowerCase() &&
                String(category.id) !== String(editId)
        );

        if (duplicate) {
            setMessage("This category already exists.");
            return;
        }

        if (editId !== null) {
            const updatedCategories = categories.map((category) =>
                String(category.id) === String(editId)
                    ? {
                        ...category,
                        name: trimmedName,
                        icon: categoryIcon
                    }
                    : category
            );

            updateCategories(updatedCategories);
            setMessage("Category updated successfully!");
        } else {
            const newCategory = {
                id: Date.now(),
                name: trimmedName,
                icon: categoryIcon
            };

            updateCategories([...categories, newCategory]);
            setMessage("Category added successfully!");
        }

        setCategoryName("");
        setCategoryIcon("📁");
        setEditId(null);
    }

    function handleEdit(category) {
        setCategoryName(category.name);
        setCategoryIcon(category.icon || "📁");
        setEditId(category.id);
        setMessage("");
    }

    function handleDelete(id) {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this category?"
        );

        if (!confirmDelete) return;

        const updatedCategories = categories.filter(
            (category) => String(category.id) !== String(id)
        );

        updateCategories(updatedCategories);

        if (String(editId) === String(id)) {
            setCategoryName("");
            setCategoryIcon("📁");
            setEditId(null);
        }

        setMessage("Category deleted successfully!");
    }

    function cancelEdit() {
        setCategoryName("");
        setCategoryIcon("📁");
        setEditId(null);
        setMessage("");
    }

    const expenses = JSON.parse(
        localStorage.getItem("budgetExpenses") || "[]"
    );

    function getCategoryTotal(categoryName) {
        return expenses
            .filter(
                (expense) =>
                    expense.category === categoryName
            )
            .reduce(
                (total, expense) => total + Number(expense.amount || 0),
                0
            );
    }

    return (
        <div className="categories-container">
            <div className="categories-header">
                <h1>Expense Categories</h1>
                <p>Manage your expense categories.</p>
            </div>

            <div className="category-form-card">
                <h2>{editId !== null ? "Edit Category" : "Add New Category"}</h2>

                <form onSubmit={handleSubmit}>
                    <div className="category-form">
                        <div>
                            <label>Category Name</label>
                            <input
                                type="text"
                                placeholder="Enter category name"
                                value={categoryName}
                                onChange={(e) =>
                                    setCategoryName(e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <label>Choose Icon</label>
                            <select
                                value={categoryIcon}
                                onChange={(e) =>
                                    setCategoryIcon(e.target.value)
                                }
                            >
                                <option value="📁">📁 General</option>
                                <option value="🍔">🍔 Food</option>
                                <option value="🚗">🚗 Transport</option>
                                <option value="🛍️">🛍️ Shopping</option>
                                <option value="📚">📚 Education</option>
                                <option value="🏥">🏥 Healthcare</option>
                                <option value="🏠">🏠 Rent</option>
                                <option value="🎬">🎬 Entertainment</option>
                                <option value="✈️">✈️ Travel</option>
                                <option value="💡">💡 Bills</option>
                                <option value="📦">📦 Others</option>
                            </select>
                        </div>

                        <button type="submit">
                            {editId !== null ? "Update Category" : "Add Category"}
                        </button>

                        {editId !== null && (
                            <button
                                type="button"
                                onClick={cancelEdit}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>

                {message && (
                    <p className="category-message">{message}</p>
                )}
            </div>

            <div className="category-list-card">
                <h2>Your Categories ({categories.length})</h2>

                {categories.length === 0 ? (
                    <p>No categories added yet.</p>
                ) : (
                    <div className="category-list">
                        {categories.map((category) => (
                            <div
                                className="category-item"
                                key={category.id}
                            >
                                <div className="category-info">
                                    <span className="category-icon">
                                        {category.icon}
                                    </span>

                                    <div>
                                        <h3>{category.name}</h3>
                                        <p>
                                            Total expenses: ₹
                                            {getCategoryTotal(
                                                category.name
                                            ).toLocaleString("en-IN")}
                                        </p>
                                    </div>
                                </div>

                                <div className="category-actions">
                                    <button
                                        onClick={() => handleEdit(category)}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        onClick={() =>
                                            handleDelete(category.id)
                                        }
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ExpenseCategories;