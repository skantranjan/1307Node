const { AzureCliCredential } = require("@azure/identity");
const { BlobServiceClient } = require("@azure/storage-blob");
const fs = require('fs');
const path = require('path');

const accountName = "ukssdptldev001";
const containerName = "sdpdevstoragecontainer";
const blobUrl = `https://${accountName}.blob.core.windows.net`;

const credential = new AzureCliCredential();

async function testAzureUpload() {
  try {
    console.log('🧪 === TESTING AZURE UPLOAD FUNCTIONALITY ===');
    console.log(`📂 Container: ${containerName}`);
    console.log(`📂 Account: ${accountName}`);
    console.log(`🔑 Using Azure CLI credentials`);
    
    const blobServiceClient = new BlobServiceClient(blobUrl, credential);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Test folder structure
    const testYear = "Test Year 2025";
    const testCmCode = "TESTCM";
    const testSkuCode = "TESTSKU";
    const testComponentCode = "TESTCOMP";
    const testCategory = "Weight";
    
    const folderPath = `${testYear}/${testCmCode}/${testSkuCode}/${testComponentCode}/${testCategory}/`;
    const testFileName = `test-file-${Date.now()}.txt`;
    const blobPath = `${folderPath}${testFileName}`;
    
    console.log(`\n📁 Testing folder structure: ${folderPath}`);
    console.log(`📄 Testing file upload: ${blobPath}`);
    
    // Create test content
    const testContent = `This is a test file created at ${new Date().toISOString()}`;
    const testBuffer = Buffer.from(testContent, 'utf8');
    
    console.log(`📊 Test content size: ${testBuffer.length} bytes`);
    
    // Upload test file
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
    
    console.log('🚀 Starting test upload...');
    await blockBlobClient.upload(testBuffer, testBuffer.length, {
      blobHTTPHeaders: {
        blobContentType: 'text/plain'
      }
    });
    
    console.log('✅ Test upload successful!');
    console.log(`🔗 Blob URL: ${blockBlobClient.url}`);
    
    // Test folder creation with .keep file
    console.log('\n📁 Testing folder creation with .keep file...');
    const keepFilePath = `${folderPath}.keep`;
    const keepBlockBlobClient = containerClient.getBlockBlobClient(keepFilePath);
    
    const keepContent = "Folder placeholder";
    await keepBlockBlobClient.upload(keepContent, keepContent.length);
    
    console.log('✅ Folder creation test successful!');
    console.log(`🔗 Keep file URL: ${keepBlockBlobClient.url}`);
    
    console.log('\n🎉 === ALL TESTS PASSED ===');
    console.log('✅ Azure CLI authentication working');
    console.log('✅ File upload working');
    console.log('✅ Folder creation working');
    console.log('✅ Your main application should work on this system!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
    
    if (error.message.includes('Azure CLI could not be found')) {
      console.log('\n💡 SOLUTION: Install and authenticate Azure CLI');
      console.log('1. Install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli');
      console.log('2. Run: az login');
      console.log('3. Run: az account set --subscription "your-subscription-id"');
    }
  }
}

testAzureUpload(); 