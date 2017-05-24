/*
 * based on https://dev.leanix.net/docs/authentication
 */

'use strict';

const fs = require('fs');
const https = require('https');

// read .env file
const envFilePath = './.env';
if (!fs.existsSync(envFilePath)) {
	console.error('.env file is missing. Please create one with default.env as template.');
	return;
}
const envFile = fs.readFileSync(envFilePath, 'UTF-8');
const keyValuePairs = getKeyValuePairs(envFile);

// handle proxy value
const proxyUrl = keyValuePairs.REACT_APP_PROXY;
if (proxyUrl && proxyUrl.length !== 0) {
	console.info('Proxy url is set. Skip generating token.');
	return;
}

// extract keyValues from .env file
const instance = keyValuePairs.INSTANCE;
const workspace = keyValuePairs.WORKSPACE;
const apiToken = keyValuePairs.API_TOKEN;

// validate keyValues
if (!instance) {
	console.error('INSTANCE is missing in .env file.');
	return;
}
if (!workspace) {
	console.error('WORKSPACE is missing in .env file.');
	return;
}
if (!apiToken) {
	console.error('API_TOKEN is missing in .env file.');
	return;
}

// query access token & update .env file
const auth = btoa('apitoken:' + apiToken);
const options = {
	host: instance.substring(8), // w/o protocol
	method: 'POST',
	path: '/services/mtm/v1/oauth2/token',
	headers: {
		'authorization': 'Basic ' + auth,
		'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
	}
}
const body = 'grant_type=client_credentials';
const request = https.request(options, res => {
		let error = checkResponse(res);
		if (error) {
			printError(error);
			res.resume();
			return;
		}
		// extract response body
		res.setEncoding('utf8');
		let rawData = '';
		res.on('data', chunk => rawData += chunk);
		res.on('end', () => {
			try {
				let parsedData = JSON.parse(rawData);
				// write to .env file
				writeEnvFile(keyValuePairs, parsedData.access_token);
				console.log(envFilePath + ' has been written. Please restart your webserver.');
			} catch (e) {
				printError(e);
			}
		});
	});
request.write(body);
request.end();
request.on('error', printError);

function getKeyValuePairs(from) {
	const a = from.split('\n');
	let result = {};
	for (let i = 0, len = a.length; i < len; i++) {
		const str = a[i].trim();
		const idx = str.indexOf('=');
		if (idx < 0) {
			continue;
		}
		const key = str.substring(0, idx);
		if (!key || key.length === 0 || key.startsWith('#')) {
			continue;
		}
		result[key] = str.substring(idx + 1);
	}
	return result;
}

function btoa(str) {
	return new Buffer(str).toString('base64');
}

function checkResponse(res) {
	const statusCode = res.statusCode;
	const contentType = res.headers['content-type'];
	let error;
	if (statusCode !== 200) {
		error = new Error('Request Failed.\nStatus Code: ' + statusCode);
	} else if (!/^application\/json/.test(contentType)) {
		error = new Error('Invalid content-type.\nExpected application/json but received ' + contentType);
	}
	return error;
}

function writeEnvFile(keyValuePairs, access_token) {
	keyValuePairs.REACT_APP_BASE_URL = keyValuePairs.INSTANCE + '/' + keyValuePairs.WORKSPACE;
	keyValuePairs.REACT_APP_API_BASE_URL = keyValuePairs.REACT_APP_BASE_URL + '/api/v1';
	keyValuePairs.REACT_APP_ACCESS_TOKEN = access_token;
	const str = toEnvString(keyValuePairs);
	fs.writeFileSync(envFilePath, str);
}

function toEnvString(keyValuePairs) {
	let result = '';
	for (let prop in keyValuePairs) {
		result += prop + '=' + keyValuePairs[prop] + '\n';
	}
	return result;
}

function printError(e) {
	console.log('Error:');
	console.log(e);
}
