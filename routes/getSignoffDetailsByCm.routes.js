const { getSignoffDetailsByCmController } = require('../controllers/controller.getSignoffDetailsByCm');

async function getSignoffDetailsByCmRoutes(fastify, options) {
  fastify.get('/signoff-details/:cm_code', getSignoffDetailsByCmController);
}

module.exports = getSignoffDetailsByCmRoutes; 