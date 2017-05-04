# How to setup a create-react-app based project

This project setup methods uses an advanced build tool: [Create React app](https://github.com/facebookincubator/create-react-app)

Create React app projects may use ES6 (ECMAScript2015) syntax, but transpiles the code to ES5 syntax on build so that it's backward compatible. ES6 API's must be provided with polyfills. [Polyfill.io](https://polyfill.io/v2/docs/) is recommended (included in the guide below), which injects all polyfills based on the user agent string of the browser.

See [predecessor-successor project](predecessor-successor/README.md) for an example.

## Table of Contents
 
- [Create the project](#create-the-project)
- [Add bootstrap to the project](#add-bootstrap-to-the-project)
- [Add react-bootstrap-table to the project](#add-react-bootstrap-table-to-the-project)

## Create the project

* `npm install -g create-react-app`
* from the root folder: `create-react-app ${project.name}`
* go to `${project.name}` folder
* extend the `scripts` block in `package.json` with

```json
"scripts": {
	"createToken": "node ./lib/createToken.js",
	"prestart": "npm run createToken",
	...
}
```

* add `"homepage": ".",` inside of the root object in `package.json`
* add `<script src="https://cdn.polyfill.io/v2/polyfill.min.js?features=es6"></script>` inside of the `head` element in `public/index.html`
* copy the the files
	* from root `lib/createToken.js` to `${project.name}/lib`
	* from root `lib/LeanixApi.js` to `${project.name}/src`
	* from root `lib/default.env` to `${project.name}`
* create a `.env` file based on `default.env` in `${project.name}`

## Add bootstrap to the project

[Bootstrap](http://getbootstrap.com/)

* `npm install bootstrap --save`
* add the content below at the beginning of `src/index.js`

```javascript
// 3rd party css files
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';
```

## Add react-bootstrap-table to the project

[react-bootstrap-table](http://allenfang.github.io/react-bootstrap-table/)

* `npm install react-bootstrap-table --save`
* add the content below at the beginning (but after bootstrap imports) of `src/index.js`

```javascript
// 3rd party css files
import 'react-bootstrap-table/css/react-bootstrap-table.css';
```