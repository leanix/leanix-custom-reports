# leanix-custom-reports

Contains custom reports (e.g. based on d3js) which can be included into leanIX reporting.
These reports are hosted via github-pages and are available under the following base url: **leanix.github.io/leanix-custom-reports**

In order to include a custom report into leanIX you have to extend the base url with the path to the target reports index.html. As an example for the master version of the bubbles report the base url has to be extended with **/master/bubbles/index.html**. This means the final url that has to be configured in leanIX is: https://leanix.github.io/leanix-custom-reports/master/bubbles/index.html

### Requirements for each report

Each custom report is located in its own subdirectory. It is expected that the subdirectory can be built via the ```gulp``` command or with ```npm run build``` (create-react-app based project setups), which puts all relevant files into a ```dist``` directory.

### Adding a new custom report

* Create a new directory named after the custom report by copying the ```template``` directory (gulp based project setup) or
* follow the instructions in [create-react-app based project setup](HowToCreateReactApp.md)
* Add a new line to ```build.sh``` for your subdirectory based on the project setup method

### npm run createLink

You can use ```npm run createLink``` (in project root) to create a ```link.html``` file that automatically contains the required query parameters (baseUrl, apiBaseUrl, token etc.) to start a report (for gulp based project setup only). See ```default_link.properties``` for more information. Before opening ```link.html``` in your browser you have to start your dev server (in report directory). Overtime the generated access token will expire (HTTP status code 401 Unauthorized in console). In this case please re-run the npm script and open ```link.html``` again.

Note: The script doesn't support any proxy setting (nodejs doesn't either). So, if you're behind a proxy, please contact us and we might figure out a solution.

### Publishing for github pages

In order to publish the current master or develop branch to github pages the command ```publish.sh``` can be executed. Before doing this make sure that the dist directory is up-to-date by executing ```build.sh```.

* Execute build.sh
* Commit everything
* Execute publish.sh
