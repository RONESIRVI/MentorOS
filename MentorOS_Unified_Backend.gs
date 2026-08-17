/**
 * MentorOS Unified Google Apps Script Backend
 * 
 * Deployment Instructions:
 * 1. Open script.google.com and create a new project.
 * 2. Delete all existing code and paste this entire file.
 * 3. Click Deploy -> New Deployment.
 * 4. Select "Web app".
 * 5. Execute as: "Me" (your email).
 * 6. Who has access: "Anyone".
 * 7. Click Deploy, Authorize access, and copy the Web App URL.
 * 8. Paste the single Web App URL into the MENTOR_OS_BACKEND_URL variable in aspirant-dashboard.html.
 */

// ==========================================
// HANDLE GET REQUESTS (Fetch Folders & Categorize)
// ==========================================
function doGet(e) {
  try {
    var action = e.parameter.action;
    
    // ACTION 1: CATEGORIZE & COPY FILE
    if (action === "categorize") {
      var fileId = e.parameter.fileId;
      var categoryName = e.parameter.categoryName;
      var targetRootId = e.parameter.targetRootId;
      
      if (!fileId || !categoryName || !targetRootId) {
        return createJsonResponse({ success: false, error: "Missing required parameters for categorize action." });
      }
      
      var file = DriveApp.getFileById(fileId);
      var targetRoot = DriveApp.getFolderById(targetRootId);
      
      var folders = targetRoot.getFoldersByName(categoryName);
      var categoryFolder = folders.hasNext() ? folders.next() : targetRoot.createFolder(categoryName);
      
      var copiedFile = file.makeCopy(file.getName(), categoryFolder);
      
      return createJsonResponse({
        success: true,
        message: "File successfully copied to " + categoryName + " folder.",
        newFileId: copiedFile.getId()
      });
    }
    
    // ACTION 2: FETCH FOLDER CONTENTS (DEFAULT)
    var folderId = e.parameter.folderId;
    if (!folderId) {
      return createJsonResponse({ error: "folderId parameter missing" });
    }
    
    var folder = DriveApp.getFolderById(folderId);
    var result = [];
    
    var subfolders = folder.getFolders();
    while (subfolders.hasNext()) {
      var subfolder = subfolders.next();
      result.push({ id: subfolder.getId(), name: subfolder.getName(), type: 'folder' });
    }
    
    var files = folder.getFiles();
    while (files.hasNext()) {
      var file = files.next();
      result.push({ id: file.getId(), name: file.getName(), type: 'file', mimeType: file.getMimeType() });
    }
    
    return createJsonResponse(result);
    
  } catch (error) {
    var errorMessage = error.toString();
    if (errorMessage.includes("No item with the given ID could be found")) {
      errorMessage = "Permission Denied: Apps Script does not have permission. Ensure the folder is shared with 'Editor' access.";
    }
    return createJsonResponse({ success: false, error: errorMessage });
  }
}

// ==========================================
// HANDLE POST REQUESTS (Screen Cut Snippet Upload)
// ==========================================
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var parentFolderId = data.parentFolderId;
    var categoryName = data.categoryName || "Uncategorized";
    var rankName = data.rankName || "";
    var year = data.year || "";
    var paper = data.paper || "";
    var fileName = data.fileName || "snippet.png";
    var imageBase64 = data.image;

    if (!parentFolderId) {
      return createJsonResponse({ success: false, error: "parentFolderId is missing" });
    }

    // Extract Base64 from data URI
    var base64Data = imageBase64;
    if (imageBase64.indexOf(',') > -1) {
      base64Data = imageBase64.split(',')[1];
    }
    
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), 'image/png', fileName);

    // Get the target root folder dynamically (Works for Quote Bank OR Rankers Root)
    var currentFolder = DriveApp.getFolderById(parentFolderId);
    
    // 1. Create/Find Category Folder
    if (categoryName) {
      var folders = currentFolder.getFoldersByName(categoryName);
      currentFolder = folders.hasNext() ? folders.next() : currentFolder.createFolder(categoryName);
    }

    // 2. Create/Find Year Folder
    if (year) {
      var yearFolders = currentFolder.getFoldersByName(year);
      currentFolder = yearFolders.hasNext() ? yearFolders.next() : currentFolder.createFolder(year);
    }

    // 3. Create/Find Paper/Rank Folder
    var finalSubName = "";
    if (paper && rankName) finalSubName = paper + " - " + rankName;
    else if (paper) finalSubName = paper;
    else if (rankName) finalSubName = rankName;

    if (finalSubName) {
      var subFolders = currentFolder.getFoldersByName(finalSubName);
      currentFolder = subFolders.hasNext() ? subFolders.next() : currentFolder.createFolder(finalSubName);
    }

    // Save image
    var newFile = currentFolder.createFile(blob);
    
    return createJsonResponse({
      success: true,
      previewUrl: newFile.getUrl(),
      fileId: newFile.getId()
    });

  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.toString(),
      message: "Permission Denied. Please ensure the deploying account has 'Editor' access to the target folder."
    });
  }
}

// ==========================================
// CORS & HELPERS
// ==========================================
function doOptions(e) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  return ContentService.createTextOutput("").setHeaders(headers);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({ "Access-Control-Allow-Origin": "*" });
}
