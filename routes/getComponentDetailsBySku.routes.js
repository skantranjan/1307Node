const { getComponentDetailsBySkuController } = require('../controllers/controller.getComponentDetailsBySku');

async function getComponentDetailsBySkuRoutes(fastify, options) {
  fastify.get('/component-details/:sku_code', getComponentDetailsBySkuController);
}

module.exports = getComponentDetailsBySkuRoutes; 