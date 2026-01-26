document.addEventListener("DOMContentLoaded", () => {
    const carForm = document.getElementById("carForm");
    const carList = document.getElementById("carList");

    async function fetchCars() {
        const response = await fetch("/api/cars");
        const data = await response.json();
        const cars = data.cars || [];

        carList.innerHTML = cars.map(car => `
            <div class="bg-white p-4 shadow-md rounded-md mb-2">
                <h2 class="text-lg font-bold">${car.carName}</h2>
                <p>${car.description}</p>
                <p><strong>Color:</strong> ${car.color}</p>
                <p><strong>Vehicle Type:</strong> ${car.vehicleType}</p>
                <p><strong>Cost per Day:</strong> Ksh ${car.costPerDay}</p>
                <img src="${car.image || 'https://via.placeholder.com/150'}" class="w-32 h-24 object-cover mt-2 rounded">
                <button onclick="deleteCar(${car.id})" class="bg-red-600 text-white px-2 py-1 mt-2 rounded hover:bg-red-700">Delete</button>
            </div>
        `).join("");
    }

    carForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(carForm);
        await fetch("/api/cars", {
            method: "POST",
            body: formData
        });

        carForm.reset();
        fetchCars();
    });

    window.deleteCar = async (id) => {
        await fetch(`/api/cars/${id}`, { method: "DELETE" });
        fetchCars();
    };

    fetchCars();
});
