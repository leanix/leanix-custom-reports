# Technopedia

The table report shows an overview of applications, their IT components and the current coverage with information from Technopedia.

## Table of Contents

- [Project setup](#project-setup)
- [Available scripts](#available-scripts)
- [Requirements](#requirements)

## Project setup

This project was bootstrapped with [leanix-reporting-cli](https://github.com/leanix/leanix-reporting-cli).

1. `npm install -g @leanix/reporting-cli`
1. `npm install` in project directory
1. create a `lxr.json` file in project directory (please see [Getting started](https://github.com/leanix/leanix-reporting-cli#getting-started))

## Available scripts

In the project directory, one can run:

`npm start`

This command will start the local development server. Please make sure you're logged in the leanIX workspace from `lxr.json` first.

`npm run upload`

Please see [Uploading to LeanIX workspace](https://github.com/leanix/leanix-reporting-cli#uploading-to-leanix-workspace).

## Requirements

1.  table report with columns  
	* **Application Name** with link to the factsheet
	* **IT Component Name** with link to the factsheet
	* **IT Component Type** (only *Software* and *Hardware* (without *Service*))
	* **Technopedia Status** (1. URL, 2. Ignore, 3. Missing, 4. Blank (should be displayed as an empty string))
	* **Count in other markets** using this IT component (If the application is called XXName (XX is for the market, naming convention with is valid for all apps), count all applications with prefix != XX_ referenced by the same IT component)
1.  no colum for / filter by 'Market' (will be done via application prefix)
1.  filter in each column
1.  button 'Export CSV'
1.  search
1.  one row for each application
1.  one row for each combination (application -- IT component)
1.  only applications with the tag 'Applications'
1.  only applications with the IT component types *Software* and *Hardware*