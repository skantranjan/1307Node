const { getAllComponentMasterMaterialTypeController, getComponentMasterMaterialTypeByIdController } = require('../controllers/controller.componentMasterMaterialType');

async function componentMasterMaterialTypeRoutes(fastify, options) {
  fastify.get('/component-master-material-type', getAllComponentMasterMaterialTypeController);
  fastify.get('/component-master-material-type/:id', getComponentMasterMaterialTypeByIdController);
}

module.exports = componentMasterMaterialTypeRoutes; 