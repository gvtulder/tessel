#!/bin/bash
set -e

OPTIPNG="optipng -quiet -strip all"
SVGO="svgo --multipass"

# make screenshots in assets/screenshots and docs/images
if [[ $1 == screenshots ]] ; then
  npx tsx scripts/make-screenshots.ts
  $OPTIPNG assets/screenshots/*.png
fi

# copy main screenshots
cp assets/src/screenshots/* assets/screenshots/
$OPTIPNG assets/screenshots/*.png
$OPTIPNG docs/images/*.png

# build social images
for size in 1024x500 1200x630 1200x1200 ; do
   rsvg-convert assets/src/social-${size}.svg \
     -w ${size/x*/} \
     -b "#f2f2f2" \
     -o assets/social/tessel-${size}.png
   $OPTIPNG assets/social/tessel-${size}.png
done

# make badge
cp assets/src/play-now-badge.svg assets/social/play-now-badge.svg
$SVGO assets/social/play-now-badge.svg
rsvg-convert assets/src/play-now-badge.svg \
  -h 250 -o assets/social/play-now-badge.png
$OPTIPNG assets/social/play-now-badge.png
cp assets/src/apple-app-store.svg assets/social/apple-app-store.svg
$SVGO assets/social/apple-app-store.svg
rsvg-convert assets/src/apple-app-store.svg \
  -h 250 -o assets/social/apple-app-store.png
$OPTIPNG assets/social/apple-app-store.png

# copy to metadata screenshots
$OPTIPNG fastlane/metadata/android/en-US/images/phoneScreenshots/*.png

# build feature graphic
rsvg-convert assets/src/featureGraphic.svg \
  -b "#f2f2f2" -w 1024 -h 500 \
  -o fastlane/metadata/android/en-US/images/featureGraphic.png
$OPTIPNG fastlane/metadata/android/en-US/images/featureGraphic.png
rsvg-convert assets/src/featureGraphic-with-text.svg \
  -b "#f2f2f2" -w 1024 -h 500 \
  -o fastlane/metadata/android/en-US/images/featureGraphic.png
$OPTIPNG fastlane/metadata/android/en-US/images/featureGraphic.png

# build icons
cp assets/src/icon-square.svg assets/icons/icon.svg
rsvg-convert assets/icons/icon.svg -w 180 -h 180 -o assets/icons/icon.png
for size in 48 180 192 512 1024 ; do
   rsvg-convert assets/src/icon-square.svg -w ${size} -h ${size} -o assets/icons/icon-${size}.png
   $OPTIPNG assets/icons/icon-${size}.png
done
cp assets/icons/icon-512.png assets/icons/apple-touch-icon.png
convert assets/icons/icon-48.png assets/icons/favicon.ico

# fastlane for Android
cp assets/icons/icon-512.png \
   fastlane/metadata/android/en-US/images/icon.png

# build logo
cp assets/src/logo-tile-only.svg assets/logo/logo-tile-only.svg
cp assets/src/logo-with-tile.svg assets/logo/logo-with-tile.svg
$SVGO assets/logo/logo-tile-only.svg
$SVGO assets/logo/logo-with-tile.svg
rsvg-convert assets/src/logo-tile-only.svg -h 300 -o assets/logo/logo-tile-only.png
rsvg-convert assets/src/logo-with-tile.svg -h 300 -o assets/logo/logo-with-tile.png
$OPTIPNG assets/logo/*.png

# build Android app icons and splash
cp assets/src/logo-tile-only.svg assets/capacitor/logo.svg
npx @capacitor/assets generate \
   --iconBackgroundColor "#eeeeee" \
   --iconBackgroundColorDark "#222222" \
   --splashBackgroundColor "#eeeeee" \
   --splashBackgroundColorDark "#111111" \
   --android \
   --assetPath assets/capacitor/
