#!/bin/bash

set -e

echo "Deploying PatenTrack..."

echo "Pulling latest changes..."
git pull

echo "Installing dependencies..."
pnpm install --frozen-lockfile

echo "Running linters..."
pnpm lint

echo "Running type checks..."
pnpm type-check

echo "Running tests..."
pnpm test

echo "Building all packages..."
pnpm build

echo "Running database migrations..."
pnpm db:migrate

echo "Restarting PM2 processes..."
pm2 restart infrastructure/ecosystem.config.js

echo "Deployment completed successfully!"
