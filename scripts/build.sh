#!/bin/bash

SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
PACKAGES_DIR="$SCRIPT_DIR/../packages"
DIST_DIR="$SCRIPT_DIR/../dist"

mkdir -p "$DIST_DIR"

for PACKAGE in "$PACKAGES_DIR"/*; do
  if [ -f "$PACKAGE/package.json" ]; then
    echo "Building $PACKAGE..."
    
    cd "$PACKAGE"
    pnpm build
    
    if [ -d "dist" ]; then
      PROJECT_NAME=$(basename "$PACKAGE")

      mv dist "$DIST_DIR/$PROJECT_NAME"
      
      echo "Build and move successful for $PACKAGE"
    else
      echo "Build failed or dist folder does not exist for $PACKAGE"
    fi
    
    cd "$SCRIPT_DIR"
  else
    echo "No package.json found in $PACKAGE, skipping..."
  fi
done

echo "All builds are complete."