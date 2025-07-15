const { getSignoffDetailsByCmAndPeriodController } = require('../controllers/controller.getSignoffDetailsByCmAndPeriod');

async function getSignoffDetailsByCmAndPeriodRoutes(fastify, options) {
  fastify.get('/signoff-details-by-cm-period', getSignoffDetailsByCmAndPeriodController);
}

module.exports = getSignoffDetailsByCmAndPeriodRoutes; 