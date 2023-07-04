#!/bin/bash -xe

rm -rf public

timestamp=$(date +%s)
sed -E 's/(style.css|main.js|icon.png)/\1?'$timestamp'/' < index.html > public/index.html

npm install --dev
rollup -c rollup-production.config.js

