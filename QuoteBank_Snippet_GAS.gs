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
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "parentFolderId is missing" })).setMimeType(ContentService.MimeType.JSON);
    }

    // Extract Base64 from data URI
    var base64Data = imageBase64;
    if (imageBase64.indexOf(',') > -1) {
      base64Data = imageBase64.split(',')[1];
    }
    
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), 'image/png', fileName);

    // Get the target folder dynamically from parentFolderId (This fixes the hardcoded bug!)
    var currentFolder = DriveApp.getFolderById(parentFolderId);
    
    // 1. Create/Find Category Folder
    if (categoryName) {
      var folders = currentFolder.getFoldersByName(categoryName);
      currentFolder = folders.hasNext() ? folders.next() : currentFolder.createFolder(categoryName);
    }

    // 2. Create/Find Year Folder (optional)
    if (year) {
      var yearFolders = currentFolder.getFoldersByName(year);
      currentFolder = yearFolders.hasNext() ? yearFolders.next() : currentFolder.createFolder(year);
    }

    // 3. Create/Find Paper/Rank Folder (optional)
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
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      previewUrl: newFile.getUrl(),
      fileId: newFile.getId()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Return detailed error for debugging
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString(),
      message: "Please ensure this Apps Script is deployed by an account that has 'Editor' access to the Quote Bank Root folder."
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Required for CORS
function doOptions(e) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  return ContentService.createTextOutput("").setHeaders(headers);
}
