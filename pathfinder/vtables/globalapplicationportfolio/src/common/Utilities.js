function getCurrentLifecycle(node, timestamp) {
	if (!hasLifecycle(node)) {
		return;
	}
	let result = undefined;
	const now = timestamp ? timestamp : Date.now();
	node.lifecycle.phases.forEach((e) => {
		const lcDate = Date.parse(e.startDate + ' 00:00:00');
		if (lcDate <= now) {
			result = e;
		}
	});
	return createLifecycleObj(result);
}

function hasLifecycle(node) {
	return node && node.lifecycle && node.lifecycle.phases
		&& Array.isArray(node.lifecycle.phases) && node.lifecycle.phases.length > 0;
}

function createLifecycleObj(lifecyclePhase) {
	if (!lifecyclePhase) {
		return;
	}
	return {
		phase: lifecyclePhase.phase,
		// that's a timestamp as number
		startDate: Date.parse(lifecyclePhase.startDate + ' 00:00:00')
	};
}

function getLifecycleModel(setup, factsheetName) {
	if (!setup) {
		return [];
	}
	if (factsheetName) {
		const factsheetModel = setup.settings.dataModel.factSheets[factsheetName];
		if (!factsheetModel ||
			!factsheetModel.fields ||
			!factsheetModel.fields.lifecycle ||
			factsheetModel.fields.lifecycle.type !== 'LIFECYCLE' ||
			!Array.isArray(factsheetModel.fields.lifecycle.values)
		) {
			return [];
		}
		return factsheetModel.fields.lifecycle.values;
	} else {
		// TODO iterate all factsheets and compose the array
	}
}

function getLifecycles(node) {
	if (!hasLifecycle(node)) {
		return [];
	}
	return node.lifecycle.phases.map((e) => {
		return createLifecycleObj(e);
	});
}

function getLifecyclePhase(lifecycles, phase) {
	if (!lifecycles || !phase) {
		return;
	}
	for (let i = 0; i < lifecycles.length; i++) {
		const lifecycle = lifecycles[i];
		if (lifecycle && lifecycle.phase === phase) {
			return lifecycle;
		}
	}
}

function getFrom(obj, path, defaultValue) {
	if (!obj) {
		return defaultValue;
	}
	const pathArray = path.split(/\./);
	let result = obj;
	for (let i = 0; i < pathArray.length; i++) {
		result = result[pathArray[i]];
		if (!result) {
			break;
		}
	}
	return result ? result : defaultValue;
}

function createOptionsObj(optionValues) {
	if (!optionValues || !Array.isArray(optionValues)) {
		return {};
	}
	return optionValues.reduce((r, e, i) => {
		r[i] = e.name ? e.name : e;
		return r;
	}, {});
}

function createOptionsObjFrom(obj, path) {
	return createOptionsObj(getFrom(obj, path, []));
}

function getKeyToValue(obj, value) {
	if (!obj) {
		return;
	}
	for (let key in obj) {
		if (obj[key] === value) {
			return key;
		}
	}
}

function isProductionPhase(lifecycle) {
	if (!lifecycle || !lifecycle.phase) {
		return false;
	}
	switch (lifecycle.phase) {
		case 'phaseIn':
		case 'active':
		case 'phaseOut':
			return true;
		case 'plan':
		case 'endOfLife':
		default:
			return false;
	}
}

const marketRE = /^([A-Z]+)_/;

function getMarket(application) {
	if (!application) {
		return;
	}
	const m = marketRE.exec(application.name);
	if (!m) {
		return;
	}
	return m[1]; // first one is the match, followed by group matches
}

function copyObject(obj) {
	const result = {};
	if (!obj) {
		return result;
	}
	for (let key in obj) {
		result[key] = obj[key];
	}
	return result;
}

function copyArray(arr) {
	if (!arr) {
		return [];
	}
	return arr.map((e) => {
		return e;
	});
}

function isArrayEmpty(arr, startIdx) {
	if (!arr) {
		return true;
	}
	if (!startIdx || startIdx < 0) {
		startIdx = 0;
	}
	for (let i = startIdx; i < arr.length; i++) {
		const e = arr[i];
		if (e !== undefined && e !== null) {
			if (Array.isArray(e) && isArrayEmpty(e, 0)) {
				continue;
			} else {
				return false;
			}
		}
	}
	return true;
}

export default {
	getCurrentLifecycle: getCurrentLifecycle,
	hasLifecycle: hasLifecycle,
	getLifecycleModel: getLifecycleModel,
	getLifecycles: getLifecycles,
	getLifecyclePhase: getLifecyclePhase,
	getFrom: getFrom,
	createOptionsObj: createOptionsObj,
	createOptionsObjFrom: createOptionsObjFrom,
	getKeyToValue: getKeyToValue,
	isProductionPhase: isProductionPhase,
	getMarket: getMarket,
	copyObject: copyObject,
	copyArray: copyArray,
	isArrayEmpty: isArrayEmpty
};