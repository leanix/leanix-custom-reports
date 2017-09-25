import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Utilities from './common/Utilities';
import Helper from './Helper';
import Table from './Table';
import RuleDefs from './RuleDefs';

// dates and timestamps
const TODAY = new Date();
const THIS_YEAR = TODAY.getFullYear();

// Fiscal Year is from April 1st to March 31st
const FISCAL_YEAR = (TODAY.getMonth() < 3 ? THIS_YEAR-1 : THIS_YEAR);
const FISCAL_YEARS = [
	{
		startDate: new Date(FISCAL_YEAR,   3,  1, 0, 0, 0, 0).getTime(),
		endDate:   new Date(FISCAL_YEAR+1, 2, 31, 0, 0, 0, 0).getTime()
	},
	{
		startDate: new Date(FISCAL_YEAR+1, 3,  1, 0, 0, 0, 0).getTime(),
		endDate:   new Date(FISCAL_YEAR+2, 2, 31, 0, 0, 0, 0).getTime()
	},
	{
		startDate: new Date(FISCAL_YEAR+2, 3,  1, 0, 0, 0, 0).getTime(),
		endDate:   new Date(FISCAL_YEAR+3, 2, 31, 0, 0, 0, 0).getTime()
	},
	{
		startDate: new Date(FISCAL_YEAR+3, 3,  1, 0, 0, 0, 0).getTime(),
		endDate:   new Date(FISCAL_YEAR+4, 2, 31, 0, 0, 0, 0).getTime()
	},
	{
		startDate: new Date(FISCAL_YEAR+4, 3,  1, 0, 0, 0, 0).getTime(),
		endDate:   new Date(FISCAL_YEAR+5, 2, 31, 0, 0, 0, 0).getTime()
	}
];

class Report extends Component {

	constructor(props) {
		super(props);
		this._initReport = this._initReport.bind(this);
		this._handleData = this._handleData.bind(this);

		this.MARKET_OPTIONS = {}; // the list of markets

		this.state = {
			setup: null,
			data: [],
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
		lx
			.executeGraphQL(CommonQueries.tagGroups)
			.then((tagGroups) => {
				const index = new DataIndex();
				index.put(tagGroups);
				const applicationTagId = index.getFirstTagID('Application Type', 'Application');
				const itTagId = index.getFirstTagID('CostCentre', 'IT');
				lx
					.executeGraphQL(this._createQuery(applicationTagId, itTagId))
					.then((data) => {
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
		const facetkeyApplicationTypeTag = applicationTagId ? `,{facetKey:"Application Type",keys:["${applicationTagId}"]}` : '';
		const facetKeyCostCentreTag = itTagId ? `,{facetKey:"CostCentre",keys:["${itTagId}"]}` : '';
		let query = `{records:allFactSheets(
			sort:{mode:BY_FIELD,key:"displayName",order:asc },
			filter:{facetFilters:[
				{facetKey:"FactSheetTypes",keys:["Application"]}
				${facetkeyApplicationTypeTag}
				${facetKeyCostCentreTag}
			]}
		){
			edges{node{...on Application{
				name tags{name tagGroup{name}}
				lifecycle{state:asString phases{phase startDate}}
				relApplicationToProject{edges{node{factSheet{name}}}}
			}}}
		}}`;

		return query;
	}

	_handleData(index, applicationTagId, itTagId) {

		// group applications by market
		let marketCount = 0;
		const groupedByMarket = {};

		index.records.nodes.forEach((appl) => {

			// FALLBACK-Checks for applicationTagId and itTagId
			if (!applicationTagId && !index.includesTag(e, 'Application')) {
				return; // no valid record
			}
			if (!itTagId && !index.includesTag(e, 'IT')) {
				return; // no valid record
			}

			// the counters for each market's marketEntry[maturityState].counters[fyOffset] have to be updated
			// the application names for each market's have to be stored in marketEntry[maturityState].aplications[fyOffset]
			let market;
			let maturityState;
			let fyOffset;

			// get market (from application's name)
			market = Utilities.getMarket(appl);
			if (!market) {
				return; // no valid record
			}

			// get maturity state tags
			const msTags = index.getTagsFromGroup(appl, 'Cloud Maturity');
			switch (msTags.length) {
			case 0: // applications with no maturity state are regarded as DEPLOYED
				maturityState = RuleDefs.DEPLOYED;
				break;
			case 1:
				maturityState = RuleDefs.getMaturityStateFromTag(msTags[0].name);
				break;
			default:
				return; // no valid maturity state
			}

			// get application's lifecycle information
			const lifecycles = Utilities.getLifecycles(appl);
			if (lifecycles.length === 0) {
				return;
			}

			// get start and end date of application's 'active' phase
			const activePhase = Utilities.getLifecyclePhase(lifecycles, Helper.ACTIVE);
			Helper.addLifecyclePhaseEnd(lifecycles, activePhase);
			let startDate;
			let endDate;
			if (activePhase) {
				startDate = activePhase.startDate;
				endDate = activePhase.endDate;
			}

			if (startDate === undefined ||                    // invalid
				startDate > FISCAL_YEARS[4].endDate ||        // out of fiscal years scope
				(endDate !== undefined &&
					(endDate <= FISCAL_YEARS[0].startDate ||  // out of fiscal years scope
					 endDate <= startDate))                   // invalid
			) {
				return; // application has no valid or fitting 'active' phase
			}

			let marketentry = groupedByMarket[market];
			if (!marketentry) {
				// a new market - init an empty 7-by-5 array of empty arrays
				// the array will store the applications' names
				marketentry = [
					[[],[],[],[],[]], // PERCENT (calculated)
					[[],[],[],[],[]], // PHYSICAL
					[[],[],[],[],[]], // VIRTUALISED
					[[],[],[],[],[]], // TBD
					[[],[],[],[],[]], // READY
					[[],[],[],[],[]], // NATIVE
					[[],[],[],[],[]]  // DEPLOYED
				];
				groupedByMarket[market] = marketentry;
				this.MARKET_OPTIONS[marketCount++] = market;
			}

			// increment the regarding fiscal year counters (AS-IS rule)
			// DEPLOYED: increment fitting current and future fiscal year
			// OTHERS:   increment fitting current fiscal year only
			FISCAL_YEARS.forEach((fy, index) => {
				// startDate before fiscal year endDate
				// endDate - if defined - after fiscal year startDate
				if (startDate <= fy.endDate && (endDate === undefined || endDate > fy.startDate)) {
					if (index === 0) {
						marketentry[maturityState][index].push(appl.name); // application name
					} else {
						marketentry[RuleDefs.DEPLOYED][index].push(appl.name); // application name
					}
				}
			});

			// TO-BE-Rule: investigate related projects
			// Project name pattern: <MARKET>_<MATSTATE_NAME> FY<YY>/<YY>
			//                       G1       G2                G3   G4
			const PRJNAME_RE = /^([A-Z]+)_(Cloud Ready|Cloud Native|Cloud TBD)\s+FY(\d{2})\/(\d{2})$/;
			if (appl.relApplicationToProject) {
				appl.relApplicationToProject.nodes.forEach((prj) => {
					let prj_name = prj.name;
					const MATCH = PRJNAME_RE.exec(prj_name);
					if (!MATCH) {
						return; // no valid project name
					}

					// first one (0) is full match, followed by n group matches
					//const market   = MATCH[1]; // market currently out-of-interest
					const matState = MATCH[2]; // maturity state name
					const fyStart  = 1 * MATCH[3] + 2000; // beginning of fiscal year (as 4-digit number)
					const fyEnd    = 1 * MATCH[4] + 2000; // end of fiscal year (as 4-digit-number)
					if (fyStart + 1 != fyEnd) {
						return; // no valid project name (fyEnd must by fyStart + 1)
					}

					// TO-BE-Rule: check only the future fiscal years
					if (fyStart < FISCAL_YEAR+1 || fyStart > FISCAL_YEAR + 4){
						return; // project has no valid fiscal year
					}

					let prjMaturityState = RuleDefs.getMaturityStateFromTag(matState);
					if (!prjMaturityState) {
						return; // project has no valid 'Cloud Maturity' state
					}

					// increment the regarding future fiscal year counter (TO-BE rule)
					marketentry[prjMaturityState][fyStart-FISCAL_YEAR].push(appl.name);
				});
			}

		}); // records

		// add fiscal year results to tableData (7 rows per market)

		const tableData = [];
		for (let marketKey in groupedByMarket) {
			let m = groupedByMarket[marketKey]; // a 7-elements array of objects

			// the PERCENT rule
			let rule = RuleDefs.rules[RuleDefs.PERCENT];
			tableData.push({
				id: marketKey + '_' + rule.id,
				market: Helper.getOptionKeyFromValue(this.MARKET_OPTIONS, marketKey),
				rule:   Helper.getOptionKeyFromValue(RuleDefs.RULE_OPTIONS, rule.name),
				percentage: rule.percentage,
				// no Cloud TBD in current fiscal year
				fy0: Helper.getPercent(
						0,
						m[RuleDefs.READY][0].length,
						m[RuleDefs.NATIVE][0].length,
						m[RuleDefs.DEPLOYED][0].length),
				fy0Apps: m[0][0],
				fy1: Helper.getPercent(
						m[RuleDefs.TBD][1].length,
						m[RuleDefs.READY][1].length,
						m[RuleDefs.NATIVE][1].length,
						m[RuleDefs.DEPLOYED][1].length),
				fy1Apps: m[0][1],
				fy2: Helper.getPercent(
						m[RuleDefs.TBD][2].length,
						m[RuleDefs.READY][2].length,
						m[RuleDefs.NATIVE][2].length,
						m[RuleDefs.DEPLOYED][2].length),
				fy2Apps: m[0][2],
				fy3: Helper.getPercent(
						m[RuleDefs.TBD][3].length,
						m[RuleDefs.READY][3].length,
						m[RuleDefs.NATIVE][3].length,
						m[RuleDefs.DEPLOYED][3].length),
				fy3Apps: m[0][3],
				fy4: Helper.getPercent(
						m[RuleDefs.TBD][4].length,
						m[RuleDefs.READY][4].length,
						m[RuleDefs.NATIVE][4].length,
						m[RuleDefs.DEPLOYED][4].length),
				fy4Apps: m[0][4]
			});

			// the 6 other rules
			for (let r = RuleDefs.PHYSICAL; r<RuleDefs.RULE_COUNT; r++) {
				let rule = RuleDefs.rules[r];
				tableData.push({
					id: marketKey + '_' + rule.id,
					market: Helper.getOptionKeyFromValue(this.MARKET_OPTIONS, marketKey),
					rule:   Helper.getOptionKeyFromValue(RuleDefs.RULE_OPTIONS, rule.name),
					percentage: rule.percentage,
					fy0:     m[r][0].length,
					fy0Apps: m[r][0],
					fy1:     m[r][1].length,
					fy1Apps: m[r][1],
					fy2:     m[r][2].length,
					fy2Apps: m[r][2],
					fy3:     m[r][3].length,
					fy3Apps: m[r][3],
					fy4:     m[r][4].length,
					fy4Apps: m[r][4]
				});
			}
		}

		lx.hideSpinner();
		this.setState({
			data: tableData
		});
	}

	render() {
		if (this.state.data.length === 0) {
			return (<h4 className='text-center'>Loading data ...</h4>);
		}
		return (
			<Table
				data={this.state.data}
				options={{
					market: this.MARKET_OPTIONS,
					rules: RuleDefs.RULE_OPTIONS
				}}
				fiscalYear={FISCAL_YEAR % 100}
				setup={this.state.setup} />
		);
	}
}

export default Report;
