const { getSkuDetailsByCMCodeController, getAllSkuDetailsController, updateIsActiveStatusController, getActiveYearsController, getAllSkuDescriptionsController, insertSkuDetailController, updateSkuDetailBySkuCodeController } = require('../controllers/controller.getSkuDetails');

async function skuDetailsRoutes(fastify, options) {
  fastify.get('/sku-details', getAllSkuDetailsController);
  fastify.get('/sku-details/:cm_code', getSkuDetailsByCMCodeController);
  fastify.patch('/sku-details/:id/is-active', updateIsActiveStatusController);
  fastify.get('/sku-details-active-years', getActiveYearsController);
  fastify.get('/sku-descriptions', getAllSkuDescriptionsController);
  fastify.post('/sku-details/add', insertSkuDetailController);
  fastify.put('/sku-details/update/:sku_code', updateSkuDetailBySkuCodeController);
}

module.exports = skuDetailsRoutes; 