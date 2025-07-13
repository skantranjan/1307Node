const { getAllCMCodesController, getCMCodeByCodeController } = require('../controllers/controller.getcmcodes');

async function cmRoutes(fastify, options) {
  fastify.get('/cm-codes', getAllCMCodesController);
  fastify.get('/cm-codes/:cm_code', getCMCodeByCodeController);
}

module.exports = cmRoutes; 