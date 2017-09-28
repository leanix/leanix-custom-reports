import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Utilities from './common/Utilities';
import RuleSet from './RuleSet';
import Table from './Table';

const RULE_OPTIONS = Utilities.createOptionsObj(
	RuleSet.singleRules.concat(RuleSet.appTypeRule, RuleSet.overallRule));

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
							relApplicationToOwningUserGroup { edges { node { factSheet { id } } } }
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
				}
				userGroups: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["UserGroup"]}
					]}
				) {
					edges { node { id name } }
				}
				noAppType: allFactSheets(
					sort: { mode: BY_FIELD, key: "displayName", order: asc },
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Application"]}
						, {facetKey: "Application Type", keys: ["__missing__"]}
					]}
				) {
					edges { node { id name } }
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
		// group applications by market
		const groupResult = this._groupByMarket(index.applications.nodes, (application) => {
			return (!applicationTagId && !index.includesTag(application, 'Application'))
				|| (!itTagId && !index.includesTag(application, 'IT'));
		});
		const groupedByMarket = groupResult.groups;
		this.MARKET_OPTIONS = groupResult.options;
		// get 'noAppType' groups
		const noAppTypeGroupResult = this._groupByMarket(index.noAppType.nodes);
		const ruleConfig = {
			appMapId: appMapId
		};
		for (let market in groupedByMarket) {
			ruleConfig.market = market;
			const allApplications = groupedByMarket[market];
			// process single rules
			const compliants = {};
			const nonCompliants = {};
			allApplications.forEach((e) => {
				RuleSet.singleRules.forEach((e2) => {
					if (!compliants[e2.name]) {
						compliants[e2.name] = [];
						nonCompliants[e2.name] = [];
					}
					if (!e2.appliesTo(index, e)) {
						return;
					}
					const ruleResult = e2.compute(index, e, ruleConfig);
					if (ruleResult) {
						compliants[e2.name].push(e);
					} else {
						nonCompliants[e2.name].push(e);
					}
				});
			});
			// add results to tableData
			RuleSet.singleRules.forEach((e) => {
				const compliant = compliants[e.name].length;
				const nonCompliant = nonCompliants[e.name].length;
				tableData.push({
					id: market + '-' + e.name,
					market: this._getOptionKeyFromValue(this.MARKET_OPTIONS, market),
					rule: this._getOptionKeyFromValue(RULE_OPTIONS, e.name),
					overallRule: false,
					compliant: compliant,
					compliantApps: compliants[e.name].map((e2) => {
						return e2.name;
					}),
					compliantAppIds: compliants[e.name].map((e2) => {
						return e2.id;
					}),
					nonCompliant: nonCompliant,
					nonCompliantApps: nonCompliants[e.name].map((e2) => {
						return e2.name;
					}),
					nonCompliantAppIds: nonCompliants[e.name].map((e2) => {
						return e2.id;
					}),
					percentage: this._computePercentage(compliant, nonCompliant)
				});
			});
			// process 'noAppType' rule
			const noAppTypeApps = noAppTypeGroupResult.groups[market];
			if (noAppTypeApps) {
				const noAppTypeRuleResult = RuleSet.appTypeRule.compute(index, noAppTypeApps, ruleConfig);
				compliants[RuleSet.appTypeRule.name] = [];
				nonCompliants[RuleSet.appTypeRule.name] = noAppTypeRuleResult.nonCompliant;
				tableData.push({
					id: market + '-' + RuleSet.appTypeRule.name,
					market: this._getOptionKeyFromValue(this.MARKET_OPTIONS, market),
					rule: this._getOptionKeyFromValue(RULE_OPTIONS, RuleSet.appTypeRule.name),
					overallRule: false,
					compliant: Number.NaN,
					compliantApps: [],
					compliantAppIds: [],
					nonCompliant: noAppTypeRuleResult.nonCompliant.length,
					nonCompliantApps: noAppTypeRuleResult.nonCompliant.map((e) => {
						return e.name;
					}),
					nonCompliantAppIds: noAppTypeRuleResult.nonCompliant.map((e) => {
						return e.id;
					}),
					percentage: (noAppTypeRuleResult.nonCompliant.length > 0 ? 0 : 100)
				});
			} else {
				// add empty entry
				compliants[RuleSet.appTypeRule.name] = [];
				nonCompliants[RuleSet.appTypeRule.name] = [];
				tableData.push({
					id: market + '-' + RuleSet.appTypeRule.name,
					market: this._getOptionKeyFromValue(this.MARKET_OPTIONS, market),
					rule: this._getOptionKeyFromValue(RULE_OPTIONS, RuleSet.appTypeRule.name),
					overallRule: true,
					compliant: 0,
					compliantApps: [],
					compliantAppIds: [],
					nonCompliant: 0,
					nonCompliantApps: [],
					nonCompliantAppIds: [],
					percentage: Number.NaN
				});
			}
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

	_groupByMarket(nodes, additionalFilter) {
		let marketCount = 0;
		const groupedByMarket = {};
		const marketOptions = {};
		nodes.forEach((e) => {
			if (additionalFilter && additionalFilter(e)) {
				return;
			}
			const market = Utilities.getMarket(e);
			if (!market) {
				return;
			}
			if (!groupedByMarket[market]) {
				groupedByMarket[market] = [];
				marketOptions[marketCount++] = market;
			}
			groupedByMarket[market].push(e);
		});
		return {
			groups: groupedByMarket,
			options: marketOptions
		};
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
			return (<h4 className='text-center'>Loading data...</h4>);
		}
		return (
			<div>
				<Table data={this.state.data}
					additionalNotes={this.state.additionalNotes}
					options={{
						market: this.MARKET_OPTIONS,
						rule: RULE_OPTIONS
					}}
					pageSize={RuleSet.ruleCount}
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
