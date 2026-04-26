const express = require("express");
const router = express.Router();
const multer = require("multer");
const Pdf = require("../models/Pdf");
const isAuth = require("../middleware/auth");

const fs = require("fs");

// ensure uploads folder exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// admin check
function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.id === "admin") {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}

/* Upload PDF */
router.post(
  "/upload",
  isAuth,
  isAdmin,
  upload.single("file"),
  async (req, res) => {
    const { subjectName, subjectCode, type } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const pdf = new Pdf({
      subjectName,
      subjectCode,
      type,
      fileUrl: `/uploads/${req.file.filename}`
    });

    await pdf.save();
    res.json({ message: "Uploaded successfully" });
  }
);

/* Get PDFs (fixed safe filter) */
router.get("/", async (req, res) => {
  try {
    const { subjectName, type } = req.query;

    let filter = {};

    if (subjectName) {
      filter.subjectName = subjectName;
    }

    if (type) {
      filter.type = type;
    }

    const pdfs = await Pdf.find(filter);
    res.json(pdfs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;