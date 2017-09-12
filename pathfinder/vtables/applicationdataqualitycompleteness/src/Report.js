import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Utilities from './common/Utilities';
import RuleSet from './RuleSet';
import Table from './Table';

const RULE_OPTIONS = Utilities.createOptionsObj(
	RuleSet.singleRules.concat(RuleSet.overallRule));

class Report extends Component {

	constructor(props) {
		super(props);
		this._initReport = this._initReport.bind(this);
		this._handleData = this._handleData.bind(this);
		this._renderAdditionalNotes = this._renderAdditionalNotes.bind(this);
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
			const appMapId = index.getFirstTagID('BC Type', 'AppMap');
			lx.executeGraphQL(this._createQuery(applicationTagId, itTagId, appMapId)).then((data) => {
				index.put(data);
				this._handleData(index, applicationTagId, itTagId, appMapId);
			});
		});
	}

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_createQuery(applicationTagId, itTagId, appMapId) {
		const applicationTagIdFilter = applicationTagId ? `, {facetKey: "Application Type", keys: ["${applicationTagId}"]}` : '';
		const itTagIdFilter = itTagId ? `, {facetKey: "CostCentre", keys: ["${itTagId}"]}` : '';
		let appMapIdFilter = ''; // initial assume tagGroup.name changed or the id couldn't be determined otherwise
		let tagNameDef = 'tags { name }'; // initial assume to get it
		if (appMapId) {
			appMapIdFilter = `, {facetKey: "BC Type", keys: ["${appMapId}"]}`;
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
						id name description tags { name }
						subscriptions { edges { node { roles { name } } } }
						... on Application {
							lifecycle { asString phases { phase startDate } }
							functionalSuitability technicalSuitability
							relApplicationToProject { edges { node { projectImpact factSheet { id } } } }
							relApplicationToBusinessCapability { edges { node { factSheet { id } } } }
							relApplicationToITComponent { edges { node { factSheet { id } } } }
						}
					}}
				}
				businessCapabilities: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]}
						${appMapIdFilter}
					]}
				) {
					edges { node { id ${tagNameDef} } }
				}
				itComponents: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["ITComponent"]},
						{facetKey: "category", keys: ["software"]}
					]}
				) {
					edges { node { id tags { name } } }
				}}`;
	}

	_handleData(index, applicationTagId, itTagId, appMapId) {
		const tableData = [];
		let additionalNotesMarker = 0;
		const additionalNotes = RuleSet.singleRules.reduce((obj, e) => {
			if (e.additionalNote) {
				obj[e.name] = {
					marker: additionalNotesMarker++,
					note: e.additionalNote
				};
			}
			return obj;
		}, {});
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
		const ruleConfig = {
			appMapId: appMapId
		};
		for (let market in groupedByMarket) {
			const allApplications = groupedByMarket[market];
			// process single rules
			const compliants = {};
			const nonCompliants = {};
			allApplications.forEach((e2) => {
				RuleSet.singleRules.forEach((e3) => {
					if (!compliants[e3.name]) {
						compliants[e3.name] = [];
						nonCompliants[e3.name] = [];
					}
					if (!e3.appliesTo(index, e2)) {
						return;
					}
					const ruleResult = e3.compute(index, e2, ruleConfig);
					if (ruleResult) {
						compliants[e3.name].push(e2);
					} else {
						nonCompliants[e3.name].push(e2);
					}
				});
			});
			// add results to tableData
			RuleSet.singleRules.forEach((e2) => {
				const compliant = compliants[e2.name].length;
				const nonCompliant = nonCompliants[e2.name].length;
				tableData.push({
					id: market + '-' + e2.name,
					market: this._getOptionKeyFromValue(this.MARKET_OPTIONS, market),
					rule: this._getOptionKeyFromValue(RULE_OPTIONS, e2.name),
					overallRule: false,
					compliant: compliant,
					compliantApps: compliants[e2.name].map((e3) => {
						return e3.name;
					}),
					compliantAppIds: compliants[e2.name].map((e3) => {
						return e3.id;
					}),
					nonCompliant: nonCompliant,
					nonCompliantApps: nonCompliants[e2.name].map((e3) => {
						return e3.name;
					}),
					nonCompliantAppIds: nonCompliants[e2.name].map((e3) => {
						return e3.id;
					}),
					percentage: this._computePercentage(compliant, nonCompliant)
				});
			});
			// process overall rule
			const overallRuleResult = RuleSet.overallRule.compute(compliants, nonCompliants, ruleConfig);
			tableData.push({
				id: market + '-' + RuleSet.overallRule.name,
				market: this._getOptionKeyFromValue(this.MARKET_OPTIONS, market),
				rule: this._getOptionKeyFromValue(RULE_OPTIONS, RuleSet.overallRule.name),
				overallRule: true,
				compliant: overallRuleResult.compliant,
				compliantApps: [],
				compliantAppIds: [],
				nonCompliant: overallRuleResult.nonCompliant,
				nonCompliantApps: [],
				nonCompliantAppIds: [],
				percentage: this._computePercentage(overallRuleResult.compliant, overallRuleResult.nonCompliant)
			});
		}
		lx.hideSpinner();
		this.setState({
			data: tableData,
			additionalNotes: additionalNotes
		});
	}

	_computePercentage(compliant, nonCompliant) {
		const sum = compliant + nonCompliant;
		let percentage = undefined;
		if (sum === 0) {
			percentage = Number.NaN;
		} else if (compliant > 0 && nonCompliant === 0) {
			percentage = 100;
		} else if (compliant === 0 && nonCompliant > 0) {
			percentage = 0;
		} else {
			// note: floor cuts the post comma digits (rounding down)
			percentage = Math.floor(compliant * 100 / sum);
		}
		return percentage;
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
			<div>
				<Table data={this.state.data}
					additionalNotes={this.state.additionalNotes}
					options={{
						market: this.MARKET_OPTIONS,
						rule: RULE_OPTIONS
					}}
					pageSize={RuleSet.singleRules.length + 1}
					setup={this.state.setup} />
				{this._renderAdditionalNotes()}
			</div>
		);
	}

	_renderAdditionalNotes() {
		const arr = [];
		for (let key in this.state.additionalNotes) {
			const additionalNote = this.state.additionalNotes[key];
			arr[additionalNote.marker] = additionalNote.note;
		}
		return (
			<dl className='small'>
				{arr.map((e, i) => {
					return (
						<span key={i}>
							<dt>{i + 1}.</dt>
							<dd>{e}</dd>
						</span>
					);
				})}
			</dl>
		);
	}
}

export default Report;
