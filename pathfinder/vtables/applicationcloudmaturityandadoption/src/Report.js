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
		this.fiscalYear = (today.getMonth < 3 ? today.getFullYear()-1 : today.getFullYear());
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
		setup.fiscalYear = this.fiscalYear2; // 2-digits year for report table
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
		const limitation = ''; //'first:100,';
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
	Collect the regarding countings for each single market
	* 1 value for current fiscal year (fy0) and
	  4 values for the 4 upcoming fiscal years (fy1 ... fy4)
	* 7 data fields (columns in table): market|rule|fy0|fy1|fy2|fy3|fy4
	* 7 rows per market:
	  * PERCENT (calculated)
		* ==> (        0 + CLOUD_READY + CLOUD_NATIVE) / DEPLOYED (fy0)
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
		/*
		FOR EACH Record in Recordset (GraphQL response):
			IF   there is a project related to the current application record
			THEN Extract market, maturity state and fiscal year from the
				 project's name '<MARKET>_<MATURITYSTATE> FY<XX>/<YY>'
			IF   either market or maturity state or fiscal year is not yet defined
			THEN Extract market from the application's name
				 Extract maturity state from the 'Cloud Maturity' tag (if any)
				 IF   there is no 'Cloud Maturity' tag
				 THEN cloud maturity is set to DEPLOYED
				 Extract fiscal year from lifecycle state
				 IF   lifecycle.state= 'active'
				 THEN fiscal year is current year
				 ELSE Extract fiscal year from the application's lifecycle phases
					  Get the 'active' phase and check its StartDate
					  When looking backwards in time the fiscal year is that year,
					  where for the first time
					  startDate is greater than or equal to '<FiscalYear>-04-01'
			IF   market and maturity state and fiscal year are defined
			THEN increment counter of <MARKET>[<MATURITYSTATE>][<FISCALYEAR].
		*/

		// group applications by market
		let marketCount = 0;
		const groupedByMarket = {};
		let counter = 0; // for logging purposes only
		let valid = 0; // for logging purposes only

		dataIndex.records.nodes.forEach((appl) => {
			counter++;

			// the market's marketEntry[maturityState][fyOffset] has to be updated
			let market;
			let maturityState;
			let fyOffset;

			// search related projects
			let project;
			if (appl.prjs && appl.prjs.nodes && appl.prjs.nodes.length>0) {
				for (let p=0; p<appl.prjs.nodes.length; p++) {
					project = appl.prjs.nodes[p].fs;
					market = Utilities.getMarket(project);
					if (market) {
						break; // first one wins
					}
				}
			}

			if (market) {
				/* got market, check if project's name ends with
				   * '_Cloud TBD FYNN/MM',
				   * '_Virtualised FYNN/MM',
				   * '_Cloud Native FYNN/MM',
				   * '_Cloud Ready FYNN/MM',
				*/
				let prj_name = project.name;
				//console.log(`got market '${market}' from project '${prj_name}' of application '${appl.name}'`);

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

			if (!market || !maturityState || !fyOffset) {
				// analyze application's data
				//console.log(`need to get info from application '${appl.name}'`);

				// get market (from application's name)
				market = Utilities.getMarket(appl);
				if (!market) {
					return; // no valid record
				}

				// get fiscal year (from application's lifecycle)
				if (!appl.lc) {
					return; // no valid record
				}

				if (appl.lc.state === "active") {
					//console.log("  >>> 'active' in current fiscal year");
					fyOffset = 0; // current fiscal year
				} else if (appl.lc.ph) {
					// investigate the lifecycle phases
					let endOfLife = '9999-99-99';
					let active    = '9999-99-99';
					appl.lc.ph.forEach((lcPhase) => {
						switch (lcPhase.phase) {
						case "endOfLife":
							endOfLife = lcPhase.from;
							break;
						case "active":
							active = lcPhase.from;
							break;
						}
					});

					//console.log(`  >>> active from ${active} to ${endOfLife}`);
					if (endOfLife >  this.fiscalYear    + "-04-01" && // endOfLife not before current fiscal year
						active    < (this.fiscalYear+5) + "-04-01"){  // active        before current fiscal year + 5
						// active phase is within the next 4 years
						for (let offset=4; offset>0; offset--) {
							let yyyymmdd = (this.fiscalYear+offset) + "-04-01";
							if (active >= yyyymmdd) {
								fyOffset = offset;
								break;
							}
						}
					}
				}
			} // if (!market || !maturityState || !fyOffset)

			if (fyOffset == null) {
				return; // no valid record
			}

			// get maturity state (from application's tags)
			if (!appl.tags) {
				return; // no valid record
			}
			// if no maturity tag ==> DEPLOYED
			for (let t=0; t<appl.tags.length; t++) {
				if (appl.tags[t]) {
					switch (appl.tags[t].name) {
					case "Physical/Legacy":
						maturityState = PHYSICAL;
						break;
					case "Virtualised":
						maturityState = VIRTUALISED;
						break;
					case "Cloud Native":
						maturityState = NATIVE;
						break;
					case "Cloud Ready":
						maturityState = READY;
						break;
					}
					if (maturityState) {
						break; // for
					}
				}
			} // for

			if (!maturityState) {
				// if no 'Cloud Maturity' tag, then DEPLOYED
				maturityState = DEPLOYED;
			}

			// OK, got all - update counter

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

			//console.log(`${counter}. ${appl.name}: Market ${market} - MatState ${maturityState} - Fiscal Year Offset ${fyOffset}`);
			valid++;
			marketentry[maturityState][fyOffset]++;
		}); // records

		// add fiscal year results to tableData (7 rows per market)
		console.log(`FILL TABLE... (${valid} valid out of ${counter} application records)`);

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
