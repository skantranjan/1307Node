const { 
  getAllRegionsController,
  getRegionByIdController,
  createRegionController,
  updateRegionController,
  deleteRegionController
} = require('../controllers/controller.regionMaster');

async function regionMasterRoutes(fastify, options) {
  // Get all regions
  fastify.get('/regions', getAllRegionsController);
  
  // Get region by ID
  fastify.get('/regions/:id', getRegionByIdController);
  
  // Create new region
  fastify.post('/regions', createRegionController);
  
  // Update region by ID
  fastify.put('/regions/:id', updateRegionController);
  
  // Delete region by ID
  fastify.delete('/regions/:id', deleteRegionController);
}

module.exports = regionMasterRoutes; 