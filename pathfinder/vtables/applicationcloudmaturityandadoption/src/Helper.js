import Utilities from './common/Utilities';

function computePercentage(tbd, ready, native, deployed) {
	if (deployed === 0) {
		return 0.0; // Number.NaN;
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

function logObject(name, obj, level, maxlevel) {
	if (level>=maxlevel) {
		return;
	}
	if (level==0) {
		console.log(name);
	}

	let indent = "";
	for (let i=0; i<level; i++) {
		indent += "  "
	}
	//indent += "* ";
	for (let k in obj) {
		let v = obj[k];
		if (typeof v === 'object') {
			console.log(indent + k + ": {");
			logObject(name, v, level+1, maxlevel);
			console.log(indent + "}");
		} else {
			console.log(indent + k + "=" + v);
		}
	}
}

export default {
	getOptionKeyFromValue: getOptionKeyFromValue,
	getPercent: computePercentage,
	logObject: logObject
};
