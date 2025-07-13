const { getComponentDetailsByYearAndCmController } = require('../controllers/controller.getComponentDetailsByYearAndCm');

async function getComponentDetailsByYearAndCmRoutes(fastify, options) {
  fastify.get('/component-details-by-year-cm', getComponentDetailsByYearAndCmController);
}

module.exports = getComponentDetailsByYearAndCmRoutes; 