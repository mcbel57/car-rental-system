document.addEventListener("DOMContentLoaded", () => {
    const carForm = document.getElementById("carForm");
    const carList = document.getElementById("carList");

    async function fetchCars() {
        const response = await fetch("http://localhost:5000/api/cars");
        const cars = await response.json();

        carList.innerHTML = cars.map(car => `
            <div class="bg-white p-4 shadow-md rounded-md mb-2">
                <h2 class="text-lg font-bold">${car.name}</h2>
                <p>${car.description}</p>
                <p><strong>Color:</strong> ${car.color}</p>
                <p><strong>Vehicle Type:</strong> ${car.vehicleType}</p>
                <p><strong>Cost per Day:</strong> $${car.hireCostPerDay}</p>
                <img src="${car.imageUrl}" class="w-32 mt-2">
                <button onclick="deleteCar(${car.id})" class="bg-red-600 text-white px-2 py-1 mt-2">Delete</button>
            </div>
        `).join("");
    }

    carForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const formData = new FormData(carForm);
        await fetch("http://localhost:5000/api/cars", {
            method: "POST",
            body: formData
        });

        carForm.reset();
        fetchCars();
    });

    window.deleteCar = async (id) => {
        await fetch(`http://localhost:5000/api/cars/${id}`, { method: "DELETE" });
        fetchCars();
    };

    fetchCars();
});

