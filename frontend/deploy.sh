#!/bin/bash

echo "Deploying Frontend..."

# Navigate to the repository root and pull latest changes
cd /home/runneruser/obw-checking
git pull

# Switch to the frontend folder
cd frontend

# Install dependencies
npm install

# Build the project using Vite (builds into the 'dist' folder)
npm run build

# Copy the build output from the 'dist' folder to your live directory.
# Make sure /var/www/frontend exists and runneruser has write permissions.
cp -r dist/* /var/www/frontend/

# Restart or start the static server via PM2 using your start script.
# This command uses npm to run "start" which runs our server.js.
sudo pm2 restart frontend || pm2 start npm --name frontend -- run start

echo "Frontend deployed successfully."
