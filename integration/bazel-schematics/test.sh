#!/usr/bin/env bash

set -eux -o pipefail

function installLocalPackages() {
  # Install Angular packages that are built locally from HEAD.
  # This also gets around the bug whereby yarn caches local `file://` urls.
  # See https://github.com/yarnpkg/yarn/issues/2165
  readonly pwd=$(pwd)
  readonly packages=(
    animations common compiler core forms platform-browser
    platform-browser-dynamic router bazel compiler-cli language-service
  )
  local local_packages=()
  for package in "${packages[@]}"; do
    local_packages+=("@angular/${package}@file:${pwd}/../../../dist/packages-dist/${package}")
  done

  # keep typescript, tslib, and @types/node versions in sync with the ones used in this repo
  local_packages+=("typescript@file:${pwd}/../../../node_modules/typescript")
  local_packages+=("tslib@file:${pwd}/../../../node_modules/tslib")
  local_packages+=("@types/node@file:${pwd}/../../../node_modules/@types/node")

  yarn add --ignore-scripts --silent "${local_packages[@]}"
}


function testBazel() {
  # Set up
  bazel version
  ng version
  rm -rf demo
  # Create project
  ng new demo --collection=@angular/bazel --routing --skip-git --skip-install --style=scss
  cd demo
  installLocalPackages
  ng generate component widget --style=css
  ng build
  ng test
  ng e2e
  ng e2e --prod
  if [ -e 'WORKSPACE' ] || [ -e 'BUILD.bazel' ]; then
    echo 'WORKSPACE / BUILD.bazel file should not exist in project'
    exit 1
  fi
}

function testNonBazel() {
  # Replace angular.json that uses Bazel builder with the default generated by CLI
  mv ./angular.json.bak ./angular.json
  rm -rf dist src/main.dev.ts src/main.prod.ts
  # disable CLI's version check (if version is 0.0.0, then no version check happens)
  yarn --cwd node_modules/@angular/cli version --new-version 0.0.0 --no-git-tag-version
  # re-add build-angular
  yarn add --dev @angular-devkit/build-angular@0.900.0-rc.3
  yarn webdriver-manager update --gecko=false --standalone=false ${CI_CHROMEDRIVER_VERSION_ARG:---versions.chrome 2.45}
  ng build --progress=false
  ng test --progress=false --watch=false
  ng e2e --configuration=production --webdriver-update=false
}

testBazel

# this test verifies that users can undo bazel - the value of this is questionable
# because there are way too many manual steps and it would be easier for users to
# just revert the diff created by `ng add @angular/bazel`
testNonBazel
