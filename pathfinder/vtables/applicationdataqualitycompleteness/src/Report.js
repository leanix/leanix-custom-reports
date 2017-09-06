import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Utilities from './common/Utilities';
import RuleSet from './RuleSet';
import Table from './Table';

const RULE_OPTIONS = Utilities.createOptionsObj(RuleSet);

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
				}
				projects: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Project"]}
					]}
				) {
					edges { node { id name } }
				}}`;
	}

	_handleData(index, applicationTagId, itTagId, appMapId) {
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
		const ruleConfig = {
			appMapId: appMapId
		};
		for (let market in groupedByMarket) {
			const allApplications = groupedByMarket[market];
			// apply rule set
			const compliants = {};
			const nonCompliants = {};
			allApplications.forEach((e2) => {
				RuleSet.forEach((e3) => {
					if (e3.overall) {
						return;
					}
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
			// process overall rules
			RuleSet.forEach((e2) => {
				if (!e2.overall) {
					return;
				}
				const ruleResult = e2.compute(compliants, nonCompliants, ruleConfig);
				compliants[e2.name] = ruleResult.compliant;
				nonCompliants[e2.name] = ruleResult.nonCompliant;
			});
			// add results to tableData
			RuleSet.forEach((e2) => {
				const compliant = e2.overall ? compliants[e2.name] : compliants[e2.name].length;
				const nonCompliant = e2.overall ? nonCompliants[e2.name] : nonCompliants[e2.name].length;
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
				tableData.push({
					id: market + '-' + e2.name,
					market: this._getOptionKeyFromValue(this.MARKET_OPTIONS, market),
					rule: this._getOptionKeyFromValue(RULE_OPTIONS, e2.name),
					overallRule: e2.overall === true,
					compliant: compliant,
					compliantApps: e2.overall ? [] : compliants[e2.name].map((e3) => {
						return e3.name;
					}),
					compliantAppIds: e2.overall ? [] : compliants[e2.name].map((e3) => {
						return e3.id;
					}),
					nonCompliant: nonCompliant,
					nonCompliantApps: e2.overall ? [] : nonCompliants[e2.name].map((e3) => {
						return e3.name;
					}),
					nonCompliantAppIds: e2.overall ? [] : nonCompliants[e2.name].map((e3) => {
						return e3.id;
					}),
					percentage: percentage
				});
			});
		}
		lx.hideSpinner();
		this.setState({
			data: tableData
		});
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
				options={{
					market: this.MARKET_OPTIONS,
					rule: RULE_OPTIONS
				}}
				pageSize={RuleSet.length}
				setup={this.state.setup} />
		);
	}
}

export default Report;
