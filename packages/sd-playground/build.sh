set -e

[ -d "dist" ] && rm -rf dist
mkdir dist
cp index.html dist/
cp index.js dist/

