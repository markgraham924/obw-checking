#!/bin/bash

echo "Deploying Frontend..."

# Navigate to the repository root and pull the latest changes.
# cd /home/runneruser/obw-checking
git pull

# Install dependencies.
npm install

# Build the project using Vite (builds into the 'dist' folder).
npm run build

# Copy the build output from the 'dist' folder to the live directory.
cp -r dist/* /var/www/frontend/

# Reload nginx to ensure it serves the latest files.
systemctl reload nginx

echo "Frontend deployed successfully."
