#!/bin/bash -xe

rm -rf public

npm install --dev
rollup -c rollup-production.config.js

timestamp=$(date +%s)
sed -E 's/(style.css|main.js|icon.png)/\1?t='$timestamp'/' < index.html > public/index.html

