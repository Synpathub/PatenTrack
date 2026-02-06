#!/bin/bash

set -e

echo "Stopping PatenTrack services..."

echo "Stopping PM2 processes..."
pm2 stop infrastructure/ecosystem.config.js || true
pm2 delete infrastructure/ecosystem.config.js || true

echo "Stopping Docker services..."
cd infrastructure
docker-compose down
cd ..

echo "PatenTrack services stopped successfully!"
