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
build_report applicationdataqualitycompleteness
build_report applicationlifecycleprojects
build_report appmap2bca
build_report appmap2cim
build_report appmap2etom
build_report appmap2platforms
build_report cimmasterlist
build_report csmoperations
build_report csmservices
cd ..