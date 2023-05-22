#!/bin/bash

rm -rf public
mkdir -p public

cp style.css public/
cp icon.png public/

timestamp=$(date +%s)
sed -E 's/(style.css|main.js|icon.png)/\1?'$timestamp'/' < index.html > public/index.html
cp newgame.html public/
mkdir -p public/fonts/
cp fonts/source-sans-3-latin-400.woff public/fonts/


rollup -c rollup-production.config.js

rsync -avz public/ 10.10.10.11:/var/www/html/tilegame/2/
