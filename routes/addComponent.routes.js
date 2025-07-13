const { addComponentController } = require('../controllers/controller.addComponent');

async function addComponentRoutes(fastify, options) {
  fastify.post('/add-component', addComponentController);
}

module.exports = addComponentRoutes; 