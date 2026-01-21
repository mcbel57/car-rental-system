document.addEventListener("DOMContentLoaded", () => {
    const registrationForm = document.getElementById("registrationForm");

    if (registrationForm) {
        registrationForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            // Collect form data
            const userData = {
                firstName: document.getElementById("firstName").value,
                lastName: document.getElementById("lastName").value,
                email: document.getElementById("email").value,
                phoneNumber: document.getElementById("phoneNumber").value,
                idNumber: document.getElementById("idNumber").value,
                password: document.getElementById("password").value,
                confirmPassword: document.getElementById("confirmPassword").value
            };

            try {
                const response = await registerUser(userData);
                alert("✅ Registration successful! You can now log in.");
                window.location.href = "login.html";
            } catch (error) {
                alert(`❌ Error: ${error.error}`);
            }
        });
    }
});

