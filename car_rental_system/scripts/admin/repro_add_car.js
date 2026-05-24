import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';

async function testAddCar() {
    try {
        if (!fs.existsSync('dummy_car.jpg')) {
            fs.writeFileSync('dummy_car.jpg', 'fake image content');
        }

        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@example.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;

        const form = new FormData();
        form.append('carName', 'Bug Check Car ' + Date.now());
        form.append('description', 'Checking for recurring bugs');
        form.append('color', 'Red');
        form.append('vehicleType', 'FWD');
        form.append('hireCost', '10000');
        form.append('isAvailableForLease', 'true');
        form.append('weeklyLeaseCost', '50000');
        form.append('image', fs.createReadStream('dummy_car.jpg'));

        const addRes = await axios.post('http://localhost:5000/api/cars', form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });

        console.log("✅ Add car response:", addRes.data);

    } catch (error) {
        console.error("❌ ERROR:", error.response ? error.response.data : error.message);
    }
}

testAddCar();
