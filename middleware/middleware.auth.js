const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const { v4: uuidv4 } = require('uuid');
const azureConfig = require('../config/azure-ad.config');

// JWKS client for token validation
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${azureConfig.azureAd.tenantId}/discovery/v2.0/keys`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000, // 10 minutes
});

// Get signing key from JWKS
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

// Authentication middleware for protecting routes
const requireAuth = async (request, reply) => {
  try {
    // Check if user is authenticated via session
    if (request.session && request.session.user) {
      request.user = request.session.user;
      return;
    }

    // Check for Bearer token in Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Verify JWT token
      const decoded = await new Promise((resolve, reject) => {
        jwt.verify(token, getKey, {
          audience: azureConfig.azureAd.tokenValidation.audience,
          issuer: azureConfig.azureAd.tokenValidation.issuer,
          clockTolerance: azureConfig.azureAd.tokenValidation.clockTolerance
        }, (err, decoded) => {
          if (err) {
            reject(err);
          } else {
            resolve(decoded);
          }
        });
      });

      request.user = {
        id: decoded.sub || decoded.oid,
        email: decoded.email || decoded.preferred_username,
        name: decoded.name,
        roles: decoded.roles || [],
        groups: decoded.groups || []
      };
      return;
    }

    // No valid authentication found
    return reply.code(401).send({
      error: 'Authentication required',
      message: 'Please login to access this resource'
    });
  } catch (error) {
    request.log.error('Authentication error:', error);
    return reply.code(401).send({
      error: 'Authentication failed',
      message: 'Invalid or expired token'
    });
  }
};

// Optional authentication middleware (doesn't block if not authenticated)
const optionalAuth = async (request, reply) => {
  try {
    // Check if user is authenticated via session
    if (request.session && request.session.user) {
      request.user = request.session.user;
      return;
    }

    // Check for Bearer token in Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Verify JWT token
      const decoded = await new Promise((resolve, reject) => {
        jwt.verify(token, getKey, {
          audience: azureConfig.azureAd.tokenValidation.audience,
          issuer: azureConfig.azureAd.tokenValidation.issuer,
          clockTolerance: azureConfig.azureAd.tokenValidation.clockTolerance
        }, (err, decoded) => {
          if (err) {
            reject(err);
          } else {
            resolve(decoded);
          }
        });
      });

      request.user = {
        id: decoded.sub || decoded.oid,
        email: decoded.email || decoded.preferred_username,
        name: decoded.name,
        roles: decoded.roles || [],
        groups: decoded.groups || []
      };
    }
  } catch (error) {
    request.log.error('Optional authentication error:', error);
    // Don't block the request, just log the error
  }
};

// Role-based access control middleware
const requireRole = (requiredRoles) => {
  return async (request, reply) => {
    await requireAuth(request, reply);
    
    if (reply.sent) return; // Auth failed, response already sent
    
    const userRoles = request.user.roles || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return reply.code(403).send({
        error: 'Insufficient permissions',
        message: 'You do not have the required role to access this resource'
      });
    }
  };
};

// CSRF protection middleware
const csrfProtection = async (request, reply) => {
  if (request.method === 'GET') {
    return; // Skip CSRF for GET requests
  }

  const csrfToken = request.headers['x-csrf-token'] || request.body._csrf;
  const sessionToken = request.session.csrfToken;

  if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
    return reply.code(403).send({
      error: 'CSRF token validation failed',
      message: 'Invalid or missing CSRF token'
    });
  }
};

// Generate CSRF token
const generateCsrfToken = (request) => {
  const token = uuidv4();
  request.session.csrfToken = token;
  return token;
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireRole,
  csrfProtection,
  generateCsrfToken
}; 