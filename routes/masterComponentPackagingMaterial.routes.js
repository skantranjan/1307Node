const { getAllMasterComponentPackagingMaterialController, getMasterComponentPackagingMaterialByIdController } = require('../controllers/controller.masterComponentPackagingMaterial');

async function masterComponentPackagingMaterialRoutes(fastify, options) {
  fastify.get('/master-component-packaging-material', getAllMasterComponentPackagingMaterialController);
  fastify.get('/master-component-packaging-material/:id', getMasterComponentPackagingMaterialByIdController);
}

module.exports = masterComponentPackagingMaterialRoutes; 