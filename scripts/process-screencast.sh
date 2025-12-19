#!/bin/bash
cd $(dirname $0)/../fastlane/screencasts
for i in *.webm ; do
  ffmpeg -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 \
    -i $i -crf 10 -c:v libx264 -profile:v high -level 4.0 -pix_fmt yuv420p \
    -c:a aac -b:a 256k -ar 44100 -ac 2 -ss 00:00:00 -to 00:00:25 -shortest \
    -y $(basename $i .webm).mp4
done
