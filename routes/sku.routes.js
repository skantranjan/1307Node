const { saveSkuController } = require('../controllers/controller.savesku');

async function skuRoutes(fastify, options) {
  fastify.post('/sku', saveSkuController);
}

module.exports = skuRoutes; 