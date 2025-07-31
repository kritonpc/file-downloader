const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const axios = require('axios');
const { pipeline } = require('stream');
const { createWriteStream } = require('fs');

const pipelineAsync = promisify(pipeline);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);
const mkdirAsync = promisify(fs.mkdir);

/**
 * Get the directory structure recursively
 * @param {string} baseDir - The base directory to start from
 * @param {string} [currentDir=''] - The current directory relative to baseDir
 * @param {number} [depth=0] - Current recursion depth
 * @param {number} [maxDepth=5] - Maximum recursion depth
 * @returns {Promise<Object>} The directory structure
 */
async function getDirectoryStructure(baseDir, currentDir = '', depth = 0, maxDepth = 5) {
  const fullPath = path.join(baseDir, currentDir);
  const relativePath = currentDir;
  const name = path.basename(fullPath) || path.basename(baseDir);
  
  // Base case: reached max depth
  if (depth >= maxDepth) {
    return {
      id: Buffer.from(relativePath).toString('base64'),
      name,
      type: 'directory',
      path: relativePath,
      children: []
    };
  }
  
  try {
    const entries = await readdirAsync(fullPath);
    const children = [];
    
    for (const entry of entries) {
      const entryPath = path.join(fullPath, entry);
      const stat = await statAsync(entryPath);
      
      if (stat.isDirectory()) {
        const entryRelativePath = path.join(currentDir, entry);
        const childStructure = await getDirectoryStructure(
          baseDir,
          entryRelativePath,
          depth + 1,
          maxDepth
        );
        children.push(childStructure);
      }
    }
    
    return {
      id: Buffer.from(relativePath).toString('base64'),
      name,
      type: 'directory',
      path: relativePath,
      children
    };
  } catch (error) {
    console.error(`Error reading directory ${fullPath}:`, error);
    return {
      id: Buffer.from(relativePath).toString('base64'),
      name,
      type: 'directory',
      path: relativePath,
      error: 'Failed to read directory',
      children: []
    };
  }
}

/**
 * Create a directory
 * @param {string} dirPath - The directory path to create
 * @returns {Promise<void>}
 */
async function createDirectory(dirPath) {
  try {
    await mkdirAsync(dirPath, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    throw new Error(`Failed to create directory: ${error.message}`);
  }
}

/**
 * Sanitize file name to prevent directory traversal and invalid characters
 * @param {string} fileName - The file name to sanitize
 * @returns {string} Sanitized file name
 */
function sanitizeFileName(fileName) {
  // Remove path traversal characters and replace invalid characters
  return fileName
    .replace(/\.\./g, '')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .trim();
}

/**
 * Extract filename from URL
 * @param {string} url - The URL
 * @returns {string} The filename
 */
function getFilenameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    let filename = path.basename(urlObj.pathname);

    // If no filename found, use a default name with timestamp
    if (!filename || filename === "" || filename === "/") {
      filename = `download_${Date.now()}`;
    }

    return sanitizeFileName(decodeURIComponent(filename));
  } catch (error) {
    return `download_${Date.now()}`;
  }
}

/**
 * Download a file from URL to specified directory
 * @param {string} url - The URL to download from
 * @param {string} directory - The directory to save to
 * @param {string} filename - The filename to save as
 * @param {Object} options - Options including callbacks
 * @returns {Object} Download task object with cancel method
 */
function downloadFile(url, directory, filename, options = {}) {
  const { onProgress, onComplete, onError } = options;
  let isCancelled = false;
  let tempFilePath;
  let writeStream;

  const downloadTask = {
    cancel: () => {
      isCancelled = true;
      if (writeStream) {
        writeStream.close();
      }

      // Clean up temp file if it exists
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlink(tempFilePath, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      }
    },
  };

  // Ensure the directory exists
  createDirectory(directory)
    .then(() => {
      const filePath = path.join(directory, filename);
      tempFilePath = `${filePath}.download`;

      // Start the download
      return axios({
        method: "GET",
        url: url,
        responseType: "stream",
        onDownloadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            onProgress(progress);
          }
        },
      });
    })
    .then((response) => {
      // Get the total size
      const totalBytes = parseInt(response.headers["content-length"], 10) || 0;
      let downloadedBytes = 0;

      // Create write stream
      writeStream = createWriteStream(tempFilePath);

      // Track progress
      response.data.on("data", (chunk) => {
        if (isCancelled) return;

        downloadedBytes += chunk.length;
        if (onProgress && totalBytes > 0) {
          const progress = Math.min(
            Math.round((downloadedBytes / totalBytes) * 100),
            100
          );
          onProgress(progress);
        }
      });

      // Pipe to file
      return pipelineAsync(response.data, writeStream);
    })
    .then(() => {
      if (isCancelled) return;

      // Rename temp file to final filename
      const filePath = path.join(directory, filename);
      fs.rename(tempFilePath, filePath, (err) => {
        if (err) {
          console.error("Error renaming file:", err);
          if (onError) onError(err);
          return;
        }

        if (onComplete) onComplete();
      });
    })
    .catch((error) => {
      console.error("Download error:", error);
      if (onError) onError(error);

      // Clean up temp file if it exists
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlink(tempFilePath, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      }
    });

  return downloadTask;
}

module.exports = {
  getDirectoryStructure,
  createDirectory,
  sanitizeFileName,
  getFilenameFromUrl,
  downloadFile,
};