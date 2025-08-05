const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const azureConfig = require('../config/azure-ad.config');
const { requireAuth, optionalAuth, generateCsrfToken } = require('../middleware/middleware.auth');

async function routes(fastify, options) {
  // Login endpoint - initiates Azure AD SSO
  fastify.get('/auth/login', async (request, reply) => {
    try {
      const state = uuidv4();
      const nonce = uuidv4();
      
      // Store state and nonce in session for security
      request.session.state = state;
      request.session.nonce = nonce;
      
      // Generate CSRF token
      const csrfToken = generateCsrfToken(request);
      
      // Build authorization URL
      const authUrl = new URL(azureConfig.azureAd.authorizationURL);
      authUrl.searchParams.set('client_id', azureConfig.azureAd.clientId);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('redirect_uri', azureConfig.azureAd.redirectUri);
      authUrl.searchParams.set('scope', azureConfig.azureAd.scope);
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('nonce', nonce);
      authUrl.searchParams.set('response_mode', 'query');
      
      // Check if this is a direct browser request or API call
      const acceptHeader = request.headers.accept || '';
      const isApiCall = acceptHeader.includes('application/json') || request.headers['x-requested-with'] === 'XMLHttpRequest';
      
      if (isApiCall) {
        // Return JSON for API calls
        return reply.send({
          authUrl: authUrl.toString(),
          state,
          nonce,
          csrfToken
        });
      } else {
        // Redirect directly for browser requests
        return reply.redirect(authUrl.toString());
      }
    } catch (error) {
      request.log.error('Login error:', error);
      return reply.code(500).send({
        error: 'Login initiation failed',
        message: 'Unable to initiate authentication'
      });
    }
  });

  // Callback endpoint - handles Azure AD response
  fastify.get('/auth/callback', async (request, reply) => {
    try {
      const { code, state, error, error_description } = request.query;
      
      // Check for errors
      if (error) {
        request.log.error('Azure AD error:', error, error_description);
        return reply.code(400).send({
          success: false,
          error: 'Authentication failed',
          message: error_description || 'Unknown error occurred during authentication'
        });
      }
      
      // Validate state parameter
      if (!state || state !== request.session.state) {
        return reply.code(400).send({
          success: false,
          error: 'Security validation failed',
          message: 'Invalid state parameter'
        });
      }
      
      // Exchange authorization code for tokens
      const tokenResponse = await axios.post(azureConfig.azureAd.tokenURL, {
        client_id: azureConfig.azureAd.clientId,
        client_secret: azureConfig.azureAd.clientSecret,
        code,
        redirect_uri: azureConfig.azureAd.redirectUri,
        grant_type: 'authorization_code'
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const { access_token, id_token, refresh_token } = tokenResponse.data;
      
      // Get user information from Microsoft Graph
      const userInfoResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
      
      const userInfo = userInfoResponse.data;
      
      // Store user information in session
      request.session.user = {
        id: userInfo.id,
        email: userInfo.mail || userInfo.userPrincipalName,
        name: userInfo.displayName,
        firstName: userInfo.givenName,
        lastName: userInfo.surname,
        roles: [], // You can populate this from Azure AD app roles or groups
        groups: [], // You can populate this from Azure AD groups
        accessToken: access_token,
        refreshToken: refresh_token
      };
      
      // Clear security parameters
      delete request.session.state;
      delete request.session.nonce;
      
      // Return JSON response for API consumption
      return reply.send({
        success: true,
        user: {
          id: request.session.user.id,
          email: request.session.user.email,
          name: request.session.user.name,
          firstName: request.session.user.firstName,
          lastName: request.session.user.lastName,
          roles: request.session.user.roles,
          groups: request.session.user.groups
        },
        message: 'Authentication successful',
        sessionId: request.session.id
      });
      
    } catch (error) {
      request.log.error('Callback error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Authentication callback failed',
        message: 'Unable to complete authentication process'
      });
    }
  });

  // Logout endpoint
  fastify.get('/auth/logout', async (request, reply) => {
    try {
      // Clear session
      request.session.destroy();
      
      // Build logout URL for Azure AD
      const logoutUrl = new URL(`https://login.microsoftonline.com/${azureConfig.azureAd.tenantId}/oauth2/v2.0/logout`);
      logoutUrl.searchParams.set('client_id', azureConfig.azureAd.clientId);
      logoutUrl.searchParams.set('post_logout_redirect_uri', azureConfig.azureAd.logoutRedirectUri);
      
      return reply.send({
        logoutUrl: logoutUrl.toString(),
        message: 'Logout successful'
      });
    } catch (error) {
      request.log.error('Logout error:', error);
      return reply.code(500).send({
        error: 'Logout failed',
        message: 'Unable to complete logout'
      });
    }
  });

  // Get current user information
  fastify.get('/auth/user', { preHandler: [optionalAuth] }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.code(401).send({
          error: 'Not authenticated',
          message: 'No user information available'
        });
      }
      
      // Return user info without sensitive data
      const { accessToken, refreshToken, ...userInfo } = request.user;
      
      return reply.send({
        user: userInfo,
        authenticated: true
      });
    } catch (error) {
      request.log.error('Get user info error:', error);
      return reply.code(500).send({
        error: 'Failed to get user information',
        message: 'Unable to retrieve user data'
      });
    }
  });

  // Check authentication status
  fastify.get('/auth/status', { preHandler: [optionalAuth] }, async (request, reply) => {
    try {
      const isAuthenticated = !!request.user;
      
      return reply.send({
        authenticated: isAuthenticated,
        user: isAuthenticated ? {
          id: request.user.id,
          email: request.user.email,
          name: request.user.name
        } : null
      });
    } catch (error) {
      request.log.error('Auth status error:', error);
      return reply.code(500).send({
        error: 'Failed to check authentication status',
        message: 'Unable to verify authentication'
      });
    }
  });

  // Refresh token endpoint
  fastify.post('/auth/refresh', async (request, reply) => {
    try {
      const { refresh_token } = request.body;
      
      if (!refresh_token) {
        return reply.code(400).send({
          error: 'Missing refresh token',
          message: 'Refresh token is required'
        });
      }
      
      // Exchange refresh token for new access token
      const tokenResponse = await axios.post(azureConfig.azureAd.tokenURL, {
        client_id: azureConfig.azureAd.clientId,
        client_secret: azureConfig.azureAd.clientSecret,
        refresh_token,
        grant_type: 'refresh_token'
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const { access_token, refresh_token: new_refresh_token } = tokenResponse.data;
      
      return reply.send({
        access_token,
        refresh_token: new_refresh_token,
        token_type: 'Bearer',
        expires_in: 3600
      });
      
    } catch (error) {
      request.log.error('Token refresh error:', error);
      return reply.code(401).send({
        error: 'Token refresh failed',
        message: 'Invalid or expired refresh token'
      });
    }
  });

  // Protected test endpoint
  fastify.get('/auth/protected', { preHandler: [requireAuth] }, async (request, reply) => {
    return reply.send({
      message: 'This is a protected endpoint',
      user: request.user
    });
  });
}

module.exports = routes; 