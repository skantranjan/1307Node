const { requireAuth, requireRole, csrfProtection } = require('../middleware/middleware.auth');

async function routes(fastify, options) {
  // Example protected route that requires authentication
  fastify.get('/protected/example', { preHandler: [requireAuth] }, async (request, reply) => {
    return reply.send({
      message: 'This is a protected endpoint',
      user: {
        id: request.user.id,
        email: request.user.email,
        name: request.user.name
      },
      timestamp: new Date().toISOString()
    });
  });

  // Example protected route that requires specific role
  fastify.get('/protected/admin', { preHandler: [requireRole(['admin', 'administrator'])] }, async (request, reply) => {
    return reply.send({
      message: 'This is an admin-only endpoint',
      user: {
        id: request.user.id,
        email: request.user.email,
        name: request.user.name,
        roles: request.user.roles
      },
      timestamp: new Date().toISOString()
    });
  });

  // Example protected POST route with CSRF protection
  fastify.post('/protected/data', { 
    preHandler: [requireAuth, csrfProtection] 
  }, async (request, reply) => {
    return reply.send({
      message: 'Data saved successfully',
      user: {
        id: request.user.id,
        email: request.user.email
      },
      data: request.body,
      timestamp: new Date().toISOString()
    });
  });

  // Example protected route for SKU operations
  fastify.get('/protected/sku/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = request.params;
    
    return reply.send({
      message: 'SKU data retrieved',
      skuId: id,
      user: {
        id: request.user.id,
        email: request.user.email
      },
      timestamp: new Date().toISOString()
    });
  });

  // Example protected route for component operations
  fastify.post('/protected/component', { 
    preHandler: [requireAuth, csrfProtection] 
  }, async (request, reply) => {
    return reply.send({
      message: 'Component created successfully',
      user: {
        id: request.user.id,
        email: request.user.email
      },
      component: request.body,
      timestamp: new Date().toISOString()
    });
  });
}

module.exports = routes; 