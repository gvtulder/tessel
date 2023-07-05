#!/bin/bash -xe

rm -rf public

npm install --include=dev
rollup -c rollup-production.config.js

sed --in-place "s/{version}/$(git rev-parse --short HEAD)/" public/dist/main.js

