#!/bin/bash
set -e

function install_report {
	echo -e "\033[0;32m>>> Installing $1 \033[0m"
	cd $1
	npm install
	cd ..
}

echo -e "\033[0;32m>>> I'll install them all ... \033[0m"
echo -e "            ((((     "
echo -e "             ))))    "
echo -e "          _ .---.    "
echo -e "         ( |\`---'|  "
echo -e "          \|     |   "
echo -e "          : .___, :  \033[0;32m... Time for some coffee! \033[0m"
echo -e "           \`-----'  "

# List of custom reports to be built
install_report burndown
cd vtables
install_report applicationcloudmaturityandadoption
install_report applicationdataqualitycompleteness
install_report applicationlifecycleprojects
install_report appmap2bca
install_report appmap2cim
install_report appmap2etom
install_report appmap2platforms
install_report cimmasterlist
install_report csmoperations
install_report csmservices
install_report decommissioningcommissioningapplications
install_report globalapplicationportfolio
install_report projectdataqualitycompleteness
install_report technopedia
cd ..