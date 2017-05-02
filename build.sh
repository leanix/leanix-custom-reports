#!/bin/bash
set -e

function build_report {
  echo "building $1"
  cd $1
  npm install
  gulp
  cd ..
  mkdir -p dist/$1
  cp -R $1/dist/* dist/$1
}

function build_report_with_cra {
  echo "building $1 with creat-react-app"
  cd $1
  npm install
  npm run build
  cd ..
  mkdir -p dist/$1
  cp -R $1/build/* dist/$1
}

npm install

# List of custom reports to be built
build_report burndown
build_report bubbles
build_report circle
build_report tables
build_report vtables
build_report_with_cra predecessor-successor