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
		lx.showSpinner('Loading data...');
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

			if (!applicationTagId && !index.includesTag(e, 'Application')) {
				return; // no valid record
			}
			if (!itTagId && !index.includesTag(e, 'IT')) {
				return; // no valid record
			}

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
			case 0: // applications with not maturity state are regarded as DEPLOYED
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

			//console.log(`${counter}. ${appl.name}: 'active' from ${startDate} to ${endDate} | ${msTag} (${maturityState})`);

			let marketentry = groupedByMarket[market];
			if (!marketentry) {
				// a new market - init an empty 7-by-5 array
				marketentry = [
					[0,0,0,0,0], // PERCENT (calculated)
					[0,0,0,0,0], // PHYSICAL
					[0,0,0,0,0], // VIRTUALISED
					[0,0,0,0,0], // TBD
					[0,0,0,0,0], // READY
					[0,0,0,0,0], // NATIVE
					[0,0,0,0,0]  // DEPLOYED
				];
				groupedByMarket[market] = marketentry;
				this.MARKET_OPTIONS[marketCount++] = market;
			}

			// increment the regarding fiscal year counters (AS-IS rule)
			FISCAL_YEARS.forEach((fy, index) => {
				// startDate before fiscal year endDate
				// endDate - if defined - after fiscal year startDate
				if (startDate <= fy.endDate && (endDate === undefined || endDate > fy.startDate)) {
					if (index === 0) {
						marketentry[maturityState][index]++; // current fiscal year
					} else {
						marketentry[RuleDefs.DEPLOYED][index]++; // future fiscal year (DEPLOYED only)
					}
				}
			});

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

					const matState = MATCH[2];
					const fyStart  = 1 * MATCH[3] + 2000; // 4-digit year
					const fyEnd    = 1 * MATCH[4] + 2000; // 4-digit-year
					if (fyStart + 1 != fyEnd) {
						return; // no valid project name (fyEnd must be fyStart + 1)
					}

					// check only the future fiscal years
					if (fyStart < FISCAL_YEAR+1 || fyStart > FISCAL_YEAR + 4){
						return; // project has no valid fiscal year
					}

					let prjMaturityState = RuleDefs.getMaturityStateFromTag(matState);
					if (!prjMaturityState) {
						return; // project has no valid 'Cloud Maturity' state
					}

					marketentry[prjMaturityState][fyStart-FISCAL_YEAR]++;
				});
			}
		}); // records

		// add fiscal year results to tableData (7 rows per market)
		const tableData = [];
		for (let marketKey in groupedByMarket) {
			let m = groupedByMarket[marketKey]; // a 7-by-5 array of numbers

			// the PERCENT rule
			let rule = RuleDefs.rules[RuleDefs.PERCENT];
			tableData.push({
				id: marketKey + '_' + rule.id,
				market: Helper.getOptionKeyFromValue(this.MARKET_OPTIONS, marketKey),
				rule:   Helper.getOptionKeyFromValue(RuleDefs.RULE_OPTIONS, rule.name),
				percentage: rule.percentage,
				// no Cloud TBD in current fiscal year
				fy0: Helper.getPercent(                0 , m[RuleDefs.READY][0], m[RuleDefs.NATIVE][0], m[RuleDefs.DEPLOYED][0]),
				fy1: Helper.getPercent(m[RuleDefs.TBD][1], m[RuleDefs.READY][1], m[RuleDefs.NATIVE][1], m[RuleDefs.DEPLOYED][1]),
				fy2: Helper.getPercent(m[RuleDefs.TBD][2], m[RuleDefs.READY][2], m[RuleDefs.NATIVE][2], m[RuleDefs.DEPLOYED][2]),
				fy3: Helper.getPercent(m[RuleDefs.TBD][3], m[RuleDefs.READY][3], m[RuleDefs.NATIVE][3], m[RuleDefs.DEPLOYED][3]),
				fy4: Helper.getPercent(m[RuleDefs.TBD][4], m[RuleDefs.READY][4], m[RuleDefs.NATIVE][4], m[RuleDefs.DEPLOYED][4]),
			});

			// the 6 other rules
			for (let r = RuleDefs.PHYSICAL; r<RuleDefs.RULE_COUNT; r++) {
				let rule = RuleDefs.rules[r];
				tableData.push({
					id: marketKey + '_' + rule.id,
					market: Helper.getOptionKeyFromValue(this.MARKET_OPTIONS, marketKey),
					rule:   Helper.getOptionKeyFromValue(RuleDefs.RULE_OPTIONS, rule.name),
					percentage: rule.percentage,
					fy0: m[r][0],
					fy1: m[r][1],
					fy2: m[r][2],
					fy3: m[r][3],
					fy4: m[r][4]
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
			return (<h4 className='text-center'>Loading data...</h4>);
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
