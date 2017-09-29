import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import DateUtil from './DateUtil';
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

console.log(CATEGORY_NAMES);

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
		lastStart = monthStart.clone();
		lastEnd = monthEnd.clone();
	}
	// add current
	result.push({
		name: currentMonthStart.format('MMMM Y'),
		start: currentMonthStart,
		end: currentMonthEnd
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
			data: []
		};
	}

	componentDidMount() {
		lx.init().then(this._initReport);
	}

	_initReport(setup) {
		// TODO create categories
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

	_handleData(index, applicationTagId, itTagId) {
		const tableData = [];
		console.log(index);
		/*
		if (!applicationTagId && !index.includesTag(e, 'Application')) {
			return;
		}
		if (!itTagId && !index.includesTag(e, 'IT')) {
			return;
		}
		*/
		lx.hideSpinner();
		this.setState({
			data: tableData
		});
	}

	render() {
		if (this.state.data.length === 0) {
			return (<h4 className='text-center'>Loading data...</h4>);
		}
		return (
			<div>
				<h3 id='title'>Application Burndown Chart</h3>
				<Chart
					categories={[{
						name: 'lala'
					}]}
					data={this.state.data} />
			</div>
		);
	}
}

export default Report;
