async function testInquiry() {
    const response = await fetch('http://localhost:5000/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            fullName: "Test User",
            email: "test@example.com",
            message: "Hello, this is a test inquiry."
        })
    });

    const data = await response.json();
    console.log(data);
    if (response.ok) {
        console.log("✅ Inquiry API test passed!");
    } else {
        console.error("❌ Inquiry API test failed!");
        process.exit(1);
    }
}

testInquiry();
