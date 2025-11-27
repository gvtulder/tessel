#!/usr/bin/env python3
import argparse
import os.path
import re

parser = argparse.ArgumentParser()
parser.add_argument("--version", required=True)
parser.add_argument("--build-gradle-path",
    default=os.path.join(os.path.dirname(__file__), "../android/app/build.gradle"))
parser.add_argument("--project-pbxproj-path",
    default=os.path.join(os.path.dirname(__file__), "../ios/App/App.xcodeproj/project.pbxproj"))
parser.add_argument("--package-json-path",
    default=os.path.join(os.path.dirname(__file__), "../package.json"))
args = parser.parse_args()

if not re.match(r"^[0-9]+\.[0-9]+\.[0-9]+$", args.version):
    raise Exception("invalid version")

split_version = args.version.split(".")
version_code = int("%d%02d%02d" % tuple(int(i) for i in split_version))

with open(args.build_gradle_path, "r") as f:
    txt = f.read()

txt = re.sub(r'^(\s+versionCode\s+)([0-9]+)', fr'\g<1>{version_code}', txt, flags=re.M)
txt = re.sub(r'^(\s+versionName\s+")([0-9.]+)(")', fr'\g<1>{args.version}\g<3>', txt, flags=re.M)

with open(args.build_gradle_path, "w") as f:
    f.write(txt)

with open(args.project_pbxproj_path, "r") as f:
    txt = f.read()

txt = re.sub(r'^(\s+CURRENT_PROJECT_VERSION\s*=\s*)([0-9]+)(;)', fr'\g<1>{version_code}\g<3>', txt, flags=re.M)
txt = re.sub(r'^(\s+MARKETING_VERSION\s*=\s*)([0-9.]+)(;)', fr'\g<1>{args.version}\g<3>', txt, flags=re.M)

with open(args.project_pbxproj_path, "w") as f:
    f.write(txt)

with open(args.package_json_path, "r") as f:
    txt = f.read()

txt = re.sub(r'^(\s+"version"\s*:\s*")([0-9.]+)(")', fr'\g<1>{args.version}\g<3>', txt, flags=re.M)

with open(args.package_json_path, "w") as f:
    f.write(txt)
