const API_BASE_URL = "http://localhost:5000/api";

// Function to send registration data to backend
async function registerUser(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        return response.ok ? data : Promise.reject(data);
    } catch (error) {
        console.error("Error registering user:", error);
    }
}
