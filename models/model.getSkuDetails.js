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
 * Get all sku_description values from sdp_skudetails
 * @returns {Promise<Array>} Array of sku_description strings
 */
async function getAllSkuDescriptions() {
  const query = `
    SELECT sku_description
    FROM public.sdp_skudetails
    ORDER BY sku_description;
  `;
  const result = await pool.query(query);
  return result.rows.map(row => row.sku_description);
}

/**
 * Insert a new SKU detail into sdp_skudetails
 * @param {Object} data - The SKU detail data
 * @returns {Promise<Object>} The inserted record
 */
async function insertSkuDetail(data) {
  const query = `
    INSERT INTO public.sdp_skudetails (
      sku_code, sku_description, cm_code, cm_description, sku_reference, is_active, created_by, created_date, period, purchased_quantity, sku_reference_check, formulation_reference, dual_source_sku, site
    ) VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING id, sku_code, sku_description, cm_code, cm_description, is_active, created_by, created_date, period, purchased_quantity, sku_reference_check, formulation_reference, dual_source_sku, site;
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
    data.site || null
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
  const query = `
    UPDATE public.sdp_skudetails SET
      sku_description = $1
    WHERE sku_code = $2
    RETURNING id, sku_code, sku_description, cm_code, cm_description, sku_reference, is_active, created_by, created_date, period, purchased_quantity, sku_reference_check, formulation_reference, dual_source_sku, site, skutype;
  `;
  const values = [
    data.sku_description,
    sku_code
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
}

module.exports = {
  getActiveYears,
  getSkuDetailsByCMCode,
  getAllSkuDetails,
  updateIsActiveStatus,
  getAllSkuDescriptions,
  insertSkuDetail,
  updateSkuDetailBySkuCode
}; 