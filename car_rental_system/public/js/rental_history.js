document.addEventListener("DOMContentLoaded", async () => {
    const rentalList = document.getElementById("rentalList");

    async function fetchRentals() {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/api/rentals/user", {
            headers: { Authorization: `Bearer ${token}` }
        });

        const rentals = await response.json();

        rentalList.innerHTML = rentals.map(rental => `
            <div class="bg-white p-4 shadow-md rounded-md mb-2">
                <h2 class="text-lg font-bold">${rental.Car.name}</h2>
                <img src="${rental.Car.imageUrl}" class="w-32 mt-2">
                <p><strong>Start Date:</strong> ${new Date(rental.startDate).toDateString()}</p>
                <p><strong>End Date:</strong> ${new Date(rental.endDate).toDateString()}</p>
                <p><strong>Status:</strong> ${rental.status}</p>
                ${rental.status === "Pending" ? `<button onclick="cancelRental(${rental.id})" class="bg-red-600 text-white px-2 py-1 mt-2">Cancel</button>` : ""}
            </div>
        `).join("");
    }

    window.cancelRental = async (id) => {
        const token = localStorage.getItem("token");
        await fetch(`http://localhost:5000/api/rentals/${id}/cancel`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` }
        });

        fetchRentals();
    };

    fetchRentals();
});
