const pool = require('../config/db.config');

/**
 * Insert a new SKU detail into sdp_skudetails
 * @param {Object} data - The SKU detail data
 * @returns {Promise<Object>} The inserted record
 */
async function insertSkuDetail(data) {
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
  
  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
}

module.exports = {
  insertSkuDetail
}; 