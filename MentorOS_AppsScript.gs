/**
 * MentorOS Google Apps Script Backend
 * 
 * Deployment Instructions:
 * 1. Open script.google.com and create a new project.
 * 2. Delete all existing code and paste this entire file.
 * 3. Click Deploy -> New Deployment.
 * 4. Select "Web app".
 * 5. Execute as: "Me" (your email).
 * 6. Who has access: "Anyone".
 * 7. Click Deploy, Authorize access, and copy the Web App URL.
 */

function doGet(e) {
  try {
    var action = e.parameter.action;
    
    // ==========================================
    // ACTION 1: CATEGORIZE & COPY FILE
    // ==========================================
    if (action === "categorize") {
      var fileId = e.parameter.fileId;
      var categoryName = e.parameter.categoryName;
      var targetRootId = e.parameter.targetRootId;
      
      if (!fileId || !categoryName || !targetRootId) {
        return createJsonResponse({ success: false, error: "Missing required parameters for categorize action." });
      }
      
      // Get the file to copy
      var file = DriveApp.getFileById(fileId);
      
      // Get the target root folder
      var targetRoot = DriveApp.getFolderById(targetRootId);
      
      // Check if category folder exists, if not create it
      var folders = targetRoot.getFoldersByName(categoryName);
      var categoryFolder;
      if (folders.hasNext()) {
        categoryFolder = folders.next();
      } else {
        categoryFolder = targetRoot.createFolder(categoryName);
      }
      
      // Copy the file into the category folder
      var copiedFile = file.makeCopy(file.getName(), categoryFolder);
      
      return createJsonResponse({
        success: true,
        message: "File successfully copied to " + categoryName + " folder.",
        newFileId: copiedFile.getId()
      });
    }
    
    // ==========================================
    // ACTION 2: FETCH FOLDER CONTENTS (DEFAULT)
    // ==========================================
    var folderId = e.parameter.folderId;
    if (!folderId) {
      return createJsonResponse({ error: "folderId parameter missing" });
    }
    
    var folder = DriveApp.getFolderById(folderId);
    var result = [];
    
    // Get all subfolders
    var subfolders = folder.getFolders();
    while (subfolders.hasNext()) {
      var subfolder = subfolders.next();
      result.push({
        id: subfolder.getId(),
        name: subfolder.getName(),
        type: 'folder'
      });
    }
    
    // Get all files
    var files = folder.getFiles();
    while (files.hasNext()) {
      var file = files.next();
      result.push({
        id: file.getId(),
        name: file.getName(),
        type: 'file',
        mimeType: file.getMimeType()
      });
    }
    
    return createJsonResponse(result);
    
  } catch (error) {
    // Custom error handling for Permission issues
    var errorMessage = error.toString();
    if (errorMessage.includes("No item with the given ID could be found")) {
      errorMessage = "Permission Denied: Apps Script does not have permission to access the file or target folder. Please ensure the target folder is shared with 'Editor' access to the account running this script.";
    }
    return createJsonResponse({ success: false, error: errorMessage });
  }
}

function doOptions(e) {
  return createJsonResponse({ success: true });
}

// Helper function for JSON response
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
