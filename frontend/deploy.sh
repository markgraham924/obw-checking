#!/bin/bash

echo "Deploying Frontend..."

# No need to change to an absolute path if you're working relative to the repo root.
# If you want to pull changes, you can do that directly.
git pull

# Install dependencies
npm install

# Build the project using Vite (outputs into the 'dist' folder)
npm run build

# Copy the build output from the 'dist' folder to your live directory.
# Make sure /var/www/frontend exists and runneruser has write permissions.
cp -r dist/* /var/www/frontend/

# Restart or start the static server via PM2 using your start script.
pm2 restart frontend || pm2 start npm --name frontend -- run start

echo "Frontend deployed successfully."
