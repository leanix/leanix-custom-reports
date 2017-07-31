function getCurrentLifecycle(application) {
	if (!application.lifecycle || !application.lifecycle.asString
		 || !application.lifecycle.phases || !Array.isArray(application.lifecycle.phases)) {
		return;
	}
	const currentPhase = application.lifecycle.asString;
	let result = undefined;
	if (currentPhase) {
		result = application.lifecycle.phases.find((e) => {
			return e.phase === currentPhase;
		});
	} else {
		// TODO analyse startDate
	}
	return {
		phase: result.phase,
		startDate: Date.parse(result.startDate)
	};
}

function getKeyToValue(obj, value) {
	for (let key in obj) {
		if (obj[key] === value) {
			return key;
		}
	}
}

function isProductionPhase(lifecycle) {
	if (!lifecycle) {
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

const marketRE = /^([A-Z]{2,3})_/;

function getMarket(application) {
	if (!application) {
		return;
	}
	const m = marketRE.exec(application.name);
	if (!m) {
		return;
	}
	return m[1]; // first one is the match, followed by group matches
};

export default {
	getCurrentLifecycle: getCurrentLifecycle,
	getKeyToValue: getKeyToValue,
	isProductionPhase: isProductionPhase,
	getMarket: getMarket
};