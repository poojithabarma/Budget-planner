
import { useEffect, useState } from "react";
import "../styles/Profile.css";

function readStorage(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value ?? fallback;
    } catch {
        return fallback;
    }
}

function Profile() {
    const [user, setUser] = useState(() =>
        readStorage("budgetPlannerCurrentUser", {})
    );

    const [editing, setEditing] = useState(false);
    const [message, setMessage] = useState("");

    const [form, setForm] = useState({
        name: user.name || user.fullName || user.username || "",
        email: user.email || ""
    });

    useEffect(() => {
        const currentUser = readStorage("budgetPlannerCurrentUser", {});
        setUser(currentUser);
        setForm({
            name: currentUser.name || currentUser.fullName || currentUser.username || "",
            email: currentUser.email || ""
        });
    }, []);

    const displayName =
        user.name || user.fullName || user.username || "User";

    const initials = displayName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(word => word[0]?.toUpperCase() || "")
        .join("");

    function handleChange(e) {
        const { name, value } = e.target;
        setForm(previous => ({
            ...previous,
            [name]: value
        }));
    }

    function handleEdit() {
        setForm({
            name: user.name || user.fullName || user.username || "",
            email: user.email || ""
        });
        setMessage("");
        setEditing(true);
    }

    function handleSave(e) {
        e.preventDefault();

        const name = form.name.trim();
        const email = form.email.trim().toLowerCase();

        if (!name || !email) {
            setMessage("Please fill in all required fields.");
            return;
        }

        const users = readStorage("budgetPlannerUsers", []);

        const duplicateEmail = users.some(existingUser =>
            existingUser.email?.toLowerCase() === email &&
            existingUser.email?.toLowerCase() !== user.email?.toLowerCase()
        );

        if (duplicateEmail) {
            setMessage("This email is already registered.");
            return;
        }

        const updatedUser = {
            ...user,
            name,
            fullName: name,
            email
        };

        localStorage.setItem(
            "budgetPlannerCurrentUser",
            JSON.stringify(updatedUser)
        );

        const updatedUsers = users.map(existingUser => {
            const isSameUser = user.id
                ? existingUser.id === user.id
                : existingUser.email?.toLowerCase() === user.email?.toLowerCase();

            return isSameUser
                ? { ...existingUser, name, fullName: name, email }
                : existingUser;
        });

        localStorage.setItem(
            "budgetPlannerUsers",
            JSON.stringify(updatedUsers)
        );

        setUser(updatedUser);
        setEditing(false);
        setMessage("Profile updated successfully!");

        window.dispatchEvent(new Event("budgetProfileUpdated"));
    }

    function handleCancel() {
        setForm({
            name: user.name || user.fullName || user.username || "",
            email: user.email || ""
        });
        setEditing(false);
        setMessage("");
    }

    return (
        <div className="profile-page">
            <div className="profile-heading">
                <div>
                    <h1>My Profile</h1>
                    <p>View and manage your account information.</p>
                </div>
            </div>

            <div className="profile-container">

                <div className="profile-card">
                    <div className="profile-avatar-large">
                        {initials || "U"}
                    </div>

                    <h2>{displayName}</h2>
                    <p className="profile-email">{user.email || "No email available"}</p>

                    <span className="profile-role">
                        {(user.role || "User").toString().toUpperCase()}
                    </span>
                </div>

                <div className="profile-details-card">
                    <div className="profile-card-heading">
                        <div>
                            <h2>Personal Information</h2>
                            <p>Your account details</p>
                        </div>

                        {!editing && (
                            <button
                                className="profile-edit-button"
                                onClick={handleEdit}
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>

                    {editing ? (
                        <form onSubmit={handleSave} className="profile-form">
                            <div className="profile-field">
                                <label htmlFor="profile-name">Full Name</label>
                                <input
                                    id="profile-name"
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>

                            <div className="profile-field">
                                <label htmlFor="profile-email">Email Address</label>
                                <input
                                    id="profile-email"
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>

                            <div className="profile-form-actions">
                                <button type="submit" className="profile-save-button">
                                    Save Changes
                                </button>

                                <button
                                    type="button"
                                    className="profile-cancel-button"
                                    onClick={handleCancel}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="profile-information">
                            <div className="profile-info-item">
                                <span>Full Name</span>
                                <strong>{displayName}</strong>
                            </div>

                            <div className="profile-info-item">
                                <span>Email Address</span>
                                <strong>{user.email || "Not provided"}</strong>
                            </div>

                            <div className="profile-info-item">
                                <span>Account Type</span>
                                <strong>{user.role || "User"}</strong>
                            </div>

                            <div className="profile-info-item">
                                <span>Account Status</span>
                                <strong className="profile-active-status">
                                    Active
                                </strong>
                            </div>
                        </div>
                    )}

                    {message && (
                        <p className="profile-message">{message}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;