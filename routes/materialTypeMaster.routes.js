const { getAllMaterialTypeMasterController, getMaterialTypeMasterByIdController } = require('../controllers/controller.materialTypeMaster');

async function materialTypeMasterRoutes(fastify, options) {
  fastify.get('/material-type-master', getAllMaterialTypeMasterController);
  fastify.get('/material-type-master/:id', getMaterialTypeMasterByIdController);
}

module.exports = materialTypeMasterRoutes; 