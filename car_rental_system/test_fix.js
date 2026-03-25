const testFix = async () => {
    const baseUrl = "http://localhost:5000/api/auth/register";

    // Test data - using an ID that already exists (from check_users.js output)
    const duplicateIdData = {
        firstName: "Test",
        lastName: "Fix",
        email: "unique_email_123@example.com",
        phoneNumber: "0712345678",
        idNumber: "ADMIN001", // This is User ID 1's ID number
        password: "password123",
        confirmPassword: "password123"
    };

    const duplicateEmailData = {
        firstName: "Test",
        lastName: "Fix",
        email: "admin@example.com", // This exists
        phoneNumber: "0712345678",
        idNumber: "UNIQUE123",
        password: "password123",
        confirmPassword: "password123"
    };

    try {
        console.log("--- Testing Duplicate ID Number via API ---");
        const resId = await fetch(baseUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(duplicateIdData)
        });
        const dataId = await resId.json();
        console.log("Status:", resId.status);
        console.log("Response:", dataId);

        console.log("\n--- Testing Duplicate Email via API ---");
        const resEmail = await fetch(baseUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(duplicateEmailData)
        });
        const dataEmail = await resEmail.json();
        console.log("Status:", resEmail.status);
        console.log("Response:", dataEmail);

    } catch (error) {
        console.error("Test failed:", error.message);
    }
};

testFix();
