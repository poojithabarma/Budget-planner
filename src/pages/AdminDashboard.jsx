import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/AdminDashboard.css";

const USERS_KEY = "budgetPlannerUsers";

function AdminDashboard() {
    const { currentUser, logout, updateAdminAccount } = useAuth();
    const navigate = useNavigate();

    const [activePage, setActivePage] = useState("Overview");
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedUser, setSelectedUser] = useState(null);

    const [credentialForm, setCredentialForm] = useState({
        currentPassword: "",
        newEmail: currentUser?.email || "",
        newPassword: "",
        confirmPassword: ""
    });

    const [credentialMessage, setCredentialMessage] = useState("");
    const [credentialError, setCredentialError] = useState(false);

    function loadUsers() {
        try {
            const savedUsers = JSON.parse(
                localStorage.getItem(USERS_KEY)
            ) || [];

            setUsers(Array.isArray(savedUsers) ? savedUsers : []);
        } catch {
            setUsers([]);
        }
    }

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        setCredentialForm(prev => ({
            ...prev,
            newEmail: currentUser?.email || ""
        }));
    }, [currentUser?.email]);

    const registeredUsers = users.filter(
        user => user.role !== "admin"
    );

    const activeUsers = registeredUsers.filter(
        user => user.isActive !== false
    );

    const inactiveUsers = registeredUsers.filter(
        user => user.isActive === false
    );

    const filteredUsers = registeredUsers.filter(user => {
        const matchesSearch =
            user.name?.toLowerCase().includes(search.toLowerCase()) ||
            user.email?.toLowerCase().includes(search.toLowerCase());

        const matchesStatus =
            statusFilter === "All" ||
            (statusFilter === "Active" && user.isActive !== false) ||
            (statusFilter === "Inactive" && user.isActive === false);

        return matchesSearch && matchesStatus;
    });

    function toggleUserStatus(email) {
        const updatedUsers = users.map(user => {
            if (user.email?.toLowerCase() === email.toLowerCase()) {
                return {
                    ...user,
                    isActive: user.isActive === false
                };
            }

            return user;
        });

        localStorage.setItem(
            USERS_KEY,
            JSON.stringify(updatedUsers)
        );

        setUsers(updatedUsers);

        if (selectedUser?.email?.toLowerCase() === email.toLowerCase()) {
            setSelectedUser(prev => ({
                ...prev,
                isActive: prev.isActive === false
            }));
        }
    }

    function deleteUser(email) {
        const confirmed = window.confirm(
            `Are you sure you want to delete the account of ${email}?`
        );

        if (!confirmed) return;

        const updatedUsers = users.filter(
            user => user.email?.toLowerCase() !== email.toLowerCase()
        );

        localStorage.setItem(
            USERS_KEY,
            JSON.stringify(updatedUsers)
        );

        setUsers(updatedUsers);
        setSelectedUser(null);
    }

    function handleLogout() {
        logout();
        navigate("/login");
    }

    function handleCredentialChange(e) {
        const { name, value } = e.target;

        setCredentialForm(prev => ({
            ...prev,
            [name]: value
        }));

        setCredentialMessage("");
    }

    function handleCredentialSubmit(e) {
        e.preventDefault();

        setCredentialMessage("");
        setCredentialError(false);

        if (
            credentialForm.newPassword &&
            credentialForm.newPassword !== credentialForm.confirmPassword
        ) {
            setCredentialError(true);
            setCredentialMessage(
                "New password and confirm password do not match."
            );
            return;
        }

        if (
            credentialForm.newPassword &&
            credentialForm.newPassword.length < 8
        ) {
            setCredentialError(true);
            setCredentialMessage(
                "New password must contain at least 8 characters."
            );
            return;
        }

        const result = updateAdminAccount({
            currentPassword: credentialForm.currentPassword,
            newEmail: credentialForm.newEmail,
            newPassword: credentialForm.newPassword
        });

        if (!result.success) {
            setCredentialError(true);
            setCredentialMessage(result.message);
            return;
        }

        setCredentialError(false);
        setCredentialMessage(result.message);

        setCredentialForm({
            currentPassword: "",
            newEmail: result.user.email,
            newPassword: "",
            confirmPassword: ""
        });

        loadUsers();
    }

    const inputStyle = {
        width: "100%",
        padding: "13px 15px",
        marginTop: "8px",
        marginBottom: "18px",
        border: "1px solid #31515A",
        borderRadius: "9px",
        background: "#071821",
        color: "#FFFFFF",
        fontSize: "14px",
        outline: "none",
        boxSizing: "border-box"
    };

    const labelStyle = {
        color: "#A9C1C0",
        fontSize: "14px",
        fontWeight: "600"
    };

    const submitStyle = {
        padding: "13px 22px",
        background: "#1E9B83",
        color: "#FFFFFF",
        border: "none",
        borderRadius: "9px",
        fontWeight: "600",
        fontSize: "14px",
        cursor: "pointer"
    };

    function renderOverview() {
        return (
            <>
                <div className="admin-welcome">
                    <div>
                        <h2>Welcome, {currentUser?.name || "Admin"}!</h2>
                        <p>Here's what's happening with your platform.</p>
                    </div>
                </div>

                <div className="admin-stats-grid">
                    <div className="admin-stat-card">
                        <span>Total Users</span>
                        <h2>{registeredUsers.length}</h2>
                        <p>Registered accounts</p>
                    </div>

                    <div className="admin-stat-card">
                        <span>Active Users</span>
                        <h2>{activeUsers.length}</h2>
                        <p>Currently active accounts</p>
                    </div>

                    <div className="admin-stat-card">
                        <span>Inactive Users</span>
                        <h2>{inactiveUsers.length}</h2>
                        <p>Deactivated accounts</p>
                    </div>

                    <div className="admin-stat-card">
                        <span>Admin Accounts</span>
                        <h2>
                            {users.filter(user => user.role === "admin").length}
                        </h2>
                        <p>Platform administrators</p>
                    </div>
                </div>

                <div className="admin-content-card">
                    <h3>Recent Registered Users</h3>

                    {registeredUsers.length === 0 ? (
                        <p className="admin-empty">
                            No users registered yet.
                        </p>
                    ) : (
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {registeredUsers.slice(-5).reverse().map((user, index) => (
                                        <tr key={user.email || index}>
                                            <td>{user.name}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className={`admin-status ${user.isActive === false ? "inactive" : "active"}`}>
                                                    {user.isActive === false ? "Inactive" : "Active"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </>
        );
    }

    function renderUserManagement() {
        return (
            <>
                <div className="admin-content-card">
                    <div className="admin-section-heading">
                        <div>
                            <h2>User Management</h2>
                            <p>View, search and manage registered accounts.</p>
                        </div>

                        <span className="admin-user-count">
                            {registeredUsers.length} Users
                        </span>
                    </div>

                    <div className="admin-user-controls">
                        <input
                            type="text"
                            className="admin-search"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />

                        <div className="admin-filter-buttons">
                            {["All", "Active", "Inactive"].map(filter => (
                                <button
                                    key={filter}
                                    className={`admin-filter-btn ${statusFilter === filter ? "selected" : ""}`}
                                    onClick={() => setStatusFilter(filter)}
                                >
                                    {filter}
                                    {filter === "All" && ` (${registeredUsers.length})`}
                                    {filter === "Active" && ` (${activeUsers.length})`}
                                    {filter === "Inactive" && ` (${inactiveUsers.length})`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredUsers.length === 0 ? (
                        <p className="admin-empty">
                            No users found. Try changing your search or filter.
                        </p>
                    ) : (
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredUsers.map((user, index) => (
                                        <tr key={user.email || index}>
                                            <td>{user.name}</td>
                                            <td>{user.email}</td>
                                            <td>User</td>
                                            <td>
                                                <span className={`admin-status ${user.isActive === false ? "inactive" : "active"}`}>
                                                    {user.isActive === false ? "Inactive" : "Active"}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="admin-user-actions">
                                                    <button
                                                        className="admin-action-btn view"
                                                        onClick={() => setSelectedUser(user)}
                                                    >
                                                        View
                                                    </button>

                                                    <button
                                                        className={`admin-action-btn ${user.isActive === false ? "activate" : "deactivate"}`}
                                                        onClick={() => toggleUserStatus(user.email)}
                                                    >
                                                        {user.isActive === false ? "Activate" : "Deactivate"}
                                                    </button>

                                                    <button
                                                        className="admin-action-btn delete"
                                                        onClick={() => deleteUser(user.email)}
                                                    >
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

                {selectedUser && (
                    <div
                        className="admin-modal-overlay"
                        onClick={() => setSelectedUser(null)}
                    >
                        <div
                            className="admin-user-modal"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                className="admin-modal-close"
                                onClick={() => setSelectedUser(null)}
                            >
                                ×
                            </button>

                            <div className="admin-profile-avatar">
                                {(selectedUser.name || "U").charAt(0).toUpperCase()}
                            </div>

                            <h2>{selectedUser.name}</h2>
                            <span className="admin-role-badge">Registered User</span>

                            <div className="admin-profile-details">
                                <div>
                                    <span>Full Name</span>
                                    <strong>{selectedUser.name}</strong>
                                </div>

                                <div>
                                    <span>Email Address</span>
                                    <strong>{selectedUser.email}</strong>
                                </div>

                                <div>
                                    <span>Account Role</span>
                                    <strong>User</strong>
                                </div>

                                <div>
                                    <span>Account Status</span>
                                    <strong className={selectedUser.isActive === false ? "admin-inactive-text" : "admin-profile-active"}>
                                        {selectedUser.isActive === false ? "Inactive" : "Active"}
                                    </strong>
                                </div>
                            </div>

                            <button
                                className={`admin-action-btn modal-status-btn ${selectedUser.isActive === false ? "activate" : "deactivate"}`}
                                onClick={() => toggleUserStatus(selectedUser.email)}
                            >
                                {selectedUser.isActive === false ? "Activate Account" : "Deactivate Account"}
                            </button>

                            <button
                                className="admin-action-btn delete modal-delete-btn"
                                onClick={() => deleteUser(selectedUser.email)}
                            >
                                Delete User
                            </button>
                        </div>
                    </div>
                )}
            </>
        );
    }

    function renderReports() {
        const activePercentage = registeredUsers.length
            ? Math.round((activeUsers.length / registeredUsers.length) * 100)
            : 0;

        const inactivePercentage = registeredUsers.length
            ? Math.round((inactiveUsers.length / registeredUsers.length) * 100)
            : 0;

        return (
            <>
                <div className="admin-section-heading">
                    <div>
                        <h2>Reports & Analytics</h2>
                        <p>Overview of Budget Planner platform activity.</p>
                    </div>
                </div>

                <div className="admin-stats-grid">
                    <div className="admin-stat-card">
                        <span>Total Registrations</span>
                        <h2>{registeredUsers.length}</h2>
                        <p>All registered users</p>
                    </div>

                    <div className="admin-stat-card">
                        <span>Active Accounts</span>
                        <h2>{activePercentage}%</h2>
                        <p>Active user percentage</p>
                    </div>
                </div>

                <div className="admin-content-card">
                    <h3>User Account Statistics</h3>

                    <div className="admin-report-row">
                        <span>Active Users</span>
                        <strong>{activeUsers.length}</strong>
                    </div>

                    <div className="admin-report-track">
                        <div
                            className="admin-report-fill"
                            style={{ width: `${activePercentage}%` }}
                        />
                    </div>

                    <div className="admin-report-row">
                        <span>Inactive Users</span>
                        <strong>{inactiveUsers.length}</strong>
                    </div>

                    <div className="admin-report-track">
                        <div
                            className="admin-report-fill inactive-fill"
                            style={{ width: `${inactivePercentage}%` }}
                        />
                    </div>
                </div>
            </>
        );
    }

    function renderProfile() {
        return (
            <>
                <div className="admin-content-card admin-profile-card">
                    <div className="admin-profile-avatar">
                        {(currentUser?.name || "A").charAt(0).toUpperCase()}
                    </div>

                    <h2>{currentUser?.name || "Admin"}</h2>
                    <span className="admin-role-badge">Administrator</span>

                    <div className="admin-profile-details">
                        <div>
                            <span>Full Name</span>
                            <strong>{currentUser?.name || "Admin"}</strong>
                        </div>

                        <div>
                            <span>Email Address</span>
                            <strong>{currentUser?.email}</strong>
                        </div>

                        <div>
                            <span>Account Role</span>
                            <strong>Admin</strong>
                        </div>

                        <div>
                            <span>Account Status</span>
                            <strong className="admin-profile-active">Active</strong>
                        </div>
                    </div>
                </div>

                <div className="admin-content-card admin-credentials-card">
                    <h2>Change Login Credentials</h2>

                    <p>
                        Update your Admin email address or password.
                    </p>

                    <form onSubmit={handleCredentialSubmit}>
                        <label style={labelStyle}>
                            Current Password
                        </label>

                        <input
                            type="password"
                            name="currentPassword"
                            value={credentialForm.currentPassword}
                            onChange={handleCredentialChange}
                            placeholder="Enter current password"
                            style={inputStyle}
                            required
                        />

                        <label style={labelStyle}>
                            New Email Address
                        </label>

                        <input
                            type="email"
                            name="newEmail"
                            value={credentialForm.newEmail}
                            onChange={handleCredentialChange}
                            placeholder="Enter new email address"
                            style={inputStyle}
                            required
                        />

                        <label style={labelStyle}>
                            New Password
                        </label>

                        <input
                            type="password"
                            name="newPassword"
                            value={credentialForm.newPassword}
                            onChange={handleCredentialChange}
                            placeholder="Leave blank if you don't want to change password"
                            style={inputStyle}
                        />

                        <label style={labelStyle}>
                            Confirm New Password
                        </label>

                        <input
                            type="password"
                            name="confirmPassword"
                            value={credentialForm.confirmPassword}
                            onChange={handleCredentialChange}
                            placeholder="Confirm your new password"
                            style={inputStyle}
                        />

                        {credentialMessage && (
                            <p className={credentialError ? "admin-credential-error" : "admin-credential-success"}>
                                {credentialMessage}
                            </p>
                        )}

                        <button type="submit" style={submitStyle}>
                            Save Changes
                        </button>
                    </form>
                </div>
            </>
        );
    }

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-brand">
                    <h2>Budget Planner</h2>
                    <p>Admin Panel</p>
                </div>

                <div className="admin-menu">
                    <p className="admin-menu-label">MAIN MENU</p>

                    {["Overview", "User Management", "Reports & Analytics", "Admin Profile"].map(page => (
                        <button
                            key={page}
                            className={`admin-menu-item ${activePage === page ? "selected" : ""}`}
                            onClick={() => {
                                setActivePage(page);
                                setSelectedUser(null);
                            }}
                        >
                            {page}
                        </button>
                    ))}
                </div>

                <div className="admin-sidebar-bottom">
                    <div className="admin-sidebar-user">
                        <strong>{currentUser?.name || "Admin"}</strong>
                        <span>Administrator</span>
                    </div>

                    <button className="admin-logout" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-topbar">
                    <div>
                        <span>ADMIN PANEL</span>
                        <h1>{activePage}</h1>
                    </div>

                    <div className="admin-topbar-profile">
                        <div className="admin-small-avatar">
                            {(currentUser?.name || "A").charAt(0).toUpperCase()}
                        </div>
                        <span>{currentUser?.name || "Admin"}</span>
                    </div>
                </header>

                <section className="admin-page-content">
                    {activePage === "Overview" && renderOverview()}
                    {activePage === "User Management" && renderUserManagement()}
                    {activePage === "Reports & Analytics" && renderReports()}
                    {activePage === "Admin Profile" && renderProfile()}
                </section>
            </main>
        </div>
    );
}

export default AdminDashboard;