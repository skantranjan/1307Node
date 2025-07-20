#!/bin/bash

# ===== EIP DEVELOPMENT DEPLOYMENT SCRIPT =====

echo "🚀 Starting EIP Development Deployment..."

# Set environment
export NODE_ENV=development

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create logs directory
mkdir -p logs

# Start the application
echo "🚀 Starting application on EIP Dev environment..."
echo "📊 Environment: Development"
echo "🌐 Server: http://0.0.0.0:${PORT:-3000}"
echo "📁 Logs: logs/app.log"

# Start with PM2 for process management
if command -v pm2 &> /dev/null; then
    echo "📊 Using PM2 for process management..."
    pm2 start app.js --name "sustainability-api-dev" --log logs/app.log
    pm2 save
    pm2 startup
else
    echo "⚠️ PM2 not found, starting with node..."
    node app.js
fi

echo "✅ EIP Development deployment completed!"
echo "🔍 Check logs: tail -f logs/app.log" 