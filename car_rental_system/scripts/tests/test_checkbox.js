import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';

async function testAddCar() {
    try {
        // Create dummy image if not exists
        if (!fs.existsSync('dummy_car.jpg')) {
            fs.writeFileSync('dummy_car.jpg', 'fake image content');
        }

        // 1. Login as admin
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@example.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;

        // 2. Add a car with isAvailableForLease = 'on' (typical browser behavior)
        const form = new FormData();
        form.append('carName', 'Browser Test Car');
        form.append('description', 'Testing browser checkbox behavior');
        form.append('color', 'Blue');
        form.append('vehicleType', 'FWD');
        form.append('hireCost', '15000');
        form.append('isAvailableForLease', 'on');
        form.append('weeklyLeaseCost', '70000');
        form.append('image', fs.createReadStream('dummy_car.jpg'));

        const addRes = await axios.post('http://localhost:5000/api/cars', form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });

        console.log("✅ Add car response:", addRes.data);

        if (addRes.data.success && addRes.data.car.isAvailableForLease === true) {
            console.log("🚀 SUCCESS: Leasable status saved correctly with 'on' value!");
        } else {
            console.log("❌ FAILED: isAvailableForLease was:", addRes.data.car.isAvailableForLease);
        }

    } catch (error) {
        console.error("❌ ERROR:", error.response ? error.response.data : error.message);
    }
}

testAddCar();
