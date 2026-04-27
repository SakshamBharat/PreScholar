const express = require("express");
const router = express.Router();
const multer = require("multer");
const Pdf = require("../models/Pdf");
const isAuth = require("../middleware/auth");
const supabase = require("../config/supabase");

// IMPORTANT: memory storage (no local disk)
const upload = multer({ storage: multer.memoryStorage() });

/* =========================
   ADMIN CHECK
========================= */
function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.id === "admin") {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}

/* =========================
   UPLOAD PDF → SUPABASE
========================= */
router.post(
  "/upload",
  isAuth,
  isAdmin,
  upload.single("file"),
  async (req, res) => {
    try {
      const { subjectName, subjectCode, type } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileName = `${Date.now()}-${req.file.originalname}`;

      // 1. Upload file to Supabase Storage
      const { error } = await supabase.storage
        .from("pdfs") // bucket name
        .upload(fileName, req.file.buffer, {
          contentType: "application/pdf",
          upsert: false
        });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      // 2. Get public URL
      const { data } = supabase.storage
        .from("pdfs")
        .getPublicUrl(fileName);

      const fileUrl = data.publicUrl;

      // 3. Save in MongoDB
      const pdf = new Pdf({
        subjectName,
        subjectCode,
        type,
        fileUrl
      });

      await pdf.save();

      res.json({
        message: "Uploaded successfully",
        fileUrl
      });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/* =========================
   GET PDFs (API + EJS)
========================= */
router.get("/", async (req, res) => {
  try {
    const { subjectName, type } = req.query;

    let filter = {};

    if (subjectName) filter.subjectName = subjectName;
    if (type) filter.type = type;

    const pdfs = await Pdf.find(filter);

    // Browser → EJS view
    if (req.headers.accept && req.headers.accept.includes("text/html")) {
      return res.render("pdf-list", { pdfs, type });
    }

    // Flutter → JSON API
    res.json(pdfs);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;