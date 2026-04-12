#!/bin/bash

set -e

DEST="/var/www/cpu-monitor-frontend"

echo "Step 1: Building project..."
bun run build

echo "Step 2: Syncing files to $DEST..."
# Using sudo for the move and permission changes
sudo rsync -avz --delete dist/ "$DEST/"

echo "Step 3: Setting permissions..."
sudo chown -R nginx:nginx "$DEST"
sudo chmod -R 755 "$DEST"

echo "Step 4: Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "Deployment successful!"