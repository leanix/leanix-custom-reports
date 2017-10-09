import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Utilities from './common/Utilities';
import MultiSelectField from './MultiSelectField';
import Table from './Table';

const CURRENT_DATE = new Date();
CURRENT_DATE.setHours(0, 0, 0, 0);
const FINANCIAL_YEAR = getFinancialYear(CURRENT_DATE);
const APR_DATE = FINANCIAL_YEAR.start;
const MAR_DATE = FINANCIAL_YEAR.end;

function getFinancialYear(date) {
	if (!date || !(date instanceof Date)) {
		date = new Date();
		date.setHours(0, 0, 0, 0);
	}
	// get start point
	const startYear = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
	const startDate = new Date();
	startDate.setFullYear(startYear, 3, 1); // 1st apr
	startDate.setHours(0, 0, 0, 0);
	// get end point
	const endDate = new Date();
	endDate.setFullYear(startYear + 1, 2, 31); // 31th mar
	endDate.setHours(23, 59, 59, 999);
	return {
		start: startDate,
		end: endDate
	};
}

// timestamps
const CURRENT = CURRENT_DATE.getTime();
const APR = APR_DATE.getTime();
const MAR = MAR_DATE.getTime();

const PLAN = 'plan';
const PHASE_IN = 'phaseIn';
const ACTIVE = 'active';
const PHASE_OUT = 'phaseOut';
const END_OF_LIFE = 'endOfLife';

class Report extends Component {

	constructor(props) {
		super(props);
		this._initReport = this._initReport.bind(this);
		this._handleData = this._handleData.bind(this);
		this._addLifecyclePhaseEnd = this._addLifecyclePhaseEnd.bind(this);
		this._isTimestampInOnePhase = this._isTimestampInOnePhase.bind(this);
		this._onMultiSelectChange = this._onMultiSelectChange.bind(this);
		this.MARKET_OPTIONS = {};
		this.state = {
			setup: null,
			data: [],
			multiSelectValues: [
				'AL', 'CD', 'CZ', 'DE', 'EG', 'ES', 'GH', 'GR', 'HU', 'IE', 'IN',
				'IT', 'LS', 'MT', 'MZ', 'PT', 'RO', 'TR', 'TZ', 'UK', 'ZA'
			]
		};
	}

	componentDidMount() {
		lx.init().then(this._initReport);
	}

	_initReport(setup) {
		lx.ready(this._createConfig());
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
		// group applications by market
		const groupedByMarket = {};
		let marketCount = 0;
		index.applications.nodes.forEach((e) => {
			if (!applicationTagId && !index.includesTag(e, 'Application')) {
				return;
			}
			if (!itTagId && !index.includesTag(e, 'IT')) {
				return;
			}
			let market = Utilities.getMarket(e);
			if (!market) {
				return;
			}
			if (!groupedByMarket[market]) {
				groupedByMarket[market] = [];
				this.MARKET_OPTIONS[marketCount++] = market;
			}
			groupedByMarket[market].push(e);
		});
		if (groupedByMarket.CW) {
			// this is a hack for a requirement by v: CW apps should be considered belonging to UK
			const cwApplications = groupedByMarket.CW;
			if (!groupedByMarket.UK) {
				groupedByMarket.UK = cwApplications;
			} else {
				groupedByMarket.UK = cwApplications.concat(groupedByMarket.UK);
			}
			delete groupedByMarket.CW;
			delete this.MARKET_OPTIONS[Utilities.getKeyToValue(this.MARKET_OPTIONS, 'CW')];
		}
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
				let activePhase = Utilities.getLifecyclePhase(lifecycles, ACTIVE);
				const phaseInPhase = Utilities.getLifecyclePhase(lifecycles, PHASE_IN);
				const phaseOutPhase = Utilities.getLifecyclePhase(lifecycles, PHASE_OUT);
				const endOfLifePhase = Utilities.getLifecyclePhase(lifecycles, END_OF_LIFE);
				// add impicit phase before 'endOfLife' if production phases are missing
				if (!activePhase && !phaseInPhase && !phaseOutPhase && endOfLifePhase) {
					activePhase = {
						phase: ACTIVE
					};
				}
				const productionPhases = [activePhase, phaseInPhase, phaseOutPhase];
				this._addLifecyclePhaseEnd(lifecycles, activePhase);
				this._addLifecyclePhaseEnd(lifecycles, phaseInPhase);
				this._addLifecyclePhaseEnd(lifecycles, phaseOutPhase);
				if (this._isTimestampInOnePhase(APR, productionPhases)) {
					// count if 1st apr <CURRENT_YEAR> is a timepoint in the 'active', 'phaseIn' or 'phaseOut' lifecycle phase
					baselineApr++;
				} else if (endOfLifePhase && endOfLifePhase.startDate === APR) {
					// application is in time frame, but it's decommissioned on the first date, still count to baseline
					// NOTE: that is unique for this baseline!
					baselineApr++;
				}
				if (this._isTimestampInOnePhase(CURRENT, productionPhases)) {
					// count if <CURRENT_DATE> is a timepoint in the 'active', 'phaseIn' or 'phaseOut' lifecycle phase
					baselineToday++;
				}
				if (this._isTimestampInOnePhase(MAR, productionPhases)) {
					// count if 31th mar <CURRENT_YEAR + 1> is a timepoint in the 'active', 'phaseIn' or 'phaseOut' lifecycle phase
					baselineMar++;
				}
				// application decommissioning or decommissioned this FY?
				// 'endOfLife' phase start date must be between 1st apr <CURRENT_YEAR> and 31th mar <CURRENT_YEAR + 1> (both inclusive)
				if (this._isLifecyclePhaseStartDateIn(endOfLifePhase, APR, MAR, false, false)) {
					// planned (decommissioning) or actuals (decommissioned)?
					if (endOfLifePhase.startDate > CURRENT) {
						decommissionsPlanned++;
					} else {
						decommissionsActuals++;
					}
				}
				// application commissioning or commissioned this FY?
				// 'active' phase start date must be between 1st apr <CURRENT_YEAR> and 31th mar <CURRENT_YEAR + 1> (both inclusive)
				if (this._isLifecyclePhaseStartDateIn(activePhase, APR, MAR, false, false)) {
					// planned (commissioning) or actuals (commissioned)?
					if (activePhase.startDate > CURRENT) {
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

	_addLifecyclePhaseEnd(lifecycles, phase) {
		if (!lifecycles || !phase || !phase.phase) {
			return;
		}
		let nextPhaseKey = this._getNextPhaseKey(phase.phase);
		let nextPhase = Utilities.getLifecyclePhase(lifecycles, nextPhaseKey);
		while (!nextPhase) {
			nextPhaseKey = this._getNextPhaseKey(nextPhaseKey);
			if (!nextPhaseKey) {
				break;
			}
			nextPhase = Utilities.getLifecyclePhase(lifecycles, nextPhaseKey);
		}
		if (nextPhase) {
			phase.endDate = nextPhase.startDate;
		}
	}

	_getNextPhaseKey(phase) {
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

	_isTimestampInOnePhase(timestamp, phases) {
		if (timestamp === undefined || timestamp === null || !phases) {
			return false;
		}
		return phases.some((e) => {
			return this._isTimestampInPhase(e, timestamp);
		});
	}

	_isTimestampInPhase(phase, timestamp) {
		if (!phase || timestamp === undefined || timestamp === null) {
			return false;
		}
		const startDate = phase.startDate;
		const endDate = phase.endDate;
		if (startDate !== undefined && startDate !== null) {
			return (endDate !== undefined && endDate !== null)
				? (startDate <= timestamp && timestamp < endDate)
				: (startDate <= timestamp);
		} else if (endDate !== undefined && endDate !== null) {
			return timestamp < endDate;
		}
		return false;
	}

	_isLifecyclePhaseStartDateIn(lifecycle, from, to, fromExclusive, toExclusive) {
		return lifecycle
			&& (fromExclusive ? lifecycle.startDate > from : lifecycle.startDate >= from)
			&& (toExclusive ? lifecycle.startDate < to : lifecycle.startDate <= to);
	}

	_getOptionKeyFromValue(options, value) {
		if (!value) {
			return undefined;
		}
		const key = Utilities.getKeyToValue(options, value);
		return key !== undefined && key !== null ? parseInt(key, 10) : undefined;
	}

	_onMultiSelectChange(values) {
		this.setState({
			multiSelectValues: values
		});
	}

	render() {
		if (this.state.data.length === 0) {
			return (<h4 className='text-center'>Loading data...</h4>);
		}
		let data = this.state.data;
		let marketOptions = Utilities.copyObject(this.MARKET_OPTIONS);
		if (this.state.multiSelectValues.length > 0) {
			// filter table data
			data = data.filter((e) => {
				return this.state.multiSelectValues.some((e2) => {
					const key = Utilities.getKeyToValue(this.MARKET_OPTIONS, e2);
					return key && e.market === parseInt(key);
				});
			});
			// filter market options for table only
			for (let key in this.MARKET_OPTIONS) {
				const value = this.MARKET_OPTIONS[key];
				if (!this.state.multiSelectValues.includes(value)) {
					delete marketOptions[key];
				}
			}
		}
		// add & compute the 'total' row
		const totalOptionKey = Object.keys(this.MARKET_OPTIONS).length + 1;
		marketOptions[totalOptionKey] = 'total';
		const total = {
			id: 'total',
			market: totalOptionKey,
			baselineApr: 0,
			decommissionsPlanned: 0,
			decommissionsActuals: 0,
			commissionsPlanned: 0,
			commissionsActuals: 0,
			baselineMar: 0,
			baselineToday: 0
		};
		data.forEach((e) => {
			total.baselineApr += e.baselineApr;
			total.decommissionsPlanned += e.decommissionsPlanned;
			total.decommissionsActuals += e.decommissionsActuals;
			total.commissionsPlanned += e.commissionsPlanned;
			total.commissionsActuals += e.commissionsActuals;
			total.baselineMar += e.baselineMar;
			total.baselineToday += e.baselineToday;
		});
		data.push(total);
		return (
			<div>
				<MultiSelectField
					label='Markets to show'
					placeholder='Select a market'
					items={this.MARKET_OPTIONS}
					onChange={this._onMultiSelectChange}
					values={this.state.multiSelectValues} />
				<Table data={data}
					currentYear={APR_DATE.getFullYear()}
					options={{
						market: marketOptions
					}}
					setup={this.state.setup} />
			</div>
		);
	}
}

export default Report;
