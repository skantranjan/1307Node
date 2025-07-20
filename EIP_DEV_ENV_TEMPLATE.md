# EIP Development Environment Variables

Copy this template and fill in your EIP dev environment values:

```bash
# ===== EIP DEVELOPMENT ENVIRONMENT =====

# Node Environment
NODE_ENV=development

# Server Configuration
PORT=3000
HOST=0.0.0.0

# Database Configuration (EIP Dev Database)
PG_HOST=your-eip-dev-db-host
PG_PORT=5432
PG_USER=your-eip-dev-db-user
PG_PASSWORD=your-eip-dev-db-password
PG_DATABASE=your-eip-dev-db-name
PG_SSL=true

# Azure Storage Configuration (EIP Dev Storage)
AZURE_STORAGE_ACCOUNT=your-eip-dev-storage-account
AZURE_CONTAINER_NAME=your-eip-dev-container
AZURE_STORAGE_CONNECTION_STRING=your-eip-dev-connection-string
AZURE_USE_CONNECTION_STRING=true

# Security Configuration
JWT_SECRET=your-eip-dev-jwt-secret
CORS_ORIGIN=*

# Logging Configuration
LOG_LEVEL=info

# File Upload Configuration
MAX_FILE_SIZE=10mb
```

## Required EIP Dev Environment Values:

### Database (PostgreSQL):
- `PG_HOST`: EIP dev database host
- `PG_USER`: EIP dev database user
- `PG_PASSWORD`: EIP dev database password
- `PG_DATABASE`: EIP dev database name

### Azure Storage:
- `AZURE_STORAGE_ACCOUNT`: EIP dev storage account name
- `AZURE_CONTAINER_NAME`: EIP dev container name
- `AZURE_STORAGE_CONNECTION_STRING`: EIP dev storage connection string

### Security:
- `JWT_SECRET`: Unique JWT secret for dev environment
- `CORS_ORIGIN`: Allowed CORS origins (use * for dev)

## Deployment Steps:

1. **Set Environment Variables:**
   ```bash
   export $(cat .env.dev | xargs)
   ```

2. **Deploy to EIP Dev:**
   ```bash
   chmod +x deploy-eip-dev.sh
   ./deploy-eip-dev.sh
   ```

3. **Verify Deployment:**
   ```bash
   curl http://your-eip-dev-host:3000/health
   ``` 