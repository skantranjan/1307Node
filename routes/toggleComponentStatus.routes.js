const { toggleComponentStatusController } = require('../controllers/controller.toggleComponentStatus');

async function toggleComponentStatusRoutes(fastify, options) {
  fastify.patch('/component-status-change/:id', toggleComponentStatusController);
}

module.exports = toggleComponentStatusRoutes; 