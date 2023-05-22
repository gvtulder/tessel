#!/bin/bash -xe

rm -rf public
mkdir -p public

cp style.css public/
cp icon.png public/

timestamp=$(date +%s)
sed -E 's/(style.css|main.js|icon.png)/\1?'$timestamp'/' < index.html > public/index.html

npm install --dev
rollup -c rollup-production.config.js

