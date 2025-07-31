import { useState, useEffect } from "react";
import {
  Folder,
  File,
  Plus,
  X,
  Download,
  FolderPlus,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

function FileDownloader() {
  // State for URL input
  const [url, setUrl] = useState("");

  // State for directory structure
  const [directories, setDirectories] = useState([
    {
      id: "root",
      name: "Downloads",
      isExpanded: true,
      parentId: null,
      children: [
        {
          id: "dir1",
          name: "Documents",
          isExpanded: false,
          parentId: "root",
          children: [],
        },
        {
          id: "dir2",
          name: "Images",
          isExpanded: false,
          parentId: "root",
          children: [],
        },
        {
          id: "dir3",
          name: "Music",
          isExpanded: false,
          parentId: "root",
          children: [],
        },
      ],
    },
  ]);

  // State for selected directory
  const [selectedDirectory, setSelectedDirectory] = useState("root");

  // State for downloads
  const [downloads, setDownloads] = useState([]);

  // State for new folder dialog
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderParent, setNewFolderParent] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");

  // Function to find directory by id
  const findDirectory = (id, dirs = directories) => {
    for (const dir of dirs) {
      if (dir.id === id) return dir;
      if (dir.children && dir.children.length > 0) {
        const found = findDirectory(id, dir.children);
        if (found) return found;
      }
    }
    return null;
  };

  // Function to get directory path
  const getDirectoryPath = (id) => {
    const paths = [];
    let currentId = id;

    while (currentId) {
      const dir = findDirectory(currentId);
      if (dir) {
        paths.unshift(dir.name);
        currentId = dir.parentId;
      } else {
        break;
      }
    }

    return paths.join("/");
  };

  // Function to toggle directory expansion
  const toggleDirectory = (id) => {
    const updateDirs = (dirs) => {
      return dirs.map((dir) => {
        if (dir.id === id) {
          return { ...dir, isExpanded: !dir.isExpanded };
        }
        if (dir.children && dir.children.length > 0) {
          return { ...dir, children: updateDirs(dir.children) };
        }
        return dir;
      });
    };

    setDirectories(updateDirs(directories));
  };

  // Function to select a directory
  const selectDirectory = (id) => {
    setSelectedDirectory(id);
  };

  // Function to open new folder dialog
  const openNewFolderDialog = (parentId) => {
    setNewFolderParent(parentId);
    setNewFolderName("");
    setNewFolderDialogOpen(true);
  };

  // Function to create a new folder
  const createNewFolder = () => {
    if (!newFolderName.trim()) return;

    const newFolderId = `dir${Date.now()}`;

    const updateDirs = (dirs) => {
      return dirs.map((dir) => {
        if (dir.id === newFolderParent) {
          return {
            ...dir,
            isExpanded: true,
            children: [
              ...dir.children,
              {
                id: newFolderId,
                name: newFolderName,
                isExpanded: false,
                parentId: dir.id,
                children: [],
              },
            ],
          };
        }
        if (dir.children && dir.children.length > 0) {
          return { ...dir, children: updateDirs(dir.children) };
        }
        return dir;
      });
    };

    setDirectories(updateDirs(directories));
    setNewFolderDialogOpen(false);
  };

  // Function to initiate download
  const initiateDownload = () => {
    if (!url.trim()) return;

    // Extract filename from URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.substring(pathname.lastIndexOf("/") + 1);

    // Create new download
    const newDownload = {
      id: `dl${Date.now()}`,
      url,
      filename,
      directory: selectedDirectory,
      directoryPath: getDirectoryPath(selectedDirectory),
      progress: 0,
      status: "downloading",
      startTime: new Date(),
    };

    setDownloads([newDownload, ...downloads]);
    setUrl("");

    // Simulate download progress
    simulateDownloadProgress(newDownload.id);
  };

  // Function to simulate download progress
  const simulateDownloadProgress = (downloadId) => {
    const interval = setInterval(() => {
      setDownloads((prevDownloads) => {
        const updatedDownloads = prevDownloads.map((dl) => {
          if (dl.id === downloadId) {
            const newProgress = dl.progress + Math.random() * 10;

            if (newProgress >= 100) {
              clearInterval(interval);
              return { ...dl, progress: 100, status: "completed" };
            }

            return { ...dl, progress: newProgress };
          }
          return dl;
        });

        return updatedDownloads;
      });
    }, 500);

    // Store interval ID to clear it if download is cancelled
    window.intervals = window.intervals || {};
    window.intervals[downloadId] = interval;
  };

  // Function to cancel download
  const cancelDownload = (downloadId) => {
    // Clear the interval
    if (window.intervals && window.intervals[downloadId]) {
      clearInterval(window.intervals[downloadId]);
      delete window.intervals[downloadId];
    }

    // Update download status
    setDownloads((prevDownloads) => {
      return prevDownloads.map((dl) => {
        if (dl.id === downloadId) {
          return { ...dl, status: "cancelled" };
        }
        return dl;
      });
    });
  };

  // Function to remove download from list
  const removeDownload = (downloadId) => {
    setDownloads((prevDownloads) =>
      prevDownloads.filter((dl) => dl.id !== downloadId)
    );
  };

  // Function to render directory tree
  const renderDirectoryTree = (directory, level = 0) => {
    return (
      <div key={directory.id} className="mt-1">
        <div
          className={`flex items-center py-1 px-2 rounded hover:bg-gray-100 cursor-pointer ${
            selectedDirectory === directory.id
              ? "bg-blue-100 text-blue-600 font-medium"
              : ""
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          <button
            className="mr-1 h-5 w-5 flex items-center justify-center"
            onClick={() => toggleDirectory(directory.id)}
          >
            {directory.children && directory.children.length > 0 ? (
              directory.isExpanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )
            ) : (
              <span className="w-4"></span>
            )}
          </button>

          <Folder size={16} className="mr-2 flex-shrink-0" />

          <span
            className="flex-grow truncate"
            onClick={() => selectDirectory(directory.id)}
          >
            {directory.name}
          </span>

          <button
            className="h-6 w-6 opacity-0 hover:opacity-100 text-gray-500 hover:text-gray-700"
            onClick={() => openNewFolderDialog(directory.id)}
          >
            <FolderPlus size={14} />
          </button>
        </div>

        {directory.isExpanded &&
          directory.children &&
          directory.children.length > 0 && (
            <div>
              {directory.children.map((child) =>
                renderDirectoryTree(child, level + 1)
              )}
            </div>
          )}
      </div>
    );
  };

  // Function to handle URL input
  const handleUrlChange = (e) => {
    setUrl(e.target.value);
  };

  // Function to handle URL form submission
  const handleUrlSubmit = (e) => {
    e.preventDefault();
    initiateDownload();
  };

  // Function to format time elapsed
  const formatTimeElapsed = (startTime) => {
    const elapsed = Math.floor((new Date() - new Date(startTime)) / 1000);
    if (elapsed < 60) return `${elapsed}s`;
    if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;
    return `${Math.floor(elapsed / 3600)}h ${Math.floor(
      (elapsed % 3600) / 60
    )}m`;
  };

  // Update download progress times
  useEffect(() => {
    const timer = setInterval(() => {
      setDownloads((prevDownloads) => {
        if (prevDownloads.some((dl) => dl.status === "downloading")) {
          return [...prevDownloads]; // Force re-render to update elapsed time
        }
        return prevDownloads;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">File Downloader</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left panel: Directory browser */}
          <div className="p-4 bg-white rounded-lg shadow md:col-span-1">
            <h2 className="text-lg font-semibold mb-2">Directory Browser</h2>
            <div className="mb-2 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                Select destination folder
              </span>
              <button
                className="px-2 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => openNewFolderDialog("root")}
              >
                <Plus size={14} className="inline mr-1" /> New Folder
              </button>
            </div>
            <hr className="my-2" />
            <div className="overflow-auto max-h-[400px]">
              {directories.map((directory) => renderDirectoryTree(directory))}
            </div>
          </div>

          {/* Right panel: URL input and download manager */}
          <div className="md:col-span-2 space-y-6">
            {/* URL input section */}
            <div className="p-4 bg-white rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Download File</h2>
              <form onSubmit={handleUrlSubmit} className="space-y-4">
                <div>
                  <label htmlFor="url-input" className="text-sm text-gray-500">
                    Enter URL to download
                  </label>
                  <div className="flex mt-1">
                    <input
                      id="url-input"
                      type="url"
                      value={url}
                      onChange={handleUrlChange}
                      placeholder="https://example.com/file.zip"
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="ml-0 px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      disabled={!url.trim()}
                    >
                      <Download size={16} className="inline mr-2" /> Download
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">
                    Destination folder:
                  </label>
                  <div className="mt-1 px-3 py-2 bg-gray-100 rounded text-sm">
                    {getDirectoryPath(selectedDirectory)}
                  </div>
                </div>
              </form>
            </div>

            {/* Download manager section */}
            <div className="p-4 bg-white rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Download Manager</h2>
              <div className="space-y-4 max-h-[400px] overflow-auto">
                {downloads.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No downloads yet. Add a URL above to start downloading.
                  </div>
                ) : (
                  downloads.map((download) => (
                    <div
                      key={download.id}
                      className="p-3 border border-gray-200 rounded-md bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium truncate max-w-md">
                            {download.filename}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {download.url}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Saving to: {download.directoryPath}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {download.status === "downloading" && (
                            <button
                              className="px-2 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                              onClick={() => cancelDownload(download.id)}
                            >
                              <X size={16} className="inline mr-1" /> Cancel
                            </button>
                          )}
                          {["completed", "cancelled"].includes(
                            download.status
                          ) && (
                            <button
                              className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                              onClick={() => removeDownload(download.id)}
                            >
                              <X size={16} className="inline mr-1" /> Remove
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className={`h-2 rounded-full ${
                            download.status === "cancelled"
                              ? "bg-red-400"
                              : download.status === "completed"
                              ? "bg-green-500"
                              : "bg-blue-500"
                          }`}
                          style={{ width: `${download.progress}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>
                          {download.status === "downloading"
                            ? `${Math.round(
                                download.progress
                              )}% • ${formatTimeElapsed(download.startTime)}`
                            : download.status === "completed"
                            ? "Completed"
                            : "Cancelled"}
                        </span>
                        {download.status === "downloading" && (
                          <span>
                            {Math.round(download.progress * 10) / 10}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New folder dialog */}
      {newFolderDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Folder</h3>
            <p className="text-gray-500 mb-4">
              Enter a name for the new folder.
            </p>
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder Name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setNewFolderDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={createNewFolder}
                disabled={!newFolderName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileDownloader;
