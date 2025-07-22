const { getComponentDetailsByPeriodAndCmController } = require('../controllers/controller.getComponentDetailsByPeriodAndCm');

async function getComponentDetailsByPeriodAndCmRoutes(fastify, options) {
  fastify.get('/get-component-details-by-period-and-cm', getComponentDetailsByPeriodAndCmController);
}

module.exports = getComponentDetailsByPeriodAndCmRoutes; 