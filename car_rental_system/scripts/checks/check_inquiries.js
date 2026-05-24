import db from "./config/db.js";
try {
    const inquiries = await db.Inquiry.findAll();
    console.log("Inquiries count:", inquiries.length);
    console.log("Inquiries:", inquiries.map(i => i.toJSON()));
    process.exit(0);
} catch (e) {
    console.error(e);
    process.exit(1);
}
