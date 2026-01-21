const validateUser = (req, res, next) => {
    const { firstName, lastName, email, phoneNumber, idNumber, password, confirmPassword } = req.body;

    // Check required fields
    if (!firstName || !lastName || !email || !phoneNumber || !idNumber || !password || !confirmPassword) {
        return res.status(400).json({ error: "All fields are required." });
    }

    // Validate ID Number (7-9 digits)
    if (!/^\d{7,9}$/.test(idNumber)) {
        return res.status(400).json({ error: "ID Number must be 7-9 digits." });
    }

    // Validate Password Match
    if (password !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match." });
    }

    next(); // Proceed to the next middleware
};

// ✅ Use ES6 Export
export default validateUser;
