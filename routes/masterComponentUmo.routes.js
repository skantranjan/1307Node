const { getAllMasterComponentUmoController, getMasterComponentUmoByIdController } = require('../controllers/controller.masterComponentUmo');

async function masterComponentUmoRoutes(fastify, options) {
  fastify.get('/master-component-umo', getAllMasterComponentUmoController);
  fastify.get('/master-component-umo/:id', getMasterComponentUmoByIdController);
}

module.exports = masterComponentUmoRoutes; 