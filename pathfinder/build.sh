#!/bin/bash
set -e

function build_report {
	echo "building $1"
	cd $1
	npm install
	cd ..
}

# List of custom reports to be built
build_report burndown
cd vtables
build_report appmap2platforms
build_report cimmasterlist
cd ..