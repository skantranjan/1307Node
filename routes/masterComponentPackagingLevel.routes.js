const { getAllMasterComponentPackagingLevelController, getMasterComponentPackagingLevelByIdController } = require('../controllers/controller.masterComponentPackagingLevel');

async function masterComponentPackagingLevelRoutes(fastify, options) {
  fastify.get('/master-component-packaging-level', getAllMasterComponentPackagingLevelController);
  fastify.get('/master-component-packaging-level/:id', getMasterComponentPackagingLevelByIdController);
}

module.exports = masterComponentPackagingLevelRoutes; 