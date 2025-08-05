const { ssoAuth, optionalSsoAuth, handleSsoCallback, generateSSOUrl } = require('../middleware/middleware.sso');

async function ssoRoutes(fastify, options) {
  
  // Get SSO login URL
  fastify.get('/sso/login', async (request, reply) => {
    try {
      const ssoUrl = await generateSSOUrl(request);
      
      return reply.send({
        success: true,
        ssoUrl: ssoUrl,
        message: 'SSO login URL generated'
      });
    } catch (error) {
      console.error('SSO login error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to generate SSO URL',
        message: 'Unable to initiate SSO login'
      });
    }
  });

  // SSO callback endpoint
  fastify.get('/sso/callback', handleSsoCallback);

  // Check SSO status
  fastify.get('/sso/status', { preHandler: [optionalSsoAuth] }, async (request, reply) => {
    try {
      const isAuthenticated = !!request.user;
      
      return reply.send({
        authenticated: isAuthenticated,
        user: isAuthenticated ? {
          id: request.user.id,
          email: request.user.email,
          name: request.user.name,
          source: request.user.source
        } : null
      });
    } catch (error) {
      console.error('SSO status error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to check SSO status',
        message: 'Unable to verify authentication'
      });
    }
  });

  // SSO logout
  fastify.get('/sso/logout', async (request, reply) => {
    try {
      // Clear session
      if (request.session) {
        request.session.destroy();
      }
      
      return reply.send({
        success: true,
        message: 'SSO logout successful'
      });
    } catch (error) {
      console.error('SSO logout error:', error);
      return reply.code(500).send({
        success: false,
        error: 'SSO logout failed',
        message: 'Unable to complete logout'
      });
    }
  });

  // Protected test endpoint with SSO
  fastify.get('/sso/protected', { preHandler: [ssoAuth] }, async (request, reply) => {
    return reply.send({
      success: true,
      message: 'This is a protected SSO endpoint',
      user: {
        id: request.user.id,
        email: request.user.email,
        name: request.user.name
      }
    });
  });
}

module.exports = ssoRoutes; 