const { getSkuDetailsByReferenceController } = require('../controllers/controller.getSkuReference');

async function skuReferenceRoutes(fastify, options) {
  fastify.get('/skureference/:sku_reference', getSkuDetailsByReferenceController);
}

module.exports = skuReferenceRoutes; 