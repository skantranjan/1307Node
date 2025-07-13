const { insertSkuAuditLogController } = require('../controllers/controller.skuAuditLog');

async function skuAuditLogRoutes(fastify, options) {
  fastify.post('/sku-auditlog/add', insertSkuAuditLogController);
}

module.exports = skuAuditLogRoutes; 