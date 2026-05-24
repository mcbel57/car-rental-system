import multer from "multer";
import path from "path";

// ✅ Set Storage Engine
const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    }
});

// ✅ File Type Validation
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only .jpeg, .png, .jpg, .webp formats allowed!"), false);
    }
};

// ✅ Initialize Upload
const upload = multer({ storage, fileFilter });

// ✅ Use ES6 Export
export default upload;
