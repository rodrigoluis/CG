#!/bin/bash

# note set -e is to exit on error
set -ex

git checkout gh-pages
git merge -s recursive -X theirs master
git checkout master
git branch
