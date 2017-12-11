import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Utilities from './common/Utilities';
import DateUtil from './DateUtil';
import LifecycleUtil from './LifecycleUtil';
import Chart, { getChartNodeID } from './Chart';

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
	// create categories in an interval from now - 6 month to now + 6 months
	const currentMonthStart = DateUtil.setFirstDayOfMonth(DateUtil.getInitDate(), false);
	const currentMonthEnd = DateUtil.setLastDayOfMonth(DateUtil.getInitDate(), true);
	const currentMonth = currentMonthStart.month();
	const result = [{
			name: 'time'
		}
	];
	// get previous months
	let lastStart = currentMonthStart.clone();
	let lastEnd = currentMonthEnd.clone();
	for (let i = 6; i > 0; i--) {
		const monthStart = DateUtil.setPreviousMonth(lastStart);
		const monthEnd = DateUtil.setPreviousMonth(lastEnd);
		result[i] = {
			name: monthStart.format('MMMM Y'),
			start: DateUtil.setFirstDayOfMonth(monthStart, false),
			end: DateUtil.setLastDayOfMonth(monthEnd, true)
		};
		result[i].range = DateUtil.createRange(result[i].start, result[i].end);
		lastStart = monthStart.clone();
		lastEnd = monthEnd.clone();
	}
	// add current
	result.push({
		name: currentMonthStart.format('MMMM Y'),
		start: currentMonthStart,
		end: currentMonthEnd,
		range: DateUtil.createRange(currentMonthStart, currentMonthEnd)
	});
	lastStart = currentMonthStart.clone();
	lastEnd = currentMonthEnd.clone();
	// get next months
	for (let i = 0; i < 6; i++) {
		const monthStart = DateUtil.setNextMonth(lastStart);
		const monthEnd = DateUtil.setNextMonth(lastEnd);
		result.push({
			name: monthStart.format('MMMM Y'),
			start: DateUtil.setFirstDayOfMonth(monthStart, false),
			end: DateUtil.setLastDayOfMonth(monthEnd, true)
		});
		const j = result.length - 1;
		result[j].range = DateUtil.createRange(result[j].start, result[j].end);
		lastStart = monthStart.clone();
		lastEnd = monthEnd.clone();
	}
	return result;
}

class Report extends Component {

	constructor(props) {
		super(props);
		this._initReport = this._initReport.bind(this);
		this._handleData = this._handleData.bind(this);
		this.state = {
			setup: null,
			chartData: [],
			dataRecords: {}
		};
	}

	componentDidMount() {
		lx.init().then(this._initReport);
	}

	_initReport(setup) {
		lx.ready(this._createConfig(setup));
		lx.showSpinner('Loading data...');
		this.setState({
			setup: setup
		});
		// get all tags, then the data
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			const index = new DataIndex();
			index.put(tagGroups);
			const applicationTagId = index.getFirstTagID('Application Type', 'Application');
			const itTagId = index.getFirstTagID('CostCentre', 'IT');
			lx.executeGraphQL(this._createQuery(applicationTagId, itTagId)).then((data) => {
				index.put(data);
				this._handleData(index, applicationTagId, itTagId);
			});
		});
	}

	_createConfig(setup) {
		// TODO menuActions
		return {
			allowEditing: false,
			export: {
				autoScale: true,
				beforeExport: (exportElement) => {
					console.log(exportElement);
				},
				exportElementSelector: '#' + getChartNodeID(),
				format: 'A4',
				inputType: 'SVG',
				orientation: 'landscape'
			}
		};
	}

	_createQuery(applicationTagId, itTagId) {
		const applicationTagIdFilter = applicationTagId ? `, {facetKey: "Application Type", keys: ["${applicationTagId}"]}` : '';
		const itTagIdFilter = itTagId ? `, {facetKey: "CostCentre", keys: ["${itTagId}"]}` : '';
		let tagNameDef = 'tags { name }'; // initial assume to get it
		if (applicationTagIdFilter && itTagId) {
			tagNameDef = '';
		}
		return `{applications: allFactSheets(
					sort: { mode: BY_FIELD, key: "displayName", order: asc },
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Application"]}
						${applicationTagIdFilter}
						${itTagIdFilter}
					]}
				) {
					edges { node {
						id name ${tagNameDef}
						...on Application { lifecycle { phases { phase startDate } } }
					}}
				}}`;
	}

	_lifecycleModel(phase) {
		// TODO for VUtil
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

	_createObj(array, keyProperty) {
		if (!Array.isArray(array) || keyProperty === undefined || keyProperty === null) {
			return {};
		}
		const result = {};
		array.forEach((e) => {
			result[e[keyProperty]] = e;
		});
		return result;
	}

	_handleData(index, applicationTagId, itTagId) {
		const chartData = [
			CATEGORY_NAMES
		];
		LIFECYCLE_PHASES.forEach((e) => {
			chartData.push([e]);
		});
		const dataRecords = {};
		for (let i = 1; i < CATEGORIES.length; i++) {
			const category = CATEGORIES[i];
			const dataRecord = LIFECYCLE_PHASES.reduce((acc, e, j) => {
				acc[e] = {
					idx: j + 1,
					applications: []
				};
				return acc;
			}, {});
			dataRecords[category.name] = dataRecord;
			index.applications.nodes.forEach((e) => {
				if (!applicationTagId && !index.includesTag(e, 'Application')) {
					return;
				}
				if (!itTagId && !index.includesTag(e, 'IT')) {
					return;
				}
				// get lifecycle information, if not present
				if (!e.lifecycles) {
					e.lifecycles = this._createObj(LifecycleUtil.getLifecycles(e, this._lifecycleModel), 'name');
				}
				// add application if lifecycle phase is in category
				for (let key in e.lifecycles) {
					const lifecycle = e.lifecycles[key];
					// end of life is just a moment, not an interval
					if (lifecycle.name === END_OF_LIFE && DateUtil.contains(category, lifecycle.start)) {
						dataRecord[key].applications.push(e);
					} else if (DateUtil.overlapsWith(category, lifecycle)) {
						dataRecord[key].applications.push(e);
					}
				}
			});
			// push values to chart data
			for (let key in dataRecord) {
				const v = dataRecord[key];
				chartData[v.idx].push(v.applications.length);
			}
		}
		lx.hideSpinner();
		this.setState({
			chartData: chartData,
			dataRecords: dataRecords
		});
	}

	render() {
		if (this.state.chartData.length === 0) {
			return (<h4 className='text-center'>Loading data...</h4>);
		}
		console.log(this.state.chartData);
		console.log(this.state.dataRecords);
		return (
			<div>
				<h3 id='title'>Application Burndown Chart</h3>
				<Chart
					categories={CATEGORY_NAMES}
					data={this.state.chartData} />
			</div>
		);
	}
}

export default Report;
