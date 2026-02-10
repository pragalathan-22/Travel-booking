const path = require("path");
const multer = require("multer");

// Store uploads in backend/uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = (file.originalname && path.extname(file.originalname)) || ".jpg";
    cb(null, file.fieldname + "-" + unique + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /image|pdf|jpeg|jpg|png|gif/;
  const mimetype = allowed.test(file.mimetype);
  if (mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only images and PDF allowed"), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});

// Single file for licence
exports.uploadLicence = upload.single("licence");
// Single file for vehicle image
exports.uploadVehicleImage = upload.single("image");
// Both licence and image (e.g. when adding vehicle)
exports.uploadVehicleFiles = upload.fields([
  { name: "licence", maxCount: 1 },
  { name: "image", maxCount: 1 }
]);
