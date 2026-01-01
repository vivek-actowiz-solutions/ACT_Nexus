const multer = require("multer");
const path = require("path");
const fs = require("fs");

const BASE_DIR = path.join(__dirname, "../uploads");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir(BASE_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "others";

    if (file.fieldname === "sowDocument") folder = "sowdocument";
    if (file.fieldname === "inputDocument") folder = "inputdocument";
    if(file.fieldname === "annotationDocument") folder = "annotationDocument";

    const uploadPath = path.join(BASE_DIR, folder);
    ensureDir(uploadPath);

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const projectName = req.body.projectName || "Unknown_Project";

    const safeProject = projectName
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "");

 const fileType =
  file.fieldname === "sowDocument"
    ? "SOW"
    : file.fieldname === "inputDocument"
    ? "INPUT"
    : file.fieldname === "annotationDocument"
    ? "ANNOTATION"
    : "";

    const now = new Date();
    const timestamp = `${now.getFullYear()}_${String(
      now.getMonth() + 1
    ).padStart(2, "0")}_${String(now.getDate()).padStart(
      2,
      "0"
    )}_${String(now.getHours()).padStart(2, "0")}_${String(
      now.getMinutes()
    ).padStart(2, "0")}_${String(now.getSeconds()).padStart(2, "0")}`;

    const ext = path.extname(file.originalname).toLowerCase();

    const finalName = `${safeProject}_${fileType}_${timestamp}${ext}`;

    cb(null, finalName);
  },
});

const fileFilter = (req, file, cb) => {
  cb(null, true); // ✅ allow all file types
};

const upload = multer({
  storage,
  fileFilter,        // allows all files
  limits: {
    fileSize: 50 * 1024 * 1024 
  }
});

module.exports = upload;
