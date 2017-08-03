import React, { Component } from 'react';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import CommonQueries from './CommonGraphQLQueries';
import DataIndex from './DataIndex';
import Utilities from './Utilities';
import RuleSet from './RuleSet';
import SubTables from './SubTables';

class Report extends Component {

	constructor(props) {
		super(props);
		this._initReport = this._initReport.bind(this);
		this._handleData = this._handleData.bind(this);
		this._formatPercentage = this._formatPercentage.bind(this);
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

	/* formatting functions for the table */

	_formatEnum(cell, row, enums) {
		if (cell < 0) {
			return '';
		}
		return enums[cell];
	}

	_formatPercentage(cell, row) {
		if (cell === undefined || cell === null) {
			return '';
		}
		return (
			<div className='label'
				 style={{
					 display: 'inline-block',
					 textAlign: 'center',
					 width: '50px',
					 fontSize: '80%',
					 paddingTop: '0.35em',
					 color: 'inherit',
					 backgroundColor: this._getGreenToRed(cell)
				 }}
			>{cell + ' %'}</div>
		);
	}

	_getGreenToRed(percent) {
		// TODO nicer color fade
		const r = percent < 50 ? 255 : Math.floor(255 - (percent * 2 - 100) * 255 / 100);
		const g = percent > 50 ? 255 : Math.floor((percent * 2) * 255 / 100);
		return 'rgb(' + r + ',' + g + ',0)';
	}

	/* customizing for the table */

	_trClassname(row, fieldValue, rowIdx, colIdx) {
		if (row.overallRule) {
			return 'info';
		}
		return '';
	}

	_isExpandableRow(row) {
		if (row.overallRule || (row.compliant === 0 && row.nonCompliant === 0)) {
			return false;
		}
		return true;
	}

	_expandComponent(row) {
		return (
			<SubTables data={{ compliantApps: row.compliantApps, nonCompliantApps: row.nonCompliantApps }} />
		);
	}

	render() {
		if (this.state.data.length === 0) {
			return null;
		}
		// TODO root csv export must have the ids aswell?
		return (
			<BootstrapTable data={this.state.data} keyField='id'
				 expandableRow={this._isExpandableRow}
				 expandComponent={this._expandComponent}
				 expandColumnOptions={{ expandColumnVisible: true }}
				 striped hover search exportCSV
				 options={{ clearSearch: true }}
				 trClassName={this._trClassname}>
				<TableHeaderColumn dataSort
					 dataField='market'
					 width='160px'
					 dataAlign='left'
					 dataFormat={this._formatEnum}
					 formatExtraData={this.MARKET_OPTIONS}
					 csvFormat={this._formatEnum}
					 csvFormatExtraData={this.MARKET_OPTIONS}
					 filter={{ type: 'SelectFilter', placeholder: 'Please choose', options: this.MARKET_OPTIONS }}
					>Market</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='rule'
					 width='400px'
					 dataAlign='left'
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Rule</TableHeaderColumn>
				<TableHeaderColumn hidden export
					 dataField='overallRule'
					 csvHeader='overall-rule'
					>overallRule</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='compliant'
					 width='260px'
					 dataAlign='left'
					 filter={{ type: 'NumberFilter', placeholder: 'Please enter a value', defaultValue: { comparator: '<=' } }}
					>Compliant</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='nonCompliant'
					 width='260px'
					 dataAlign='left'
					 csvHeader='non-compliant'
					 filter={{ type: 'NumberFilter', placeholder: 'Please enter a value', defaultValue: { comparator: '<=' } }}
					>Non-Compliant</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='percentage'
					 width='260px'
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
