const { getSkuDetailsByReferenceController } = require('../controllers/controller.getSkuReference');
const bearerTokenMiddleware = require('../middleware/middleware.bearer');

async function skuReferenceRoutes(fastify, options) {
  // Protected route - requires Bearer token
  fastify.get('/skureference/:sku_reference', {
    preHandler: bearerTokenMiddleware
  }, getSkuDetailsByReferenceController);
}

module.exports = skuReferenceRoutes; 