import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Utilities from './common/Utilities';
import Helper from './Helper';
import Table from './Table';

const PERCENT = 0;
const PHYSICAL = 1;
const VIRTUALISED = 2;
const TBD = 3;
const READY = 4;
const NATIVE = 5;
const DEPLOYED = 6;

const RULE_COUNT = 7;  // last + 1

// the list of adoption & maturity rule ids, names and descriptions
const ruleDefs = [
	{
		id: PERCENT,
		name: "Cloud Applications",
		description: "Percentage of cloud applications.",
		percentage: true
	},
	{
		id: PHYSICAL,
		name: "Physical Applications",
		description: "Total number of physical applications.",
		percentage: false
	},
	{
		id: VIRTUALISED,
		name: "Virtualised Applications",
		description: "Total number of virtualised applications.",
		percentage: false
	},
	{
		id: TBD,
		name: "Cloud TBD Applications",
		description: "Total number of applications being moved to cloud, but still having an undecided maturity state.",
		percentage: false
	},
	{
		id: READY,
		name: "Cloud Ready Applications",
		description: "Total number of applications being ready for cloud.",
		percentage: false
	},
	{
		id: NATIVE,
		name: "Cloud Native Applications",
		description: "Total number of native cloud applications.",
		percentage: false
	},
	{
		id: DEPLOYED,
		name: "Deployed Applications",
		description: "Total number of deployed applications (Current lifecycle phase \"Production\") according to IT Scope",
		percentage: false
	}
];

// the list of rules (for row selection in table)
const RULE_OPTIONS = Utilities.createOptionsObj(ruleDefs);

class Report extends Component {

	constructor(props) {
		super(props);
		this._initReport = this._initReport.bind(this);
		this._handleData = this._handleData.bind(this);

		// get current two-digit fiscal year (Fiscal Year is from April 1st to March 31st)
		let today = new Date();
		this.fiscalYear = (today.getMonth > 3 ? today.getFullYear() : today.getFullYear() -1);
		this.fiscalYear2 = this.fiscalYear % 100; // 2-digits year

		// the list of markets (for row selection in table)
		this.MARKET_OPTIONS = {};

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
		setup.fiscalYear = this.fiscalYear2; // 2-digits year
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
				if (data.records) {
					Helper.logObject("RESPONSE - records:", data.records.edges, 0, 0);
				}
				index.put(data);
				this._handleData(index);
			});
		});
	}

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_createQuery(applicationTagId, itTagId) {
		const limitation = ''; //'first:600,';
		const facetKeyFactSheetTypes = '{facetKey:"FactSheetTypes",keys:["Application"]}';
		const facetkeyApplicationTypeTag = applicationTagId ? `,{facetKey:"Application Type",keys:["${applicationTagId}"]}` : '';
		const facetKeyCostCentreTag = itTagId ? `,{facetKey:"CostCentre",keys:["${itTagId}"]}` : '';
		const applElements = 'name tags{name}';
		const lcElements   = 'lc:lifecycle{state:asString ph:phases{phase from:startDate}}';
		const prjElements  = 'prjs:relApplicationToProject{edges{node{fs:factSheet{name}}}}';
		let query = `{records:allFactSheets(${limitation}filter:{facetFilters:[
			${facetKeyFactSheetTypes}
			${facetkeyApplicationTypeTag}
			${facetKeyCostCentreTag}
		]})
			{edges{node{...on Application{
				${applElements}
				${lcElements}
				${prjElements}}}}
			}
		}`;

		console.log(`GraphQL-Query:\n${query}`);
		return query;
	}

	/*
	7 DataFields: market|rule|fy0|fy1|fy2|fy3|fy4
	7 rows per market:
	  * PERCENT
		* ==> (        0 + CLOUD_READY + CLOUD_NATIVE) / DEPLOYED (fy0 = current FY)
		* ==> (CLOUD_TBD + CLOUD_READY + CLOUD_NATIVE) / DEPLOYED (fy1|fy2|fy3|fy4)
	  * PHYSICAL
	  * VIRTUALISED
	  * CLOUD_TBD
	  * CLOUD_READY
	  * CLOUD_NATIVE
	  * DEPLOYED
	*/

	_handleData(dataIndex) {
		console.log("HANDLE DATA...");

		// group applications by market
		let marketCount = 0;
		const groupedByMarket = {};

		dataIndex.records.nodes.forEach((e) => {

			// the market's marketEntry[maturityState][fyOffset] has to be updated
			let market;
			let maturityState;
			let fyOffset;

			// GET MARKET - identified by application or project name's prefix
			market = Utilities.getMarket(e);
			let project;
			if (!market) {
				// if not found, the related processes will be investigated
				if (e.prjs && e.prjs.nodes && e.prjs.nodes.length>0) {
					for (let p=0; p<e.prjs.nodes.length; p++) {
						let prj = e.prjs.nodes[p];
						market = Utilities.getMarket(prj);
						if (market) {
							project = prj.fs; // first one wins
							break;
						}
					}
				}
			}
			//console.log(`Application: ${e.name} ==> Market: ${market}`);
			if (!market) {
				return;
			}

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

			// GET LIFECYCLE STATE AND START DATE
			if (e.lc) {
				if (e.lc.state === "active") {
					//console.log(`  >>> ${e.lc.state} in current fiscal year`);
					fyOffset = 0; // current fiscal year
				} else if (e.lc.ph) {
					// search for 'active' phase in lifecycle phases
					e.lc.ph.forEach((lcPhase) => {
						if (lcPhase.phase === "active") {
							// active in the future?
							let yyyymmdd = `{this.fiscalYear}-04-01`; // yyyy-04-01
							if (lcPhase.from >= yyyymmdd) {
								// yes, in the future
								for (let offset=4; offset>0; offset--) {
									let yyyymmdd = `{this.fiscalYear+offset}-04-01`;
									if (lcPhase.from >= yyyymmdd) {
										console.log(`  >>> ${e.lc.state} (active from ${lcPhase.from})`);
										fyOffset = offset
										break; // startDate is within FY+fyOffset (2017 + 3)
									}
								}
							}
						}
					});
				}
			}

			// GET MATURITY STATE - mainly from tags
			let tags = e.tags; // taglist

			// tag defines the maturity state for: Cloud Native, Cloud Ready, Virtualised, Physical
			// if no maturity tag ==> DEPLOYED
			maturityState = DEPLOYED;
			for (let i=0; i<tags.length; i++) {
				let tag = tags[i];
				if (tag) {
					if (tag.name === "Physical/Legacy") {
						maturityState = PHYSICAL;
						break;
					} else if (tag.name === "Virtualised") {
						maturityState = VIRTUALISED;
						break;
					} else if (tag.name === "Cloud Native") {
						maturityState = NATIVE;
						break;
					} else if (tag.name === "Cloud Ready") {
						maturityState = READY;
						break;
					}
				}
			} // for

			// search related projects:
			if (!fyOffset && project) {
				const prj_name = project.name;

				/* check if project's name ends with
				   * '_Cloud TBD FYNN/MM',
				   * '_Virtualised FYNN/MM',
				   * '_Cloud Native FYNN/MM',
				   * '_Cloud Ready FYNN/MM',
				*/
				for (let offset=0; offset<5; offset++) {
					let fySnippet = `FY${this.fiscalYear2+offset}/${this.fiscalYear2+offset+1}`;
					if (prj_name.endsWith(`_Cloud TBD ${fySnippet}`)) {
						maturityState = TBD;
						fyOffset = offset;
						break;
					}
					if (prj_name.endsWith(`_Cloud Native ${fySnippet}`)) {
						maturityState = NATIVE;
						fyOffset = offset;
						break;
					}
					if (prj_name.endsWith(`_Cloud Ready ${fySnippet}`)) {
						maturityState = READY;
						fyOffset = offset;
						break;
					}
					if (prj_name.endsWith(`_Virtualised ${fySnippet}`)) {
						maturityState = VIRTUALISED;
						fyOffset = offset;
						break;
					}
				}
			}

			//console.log(`  >>> Market: ${market} ==> marketentry[${maturityState}][${fyOffset}]++`);
			if (maturityState && fyOffset) {
				marketentry[maturityState][fyOffset]++;
			}
		}); // records

		// add fiscal year results to tableData (7 rows per market)
		console.log("FILL TABLE...");
		const tableData = [];
		for (let marketKey in groupedByMarket) {
			let m = groupedByMarket[marketKey]; // a 7-by-5 array of numbers

			// computated cloud percentage = (cloud_tdb + cloud_ready + cloud_native) / deployed
			tableData.push({
				id: marketKey + '_' + ruleDefs[PERCENT].id,
				market: Helper.getOptionKeyFromValue(this.MARKET_OPTIONS, marketKey),
				rule:   Helper.getOptionKeyFromValue(RULE_OPTIONS, ruleDefs[PERCENT].name),
				percentage: ruleDefs[PERCENT].percentage,
				fy0: Helper.computePercentage(       0 , m[READY][0], m[NATIVE][0], m[DEPLOYED][0]), // no TBD in current FY
				fy1: Helper.computePercentage(m[TBD][1], m[READY][1], m[NATIVE][1], m[DEPLOYED][1]),
				fy2: Helper.computePercentage(m[TBD][2], m[READY][2], m[NATIVE][2], m[DEPLOYED][2]),
				fy3: Helper.computePercentage(m[TBD][3], m[READY][3], m[NATIVE][3], m[DEPLOYED][3]),
				fy4: Helper.computePercentage(m[TBD][4], m[READY][4], m[NATIVE][4], m[DEPLOYED][4]),
			});

			// the 6 other rules
			for (let rule = PHYSICAL; rule<RULE_COUNT; rule++) {
				tableData.push({
					id: marketKey + '_' + ruleDefs[rule].id,
					market: Helper.getOptionKeyFromValue(this.MARKET_OPTIONS, marketKey),
					rule:   Helper.getOptionKeyFromValue(RULE_OPTIONS, ruleDefs[rule].name),
					percentage: ruleDefs[rule].percentage,
					fy0: m[rule][0],
					fy1: m[rule][1],
					fy2: m[rule][2],
					fy3: m[rule][3],
					fy4: m[rule][4]
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
					rules: RULE_OPTIONS
				}}
				setup={this.state.setup} />
		);
	}
}

export default Report;
