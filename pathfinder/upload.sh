#!/bin/bash
set -e

function upload_report {
	echo -e "\033[0;32m>>> Uploading $1 \033[0m"
	cd $1
	npm run upload
	cd ..
}

echo -e "\033[0;32m>>> I'll upload them all ... \033[0m"
echo -e "            ((((     "
echo -e "             ))))    "
echo -e "          _ .---.    "
echo -e "         ( |\`---'|  "
echo -e "          \|     |   "
echo -e "          : .___, :  \033[0;32m... Time for some coffee! \033[0m"
echo -e "           \`-----'  "

# List of custom reports to be uploaded
upload_report burndown
cd vtables
upload_report applicationdataqualitycompleteness
upload_report applicationlifecycleprojects
upload_report appmap2bca
upload_report appmap2cim
upload_report appmap2etom
upload_report appmap2platforms
upload_report cimmasterlist
upload_report csmoperations
upload_report csmservices
upload_report decommissioningcommissioningapplications
upload_report globalapplicationportfolio
upload_report technopedia
cd ..