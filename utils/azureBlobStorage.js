const { AzureCliCredential, DefaultAzureCredential } = require("@azure/identity");
const { BlobServiceClient } = require("@azure/storage-blob");

// Production configuration
const accountName = process.env.AZURE_STORAGE_ACCOUNT || "ukssdptldev001";
const containerName = process.env.AZURE_CONTAINER_NAME || "sdpdevstoragecontainer";
const blobUrl = `https://${accountName}.blob.core.windows.net`;

// Choose authentication method based on environment
let credential;
if (process.env.NODE_ENV === 'production') {
  if (process.env.AZURE_USE_MANAGED_IDENTITY === 'true') {
    // Use Managed Identity (recommended for Azure App Service)
    credential = new DefaultAzureCredential();
  } else if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
    // Use connection string
    credential = null; // Will use connection string directly
  } else {
    // Fallback to Azure CLI (for local development)
    credential = new AzureCliCredential();
  }
} else {
  // Development environment - EIP Dev
  if (process.env.AZURE_USE_CONNECTION_STRING === 'true' && process.env.AZURE_STORAGE_CONNECTION_STRING) {
    // Use connection string for EIP Dev
    credential = null; // Will use connection string directly
  } else {
    // Fallback to Azure CLI (for local development)
    credential = new AzureCliCredential();
  }
}

/**
 * Upload files to Azure Blob Storage with the specified folder structure
 * @param {Object} files - Object containing category files
 * @param {string} year - Year name from sdp_period table
 * @param {string} cmCode - CM Code
 * @param {string} skuCode - SKU Code
 * @param {string} componentCode - Component Code
 * @returns {Object} - Upload results with blob URLs
 */
async function uploadFilesToBlob(files, year, cmCode, skuCode, componentCode) {
  try {
    console.log('🔧 === AZURE BLOB STORAGE UPLOAD ===');
    console.log(`📂 Container: ${containerName}`);
    console.log(`📂 Account: ${accountName}`);
    console.log(`📂 Blob URL: ${blobUrl}`);
    console.log(`🔑 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    let blobServiceClient;
    if (process.env.NODE_ENV === 'production' && process.env.AZURE_STORAGE_CONNECTION_STRING) {
      // Use connection string for production
      console.log(`🔑 Using Azure Storage Connection String`);
      blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
    } else {
      // Use credential-based authentication
      console.log(`🔑 Using Azure Credentials`);
      blobServiceClient = new BlobServiceClient(blobUrl, credential);
    }
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    const uploadResults = {
      success: true,
      uploadedFiles: {},
      errors: []
    };

    // Use the specific category names
    const categories = ["Weight", "weightUOM", "Packaging Type", "Material Type"];
    
    console.log('\n📁 === PROCESSING FILES BY CATEGORY ===');
    for (const category of categories) {
      console.log(`\n📂 Processing category: ${category}`);
      console.log(`📊 Files in ${category}: ${files[category] ? files[category].length : 0}`);
      
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
          
          console.log(`📁 Creating folder structure: ${folderPath}`);
          console.log(`📄 Uploading file: ${blobPath}`);
          console.log(`📊 File info: ${fileName}, size: ${file.data ? file.data.length : 'unknown'} bytes`);
          
          // Enhanced safety check for file data
          if (!file.data) {
            console.error(`❌ No file data for ${fileName}`);
            uploadResults.errors.push({
              fileName: fileName,
              category: category,
              error: 'No file data available'
            });
            continue;
          }
          
          // Validate file data is a Buffer
          if (!Buffer.isBuffer(file.data)) {
            console.error(`❌ Invalid file data format for ${fileName}. Expected Buffer, got: ${typeof file.data}`);
            uploadResults.errors.push({
              fileName: fileName,
              category: category,
              error: 'Invalid file data format - not a Buffer'
            });
            continue;
          }
          
          // Check file size
          if (file.data.length === 0) {
            console.error(`❌ Empty file data for ${fileName}`);
            uploadResults.errors.push({
              fileName: fileName,
              category: category,
              error: 'Empty file data'
            });
            continue;
          }
          
          try {
            console.log(`🔧 Creating block blob client for: ${blobPath}`);
            const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
            
            console.log(`🚀 Starting upload for ${fileName} (${file.data.length} bytes)`);
            console.log(`📄 MimeType: ${file.mimetype || 'application/octet-stream'}`);
            
            // Upload the file with proper content length
            await blockBlobClient.upload(file.data, file.data.length, {
              blobHTTPHeaders: {
                blobContentType: file.mimetype || 'application/octet-stream'
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
            
            console.log(`✅ Successfully uploaded: ${blobPath}`);
            console.log(`🔗 Blob URL: ${blobUrl}`);
          } catch (uploadError) {
            console.error(`❌ Upload failed for ${fileName}:`, uploadError);
            uploadResults.errors.push({
              fileName: fileName,
              category: category,
              error: uploadError.message
            });
          }
        }
      } else {
        console.log(`⚠️ No files found for category: ${category}`);
      }
    }
    
    console.log('\n📊 === UPLOAD SUMMARY ===');
    console.log(`✅ Successfully uploaded files: ${Object.keys(uploadResults.uploadedFiles).reduce((total, cat) => total + uploadResults.uploadedFiles[cat].length, 0)}`);
    console.log(`❌ Errors: ${uploadResults.errors.length}`);
    
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
 * @param {string} year - Year name from sdp_period table
 * @param {string} cmCode - CM Code
 * @param {string} skuCode - SKU Code
 * @param {string} componentCode - Component Code
 */
async function createVirtualFolders(year, cmCode, skuCode, componentCode) {
  try {
    console.log('📁 === CREATING VIRTUAL FOLDERS ===');
    console.log(`📂 Year: ${year}`);
    console.log(`📂 CM Code: ${cmCode}`);
    console.log(`📂 SKU Code: ${skuCode}`);
    console.log(`📂 Component Code: ${componentCode}`);
    
    let blobServiceClient;
    if (process.env.NODE_ENV === 'production' && process.env.AZURE_STORAGE_CONNECTION_STRING) {
      // Use connection string for production
      blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
    } else {
      // Use credential-based authentication
      blobServiceClient = new BlobServiceClient(blobUrl, credential);
    }
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Use the specific category names
    const categories = ["Weight", "weightUOM", "Packaging Type", "Material Type"];
    
    console.log('\n📁 === CREATING FOLDER STRUCTURE ===');
    for (const category of categories) {
      const folderPath = `${year}/${cmCode}/${skuCode}/${componentCode}/${category}/.keep`;
      console.log(`📁 Creating folder: ${folderPath}`);
      
      const blockBlobClient = containerClient.getBlockBlobClient(folderPath);
      
      const content = "Folder placeholder";
      await blockBlobClient.upload(content, content.length);
      console.log(`✅ Created virtual folder: ${folderPath}`);
    }
    
    console.log('✅ All virtual folders created successfully');
    return true;
  } catch (error) {
    console.error("❌ Error creating virtual folders:", error);
    return false;
  }
}

module.exports = { uploadFilesToBlob, createVirtualFolders }; 