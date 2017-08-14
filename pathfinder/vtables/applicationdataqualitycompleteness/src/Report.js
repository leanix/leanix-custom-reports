import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Utilities from './common/Utilities';
import RuleSet from './RuleSet';
import Table from './Table';

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
		this.setState({
			setup: setup
		});
		// get all tags, then the data
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			const index = new DataIndex();
			index.put(tagGroups);
			const applicationTagID = index.getFirstTagID('Application Type', 'Application');
			const itTagID = index.getFirstTagID('CostCentre', 'IT');
			const appMapID = index.getFirstTagID('BC Type', 'AppMap');
			lx.executeGraphQL(this._createQuery(applicationTagID, itTagID, appMapID)).then((data) => {
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

	_createQuery(applicationTagID, itTagID, appMapID) {
		const applicationTagIDFilter = applicationTagID ? `, {facetKey: "Application Type", keys: ["${applicationTagID}"]}` : '';
		const itTagIDFilter = itTagID ? `, {facetKey: "CostCentre", keys: ["${itTagID}"]}` : '';
		let appMapIDFilter = ''; // initial assume tagGroup.name changed or the id couldn't be determined otherwise
		let tagNameDef = 'tags { name }'; // initial assume to get it
		if (appMapID) {
			appMapIDFilter = `, {facetKey: "BC Type", keys: ["${appMapID}"]}`;
			tagNameDef = '';
		}
		return `{applications: allFactSheets(
					sort: {mode: BY_FIELD, key: "displayName", order: asc},
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Application"]}
						${applicationTagIDFilter}
						${itTagIDFilter}
					]}
				) {
					edges { node {
						id name description tags { name }
						subscriptions { edges { node { roles { name } } } }
						... on Application {
							lifecycle { asString phases { phase startDate } }
							functionalSuitability technicalSuitability
							relApplicationToProject { edges { node { factSheet { id } } } }
							relApplicationToBusinessCapability { edges { node { factSheet { id } } } }
							relApplicationToITComponent { edges { node { factSheet { id } } } }
						}
					}}
				}
				businessCapabilities: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]}
						${appMapIDFilter}
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

	_handleData(index, applicationTagID, itTagID, appMapID) {
		const tableData = [];
		let marketCount = 0;
		// group applications by market
		const groupedByMarket = {};
		index.applications.nodes.forEach((e) => {
			if (!applicationTagID && !index.includesTag(e, 'Application')) {
				return;
			}
			if (!itTagID && !index.includesTag(e, 'IT')) {
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
			appMapID: appMapID
		};
		for (let market in groupedByMarket) {
			const allApplications = groupedByMarket[market];
			const onlyActive = allApplications.filter((e) => {
				const currentLifecycle = Utilities.getCurrentLifecycle(e);
				return currentLifecycle && currentLifecycle.phase === 'active';
			});
			const onlyActiveCOTSPackage = onlyActive.filter((e) => {
				return index.includesTag(e, 'COTS Package');
			});
			const applications = {
				all: allApplications,
				onlyActive: onlyActive,
				onlyActiveCOTSPackage: onlyActiveCOTSPackage
			};
			// apply rule set
			const compliants = {};
			const nonCompliants = {};
			RuleSet.forEach((e) => {
				let ruleResult = undefined;
				if (e.overall) {
					ruleResult = e.compute(compliants, nonCompliants, ruleConfig);
				} else {
					ruleResult = e.compute(index, applications, ruleConfig);
					compliants[e.name] = ruleResult.compliant.length;
					nonCompliants[e.name] = ruleResult.nonCompliant.length;
				}
				const compliant = e.overall ? ruleResult.compliant : ruleResult.compliant.length;
				const nonCompliant = e.overall ? ruleResult.nonCompliant : ruleResult.nonCompliant.length;
				const sum = compliant + nonCompliant;
				let percentage = undefined;
				if (sum === 0 || (compliant > 0 && nonCompliant === 0)) {
					percentage = 100;
				} else if (compliant === 0 && nonCompliant > 0) {
					percentage = 0;
				} else {
					percentage = compliant * 100 / sum;
				}
				percentage = Math.floor(percentage);
				tableData.push({
					id: market + '-' + e.name,
					market: Utilities.getKeyToValue(this.MARKET_OPTIONS, market),
					rule: e.name,
					overallRule: e.overall === true,
					compliant: compliant,
					compliantApps: e.overall ? [] : ruleResult.compliant,
					nonCompliant: nonCompliant,
					nonCompliantApps: e.overall ? [] : ruleResult.nonCompliant,
					percentage: percentage
				});
			});
		}
		this.setState({
			data: tableData
		});
	}

	render() {
		return (
			<Table data={this.state.data}
				pageSize={RuleSet.length}
				options={{
					market: this.MARKET_OPTIONS
				}} />
		);
	}
}

export default Report;
