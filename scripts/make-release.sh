#!/bin/bash
set -e
ls -1 fastlane/metadata/android/en-US/changelogs | sort -h | tail -n 3
read -p "Version? " version
echo $version
oldVersionCode=$( grep versionCode android/app/build.gradle | grep -ohE "[0-9]+" )
scripts/update-app-version.py --version $version
versionCode=$( grep versionCode android/app/build.gradle | grep -ohE "[0-9]+" )

vim -o \
  fastlane/metadata/android/en-US/changelogs/$versionCode.txt \
  fastlane/metadata/android/en-US/changelogs/$oldVersionCode.txt

sed --in-place -E 's/^[*-.] /• /' fastlane/metadata/android/en-US/changelogs/$versionCode.txt

cat fastlane/metadata/android/en-US/changelogs/$versionCode.txt > fastlane/metadata/ios/en-US/release_notes.txt

for lang_dir in fastlane/metadata/android/* ; do
  langAndroid=$(basename $lang_dir)
  if [[ $langAndroid != en-* ]] && [[ $langAndroid != *.txt ]] ; then
    langIOS=$langAndroid
    [[ $langAndroid == tr-TR ]] && langIOS=tr
    [[ $langAndroid == zh-TW ]] && langIOS=zh-Hant
    [[ $langAndroid == zh-CN ]] && langIOS=zh-Hans

    if [[ -f fastlane/metadata/android/${langAndroid}/generic_release_notes.txt ]] ; then
      echo "Copying release notes for $langAndroid"
      mkdir -p fastlane/metadata/android/${langAndroid}/changelogs/
      cat fastlane/metadata/android/${langAndroid}/generic_release_notes.txt > fastlane/metadata/android/${langAndroid}/changelogs/$versionCode.txt
      echo >> fastlane/metadata/android/${langAndroid}/changelogs/$versionCode.txt
      cat fastlane/metadata/android/en-US/changelogs/$versionCode.txt >> fastlane/metadata/android/${langAndroid}/changelogs/$versionCode.txt
      if [[ -e "fastlane/metadata/ios/${langIOS}" ]] ; then
        cat fastlane/metadata/android/${langAndroid}/changelogs/$versionCode.txt > fastlane/metadata/ios/${langIOS}/release_notes.txt
      fi
    fi
  fi
done

git add fastlane/metadata/android/*/changelogs/ fastlane/metadata/ios/*/release_notes.txt
git add -p
git commit --edit -m "Version $version."
git tag -a v$version -m "Version $version."
echo git push origin main v$version
echo
echo "bundle exec fastlane ios update_metadata_screenshots"
echo "bundle exec fastlane android update_metadata_screenshots"
