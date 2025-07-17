const { AzureCliCredential } = require("@azure/identity");
const { BlobServiceClient } = require("@azure/storage-blob");

const accountName = "ukssdptldev001";
const containerName = "sdpdevstoragecontainer";
const blobUrl = `https://${accountName}.blob.core.windows.net`;

const credential = new AzureCliCredential();

/**
 * Upload files to Azure Blob Storage with the specified folder structure
 * @param {Object} files - Object containing category files
 * @param {string} year - Year
 * @param {string} cmCode - CM Code
 * @param {string} skuCode - SKU Code
 * @param {string} componentCode - Component Code
 * @returns {Object} - Upload results with blob URLs
 */
async function uploadFilesToBlob(files, year, cmCode, skuCode, componentCode) {
  try {
    const blobServiceClient = new BlobServiceClient(blobUrl, credential);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    const uploadResults = {
      success: true,
      uploadedFiles: {},
      errors: []
    };

    const categories = ["category1", "category2", "category3", "category4"];
    
    for (const category of categories) {
      if (files[category] && files[category].length > 0) {
        uploadResults.uploadedFiles[category] = [];
        
        for (let i = 0; i < files[category].length; i++) {
          const file = files[category][i];
          const fileName = file.filename;
          const fileExtension = fileName.split('.').pop();
          const timestamp = Date.now();
          const uniqueFileName = `${fileName.split('.')[0]}_${timestamp}.${fileExtension}`;
          
          // Create folder structure: year/cmCode/skuCode/componentCode/category/
          const folderPath = `${year}/${cmCode}/${skuCode}/${componentCode}/${category}/`;
          const blobPath = `${folderPath}${uniqueFileName}`;
          
          // Safety check for file data
          if (!file.data) {
            console.error(`❌ No file data for ${fileName}`);
            uploadResults.errors.push({
              fileName: fileName,
              category: category,
              error: 'No file data available'
            });
            continue;
          }
          
          try {
            const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
            await blockBlobClient.upload(file.data, file.data.length, {
              blobHTTPHeaders: {
                blobContentType: file.mimetype
              }
            });
            
            const blobUrl = blockBlobClient.url;
            uploadResults.uploadedFiles[category].push({
              originalName: fileName,
              blobName: uniqueFileName,
              blobUrl: blobUrl,
              size: file.data.length,
              mimetype: file.mimetype
            });
            
            console.log(`✅ Uploaded: ${blobPath}`);
          } catch (uploadError) {
            console.error(`❌ Upload failed for ${fileName}:`, uploadError);
            uploadResults.errors.push({
              fileName: fileName,
              category: category,
              error: uploadError.message
            });
          }
        }
      }
    }
    
    return uploadResults;
  } catch (error) {
    console.error("❌ Azure Blob Storage error:", error);
    return {
      success: false,
      error: error.message,
      uploadedFiles: {},
      errors: []
    };
  }
}

/**
 * Create virtual folders in Azure Blob Storage
 * @param {string} year - Year
 * @param {string} cmCode - CM Code
 * @param {string} skuCode - SKU Code
 * @param {string} componentCode - Component Code
 */
async function createVirtualFolders(year, cmCode, skuCode, componentCode) {
  try {
    const blobServiceClient = new BlobServiceClient(blobUrl, credential);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    const categories = ["category1", "category2", "category3", "category4"];
    
    for (const category of categories) {
      const folderPath = `${year}/${cmCode}/${skuCode}/${componentCode}/${category}/.keep`;
      const blockBlobClient = containerClient.getBlockBlobClient(folderPath);
      
      const content = "Folder placeholder";
      await blockBlobClient.upload(content, content.length);
      console.log(`📁 Created virtual folder: ${folderPath}`);
    }
    
    return true;
  } catch (error) {
    console.error("❌ Error creating virtual folders:", error);
    return false;
  }
}

module.exports = { uploadFilesToBlob, createVirtualFolders }; 