import Utilities from './common/Utilities';

function computePercentage(tbd, ready, native, deployed) {
	if (deployed === 0) {
		return 0.0;
	}
	// auf 1 Nachkommastelle reduzieren
	return Math.round((tbd + ready + native) * 1000 / deployed)/10;
}

function getOptionKeyFromValue(options, value) {
	if (!value) {
		return undefined;
	}
	const key = Utilities.getKeyToValue(options, value);
	return key !== undefined && key !== null ? parseInt(key, 10) : undefined;
}

// investigates the phases of a lifecycle object to get the end of phase 'active'.
function addLifecyclePhaseEnd(lifecycles, phase) {
		if (!lifecycles || !phase || !phase.phase || !phase.startDate) {
			return;
		}
		let nextPhaseKey = getNextPhaseKey(phase.phase);
		let nextPhase = Utilities.getLifecyclePhase(lifecycles, nextPhaseKey);
		while (!nextPhase) {
			nextPhaseKey = getNextPhaseKey(nextPhaseKey);
			if (!nextPhaseKey) {
				break;
			}
			nextPhase = Utilities.getLifecyclePhase(lifecycles, nextPhaseKey);
		}
		if (nextPhase) {
			phase.endDate = nextPhase.startDate;
		}
	}

const PLAN = 'plan';
const PHASE_IN = 'phaseIn';
const ACTIVE = 'active';
const PHASE_OUT = 'phaseOut';
const END_OF_LIFE = 'endOfLife';

function getNextPhaseKey(phase) {
	switch (phase) {
		case PLAN:
			return PHASE_IN;
		case PHASE_IN:
			return ACTIVE;
		case ACTIVE:
			return PHASE_OUT;
		case PHASE_OUT:
			return END_OF_LIFE;
		case END_OF_LIFE:
		default:
			return;
	}
}

function isTimestampInPhase(phase, timestamp) {
		if (!phase || timestamp === undefined || timestamp === null) {
			return false;
		}
		const startDate = phase.startDate;
		const endDate = phase.endDate;
		if (startDate) {
			return endDate ? (startDate <= timestamp && timestamp < endDate) : (startDate <= timestamp);
		} else if (endDate) {
			return timestamp < endDate;
		}
		return false;
	}

function isLifecyclePhaseStartDateIn(lifecycle, from, to) {
	return lifecycle && lifecycle.startDate >= from && lifecycle.startDate < to;
}

// console output of an object (up to level maxlevel)
function logObject(name, obj, maxlevel) {
	console.log(name);
	_logObj(obj, 0, maxlevel);
}

function _logObj(obj, level, maxlevel) {
	if (level>=maxlevel) {
		return;
	}
	let indent = "";
	for (let i=0; i<level; i++) {
		indent += "  "
	}
	for (let k in obj) {
		let v = obj[k];
		if (typeof v === 'object') {
			console.log(indent + k + ": {");
			_logObj(name, v, level+1, maxlevel);
			console.log(indent + "}");
		} else {
			console.log(indent + k + "=" + v);
		}
	}
}

export default {
	getOptionKeyFromValue: getOptionKeyFromValue,
	getPercent: computePercentage,
	addLifecyclePhaseEnd: addLifecyclePhaseEnd,
	getNextPhaseKey: getNextPhaseKey,
	isTimestampInPhase: isTimestampInPhase,
	ACTIVE: ACTIVE,
	logObject: logObject
};
