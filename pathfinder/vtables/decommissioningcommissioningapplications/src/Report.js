import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Utilities from './common/Utilities';
import Table from './Table';

const CURRENT_DATE = new Date();
CURRENT_DATE.setHours(0, 0, 0, 0);
const APR_DATE = new Date();
APR_DATE.setFullYear(CURRENT_DATE.getFullYear(), 3, 1); // 1st apr
APR_DATE.setHours(0, 0, 0, 0);
const MAR_DATE = new Date();
MAR_DATE.setFullYear(CURRENT_DATE.getFullYear() + 1, 2, 31); // 31th mar
MAR_DATE.setHours(0, 0, 0, 0);

// timestamps
const CURRENT = CURRENT_DATE.getTime();
const APR = APR_DATE.getTime();
const MAR = MAR_DATE.getTime();

class Report extends Component {

	constructor(props) {
		super(props);
		this._initReport = this._initReport.bind(this);
		this._handleData = this._handleData.bind(this);
		this.MARKET_OPTIONS = {};
		this.state = {
			setup: null,
			data: []
		};
	}

	componentDidMount() {
		lx.init().then(this._initReport);
	}

	_initReport(setup) {
		lx.ready(this._createConfig());
		lx.showSpinner('Loading data ...');
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

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_createQuery(applicationTagId, itTagId) {
		// initial assume tagGroup.name changed or the id couldn't be determined otherwise
		const idFilter = { application: '', it: '' };
		// initial assume to get it
		let tagNameDef = 'tags { name }';
		if (applicationTagId) {
			idFilter.application = `, {facetKey: "Application Type", keys: ["${applicationTagId}"]}`;
		}
		if (itTagId) {
			idFilter.it = `, {facetKey: "CostCentre", keys: ["${itTagId}"]}`;
		}
		if (applicationTagId && itTagId) {
			tagNameDef = '';
		}
		// TODO optimise query with lifecycle filter
		return `{applications: allFactSheets(
					sort: { mode: BY_FIELD, key: "displayName", order: asc },
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Application"]}
						${idFilter.application}
						${idFilter.it}
					]}
				) {
					edges { node {
						id name ${tagNameDef}
						... on Application {
							lifecycle { phases { phase startDate } }
						}
					}}
				}}`;
	}

	_handleData(index, applicationTagId, itTagId) {
		const tableData = [];
		let marketCount = 0;
		// group applications by market
		const groupedByMarket = {};
		index.applications.nodes.forEach((e) => {
			if (!applicationTagId && !index.includesTag(e, 'Application')) {
				return;
			}
			if (!itTagId && !index.includesTag(e, 'IT')) {
				return;
			}
			const market = Utilities.getMarket(e);
			if (!market) {
				return;
			}
			if (!groupedByMarket[market]) {
				groupedByMarket[market] = [];
				this.MARKET_OPTIONS[marketCount++] = market;
			}
			groupedByMarket[market].push(e);
		});
		for (let market in groupedByMarket) {
			const allApplications = groupedByMarket[market];
			let baselineApr = 0;
			let decommissionsPlanned = 0;
			let decommissionsActuals = 0;
			let commissionsPlanned = 0;
			let commissionsActuals = 0;
			let baselineMar = 0;
			let baselineToday = 0;
			allApplications.forEach((e) => {
				const lifecycles = Utilities.getLifecycles(e);
				if (lifecycles.length === 0) {
					return;
				}
				if (this._hasActiveLifecyclePhaseAfter(lifecycles, APR)) {
					// count if 'active' lifecycle phase has a start date greater than or equal to 1st apr <CURRENT_YEAR>
					baselineApr++;
				}
				if (this._hasActiveLifecyclePhaseAfter(lifecycles, MAR)) {
					// count if 'active' lifecycle phase has a start date greater than or equal to 31th mar <CURRENT_YEAR + 1>
					baselineMar++;
				}
				if (this._hasActiveLifecyclePhaseAfter(lifecycles, CURRENT)) {
					// count if 'active' lifecycle phase has a start date greater than or equal to <CURRENT_DATE>
					baselineToday++;
				}
				const endOfLifePhase = Utilities.getLifecyclePhase(lifecycles, 'endOfLife');
				// application decommissioning or decommissioned this FY?
				// 'endOfLife' phase must be between 1st apr <CURRENT_YEAR> and 31th mar <CURRENT_YEAR + 1>
				if (this._isLifecyclePhaseBetween(endOfLifePhase, APR, MAR)) {
					// planned (decommissioning) or actuals (decommissioned)?
					if (endOfLifePhase.startDate < CURRENT) {
						decommissionsPlanned++;
					} else {
						decommissionsActuals++;
					}
				}
				const activePhase = Utilities.getLifecyclePhase(lifecycles, 'active');
				// application commissioning or commissioned this FY?
				// 'active' phase must be between 1st apr <CURRENT_YEAR> and 31th mar <CURRENT_YEAR + 1>
				if (this._isLifecyclePhaseBetween(activePhase, APR, MAR)) {
					// planned (commissioning) or actuals (commissioned)?
					if (activePhase.startDate < CURRENT) {
						commissionsPlanned++;
					} else {
						commissionsActuals++;
					}
				}
			});
			const marketEnum = this._getOptionKeyFromValue(this.MARKET_OPTIONS, market);
			tableData.push({
				id: market,
				market: marketEnum,
				baselineApr: baselineApr,
				decommissionsPlanned: decommissionsPlanned,
				decommissionsActuals: decommissionsActuals,
				commissionsPlanned: commissionsPlanned,
				commissionsActuals: commissionsActuals,
				baselineMar: baselineMar,
				baselineToday: baselineToday
			});
		}
		lx.hideSpinner();
		this.setState({
			data: tableData
		});
	}

	_isLifecyclePhaseBetween(lifecycle, from, to) {
		return lifecycle && lifecycle.startDate >= from && lifecycle.startDate < to;
	}

	_hasActiveLifecyclePhaseAfter(lifecycles, timestamp) {
		const activePhase = Utilities.getLifecyclePhase(lifecycles, 'active');
		return activePhase && activePhase.startDate >= timestamp;
	}

	_getOptionKeyFromValue(options, value) {
		if (!value) {
			return undefined;
		}
		const key = Utilities.getKeyToValue(options, value);
		return key !== undefined && key !== null ? parseInt(key, 10) : undefined;
	}

	render() {
		if (this.state.data.length === 0) {
			return (<h4 className='text-center'>Loading data ...</h4>);
		}
		return (
			<Table data={this.state.data}
				currentYear={CURRENT_DATE.getFullYear()}
				options={{
					market: this.MARKET_OPTIONS
				}}
				setup={this.state.setup} />
		);
	}
}

export default Report;
