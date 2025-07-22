const { getComponentCodeDataController } = require('../controllers/controller.getComponentCodeData');

async function getComponentCodeDataRoutes(fastify, options) {
  fastify.get('/get-component-code-data', getComponentCodeDataController);
}

module.exports = getComponentCodeDataRoutes; 