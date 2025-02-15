#!/bin/bash

echo "Deploying Frontend..."

# Navigate to the repository root and pull the latest changes.
cd /home/runneruser/obw-checking
git pull

# Switch to the frontend folder.
cd frontend

# Install dependencies.
npm install

# Build the project using Vite (builds into the 'dist' folder).
npm run build

# Ensure the live directory exists and has correct permissions.
sudo mkdir -p /var/www/frontend
sudo chown runneruser:runneruser /var/www/frontend

# Copy the build output from the 'dist' folder to the live directory.
cp -r dist/* /var/www/frontend/

# Reload nginx to ensure it serves the latest files.
sudo systemctl reload nginx

echo "Frontend deployed successfully."
