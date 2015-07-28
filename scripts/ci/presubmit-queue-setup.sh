#!/bin/bash
set -e -o pipefail

if [ "$TRAVIS_REPO_SLUG" = "angular/angular" ]; then
  if [[ $TRAVIS_BRANCH == "presubmit-"* ]]; then

    echo '*********************'
    echo '** PRESUBMIT SETUP **'
    echo '*********************'

    git config credential.helper "store --file=.git/credentials"
    # travis encrypt GITHUB_TOKEN_ANGULAR=??? --repo=angular/angular
    echo "https://${GITHUB_TOKEN_ANGULAR}:@github.com" > .git/credentials
    git config user.name "travis@travis-ci.org"

    git remote add upstream https://github.com/angular/angular.git
    git fetch upstream master
    git rebase upstream/master
  fi
fi
