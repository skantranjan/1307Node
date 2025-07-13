const pool = require('../config/db.config');

/**
 * Fetch all CM codes
 */
async function getAllCMCodes() {
  const result = await pool.query('SELECT id, cm_code, cm_description, created_at, updated_at, company_name, signoff_by, signoff_date, signoff_status, document_url FROM sdp_contractors');
  return result.rows;
}

/**
 * Fetch CM code by cm_code
 */
async function getCMCodeByCode(cm_code) {
  const result = await pool.query('SELECT id, cm_code, cm_description, created_at, updated_at, company_name, signoff_by, signoff_date, signoff_status, document_url FROM sdp_contractors WHERE cm_code = $1', [cm_code]);
  return result.rows;
}

module.exports = { getAllCMCodes, getCMCodeByCode }; 