class LeanixApi {
	
	constructor () {
		this.queryParams = getParams();
	}
		
	queryFactsheets(onSuccess, onError, relations, pageSize, types, filterRelations, filterAttributes) {
		checkParams(this.queryParams);
		if (!onSuccess) {
			throw new Error('"onSuccess" is missing.');
		}
		if (!onError) {
			throw new Error('"onError" is missing.');
		}
		if (relations === undefined || relations === null) {
			throw new Error('"relations" is missing.');
		}
		if (pageSize === undefined || pageSize === null) {
			throw new Error('"pageSize" is missing.');
		}
		let factsheetsUrl = '/factsheets?'
			// information about relations
			 + 'relations=' + relations
			// result limit
			 + '&pageSize=' + pageSize;
		if (types) {
			types.forEach((item) => {
				factsheetsUrl += '&types[]=' + item;
			});
		}
		if (filterRelations) {
			filterRelations.forEach((item) => {
				factsheetsUrl += '&filterRelations[]=' + item;
			});
		}
		if (filterAttributes) {
			filterAttributes.forEach((item) => {
				factsheetsUrl += '&filterAttributes[]=' + item;
			});
		}
		if (process.env.NODE_ENV === 'development') {
			// maybe query from proxy
			const proxyUrl = process.env.REACT_APP_PROXY;
			if (proxyUrl && proxyUrl.length !== 0) {
				sendGetRequest(proxyUrl + factsheetsUrl, this.queryParams, onSuccess, onError);
				return;
			}
		}
		// query the rest api
		sendGetRequest(this.queryParams.apiBaseUrl + factsheetsUrl, this.queryParams, onSuccess, onError);
	}
}

export default LeanixApi;

function addKeyValuePair(item, to) {
	const idx = item.indexOf('=');
	if (idx < 0) {
		return;
	}
	const key = item.substring(0, idx);
	to[key] = item.substring(idx + 1);
}

function sendGetRequest(url, params, onSuccess, onError) {
	let xhr = new XMLHttpRequest();
	xhr.addEventListener('load', function (evt) {
		if (evt.target.status === 200) {
			try {
				onSuccess(JSON.parse(evt.target.responseText));
			} catch (err) {
				onError(err);
			}
		} else {
			onError(evt.target);
		}
	});
	xhr.addEventListener('error', function (evt) {
		onError(evt.target);
	});
	xhr.open('GET', url);
	xhr.setRequestHeader('Authorization', 'Bearer ' + params.token);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.send();
}
function getParams() {
	if (process.env.NODE_ENV === 'development') {
		const customQueryParams = process.env.REACT_APP_CUSTOM_QUERY_PARAMS;
		let result = {};
		if (customQueryParams) {
			customQueryParams.split('&').forEach((item) => {
				addKeyValuePair(item, result);
			});
		}
		result['baseUrl'] = decodeURIComponent(process.env.REACT_APP_BASE_URL);
		result['apiBaseUrl'] = decodeURIComponent(process.env.REACT_APP_API_BASE_URL);
		result['token'] = process.env.REACT_APP_ACCESS_TOKEN;
		return result;
	}
	const keyValuePairs = window.location.search.substring(1).split('&');
	let result = {};
	keyValuePairs.forEach((item) => {
		addKeyValuePair(item, result);
	});
	// decode url's
	if (result.baseUrl) {
		result.baseUrl = decodeURIComponent(result.baseUrl);
	}
	if (result.apiBaseUrl) {
		result.apiBaseUrl = decodeURIComponent(result.apiBaseUrl);
	}
	return result;
}

function checkParams(params) {
	if (!params.baseUrl) {
		throw new Error('"baseUrl" is missing.');
	}
	if (!params.apiBaseUrl) {
		throw new Error('"apiBaseUrl" is missing.');
	}
	if (!params.token) {
		throw new Error('"token" is missing.');
	}	
}