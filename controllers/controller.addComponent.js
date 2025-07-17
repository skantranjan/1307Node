const { insertComponentDetail } = require('../models/model.addComponent');
const { insertMultipleEvidenceFiles } = require('../models/model.addEvidence');
const { uploadFilesToBlob, createVirtualFolders } = require('../utils/azureBlobStorage');

/**
 * Controller to add a new component detail with file uploads
 */
async function addComponentController(request, reply) {
  try {
    console.log('Content-Type:', request.headers['content-type']);
    console.log('Request body keys:', Object.keys(request.body || {}));
    
    const componentData = {};
    const files = {
      category1: [],
      category2: [],
      category3: [],
      category4: []
    };

    // Since we have attachFieldsToBody: true, data is in request.body
    if (request.body) {
      // Extract component data from request.body
      Object.keys(request.body).forEach(key => {
        if (key.endsWith('_files')) {
          // This is a file field
          const category = key.replace('_files', '');
          if (files.hasOwnProperty(category)) {
            // Handle file data
            const fileData = request.body[key];
            console.log(`File data for ${key}:`, fileData);
            
            if (Array.isArray(fileData)) {
              fileData.forEach(file => {
                files[category].push({
                  filename: file.filename,
                  mimetype: file.mimetype,
                  data: file.data || file.buffer || file.toBuffer()
                });
              });
            } else if (fileData && fileData.filename) {
              files[category].push({
                filename: fileData.filename,
                mimetype: fileData.mimetype,
                data: fileData.data || fileData.buffer || fileData.toBuffer()
              });
            }
          }
        } else {
          // This is a regular field - extract the value properly
          const fieldData = request.body[key];
          if (fieldData && typeof fieldData === 'object' && fieldData.value !== undefined) {
            componentData[key] = fieldData.value;
          } else if (typeof fieldData === 'string' || typeof fieldData === 'number') {
            componentData[key] = fieldData;
          }
        }
      });
    }

    console.log('Component Data Keys:', Object.keys(componentData));
    console.log('Files:', Object.keys(files).map(cat => `${cat}: ${files[cat].length} files`));

    // Validate required fields
    if (!componentData.cm_code || !componentData.year || !componentData.sku_code || !componentData.component_code) {
      return reply.code(400).send({
        success: false,
        message: 'Missing required fields: cm_code, year, sku_code, component_code'
      });
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

    // Upload files to Azure Blob Storage
    const uploadResults = await uploadFilesToBlob(
      files,
      componentData.year,
      componentData.cm_code,
      componentData.sku_code,
      componentData.component_code
    );

    // Create virtual folders even if no files
    await createVirtualFolders(
      componentData.year,
      componentData.cm_code,
      componentData.sku_code,
      componentData.component_code
    );

    // Insert component data into database
    const insertedComponent = await insertComponentDetail(componentData);

    // Save evidence file records to sdp_evidence table
    const evidenceFiles = [];
    
    // Collect all uploaded files for evidence table
    Object.keys(uploadResults.uploadedFiles).forEach(category => {
      uploadResults.uploadedFiles[category].forEach(uploadedFile => {
        evidenceFiles.push({
          component_id: insertedComponent.id,
          evidence_file_name: uploadedFile.originalName,
          evidence_file_url: uploadedFile.blobUrl,
          created_by: componentData.created_by || componentData.user_id,
          created_date: new Date()
        });
      });
    });

    // Insert evidence records if there are any files
    let evidenceRecords = [];
    if (evidenceFiles.length > 0) {
      evidenceRecords = await insertMultipleEvidenceFiles(evidenceFiles);
      console.log(`✅ Saved ${evidenceRecords.length} evidence records to database`);
    }

    reply.code(201).send({
      success: true,
      message: 'Component detail added successfully with file uploads',
      data: {
        component: insertedComponent,
        fileUploads: uploadResults,
        evidenceRecords: evidenceRecords
      }
    });

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