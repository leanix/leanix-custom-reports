import React, {	Component } from 'react';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import CommonQueries from './CommonGraphQLQueries';
import DataIndex from './DataIndex';
import Link from './Link';

class Report extends Component {

	constructor(props) {
		super(props);
		this._initReport = this._initReport.bind(this);
		this._handleData = this._handleData.bind(this);
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
			const appMapID = index.getFirstTagID('BC Type', 'AppMap');
			lx.executeGraphQL(this._createQuery(appMapID)).then((data) => {
				index.put(data);
				this._handleData(index, appMapID);
			});
		});
	}

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_createQuery(appMapID) {
		let appMapIDFilter = ''; // initial assume tagGroup.name changed or the id couldn't be determined otherwise
		let tagNameDef = 'tags { name }'; // initial assume to get it
		if (appMapID) {
			// query filtering only bc with tag 'AppMap'
			appMapIDFilter = `, {facetKey: "BC Type", keys: ["${appMapID}"]}`;
			tagNameDef = '';
		}
		return `{businessCapabilities: allFactSheets(
					sort: {mode: BY_FIELD, key: "displayName", order: asc},
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]}
						${appMapIDFilter}
					]}
				) {
					edges { node {
						id name ${tagNameDef}
						... on BusinessCapability {
							relBusinessCapabilityToPlatform {
								edges { node { factSheet {
									id name
									... on BusinessCapability {
										relToParent { edges { node { factSheet { id name } } } }
									}
								}}}
							}
							relToParent { edges { node { factSheet { id name } } } }
						}
					}}
				}}`;
	}

	_handleData(index, appMapID) {
		const tableData = [];
		index.businessCapabilities.nodes.forEach((appMapL2) => {
			if (!appMapID && !index.includesTag(appMapL2, 'AppMap')) {
				return;
			}
			const subIndex = appMapL2.relBusinessCapabilityToPlatform;
			if (!subIndex) {
				return;
			}
			const appMapL1 = appMapL2.relToParent ? appMapL2.relToParent.nodes[0] : undefined;
			subIndex.nodes.forEach((platformL2) => {
				const platformL1 = platformL2.relToParent ? platformL2.relToParent.nodes[0] : undefined;
				tableData.push({
					appMapL1ID: appMapL1 ? appMapL1.id : '',
					appMapL1Name: appMapL1 ? appMapL1.name : '',
					appMapL2ID: appMapL2.id,
					appMapL2Name: appMapL2.name,
					platformL1ID: platformL1 ? platformL1.id : '',
					platformL1Name: platformL1 ? platformL1.name : '',
					platformL2ID: platformL2.id,
					platformL2Name: platformL2.name
				});
			});
		});
		this.setState({
			data: tableData
		});
	}

	/* formatting functions for the table */

	_formatLink(cell, row, idName) {
		if (!cell) {
			return '';
		}
		return (<Link link={'factsheet/BusinessCapability/' + row[idName]} target='_blank' text={cell} />);
	}

	render() {
		if (this.state.data.length === 0) {
			return null;
		}
		return (
			<BootstrapTable data={this.state.data} keyField='appMapL2ID'
				striped hover search pagination ignoreSinglePage exportCSV
				options={{ clearSearch: true }}>
				<TableHeaderColumn dataSort
					dataField='appMapL1Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={'appMapL1ID'}
					csvHeader='appmap-domain'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>AppMap Domain</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='appMapL2Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={'appMapL2ID'}
					csvHeader='appmap-solution-area'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>AppMap Solution Area</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='platformL2Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={'platformL2ID'}
					csvHeader='platform'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>Platform</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='platformL1Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={'platformL1ID'}
					csvHeader='platform-layer'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>Platform Layer</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

export default Report;
