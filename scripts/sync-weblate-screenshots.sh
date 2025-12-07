#!/bin/bash
set -e
export TOKEN=$( cat $(dirname $0)/../android-keystore/weblate-screenshot-api-token.txt )

api() {
  curl --silent -H "Authorization: Token $TOKEN" "$@"
}

for component in about-page game ; do
  screenshot_list=$( api "https://hosted.weblate.org/api/components/tessel/${component}/screenshots/" )
  for screenshot in $(dirname $0)/../weblate-screenshots/*.png ; do
    name=$(basename $screenshot .png)
    file_url=$(echo "$screenshot_list" | jq --raw-output ".results | map(select(.name == \"${name}\"))[0].file_url")
    if [[ $file_url =~ https://hosted.weblate.org/* ]] ; then
      echo "Uploading $name to $component"
      api "$file_url" -X POST -F "image=@$screenshot" | jq .result
    fi
  done
done

