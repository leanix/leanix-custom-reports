import React, { Component } from 'react';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import CommonQueries from './CommonGraphQLQueries';
import DataIndex from './DataIndex';
import Link from './Link';
import LinkList from './LinkList';
import Utilities from './Utilities';
import RuleSet from './RuleSet';

import $ from 'jquery';
import _ from 'lodash';

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
		let appMapIDFilter = undefined;
		let tagNameDef = undefined;
		if (appMapID) {
			appMapIDFilter = `, {facetKey: "BC Type", keys: ["${appMapID}"]}`;
			tagNameDef = '';
		} else {
			// tagGroup.name changed or id couldn't be determined otherwise -> need a query with tags for bc's
			appMapIDFilter = '';
			tagNameDef = 'tags { name }';
		}
		return `{applications: allFactSheets(
					sort: {mode: BY_FIELD, key: "displayName", order: asc},
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Application"]}
						${applicationTagIDFilter}
						${itTagIDFilter}
					]}
				) {
					edges {node {
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
						{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]} ${appMapIDFilter}
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
					edges {node {
						id tags { name }
					}}
				}}`;
	}

	_handleData(index, applicationTagID, itTagID, appMapID) {
		const tableData = [];
		this.MARKET_OPTIONS = {};
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
					ruleResult = e.compute(compliants, nonCompliants);
				} else {
					ruleResult = e.compute(index, applications);
					compliants[e.name] = ruleResult.compliant;
					nonCompliants[e.name] = ruleResult.nonCompliant;
				}
				tableData.push({
					id: market + '-' + e.name,
					market: Utilities.getKeyToValue(this.MARKET_OPTIONS, market),
					rule: e.name,
					compliant: ruleResult.compliant,
					nonCompliant: ruleResult.nonCompliant,
					percentage: 0,
					url: null
				});
			});
		}
		this.setState({
			data: tableData
		});
	}

	/* formatting functions for the table */

	_formatEnum(cell, row, enums) {
		if (cell < 0) {
			return '';
		}
		return enums[cell];
	}

	_formatPercentage(cell, row) {
		if (!cell) {
			return '';
		}
		return cell;
	}

	render() {
		if (this.state.data.length === 0) {
			//return null;
		}
		return (
			<BootstrapTable data={this.state.data} keyField='id'
				 striped hover search exportCSV
				 options={{ clearSearch: true }}>
				<TableHeaderColumn hidden
					 dataField='id'
					>id</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='market'
					 width='80px'
					 headerAlign='left'
					 dataAlign='left'
					 dataFormat={this._formatEnum}
					 formatExtraData={this.MARKET_OPTIONS}
					 csvFormat={this._formatEnum}
					 csvFormatExtraData={this.MARKET_OPTIONS}
					 filter={{ type: 'SelectFilter', placeholder: 'Please choose', options: this.MARKET_OPTIONS }}
					>Market</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='rule'
					 width='300px'
					 headerAlign='left'
					 dataAlign='left'
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Rule</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='compliant'
					 width='110px'
					 headerAlign='left'
					 dataAlign='left'
					 filter={{ type: 'NumberFilter', placeholder: 'Please enter a value', defaultValue: { comparator: '<=' } }}
					>Compliant</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='nonCompliant'
					 width='110px'
					 headerAlign='left'
					 dataAlign='left'
					 csvHeader='non-compliant'
					 filter={{ type: 'NumberFilter', placeholder: 'Please enter a value', defaultValue: { comparator: '<=' } }}
					>Non-Compliant</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='percentage'
					 width='110px'
					 headerAlign='left'
					 dataAlign='left'
					 dataFormat={this._formatPercentage}
					 csvHeader='compliant-percentage'
					 filter={{ type: 'NumberFilter', placeholder: 'Please enter a value', defaultValue: { comparator: '<=' } }}
					>% Compliant</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

export default Report;
