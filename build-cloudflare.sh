#!/bin/bash -xe

rm -rf public

npm install --include=dev
rollup -c rollup-production.config.js

version="$(git rev-parse --short HEAD)"
sed --in-place "s/{version}/${version}/" public/dist/main.js
echo "const version='${version}';" >> public/sw.js

