
const USERS_KEY = "budgetPlannerUsers";
const CURRENT_USER_KEY = "budgetPlannerCurrentUser";

// Default credentials used only when no Admin account exists
const ADMIN_EMAIL = "admin@budgetplanner.com";
const ADMIN_PASSWORD = "Admin@123";

// Get all users and create Admin only if no Admin account exists
export function getUsers() {
    let users = [];

    try {
        users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];

        if (!Array.isArray(users)) {
            users = [];
        }
    } catch {
        users = [];
    }

    const adminExists = users.some(
        user => user.role === "admin"
    );

    if (!adminExists) {
        users.push({
            name: "Admin",
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: "admin",
            isActive: true
        });

        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    return users;
}

// Register a normal User
export function registerUser(user) {
    const users = getUsers();

    const email = user.email.trim().toLowerCase();

    const existingUser = users.find(
        u => u.email?.toLowerCase() === email
    );

    if (existingUser) {
        return {
            success: false,
            message: "Email already registered!"
        };
    }

    const newUser = {
        name: user.name.trim(),
        email,
        password: user.password,
        role: "user",
        isActive: true
    };

    users.push(newUser);

    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    return {
        success: true,
        message: "Registration successful!"
    };
}

// Login User or Admin
export function loginUser(email, password) {
    const users = getUsers();

    const normalizedEmail = email.trim().toLowerCase();

    const user = users.find(
        u =>
            u.email?.toLowerCase() === normalizedEmail &&
            u.password === password
    );

    if (!user) {
        return {
            success: false,
            message: "Invalid email or password!"
        };
    }

    if (user.isActive === false) {
        return {
            success: false,
            message: "Your account has been deactivated. Contact Admin."
        };
    }

    const loggedUser = {
        name: user.name,
        email: user.email,
        role: user.role || "user",
        isActive: user.isActive !== false
    };

    localStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify(loggedUser)
    );

    return {
        success: true,
        user: loggedUser
    };
}

// Update Admin email and password
export function updateAdminCredentials({
    currentPassword,
    newEmail,
    newPassword
}) {
    const users = getUsers();
    const currentUser = getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
        return {
            success: false,
            message: "Only Admin can update these credentials."
        };
    }

    const admin = users.find(
        user =>
            user.email?.toLowerCase() === currentUser.email.toLowerCase() &&
            user.role === "admin"
    );

    if (!admin) {
        return {
            success: false,
            message: "Admin account not found."
        };
    }

    if (admin.password !== currentPassword) {
        return {
            success: false,
            message: "Current password is incorrect."
        };
    }

    const email = newEmail.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return {
            success: false,
            message: "Please enter a valid email address."
        };
    }

    const duplicateEmail = users.find(
        user =>
            user.email?.toLowerCase() === email &&
            user.email?.toLowerCase() !== admin.email.toLowerCase()
    );

    if (duplicateEmail) {
        return {
            success: false,
            message: "This email is already used by another account."
        };
    }

    if (newPassword && newPassword.length < 8) {
        return {
            success: false,
            message: "New password must contain at least 8 characters."
        };
    }

    const updatedUsers = users.map(user => {
        if (
            user.email?.toLowerCase() === admin.email.toLowerCase() &&
            user.role === "admin"
        ) {
            return {
                ...user,
                email,
                password: newPassword || user.password
            };
        }

        return user;
    });

    localStorage.setItem(
        USERS_KEY,
        JSON.stringify(updatedUsers)
    );

    const updatedAdmin = updatedUsers.find(
        user =>
            user.email.toLowerCase() === email &&
            user.role === "admin"
    );

    const loggedUser = {
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        role: "admin",
        isActive: updatedAdmin.isActive !== false
    };

    localStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify(loggedUser)
    );

    return {
        success: true,
        message: "Admin credentials updated successfully!",
        user: loggedUser
    };
}

// Get currently logged-in user
export function getCurrentUser() {
    try {
        const user = JSON.parse(
            localStorage.getItem(CURRENT_USER_KEY)
        );

        return user || null;
    } catch {
        return null;
    }
}

// Logout
export function logoutUser() {
    localStorage.removeItem(CURRENT_USER_KEY);
}