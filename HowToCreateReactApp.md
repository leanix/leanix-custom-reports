# How to setup a create-react-app based project

This project setup methods uses an advanced build tool: [Create React app](https://github.com/facebookincubator/create-react-app)

See [predecessor-successor project](predecessor-successor/README.md) for an example.

## Table of Contents
 
- [Create the project](#create-the-project)
- [Add bootstrap to the project](#add-bootstrap-to-the-project)
- [Add react-bootstrap-table to the project](#add-react-bootstrap-table-to-the-project)

## Create the project

* `npm install -g create-react-app`
* from the root folder: `create-react-app ${project.name}`
* go to `${project.name}` folder
* replace the `scripts` block in `package.json` with

```json
"scripts": {
	"createToken": "node ./lib/createToken.js",
	"prestart": "npm run createToken",
	"start": "react-scripts start",
	"build": "react-scripts build",
	"test": "react-scripts test --env=jsdom",
	"eject": "react-scripts eject"
}
```

* add `"homepage": ".",` inside of the root object in `package.json`
* add `<script src="https://cdn.polyfill.io/v2/polyfill.min.js?features=es6"></script>` inside of the `head` element in `public/index.html`
* copy the following files
	* from root `lib/createToken.js` to `${project.name}/lib`
	* from root `lib/LeanixApi.js` to `${project.name}/src`
	* from root `lib/default.env` to `${project.name}`
* create a `.env` file based on `default.env` in `${project.name}`

## Add bootstrap to the project

* `npm install bootstrap --save`
* add the following below at the beginning of `src/index.js`

```javascript
// 3rd party css files
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';
```

## Add react-bootstrap-table to the project

* `npm install react-bootstrap-table --save`
* add the following below at the beginning of `src/index.js`

```javascript
// 3rd party css files
import 'react-bootstrap-table/css/react-bootstrap-table.css';
```