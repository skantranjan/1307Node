const pool = require('../config/db.config');

/**
 * Insert a new SKU detail into sdp_skudetails
 * @param {Object} data - The SKU detail data
 * @returns {Promise<Object>} The inserted record
 */
async function insertSkuDetail(data) {
  console.log('=== MODEL:  MOdal data  ===');
  console.log('=== DATA RECEIVED FROM UI ===');
  console.log('Full data object:', JSON.stringify(data, null, 2));
  console.log('Data type:', typeof data);
  console.log('Is data an object?', typeof data === 'object');
  console.log('Data keys:', Object.keys(data));
  console.log('=== INDIVIDUAL FIELDS ===');
  console.log('sku_code:', data.sku_code);
  console.log('sku_description:', data.sku_description);
  console.log('cm_code:', data.cm_code);
  console.log('cm_description:', data.cm_description);
  console.log('sku_reference:', data.sku_reference);
  console.log('is_active:', data.is_active);
  console.log('created_by:', data.created_by);
  console.log('created_date:', data.created_date);
  console.log('period:', data.period);
  console.log('purchased_quantity:', data.purchased_quantity);
  console.log('sku_reference_check:', data.sku_reference_check);
  console.log('formulation_reference:', data.formulation_reference);
  console.log('dual_source_sku:', data.dual_source_sku);
  console.log('site:', data.site);
  console.log('skutype:', data.skutype);
  console.log('skutype type:', typeof data.skutype);
  console.log('skutype exists?', 'skutype' in data);
  console.log('=== END DATA FROM UI ===');

  const query = `
    INSERT INTO public.sdp_skudetails (
      sku_code, sku_description, cm_code, cm_description, sku_reference, is_active, created_by, created_date, period, purchased_quantity, sku_reference_check, formulation_reference, dual_source_sku, site, skutype
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING id, sku_code, sku_description, cm_code, cm_description, sku_reference, is_active, created_by, created_date, period, purchased_quantity, sku_reference_check, formulation_reference, dual_source_sku, site, skutype;
  `;
  const values = [
    data.sku_code,
    data.sku_description,
    data.cm_code || null,
    data.cm_description || null,
    data.sku_reference || null,
    typeof data.is_active === 'boolean' ? data.is_active : true,
    data.created_by || null,
    data.created_date || new Date(),
    data.period || null,
    data.purchased_quantity || null,
    data.sku_reference_check || null,
    data.formulation_reference || null,
    data.dual_source_sku || null,
    data.site || null,
    data.skutype || 'Default'  // Set default value if not provided
  ];
  
  console.log('=== VALUES ARRAY FOR DATABASE ===');
  console.log('Values array:', JSON.stringify(values, null, 2));
  console.log('Values array length:', values.length);
  console.log('Value at index 14 (skutype):', values[14]);
  console.log('=== END VALUES ARRAY ===');
  
  console.log('=== SQL QUERY ===');
  console.log('Query:', query);
  console.log('=== END SQL QUERY ===');
  
  try {
    const result = await pool.query(query, values);
    console.log('=== INSERT RESULT ===');
    console.log('Inserted record:', JSON.stringify(result.rows[0], null, 2));
    console.log('=== END INSERT RESULT ===');
    return result.rows[0];
  } catch (error) {
    console.log('=== INSERT ERROR ===');
    console.log('Error message:', error.message);
    console.log('Error details:', JSON.stringify(error, null, 2));
    console.log('=== END INSERT ERROR ===');
    throw error;
  }
}

module.exports = {
  insertSkuDetail
}; 