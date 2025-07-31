const express = require("express");
const router = express.Router();
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const fileManager = require("../utils/file-manager");

// Store active downloads in memory
// In a production environment, you might want to use Redis or another storage solution
const activeDownloads = new Map();

// Start a new download
router.post("/", async (req, res, next) => {
  try {
    const { url, directory } = req.body;

    if (!url || url.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: "Invalid URL format",
      });
    }

    const baseDir = req.app.locals.BASE_DOWNLOAD_DIR;

    // Ensure directory is within the allowed download directory
    const targetDir = path.join(baseDir, directory || "");
    if (!targetDir.startsWith(baseDir)) {
      return res.status(403).json({
        success: false,
        message: "Invalid target directory",
      });
    }

    // Generate download ID and setup tracking
    const downloadId = uuidv4();
    const filename = fileManager.getFilenameFromUrl(url);

    // Start download in background
    const downloadTask = fileManager.downloadFile(url, targetDir, filename, {
      onProgress: (progress) => {
        if (activeDownloads.has(downloadId)) {
          const download = activeDownloads.get(downloadId);
          activeDownloads.set(downloadId, {
            ...download,
            progress,
            updatedAt: new Date(),
          });
        }
      },
      onComplete: () => {
        if (activeDownloads.has(downloadId)) {
          const download = activeDownloads.get(downloadId);
          activeDownloads.set(downloadId, {
            ...download,
            status: "completed",
            progress: 100,
            completedAt: new Date(),
          });
        }
      },
      onError: (error) => {
        if (activeDownloads.has(downloadId)) {
          const download = activeDownloads.get(downloadId);
          activeDownloads.set(downloadId, {
            ...download,
            status: "error",
            error: error.message,
            updatedAt: new Date(),
          });
        }
      },
    });

    // Track the download
    activeDownloads.set(downloadId, {
      id: downloadId,
      url,
      filename,
      directory: path.relative(baseDir, targetDir),
      status: "downloading",
      progress: 0,
      task: downloadTask,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Download started",
      data: {
        id: downloadId,
        url,
        filename,
        directory: path.relative(baseDir, targetDir),
        status: "downloading",
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get all downloads
router.get("/", (req, res) => {
  const downloads = Array.from(activeDownloads.values()).map((download) => {
    // Don't expose the task object to the client
    const { task, ...downloadInfo } = download;
    return downloadInfo;
  });

  res.json({
    success: true,
    data: downloads,
  });
});

// Get a specific download
router.get("/:id", (req, res) => {
  const { id } = req.params;

  if (!activeDownloads.has(id)) {
    return res.status(404).json({
      success: false,
      message: "Download not found",
    });
  }

  const download = activeDownloads.get(id);
  const { task, ...downloadInfo } = download;

  res.json({
    success: true,
    data: downloadInfo,
  });
});

// Cancel a download
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  if (!activeDownloads.has(id)) {
    return res.status(404).json({
      success: false,
      message: "Download not found",
    });
  }

  const download = activeDownloads.get(id);

  if (download.status === "downloading" && download.task) {
    download.task.cancel();
    activeDownloads.set(id, {
      ...download,
      status: "cancelled",
      updatedAt: new Date(),
    });
  }

  res.json({
    success: true,
    message: "Download cancelled",
    data: {
      id,
      status: "cancelled",
    },
  });
});

// Remove a download from the list
router.delete("/:id/remove", (req, res) => {
  const { id } = req.params;

  if (!activeDownloads.has(id)) {
    return res.status(404).json({
      success: false,
      message: "Download not found",
    });
  }

  const download = activeDownloads.get(id);

  // If download is in progress, cancel it first
  if (download.status === "downloading" && download.task) {
    download.task.cancel();
  }

  // Remove from tracking
  activeDownloads.delete(id);

  res.json({
    success: true,
    message: "Download removed",
    data: { id },
  });
});

module.exports = router;
