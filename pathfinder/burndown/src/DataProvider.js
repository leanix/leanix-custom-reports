import _ from 'lodash';
import Category from './Category';

const DONT_STACK_BEFORE_PRODUCTION = 'notStackBeforeProduction';
const DONT_STACK_POINT_IN_TIME = 'notStackPointInTime';
const STACK = 'stack';

const PLAN = 'plan';
const PHASE_IN = 'phaseIn';
const ACTIVE = 'active';
const PHASE_OUT = 'phaseOut';
const END_OF_LIFE = 'endOfLife';
// DO NOT CHANGE THE ORDER IN THIS ARRAY (code depends on this)!
const LIFECYCLE_PHASES = [PLAN, PHASE_IN, ACTIVE, PHASE_OUT, END_OF_LIFE];
const CATEGORIES = _createCategories();
const CATEGORY_NAMES = CATEGORIES.map((e) => {
		return e.name;
	});

function _createCategories() {
	// create categories in an interval from now - 3 to now + 2 (e.g. now = 2017 -> [2014, 2019])
	const now = new Date().getFullYear();
	const quarters = ['-01-01', '-04-01', '-07-01', '-10-01'];
	const lastQuartersIndex = quarters.length - 1;
	const result = [{
			name: 'time'
		}
	];
	for (let year = now - 3, max = now + 3; year < max; year++) {
		const nextYear = year + 1;
		quarters.forEach((quarter) => {
			const name = year + quarter;
			result.push({
				name: name
			});
		});
	}
	return result.map((e, i) => {
		if (e.name === 'time') {
			return e;
		}
		const next = result[i + 1];
		if (!next) {
			// special handling of the last element
			const endName = (parseInt(e.name.substring(0, e.name.indexOf('-'))) + 1) + quarters[0];
			return new Category(e.name, _getTimestamp(e.name, true), _getTimestamp(endName, false));
		}
		return new Category(e.name, _getTimestamp(e.name, true), _getTimestamp(next.name, false));
	});
}

function _getTimestamp(value, start) {
	if (!value) {
		return;
	}
	const timestamp = Date.parse(value + ' 00:00:00');
	return start ? timestamp : timestamp - 1;
}

function getFactsheetTypesObjects(factSheets) {
	// get all factsheet types from workspace
	let factsheetTypes = _.filter(factSheets, (value, key) => {
			// exclude all factsheet types, which have no lifecycle definition and don't show in view
			// lifecycle definition:
			//  - must have a field 'lifecycle'
			//  - field 'lifecycle' must have a property 'type' with a value 'LIFECYCLE'
			//  - field 'lifecycle' must have a property 'inView' with a value true
			//  - field 'lifecycle' must have a property 'inFacet' with a value true
			//  - field 'lifecycle' must have a property 'values' with a value that is an array equal to LIFECYCLE_PHASES
			if (value && value.fields && value.fields.lifecycle && value.fields.lifecycle.type === 'LIFECYCLE'
				 && value.fields.lifecycle.inView && value.fields.lifecycle.inFacet
				 && Array.isArray(value.fields.lifecycle.values) && value.fields.lifecycle.values.length === LIFECYCLE_PHASES.length
				 && _.differenceWith(LIFECYCLE_PHASES, value.fields.lifecycle.values, _.isEqual).length === 0) {
				value.type = key;
				return true;
			}
			return false;
		});
	factsheetTypes = _.sortBy(factsheetTypes, [(value) => {
					return value.type;
				}
			]);
	return factsheetTypes;
}

function getCategories() {
	return CATEGORY_NAMES;
}

function getQuery(factsheetType) {
	return `{allFactSheets(factSheetType:${factsheetType}) {
		edges {node {
			name
			type
			tags {name tagGroup {name}}
			...on ${factsheetType} {
				lifecycle {
					phases {phase startDate}
				}
			}
		}}
	}}`;
}

function getChartData(requestData, factsheetType, stackPlanPhase) {
	const chartData = [
		getCategories(),
		['total'],
		['added'],
		['retired']
	];
	// just to be safe
	if (!factsheetType || !requestData || !requestData.allFactSheets
		 || !requestData.allFactSheets.edges || requestData.allFactSheets.edges.length < 1) {
		return chartData;
	}
	const extractedData = _extractDataFromRequest(requestData);
	if (extractedData.length < 1) {
		return chartData;
	}
	for (let i = 1; i < CATEGORIES.length; i++) {
		const category = CATEGORIES[i];
		let total = 0;
		let retired = 0;
		let added = 0;
		extractedData.forEach((e) => {
			const phaseDef = _getPhaseDefinition(e.lifecycles, category, stackPlanPhase);
			if (phaseDef.total) {
				total++;
			}
			if (phaseDef.retired) {
				retired++;
			}
			if (phaseDef.added) {
				added++;
			}
		});
		chartData[1].push(total);
		chartData[2].push(added);
		chartData[3].push(retired === 0 ? 0 : -retired);
	}
	return chartData;
}

function _getPhaseDefinition(phases, category, stackPlanPhase) {
	const result = {
		total: false,
		retired: false,
		added: false
	};
	for (let key in phases) {
		const phase = phases[key];
		if (key === PLAN) {
			// plan phase needs special handling according to stack mode
			switch (stackPlanPhase) {
			case DONT_STACK_BEFORE_PRODUCTION:
				// count just once by using the end moment
				if (category.contains(phase.end)) {
					result.added = true;
				}
				break;
			case DONT_STACK_POINT_IN_TIME:
				// count just once by using the start moment
				if (category.contains(phase.start)) {
					result.added = true;
				}
				break;
			case STACK:
				// count every moment between start and end
				if (category.overlapsWith(phase.start, phase.end)) {
					result.added = true;
				}
				break;
			}
		}
		if (key === END_OF_LIFE) {
			// end of life is just a moment, not an interval
			if (category.contains(phase.start)) {
				result.retired = true;
			}
		}
		// for all other phases: count every moment between start and end
		if (category.overlapsWith(phase.start, phase.end)) {
			switch (key) {
			case PHASE_IN:
			case ACTIVE:
			case PHASE_OUT:
				result.total = true;
				break;
			default:
				break;
			}
		}
	}
	return result;
}

function _extractDataFromRequest(requestData) {
	const edges = requestData.allFactSheets.edges;
	const result = [];
	edges.forEach((e) => {
		const node = e.node;
		if (!node.lifecycle || !node.lifecycle.phases) {
			return;
		}
		const lifecycleArray = node.lifecycle.phases;
		// transform the lifecycle array
		const lifecycles = {};
		lifecycleArray.forEach((e2) => {
			if (!e2.startDate) {
				return;
			}
			lifecycles[e2.phase] = e2.startDate;
		});
		// second time to get interval data
		const lifecycleIntervals = {};
		for (let key in lifecycles) {
			const value = lifecycles[key];
			const nextKey = _getNextPhaseKey(lifecycles, key);
			lifecycleIntervals[key] = {
				start: _getTimestamp(value, true),
				end: nextKey ? _getTimestamp(lifecycles[nextKey], false) : undefined
			};
		}
		node.lifecycles = lifecycleIntervals;
		result.push(node);
	});
	return result;
}

function _getNextPhaseKey(from, phase) {
	let result = undefined;
	let lastPhase = phase;
	let i = 0;
	while (i++ < 6) {
		const nextPhase = _getNextPhase(lastPhase);
		if (!nextPhase) {
			break;
		}
		const nextValue = from[nextPhase];
		if (!nextValue) {
			lastPhase = nextPhase;
			continue;
		}
		result = nextPhase;
		break;
	}
	return result;
}

function _getNextPhase(phase) {
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

export default {
	DONT_STACK_BEFORE_PRODUCTION: DONT_STACK_BEFORE_PRODUCTION,
	DONT_STACK_POINT_IN_TIME: DONT_STACK_POINT_IN_TIME,
	STACK: STACK,
	getFactsheetTypesObjects: getFactsheetTypesObjects,
	getQuery: getQuery,
	getCategories: getCategories,
	getChartData: getChartData
};
