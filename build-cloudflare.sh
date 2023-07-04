#!/bin/bash -xe

rm -rf public

npm install --dev
rollup -c rollup-production.config.js

