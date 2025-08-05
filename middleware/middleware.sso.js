const axios = require('axios');
const azureConfig = require('../config/azure-ad.config');

/**
 * SSO Middleware for Azure AD Authentication
 * This middleware can be used to protect existing API endpoints
 */

// SSO Authentication Middleware
async function ssoAuth(request, reply) {
  try {
    // Check if user is already authenticated via session
    if (request.session && request.session.user) {
      request.user = request.session.user;
      return; // User is already authenticated
    }

    // Check for Bearer token in Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Validate token with Azure AD
      try {
        const userInfo = await validateAzureToken(token);
        request.user = userInfo;
        return; // Token is valid
      } catch (error) {
        // Token validation failed, continue to SSO flow
        console.log('Token validation failed:', error.message);
      }
    }

    // If not authenticated, initiate SSO flow
    const ssoUrl = await generateSSOUrl(request);
    
    return reply.code(401).send({
      error: 'Authentication required',
      message: 'Please authenticate with Azure AD',
      ssoUrl: ssoUrl,
      requiresAuth: true
    });

  } catch (error) {
    console.error('SSO Auth error:', error);
    return reply.code(500).send({
      error: 'Authentication error',
      message: 'Unable to process authentication'
    });
  }
}

// Optional SSO Authentication (doesn't block if not authenticated)
async function optionalSsoAuth(request, reply) {
  try {
    // Check if user is already authenticated via session
    if (request.session && request.session.user) {
      request.user = request.session.user;
      return; // User is already authenticated
    }

    // Check for Bearer token in Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const userInfo = await validateAzureToken(token);
        request.user = userInfo;
        return; // Token is valid
      } catch (error) {
        // Token validation failed, but don't block the request
        console.log('Token validation failed:', error.message);
      }
    }

    // If not authenticated, just continue without user info
    request.user = null;
    return;

  } catch (error) {
    console.error('Optional SSO Auth error:', error);
    // Don't block the request, just continue without user info
    request.user = null;
    return;
  }
}

// Validate Azure AD token
async function validateAzureToken(token) {
  try {
    // Get user information from Microsoft Graph
    const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const userInfo = response.data;
    
    return {
      id: userInfo.id,
      email: userInfo.mail || userInfo.userPrincipalName,
      name: userInfo.displayName,
      firstName: userInfo.givenName,
      lastName: userInfo.surname,
      authenticated: true,
      source: 'azure_ad'
    };

  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Generate SSO URL for Azure AD
async function generateSSOUrl(request) {
  const { v4: uuidv4 } = require('uuid');
  
  const state = uuidv4();
  const nonce = uuidv4();
  
  // Store state in session for security
  if (request.session) {
    request.session.state = state;
    request.session.nonce = nonce;
  }
  
  // Build authorization URL
  const authUrl = new URL(azureConfig.azureAd.authorizationURL);
  authUrl.searchParams.set('client_id', azureConfig.azureAd.clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', azureConfig.azureAd.redirectUri);
  authUrl.searchParams.set('scope', azureConfig.azureAd.scope);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('nonce', nonce);
  authUrl.searchParams.set('response_mode', 'query');
  
  return authUrl.toString();
}

// SSO Callback Handler (for completing authentication)
async function handleSsoCallback(request, reply) {
  try {
    const { code, state, error, error_description } = request.query;
    
    // Check for errors
    if (error) {
      return reply.code(400).send({
        success: false,
        error: 'Authentication failed',
        message: error_description || 'Unknown error occurred during authentication'
      });
    }
    
    // Validate state parameter
    if (!state || !request.session || state !== request.session.state) {
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
      accessToken: access_token,
      refreshToken: refresh_token,
      authenticated: true,
      source: 'azure_ad'
    };
    
    // Clear security parameters
    delete request.session.state;
    delete request.session.nonce;
    
    // Return success response
    return reply.send({
      success: true,
      user: {
        id: request.session.user.id,
        email: request.session.user.email,
        name: request.session.user.name,
        firstName: request.session.user.firstName,
        lastName: request.session.user.lastName
      },
      message: 'Authentication successful',
      sessionId: request.session.id
    });
    
  } catch (error) {
    console.error('SSO Callback error:', error);
    return reply.code(500).send({
      success: false,
      error: 'Authentication callback failed',
      message: 'Unable to complete authentication process'
    });
  }
}

module.exports = {
  ssoAuth,
  optionalSsoAuth,
  handleSsoCallback,
  validateAzureToken,
  generateSSOUrl
}; 