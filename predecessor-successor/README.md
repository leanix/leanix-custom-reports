# predecessor-successor
 
The content of this project realizes a custom [leanIX](https://www.leanix.net/) report. It uses the [leanIX rest api](https://dev.leanix.net/docs/api-overview). The project depends on [React](https://facebook.github.io/react/), [bootstrap](http://getbootstrap.com/) and [Polyfill.io](https://polyfill.io/v2/docs/).
 
## Table of Contents
 
- [Project setup](#project-setup)
- [Available scripts](#available-scripts)
 
## Project setup
 
This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app). The Latest user guide is available [here](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md).
 
1. `npm install -g create-react-app`
1. `npm install` in project directory
1. create an `.env` file in project directory (please read the comments in `default.env`)
 
## Available scripts
 
In the project directory, you can run:
 
`npm run createToken`
 
Updates the access token in the `.env` file.<br/>
The development server needs to be restarted, because modifing the `.env` file does not trigger an update.
 
`npm start`
 
Runs the app in the development mode (invokes `npm run createToken` first).<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.
 
The page will reload if you make edits (except `.env` file).<br>
You will also see any lint errors in the console.
 
`npm run build`
 
Builds the app for production to the `build` directory.<br>
See the create react app [user guide](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md) for more information.
