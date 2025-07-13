const { addComponentAuditLogController } = require('../controllers/controller.addComponentAuditLog');

async function addComponentAuditLogRoutes(fastify, options) {
  fastify.post('/add-component-audit-log', addComponentAuditLogController);
}

module.exports = addComponentAuditLogRoutes; 