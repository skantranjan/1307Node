const { getSkuDetailsByCMCodeController, getAllSkuDetailsController, updateIsActiveStatusController, getActiveYearsController, getAllSkuDescriptionsController, insertSkuDetailController, updateSkuDetailBySkuCodeController } = require('../controllers/controller.getSkuDetails');
const bearerTokenMiddleware = require('../middleware/middleware.bearer');

async function skuDetailsRoutes(fastify, options) {
  // Protected routes - requires Bearer token
  fastify.get('/sku-details', {
    preHandler: bearerTokenMiddleware
  }, getAllSkuDetailsController);
  
  fastify.get('/sku-details/:cm_code', {
    preHandler: bearerTokenMiddleware
  }, getSkuDetailsByCMCodeController);
  
  fastify.patch('/sku-details/:id/is-active', {
    preHandler: bearerTokenMiddleware
  }, updateIsActiveStatusController);
  
  fastify.get('/sku-details-active-years', {
    preHandler: bearerTokenMiddleware
  }, getActiveYearsController);
  
  fastify.get('/sku-descriptions', {
    preHandler: bearerTokenMiddleware
  }, getAllSkuDescriptionsController);
  
  fastify.post('/sku-details/add', {
    preHandler: bearerTokenMiddleware
  }, insertSkuDetailController);
  
  fastify.put('/sku-details/update/:sku_code', {
    preHandler: bearerTokenMiddleware
  }, updateSkuDetailBySkuCodeController);
}

module.exports = skuDetailsRoutes; 