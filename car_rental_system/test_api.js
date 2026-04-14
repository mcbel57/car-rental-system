import fetch from 'node-fetch';

async function testApi() {
    try {
        console.log("🚀 Testing Local API /api/auth/login...");
        const response = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "admin@example.com", password: "any" })
        });

        const data = await response.json();
        console.log("📡 API Response Code:", response.status);
        console.log("📦 API Response Body:", JSON.stringify(data, null, 2));

        if (response.status === 500) {
            console.error("❌ Confirmed: Server is returning 500.");
        } else {
            console.log("✅ Server seems to be responding correctly to login requests.");
        }
        process.exit(0);
    } catch (error) {
        console.error("❌ FAILED TO CONNECT TO API:", error.message);
        process.exit(1);
    }
}

testApi();
