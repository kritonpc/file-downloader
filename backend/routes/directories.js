const express = require("express");
const router = express.Router();
const path = require("path");
const fileManager = require("../utils/file-manager");

// Get directory structure
router.get("/", async (req, res, next) => {
  try {
    const baseDir = req.app.locals.BASE_DOWNLOAD_DIR;
    const directoryStructure = await fileManager.getDirectoryStructure(baseDir);
    res.json({
      success: true,
      data: directoryStructure,
    });
  } catch (error) {
    next(error);
  }
});

// Create a new directory
router.post("/", async (req, res, next) => {
  try {
    const { parentPath, folderName } = req.body;

    if (!folderName || folderName.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Folder name is required",
      });
    }

    // Sanitize folder name to prevent directory traversal
    const sanitizedFolderName = fileManager.sanitizeFileName(folderName);
    const baseDir = req.app.locals.BASE_DOWNLOAD_DIR;

    // Ensure parentPath is within the allowed download directory
    const fullParentPath = path.join(baseDir, parentPath || "");
    if (!fullParentPath.startsWith(baseDir)) {
      return res.status(403).json({
        success: false,
        message: "Invalid parent directory path",
      });
    }

    const newDirPath = path.join(fullParentPath, sanitizedFolderName);
    await fileManager.createDirectory(newDirPath);

    res.status(201).json({
      success: true,
      message: "Directory created successfully",
      data: {
        path: path.relative(baseDir, newDirPath),
        name: sanitizedFolderName,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
