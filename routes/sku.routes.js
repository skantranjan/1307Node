const { saveSkuController } = require('../controllers/controller.savesku');
const bearerTokenMiddleware = require('../middleware/middleware.bearer');
const { ssoAuth } = require('../middleware/middleware.sso');

async function skuRoutes(fastify, options) {
  // Protected route - requires Bearer token OR SSO authentication
  fastify.post('/sku', {
    preHandler: [bearerTokenMiddleware, ssoAuth]
  }, saveSkuController);
  
  // Alternative: SSO-only protected route
  fastify.get('/sku/status', {
    preHandler: [ssoAuth]
  }, async (request, reply) => {
    return reply.send({
      success: true,
      message: 'SKU status endpoint - SSO authenticated',
      user: request.user ? {
        id: request.user.id,
        email: request.user.email,
        name: request.user.name
      } : null
    });
  });
}

module.exports = skuRoutes; 