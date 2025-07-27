const { getAllCMCodesController, getCMCodeByCodeController, toggleCMCodeActiveStatusController } = require('../controllers/controller.getcmcodes');

async function cmRoutes(fastify, options) {
  fastify.get('/cm-codes', getAllCMCodesController);
  fastify.get('/cm-codes/:cm_code', getCMCodeByCodeController);
  fastify.patch('/cm-codes/:id/toggle-active', toggleCMCodeActiveStatusController);
}

module.exports = cmRoutes; 