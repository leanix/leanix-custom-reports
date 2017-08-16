#!/bin/bash
set -e

function install_report {
	echo "installing $1"
	cd $1
	npm install
	cd ..
}

# List of custom reports to be built
install_report burndown
cd vtables
install_report applicationdataqualitycompleteness
install_report applicationlifecycleprojects
install_report appmap2bca
install_report appmap2cim
install_report appmap2etom
install_report appmap2platforms
install_report cimmasterlist
install_report csmoperations
install_report csmservices
install_report globalapplicationportfolio
install_report technopedia
cd ..