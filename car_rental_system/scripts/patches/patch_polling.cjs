const fs = require('fs');

const path = "c:\\\\Users\\\\Admin\\\\Downloads\\\\car_rental_system (1)\\\\car_rental_system\\\\public\\\\booking.html";
let content = fs.readFileSync(path, "utf-8");

const oldCodeBlock = `                if (stkResponse.ok) {
                    Toast.success("M-Pesa Prompt sent! Please enter PIN on your phone.");
                    btn.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Check Your Phone';
                    setTimeout(() => window.location.href = "bookings.html", 3500);
                } else {
                    const stkError = await stkResponse.json();
                    Toast.error(stkError.message || "Failed to send M-Pesa prompt. You can pay later.");
                    console.error("STK push error", stkError);
                    setTimeout(() => window.location.href = "bookings.html", 3500);
                }`;

const newCodeBlock = `                if (stkResponse.ok) {
                    const stkData = await stkResponse.json();
                    const checkoutReqId = stkData.checkoutRequestId;

                    Toast.success("Prompt sent! Provide PIN on your phone.");
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Awaiting Approval...';

                    let pollAttempts = 0;
                    const pollInterval = setInterval(async () => {
                        pollAttempts++;
                        if (pollAttempts > 25) { // Timeout after 75s
                            clearInterval(pollInterval);
                            Toast.error("Request timed out or ignored. Pay later.");
                            window.location.href = "bookings.html";
                            return;
                        }

                        try {
                            const statusRes = await fetch(\`/api/payment/status/\${checkoutReqId}\`, {
                                headers: { "Authorization": \`Bearer \${token}\` }
                            });
                            
                            if (statusRes.ok) {
                                const statusData = await statusRes.json();
                                if (statusData.status === 'paid') {
                                    clearInterval(pollInterval);
                                    Toast.success("Payment Received & Confirmed!");
                                    btn.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Verified';
                                    btn.classList.add('bg-emerald-500', 'text-white'); // Optional visual cue
                                    setTimeout(() => window.location.href = "bookings.html", 3000);
                                } else if (statusData.status === 'failed') {
                                    clearInterval(pollInterval);
                                    Toast.error("Payment Failed or Canceled.");
                                    btn.innerHTML = 'Complete Transaction';
                                    btn.disabled = false;
                                }
                            }
                        } catch(e) { console.error("Poll err:", e); }
                    }, 3000);

                } else {
                    const stkError = await stkResponse.json();
                    Toast.error(stkError.message || "Failed to send M-Pesa prompt.");
                    console.error("STK push error", stkError);
                    btn.innerHTML = 'Complete Transaction';
                    btn.disabled = false;
                }`;

content = content.replace(oldCodeBlock, newCodeBlock);

fs.writeFileSync(path, content, "utf-8");
console.log("Polling logic patched successfully.");
