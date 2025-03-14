echo npx pwa-asset-generator \
  pwa/logo.html pwa/generated/ \
  --type jpg --quality 90 \
  --manifest ./manifest.json \
  --index ./index.html \
  --splash-only

npx pwa-asset-generator \
  pwa/logo.svg pwa/generated/ \
  --padding 0 \
  --manifest ./manifest.json \
  --index ./index.html \
  --icon-only

