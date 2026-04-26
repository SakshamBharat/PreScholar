const mongoose = require("mongoose");

const pdfSchema = new mongoose.Schema({
  subjectName: String,
  subjectCode: String,
  type: { type: String, enum: ["pyq", "important"] },
  fileUrl: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Pdf", pdfSchema);