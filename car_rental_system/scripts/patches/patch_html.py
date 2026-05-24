import re

path = r"c:\Users\Admin\Downloads\car_rental_system (1)\car_rental_system\public\booking.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove the mpesa modal HTML
content = re.sub(r'<!-- 📲 M-Pesa Simulation Modal -->.*?</div>\s*</div>\s*</div>\s*<script>', '<script>', content, flags=re.DOTALL)

# 2. Replace the JS
new_js = """        // Submit Booking and Initiate STK Push
        document.getElementById("bookingForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const days = parseInt(document.getElementById("rentalDays").value);
            const totalCost = days * ratePerDay;
            const deposit = totalCost * 0.5;
            const mpesaNumber = document.getElementById("mpesaNumber").value;

            const payload = {
                carId,
                userId: user.id,
                carName: document.getElementById("carName").value,
                fullName: `${user.firstName} ${user.lastName}`,
                idNumber: user.idNumber,
                rentalDate: document.getElementById("rentalDate").value,
                rentalDays: days,
                cost: totalCost,
                depositPaid: deposit,
                paymentStatus: 'pending' // Initially pending until STK Push callback returns success
            };

            const btn = document.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            
            try {
                btn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> Initializing Booking...';
                btn.disabled = true;

                // 1. Create the pending Booking Record
                const response = await fetch("/api/bookings", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const res = await response.json();
                    Toast.error(res.message || "Reservation failed");
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                    return;
                }

                const resData = await response.json();
                
                // 2. Trigger Real M-Pesa STK Push
                btn.innerHTML = '<i class="fas fa-mobile-alt fa-shake mr-2"></i> Sending Prompt to Phone...';
                
                const stkResponse = await fetch("/api/payment/stkpush", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        phone: mpesaNumber,
                        amount: deposit, 
                        accountReference: `RNTL-${resData.rentalId}`,
                        transactionDesc: `Deposit for vehicle ID ${carId}`
                    }),
                });

                if (stkResponse.ok) {
                    Toast.success("M-Pesa Prompt sent! Please enter PIN on your phone.");
                    btn.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Check Your Phone';
                    setTimeout(() => window.location.href = "bookings.html", 3500);
                } else {
                    const stkError = await stkResponse.json();
                    Toast.error(stkError.message || "Failed to send M-Pesa prompt. You can pay later.");
                    console.error("STK push error", stkError);
                    setTimeout(() => window.location.href = "bookings.html", 3500);
                }

            } catch (error) {
                Toast.error("Network error while communicating with server.");
                console.error(error);
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    </script>
</body>
</html>"""

content = re.sub(r'// Submit Booking.*</html>', new_js, content, flags=re.DOTALL)

# 3. Remove the cancelPayment / toggleModal logic since we don't have the modal anymore
content = re.sub(r'const mpesaModal = document.getElementById\(\'mpesaModal\'\);.*?document.getElementById\(\'cancelPayment\'\).addEventListener\(\'click\', \(\) => toggleModal\(false\)\);', '', content, flags=re.DOTALL)

# 4. Remove pinInputs autofocus
content = re.sub(r'// PIN Input Auto-focus.*?}\);\s*}\);', '', content, flags=re.DOTALL)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied successfully.")
