// Load environment variables
require('dotenv').config();
const fastify = require('fastify')({ logger: false });
const skuRoutes = require('./routes/sku.routes');
const cmRoutes = require('./routes/cm.routes');
const skuDetailsRoutes = require('./routes/skuDetails.routes');
const jwtMiddleware = require('./middleware/middleware.jwt');
const pool = require('./config/db.config');
const fastifyCors = require('@fastify/cors');
const skuAuditLogRoutes = require('./routes/skuAuditLog.routes');
const materialTypeMasterRoutes = require('./routes/materialTypeMaster.routes');
const masterComponentUmoRoutes = require('./routes/masterComponentUmo.routes');
const masterComponentPackagingLevelRoutes = require('./routes/masterComponentPackagingLevel.routes');
const masterComponentPackagingMaterialRoutes = require('./routes/masterComponentPackagingMaterial.routes');
const addComponentRoutes = require('./routes/addComponent.routes');
const componentMasterMaterialTypeRoutes = require('./routes/componentMasterMaterialType.routes');
const getComponentDetailsBySkuRoutes = require('./routes/getComponentDetailsBySku.routes');
const toggleComponentStatusRoutes = require('./routes/toggleComponentStatus.routes');
const addComponentAuditLogRoutes = require('./routes/addComponentAuditLog.routes');
const getComponentDetailsByYearAndCmRoutes = require('./routes/getComponentDetailsByYearAndCm.routes');
const getSignoffDetailsByCmRoutes = require('./routes/getSignoffDetailsByCm.routes');


// Register SKU routes
fastify.register(skuRoutes);

// Register CM routes
fastify.register(cmRoutes);

// Register SKU Details routes
fastify.register(skuDetailsRoutes);

// Register SKU Audit Log routes
fastify.register(skuAuditLogRoutes);

// Register Material Type Master routes
fastify.register(materialTypeMasterRoutes);

// Register Master Component UMO routes
fastify.register(masterComponentUmoRoutes);

// Register Master Component Packaging Level routes
fastify.register(masterComponentPackagingLevelRoutes);

// Register Master Component Packaging Material routes
fastify.register(masterComponentPackagingMaterialRoutes);

// Register Add Component routes
fastify.register(addComponentRoutes);

// Register Component Master Material Type routes
fastify.register(componentMasterMaterialTypeRoutes);

// Register Get Component Details by SKU routes
fastify.register(getComponentDetailsBySkuRoutes);

// Register Toggle Component Status routes
fastify.register(toggleComponentStatusRoutes);

// Register Add Component Audit Log routes
fastify.register(addComponentAuditLogRoutes);

// Register Get Component Details by Year and CM routes
fastify.register(getComponentDetailsByYearAndCmRoutes);

// Register Get Signoff Details by CM routes
fastify.register(getSignoffDetailsByCmRoutes);

// Add JWT middleware globally
//fastify.addHook('preHandler', jwtMiddleware);

// Test database connection
fastify.get('/db-test', async (request, reply) => {
  try {
    const result = await pool.query('SELECT NOW()');
    return { 
      status: 'Database connected successfully', 
      timestamp: result.rows[0].now 
    };
  } catch (error) {
    fastify.log.error('Database connection failed:', error);
    return reply.code(500).send({ 
      status: 'Database connection failed', 
      error: error.message 
    });
  }
});

// Start server
const start = async () => {
  try {
    // Test database connection on startup
    await pool.query('SELECT NOW()');
   // fastify.log.info('Database connected successfully');
    
    fastify.register(fastifyCors, {
      origin: ['http://localhost:5000'],
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
    });
    
    await fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
   // fastify.log.info(`Server running on port ${process.env.PORT || 3000}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 