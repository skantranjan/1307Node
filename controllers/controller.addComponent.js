const { insertComponentDetail } = require('../models/model.addComponent');
const { insertMultipleEvidenceFiles } = require('../models/model.addEvidence');
const { getPeriodById } = require('../models/model.getPeriods');
const { uploadFilesToBlob, createVirtualFolders } = require('../utils/azureBlobStorage');

/**
 * Controller to add a new component detail with file uploads
 */
async function addComponentController(request, reply) {
  try {
    console.log('🔍 ===== ADD COMPONENT API - DATA RECEIVED =====');
    console.log('Content-Type:', request.headers['content-type']);
    console.log('Request body keys:', Object.keys(request.body || {}));
    
    const componentData = {};
    const files = {
      'Weight': [],
      'weightUOM': [],
      'Packaging Type': [],
      'Material Type': []
    };

    // Since we have attachFieldsToBody: true, data is in request.body
    if (request.body) {
      console.log('\n📋 === PROCESSING REQUEST BODY ===');
      
      // Extract component data from request.body
      Object.keys(request.body).forEach(key => {
        console.log(`\n🔍 Processing key: ${key}`);
        
        if (key.endsWith('_files')) {
          // This is a file field - map to specific categories
          const categoryKey = key.replace('_files', '');
          let category = categoryKey;
          
          // Map generic category names to specific ones
          if (categoryKey === 'category1') category = 'Weight';
          else if (categoryKey === 'category2') category = 'weightUOM';
          else if (categoryKey === 'category3') category = 'Packaging Type';
          else if (categoryKey === 'category4') category = 'Material Type';
          
          console.log(`📁 File field detected: ${key} -> mapped to ${category}`);
          
          if (files.hasOwnProperty(category)) {
            // Handle file data
            const fileData = request.body[key];
            console.log(`📄 File data for ${key} (mapped to ${category}):`);
            console.log(`   - Type: ${typeof fileData}`);
            console.log(`   - Is Array: ${Array.isArray(fileData)}`);
            console.log(`   - Has filename: ${fileData && fileData.filename ? 'YES' : 'NO'}`);
            console.log(`   - Has _buf: ${fileData && fileData._buf ? 'YES' : 'NO'}`);
            console.log(`   - Has toBuffer: ${fileData && fileData.toBuffer ? 'YES' : 'NO'}`);
            
            if (Array.isArray(fileData)) {
              console.log(`   - Processing as ARRAY with ${fileData.length} items`);
              fileData.forEach((file, index) => {
                console.log(`     📎 File ${index + 1}: ${file.filename}`);
                console.log(`       - MimeType: ${file.mimetype}`);
                console.log(`       - Has _buf: ${file._buf ? 'YES' : 'NO'}`);
                console.log(`       - _buf size: ${file._buf ? file._buf.length : 'N/A'} bytes`);
                
                // Properly extract file buffer
                let fileBuffer = null;
                if (file._buf) {
                  fileBuffer = file._buf;
                  console.log(`       ✅ Using _buf (${fileBuffer.length} bytes)`);
                } else if (file.data) {
                  fileBuffer = file.data;
                  console.log(`       ✅ Using data (${fileBuffer.length} bytes)`);
                } else if (file.buffer) {
                  fileBuffer = file.buffer;
                  console.log(`       ✅ Using buffer (${fileBuffer.length} bytes)`);
                } else if (file.toBuffer && typeof file.toBuffer === 'function') {
                  fileBuffer = file.toBuffer();
                  console.log(`       ✅ Using toBuffer() (${fileBuffer.length} bytes)`);
                }
                
                if (fileBuffer && Buffer.isBuffer(fileBuffer)) {
                  files[category].push({
                    filename: file.filename,
                    mimetype: file.mimetype,
                    data: fileBuffer
                  });
                  console.log(`       ✅ Added file: ${file.filename} (${fileBuffer.length} bytes) to ${category}`);
                } else {
                  console.log(`       ❌ Invalid file data for ${file.filename} in ${category}`);
                  console.log(`         - Buffer type: ${typeof fileBuffer}`);
                  console.log(`         - Is Buffer: ${Buffer.isBuffer(fileBuffer)}`);
                }
              });
            } else if (fileData && fileData.filename) {
              console.log(`   - Processing as SINGLE FILE: ${fileData.filename}`);
              console.log(`     - MimeType: ${fileData.mimetype}`);
              console.log(`     - Has _buf: ${fileData._buf ? 'YES' : 'NO'}`);
              console.log(`     - _buf size: ${fileData._buf ? fileData._buf.length : 'N/A'} bytes`);
              
              // Handle single file
              let fileBuffer = null;
              if (fileData._buf) {
                fileBuffer = fileData._buf;
                console.log(`     ✅ Using _buf (${fileBuffer.length} bytes)`);
              } else if (fileData.data) {
                fileBuffer = fileData.data;
                console.log(`     ✅ Using data (${fileBuffer.length} bytes)`);
              } else if (fileData.buffer) {
                fileBuffer = fileData.buffer;
                console.log(`     ✅ Using buffer (${fileBuffer.length} bytes)`);
              } else if (fileData.toBuffer && typeof fileData.toBuffer === 'function') {
                fileBuffer = fileData.toBuffer();
                console.log(`     ✅ Using toBuffer() (${fileBuffer.length} bytes)`);
              }
              
              if (fileBuffer && Buffer.isBuffer(fileBuffer)) {
                files[category].push({
                  filename: fileData.filename,
                  mimetype: fileData.mimetype,
                  data: fileBuffer
                });
                console.log(`     ✅ Added file: ${fileData.filename} (${fileBuffer.length} bytes) to ${category}`);
              } else {
                console.log(`     ❌ Invalid file data for ${fileData.filename} in ${category}`);
                console.log(`       - Buffer type: ${typeof fileBuffer}`);
                console.log(`       - Is Buffer: ${Buffer.isBuffer(fileBuffer)}`);
              }
            } else {
              console.log(`   ⚠️ No valid file data found for ${key}`);
            }
          }
        } else {
          // This is a regular field - extract the value properly
          const fieldData = request.body[key];
          console.log(`📝 Form field: ${key}`);
          console.log(`   - Type: ${typeof fieldData}`);
          console.log(`   - Value: ${fieldData && typeof fieldData === 'object' ? fieldData.value : fieldData}`);
          
          if (fieldData && typeof fieldData === 'object' && fieldData.value !== undefined) {
            componentData[key] = fieldData.value;
            console.log(`   ✅ Extracted value: ${fieldData.value}`);
          } else if (typeof fieldData === 'string' || typeof fieldData === 'number') {
            componentData[key] = fieldData;
            console.log(`   ✅ Direct value: ${fieldData}`);
          }
        }
      });
    }

    console.log('\n📊 === FINAL PROCESSED DATA ===');
    console.log('Component Data Keys:', Object.keys(componentData));
    console.log('Files by Category:');
    Object.keys(files).forEach(cat => {
      console.log(`  ${cat}: ${files[cat].length} files`);
      files[cat].forEach(file => {
        console.log(`    - ${file.filename} (${file.mimetype}) - ${file.data.length} bytes`);
      });
    });

    // Validate required fields
    if (!componentData.cm_code || !componentData.year || !componentData.sku_code || !componentData.component_code) {
      return reply.code(400).send({
        success: false,
        message: 'Missing required fields: cm_code, year, sku_code, component_code'
      });
    }

    // Get year name from sdp_period table
    let yearName = null;
    try {
      const periodData = await getPeriodById(componentData.year);
      if (periodData) {
        yearName = periodData.period;
        componentData.periods = componentData.year; // Use the same year ID value
        console.log(`✅ Found year name: ${yearName} for year ID: ${componentData.year}`);
      } else {
        console.log(`⚠️ No period found for year ID: ${componentData.year}`);
      }
    } catch (error) {
      console.error('❌ Error fetching period data:', error);
    }

    // Set default values for timestamps if not provided
    if (!componentData.created_date) {
      componentData.created_date = new Date();
    }

    if (!componentData.last_update_date) {
      componentData.last_update_date = new Date();
    }

    // Set default value for is_active if not provided
    if (componentData.is_active === undefined) {
      componentData.is_active = true;
    }

    console.log('\n📁 === AZURE FOLDER CREATION ===');
    console.log(`📂 Year: ${yearName || componentData.year}`);
    console.log(`📂 CM Code: ${componentData.cm_code}`);
    console.log(`📂 SKU Code: ${componentData.sku_code}`);
    console.log(`📂 Component Code: ${componentData.component_code}`);
    
    // Show folder structure that will be created
    const categories = ["Weight", "weightUOM", "Packaging Type", "Material Type"];
    console.log('\n📁 === FOLDER STRUCTURE TO BE CREATED ===');
    categories.forEach(category => {
      const folderPath = `${yearName || componentData.year}/${componentData.cm_code}/${componentData.sku_code}/${componentData.component_code}/${category}/`;
      console.log(`📁 ${folderPath}`);
    });

    // Upload files to Azure Blob Storage
    console.log('\n🚀 === STARTING AZURE UPLOAD ===');
    const uploadResults = await uploadFilesToBlob(
      files,
      yearName || componentData.year, // Use year name if available, otherwise use year ID
      componentData.cm_code,
      componentData.sku_code,
      componentData.component_code
    );

    // Create virtual folders even if no files
    console.log('\n📁 === CREATING VIRTUAL FOLDERS ===');
    await createVirtualFolders(
      yearName || componentData.year, // Use year name if available, otherwise use year ID
      componentData.cm_code,
      componentData.sku_code,
      componentData.component_code
    );

    // Insert component data into database
    console.log('\n💾 === SAVING COMPONENT TO DATABASE ===');
    const insertedComponent = await insertComponentDetail(componentData);
    console.log(`✅ Component saved with ID: ${insertedComponent.id}`);

    // Save evidence file records to sdp_evidence table
    const evidenceFiles = [];
    
    console.log('\n📄 === PROCESSING EVIDENCE FILES ===');
    console.log('Upload Results:', JSON.stringify(uploadResults, null, 2));
    console.log('Component ID:', insertedComponent.id);
    
    // Collect all uploaded files for evidence table
    Object.keys(uploadResults.uploadedFiles).forEach(category => {
      console.log(`📄 Processing category: ${category}`);
      uploadResults.uploadedFiles[category].forEach(uploadedFile => {
        console.log(`📄 Processing file: ${uploadedFile.originalName}`);
        evidenceFiles.push({
          component_id: insertedComponent.id,
          evidence_file_name: uploadedFile.originalName,
          evidence_file_url: uploadedFile.blobUrl,
          created_by: componentData.created_by || componentData.user_id,
          created_date: new Date()
        });
      });
    });

    // Also collect files from the original files object (even if Azure upload failed)
    Object.keys(files).forEach(category => {
      if (files[category] && files[category].length > 0) {
        console.log(`📄 Processing original files for category: ${category}`);
        files[category].forEach(file => {
          console.log(`📄 Processing original file: ${file.filename}`);
          evidenceFiles.push({
            component_id: insertedComponent.id,
            evidence_file_name: file.filename,
            evidence_file_url: `pending-azure-upload/${file.filename}`, // Placeholder URL
            created_by: componentData.created_by || componentData.user_id,
            created_date: new Date()
          });
        });
      }
    });

    console.log('\n💾 === SAVING EVIDENCE RECORDS ===');
    console.log('Evidence files to insert:', evidenceFiles.length);
    console.log('Evidence files data:', JSON.stringify(evidenceFiles, null, 2));

    // Insert evidence records if there are any files
    let evidenceRecords = [];
    if (evidenceFiles.length > 0) {
      try {
        evidenceRecords = await insertMultipleEvidenceFiles(evidenceFiles);
        console.log(`✅ Saved ${evidenceRecords.length} evidence records to database`);
      } catch (error) {
        console.error('❌ Error saving evidence records:', error);
      }
    } else {
      console.log('⚠️ No evidence files to save (upload may have failed)');
    }

    console.log('\n✅ === API RESPONSE ===');
    const responseData = {
      success: true,
      message: 'Component detail added successfully with file uploads',
      data: {
        component: insertedComponent,
        fileUploads: uploadResults,
        evidenceRecords: evidenceRecords,
        yearInfo: {
          yearId: componentData.year,
          yearName: yearName,
          periods: componentData.year
        },
        categories: {
          'Weight': files['Weight'].length,
          'weightUOM': files['weightUOM'].length,
          'Packaging Type': files['Packaging Type'].length,
          'Material Type': files['Material Type'].length
        }
      }
    };
    
    console.log('📤 === RESPONSE SENT TO UI ===');
    console.log('Status Code: 201');
    console.log('Response Body:');
    console.log(JSON.stringify(responseData, null, 2));
    
    reply.code(201).send(responseData);

  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ 
      success: false, 
      message: 'Failed to add component detail', 
      error: error.message 
    });
  }
}

module.exports = { addComponentController }; 