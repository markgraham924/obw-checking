#!/bin/bash

echo "Deploying Backend..."

# Change to the repository root and pull the latest changes.
git pull

# Switch to the backend folder.
cd backend

# Install dependencies.
npm install

# (Optional) Build the project if needed.
# npm run build

# Restart the backend service using PM2.
# For example, if you've already started your backend with PM2 as:
# pm2 start index.js --name backend 
pm2 restart backend || pm2 start index.js --name backend

echo "Backend deployed successfully."
