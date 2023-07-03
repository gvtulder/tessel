#!/bin/bash

rm -rf public
mkdir -p public
mkdir -p public/fonts 

cp style.css public/
cp icon.png public/
cp fonts/* public/fonts/

timestamp=$(date +%s)
sed -E 's/(style.css|main.js|icon.png)/\1?'$timestamp'/' < index.html > public/index.html
cp newgame.html public/
cp editor.html public/


rollup -c rollup-production.config.js

rsync -avz public/ 10.10.10.11:/var/www/html/tilegame/2/
