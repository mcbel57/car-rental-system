// Using global fetch

const BASE_URL = 'http://localhost:5000/api';
let adminToken, userToken;

async function test() {
    console.log('--- Starting Dashboard Verification ---');

    try {
        // 1. Login as Admin
        console.log('Testing Admin Login...');
        const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
        });
        if (!adminLogin.ok) {
            const err = await adminLogin.json();
            throw new Error(`Admin login failed: ${err.error || 'Unknown error'}`);
        }
        const adminData = await adminLogin.json();
        adminToken = adminData.token;
        console.log('✅ Admin authenticated');

        // 2. Test Admin Dashboard APIs
        console.log('Testing Admin APIs...');
        const carsRes = await fetch(`${BASE_URL}/cars`);
        const leasesRes = await fetch(`${BASE_URL}/leases/all`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
        const appsRes = await fetch(`${BASE_URL}/leases/applications`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
        const rentalsRes = await fetch(`${BASE_URL}/rentals/admin`, { headers: { 'Authorization': `Bearer ${adminToken}` } });

        console.log(`- Cars API: ${carsRes.status}`);
        console.log(`- Leases API: ${leasesRes.status}`);
        console.log(`- Applications API: ${appsRes.status}`);
        console.log(`- Rentals Admin API: ${rentalsRes.status}`);

        if (rentalsRes.status !== 200) {
            const err = await rentalsRes.json();
            console.error('❌ Rentals Admin API Error Details:', err);
        }

        if (carsRes.status !== 200 || leasesRes.status !== 200 || appsRes.status !== 200 || rentalsRes.status !== 200) {
            throw new Error('One or more Admin APIs failed');
        }

        // 3. Login as User
        console.log('Testing User Login...');
        const userLogin = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'Pakakumi57@outlook.com', password: 'user123' })
        });
        if (!userLogin.ok) {
            const err = await userLogin.json();
            throw new Error(`User login failed: ${err.error || 'Unknown error'}`);
        }
        const userData = await userLogin.json();
        userToken = userData.token;
        const userId = userData.user ? userData.user.id : null; 
        console.log(`✅ User authenticated (ID: ${userId})`);
        if (!userToken) console.error('❌ User token is missing!');

        // 4. Test User Dashboard APIs
        console.log('Testing User APIs...');
        const userBookingsRes = await fetch(`${BASE_URL}/bookings/${userId}`, { headers: { 'Authorization': `Bearer ${userToken}` } });
        console.log(`- User Bookings API: ${userBookingsRes.status}`);

        if (userBookingsRes.status !== 200) {
            const err = await userBookingsRes.json();
            console.error('❌ User API Error Details:', err);
        }
        
        const bookingData = await userBookingsRes.json();
        console.log(`- Bookings found: ${Array.isArray(bookingData) ? bookingData.length : 'Error'}`);

        if (userBookingsRes.status !== 200) {
            throw new Error('User Bookings API failed');
        }

        console.log('--- Verification Successful ---');
    } catch (error) {
        console.error('❌ Verification Failed:', error.message);
        process.exit(1);
    }
}

test();
