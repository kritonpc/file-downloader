const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const directoriesRouter = require("./routes/directories");
const downloadsRouter = require("./routes/downloads");

// Configuration
const app = express();
const PORT = process.env.PORT || 5000;
const BASE_DOWNLOAD_DIR =
  process.env.DOWNLOAD_DIR || path.join(__dirname, "downloads");

// Ensure base download directory exists
if (!fs.existsSync(BASE_DOWNLOAD_DIR)) {
  fs.mkdirSync(BASE_DOWNLOAD_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());

// Set download directory in app locals for routes to access
app.locals.BASE_DOWNLOAD_DIR = BASE_DOWNLOAD_DIR;

// Routes
app.use("/api/directories", directoriesRouter);
app.use("/api/downloads", downloadsRouter);

// Health check endpoint for TrueNAS
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "An internal server error occurred",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Download directory: ${BASE_DOWNLOAD_DIR}`);
});

module.exports = app;
