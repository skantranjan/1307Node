const pool = require('../config/db.config');

/**
 * Get SKU details by CM code
 * @param {string} cmCode - The CM code to search for
 * @returns {Promise<Array>} Array of SKU details
 */
async function getSkuDetailsByCMCode(cmCode) {
  const query = `
    SELECT id, sku_code, site, sku_description, cm_code, cm_description, sku_reference, is_active, created_by, created_date, period, purchased_quantity, sku_reference_check, formulation_reference, dual_source_sku, skutype
    FROM public.sdp_skudetails
    WHERE cm_code = $1 AND is_active = true
    ORDER BY id DESC;
  `;
  const result = await pool.query(query, [cmCode]);
  return result.rows;
}

/**
 * Get all SKU details
 * @returns {Promise<Array>} Array of all SKU details
 */
async function getAllSkuDetails() {
  const query = `
    SELECT id, sku_code, site, sku_description, cm_code, cm_description, sku_reference, is_active, created_by, created_date, period, purchased_quantity, sku_reference_check, formulation_reference, dual_source_sku, skutype
    FROM public.sdp_skudetails
    WHERE is_active = true
    ORDER BY id DESC;
  `;
  const result = await pool.query(query);
  return result.rows;
}

/**
 * Update is_active status for a SKU detail by id
 * @param {number} id - The SKU detail id
 * @param {boolean} isActive - The new is_active status
 * @returns {Promise<Object>} The updated record
 */
async function updateIsActiveStatus(id, isActive) {
  const query = `
    UPDATE public.sdp_skudetails
    SET is_active = $1
    WHERE id = $2
    RETURNING id, sku_code, sku_description, cm_code, cm_description, sku_reference, is_active, created_by, created_date;
  `;
  const result = await pool.query(query, [isActive, id]);
  return result.rows[0];
}

/**
 * Get unique periods from sdp_period where is_active is true
 * @returns {Promise<Array>} Array of active periods with id
 */
async function getActiveYears() {
  const query = `
    SELECT id, period
    FROM public.sdp_period
    WHERE is_active = true
    ORDER BY id DESC;
  `;
  const result = await pool.query(query);
  return result.rows;
}

/**
 * Get all sku_description values with CM code and description from sdp_skudetails
 * @returns {Promise<Array>} Array of objects with sku_description, cm_code, and cm_description
 */
async function getAllSkuDescriptions() {
  const query = `
    SELECT sku_description, cm_code, cm_description
    FROM public.sdp_skudetails
    ORDER BY sku_description;
  `;
  const result = await pool.query(query);
  return result.rows;
}

/**
 * Insert a new SKU detail into sdp_skudetails
 * @param {Object} data - The SKU detail data
 * @returns {Promise<Object>} The inserted record
 */
async function insertSkuDetail(data) {
  const query = `
    INSERT INTO public.sdp_skudetails (
      sku_code, sku_description, cm_code, cm_description, sku_reference, is_active, created_by, created_date, period, purchased_quantity, sku_reference_check, formulation_reference, dual_source_sku, site, skutype
    ) VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING id, sku_code, sku_description, cm_code, cm_description, is_active, created_by, created_date, period, purchased_quantity, sku_reference_check, formulation_reference, dual_source_sku, site, skutype;
  `;
  const values = [
    data.sku_code,
    data.sku_description,
    data.cm_code || null,
    data.cm_description || null,
    typeof data.is_active === 'boolean' ? data.is_active : true,
    data.created_by || null,
    data.created_date || new Date(),
    data.period || null,
    data.purchased_quantity || null,
    data.sku_reference_check || null,
    data.formulation_reference || null,
    data.dual_source_sku || null,
    data.site || null,
    data.skutype || null
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Update a SKU detail by sku_code
 * @param {string} sku_code - The SKU code to update
 * @param {Object} data - The fields to update
 * @returns {Promise<Object>} The updated record
 */
async function updateSkuDetailBySkuCode(sku_code, data) {
  // Build dynamic query based on provided fields
  const updateFields = [];
  const values = [];
  let paramIndex = 1;
  
  if (data.sku_description !== undefined) {
    updateFields.push(`sku_description = $${paramIndex++}`);
    values.push(data.sku_description);
  }
  
  if (data.sku_reference !== undefined) {
    updateFields.push(`sku_reference = $${paramIndex++}`);
    values.push(data.sku_reference);
  }
  
  if (data.skutype !== undefined) {
    updateFields.push(`skutype = $${paramIndex++}`);
    values.push(data.skutype);
  }
  
  if (data.site !== undefined) {
    updateFields.push(`site = $${paramIndex++}`);
    values.push(data.site);
  }
  
  if (data.formulation_reference !== undefined) {
    updateFields.push(`formulation_reference = $${paramIndex++}`);
    values.push(data.formulation_reference);
  }
  
  // Add WHERE condition
  values.push(sku_code);
  
  const query = `
    UPDATE public.sdp_skudetails SET
      ${updateFields.join(', ')}
    WHERE sku_code = $${paramIndex}
    RETURNING id, sku_code, sku_description, cm_code, cm_description, sku_reference, is_active, created_by, created_date, period, purchased_quantity, sku_reference_check, formulation_reference, dual_source_sku, site, skutype;
  `;
  
  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Remove SKU code from component details (handles comma-separated values)
 * @param {string} skuCode - The SKU code to remove from component details
 * @returns {Promise<Array>} Array of updated component records
 */
async function removeSkuFromComponentDetails(skuCode) {
  // First, find all components that contain this SKU code
  const findQuery = `
    SELECT id, sku_code, component_code, component_description
    FROM public.sdp_component_details
    WHERE (sku_code LIKE $1 OR sku_code LIKE $2 OR sku_code LIKE $3 OR sku_code = $4)
    AND is_active = true
  `;
  
  // Create patterns to match the sku_code in comma-separated values
  const patterns = [
    `${skuCode},%`,           // sku_code at the beginning
    `%,${skuCode},%`,         // sku_code in the middle
    `%,${skuCode}`,           // sku_code at the end
    skuCode                   // exact match
  ];
  
  const findResult = await pool.query(findQuery, patterns);
  const componentsToUpdate = findResult.rows;
  
  if (componentsToUpdate.length === 0) {
    console.log(`No components found containing SKU code: ${skuCode}`);
    return [];
  }
  
  console.log(`Found ${componentsToUpdate.length} components containing SKU code: ${skuCode}`);
  
  const updatedComponents = [];
  
  for (const component of componentsToUpdate) {
    try {
      // Remove the SKU code from the comma-separated list
      let updatedSkuCode = component.sku_code;
      
      // Handle different patterns
      if (updatedSkuCode === skuCode) {
        // Exact match - set to null or empty
        updatedSkuCode = null;
      } else if (updatedSkuCode.startsWith(`${skuCode},`)) {
        // At the beginning
        updatedSkuCode = updatedSkuCode.replace(`${skuCode},`, '');
      } else if (updatedSkuCode.endsWith(`,${skuCode}`)) {
        // At the end
        updatedSkuCode = updatedSkuCode.replace(`,${skuCode}`, '');
      } else {
        // In the middle
        updatedSkuCode = updatedSkuCode.replace(`,${skuCode},`, ',');
      }
      
      // Clean up any double commas that might result
      if (updatedSkuCode) {
        updatedSkuCode = updatedSkuCode.replace(/,,/g, ',');
        // Remove leading/trailing commas
        updatedSkuCode = updatedSkuCode.replace(/^,|,$/g, '');
      }
      
      // If the result is empty or just commas, set to null
      if (!updatedSkuCode || updatedSkuCode.trim() === '' || updatedSkuCode === ',') {
        updatedSkuCode = null;
      }
      
      // Update the component
      const updateQuery = `
        UPDATE public.sdp_component_details
        SET sku_code = $1
        WHERE id = $2
        RETURNING id, sku_code, component_code, component_description
      `;
      
      const updateResult = await pool.query(updateQuery, [updatedSkuCode, component.id]);
      
      if (updateResult.rows[0]) {
        updatedComponents.push({
          component_id: component.id,
          component_code: component.component_code,
          old_sku_code: component.sku_code,
          new_sku_code: updatedSkuCode
        });
        
        console.log(`Updated component ${component.component_code}: removed '${skuCode}' from SKU list`);
      }
    } catch (error) {
      console.error(`Error updating component ${component.component_code}:`, error);
      updatedComponents.push({
        component_id: component.id,
        component_code: component.component_code,
        error: error.message
      });
    }
  }
  
  return updatedComponents;
}

/**
 * Remove SKU code from ALL component details (handles comma-separated values)
 * @param {string} skuCode - The SKU code to remove from all component details
 * @returns {Promise<Array>} Array of updated component records
 */
async function removeSkuFromAllComponentDetails(skuCode) {
  // Find all components that contain this SKU code
  const findQuery = `
    SELECT id, sku_code, component_code, component_description
    FROM public.sdp_component_details
    WHERE (sku_code LIKE $1 OR sku_code LIKE $2 OR sku_code LIKE $3 OR sku_code = $4)
    AND is_active = true
  `;
  
  // Create patterns to match the sku_code in comma-separated values
  const patterns = [
    `${skuCode},%`,           // sku_code at the beginning
    `%,${skuCode},%`,         // sku_code in the middle
    `%,${skuCode}`,           // sku_code at the end
    skuCode                   // exact match
  ];
  
  const findResult = await pool.query(findQuery, patterns);
  const componentsToUpdate = findResult.rows;
  
  if (componentsToUpdate.length === 0) {
    return [];
  }
  
  const updatedComponents = [];
  
  for (const component of componentsToUpdate) {
    try {
      // Remove the SKU code from the comma-separated list
      let updatedSkuCode = component.sku_code;
      
      // Handle different patterns
      if (updatedSkuCode === skuCode) {
        // Exact match - set to null or empty
        updatedSkuCode = null;
      } else if (updatedSkuCode.startsWith(`${skuCode},`)) {
        // At the beginning
        updatedSkuCode = updatedSkuCode.replace(`${skuCode},`, '');
      } else if (updatedSkuCode.endsWith(`,${skuCode}`)) {
        // At the end
        updatedSkuCode = updatedSkuCode.replace(`,${skuCode}`, '');
      } else {
        // In the middle
        updatedSkuCode = updatedSkuCode.replace(`,${skuCode},`, ',');
      }
      
      // Clean up any double commas that might result
      if (updatedSkuCode) {
        updatedSkuCode = updatedSkuCode.replace(/,,/g, ',');
        // Remove leading/trailing commas
        updatedSkuCode = updatedSkuCode.replace(/^,|,$/g, '');
      }
      
      // If the result is empty or just commas, set to null
      if (!updatedSkuCode || updatedSkuCode.trim() === '' || updatedSkuCode === ',') {
        updatedSkuCode = null;
      }
      
      // Update the component
      const updateQuery = `
        UPDATE public.sdp_component_details
        SET sku_code = $1
        WHERE id = $2
        RETURNING id, sku_code, component_code, component_description
      `;
      
      const updateResult = await pool.query(updateQuery, [updatedSkuCode, component.id]);
      
      if (updateResult.rows[0]) {
        const result = updateResult.rows[0];
        
        updatedComponents.push({
          component_id: component.id,
          component_code: component.component_code,
          old_sku_code: component.sku_code,
          new_sku_code: result.sku_code
        });
      }
    } catch (error) {
      updatedComponents.push({
        component_id: component.id,
        component_code: component.component_code,
        error: error.message
      });
    }
  }
  
  return updatedComponents;
}

/**
 * Add SKU code to specific components (handles comma-separated values)
 * @param {string} skuCode - The SKU code to add to specific components
 * @param {Array} components - Array of component objects with component_id
 * @returns {Promise<Array>} Array of updated component records
 */
async function addSkuToSpecificComponents(skuCode, components) {
  const updatedComponents = [];
  
  for (const component of components) {
    try {
      const componentId = component.component_id;
      
      if (!componentId) {
        continue;
      }
      
      // Get current component data
      const getQuery = `
        SELECT id, sku_code, component_code, component_description
        FROM public.sdp_component_details
        WHERE id = $1 AND is_active = true
      `;
      
      const getResult = await pool.query(getQuery, [componentId]);
      
      if (getResult.rows.length === 0) {
        continue;
      }
      
      const componentData = getResult.rows[0];
      let updatedSkuCode = componentData.sku_code;
      
      // Add SKU code to the comma-separated list
      if (!updatedSkuCode || updatedSkuCode.trim() === '') {
        // If empty, just add the SKU code
        updatedSkuCode = skuCode;
      } else {
        // Check if SKU code already exists
        const skuList = updatedSkuCode.split(',').map(s => s.trim());
        if (!skuList.includes(skuCode)) {
          // Add to the end
          updatedSkuCode = `${updatedSkuCode},${skuCode}`;
        } else {
          continue;
        }
      }
      
      // Update the component
      const updateQuery = `
        UPDATE public.sdp_component_details
        SET sku_code = $1
        WHERE id = $2
        RETURNING id, sku_code, component_code, component_description
      `;
      
      const updateResult = await pool.query(updateQuery, [updatedSkuCode, componentId]);
      
      if (updateResult.rows[0]) {
        const result = updateResult.rows[0];
        
        updatedComponents.push({
          component_id: componentId,
          component_code: componentData.component_code,
          old_sku_code: componentData.sku_code,
          new_sku_code: result.sku_code
        });
      }
    } catch (error) {
      updatedComponents.push({
        component_id: component.component_id,
        error: error.message
      });
    }
  }
  
  return updatedComponents;
}

module.exports = {
  getActiveYears,
  getSkuDetailsByCMCode,
  getAllSkuDetails,
  updateIsActiveStatus,
  getAllSkuDescriptions,
  insertSkuDetail,
  updateSkuDetailBySkuCode,
  removeSkuFromComponentDetails,
  removeSkuFromAllComponentDetails,
  addSkuToSpecificComponents
}; 