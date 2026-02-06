#!/bin/bash

set -e

echo "Starting PatenTrack services..."

echo "Starting Docker services..."
cd infrastructure
docker-compose up -d
cd ..

echo "Waiting for services to be ready..."
sleep 5

echo "Running database migrations..."
pnpm db:migrate

echo "Running database seed..."
pnpm db:seed

echo "Building all packages..."
pnpm build

echo "Creating logs directory..."
mkdir -p logs

echo "Starting PM2 processes..."
pm2 start infrastructure/ecosystem.config.js

echo "PatenTrack services started successfully!"
echo ""
echo "Services:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo "  - API: localhost:3001"
echo ""
echo "Use 'pm2 status' to check PM2 processes"
echo "Use 'pm2 logs' to view logs"
