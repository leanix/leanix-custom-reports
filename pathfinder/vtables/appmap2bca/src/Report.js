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
							relToParent { edges { node { factSheet { id name } } } }
							relBusinessCapabilityToBCA { edges { node { factSheet { id name
								... on BusinessCapability {
									relToParent { edges { node { factSheet {id name
										... on BusinessCapability {
											relToParent { edges { node { factSheet {id name
												... on BusinessCapability {
													relToParent { edges { node { factSheet { id name } } } }
												}
											}}}}
										}
									}}}}
								}
							}}}}
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
			const subIndex = appMapL2.relBusinessCapabilityToBCA;
			if (!subIndex) {
				return;
			}
			subIndex.nodes.forEach((bcaL4) => {
				const appMapL1 = appMapL2.relToParent ? appMapL2.relToParent.nodes[0] : undefined;
				const bcaL3 = bcaL4.relToParent ? bcaL4.relToParent.nodes[0] : undefined;
				const bcaL2 = bcaL3 && bcaL3.relToParent ? bcaL3.relToParent.nodes[0] : undefined;
				const bcaL1 = bcaL2 && bcaL2.relToParent ? bcaL2.relToParent.nodes[0] : undefined;
				tableData.push({
					appMapL1ID: appMapL1 && appMapL1.id ? appMapL1.id : '',
					appMapL1Name: appMapL1 && appMapL1.name ? appMapL1.name : '',
					appMapL2ID: appMapL2.id,
					appMapL2Name: appMapL2.name,
					bcaL1ID: bcaL1 && bcaL1.id ? bcaL1.id : '',
					bcaL1Name: bcaL1 && bcaL1.name ? bcaL1.name : '',
					bcaL2ID: bcaL2 && bcaL2.id ? bcaL2.id : '',
					bcaL2Name: bcaL2 && bcaL2.name ? bcaL2.name : '',
					bcaL3ID: bcaL3 && bcaL3.id ? bcaL3.id : '',
					bcaL3Name: bcaL3 && bcaL3.name ? bcaL3.name : '',
					bcaL4ID: bcaL4.id,
					bcaL4Name: bcaL4.name,
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
				<TableHeaderColumn hidden export
					 dataField='appMapL1ID'
					 csvHeader='appmap-L1-id'
				>appMapL1ID</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='appMapL1Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={'appMapL1ID'}
					csvHeader='appmap-L1'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>App Map L1</TableHeaderColumn>
				<TableHeaderColumn hidden export
					 dataField='appMapL2ID'
					 csvHeader='appmap-L2-id'
				>appMapL2ID</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='appMapL2Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={'appMapL2ID'}
					csvHeader='appmap-L2'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>App Map L2</TableHeaderColumn>
				<TableHeaderColumn hidden export
					 dataField='bcaL1ID'
					 csvHeader='bca-L1-id'
				>bcaL1ID</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='bcaL1Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={'bcaL1ID'}
					csvHeader='bca-L1'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>BCA L1</TableHeaderColumn>
				<TableHeaderColumn hidden export
					 dataField='bcaL2ID'
					 csvHeader='bca-L2-id'
				>bcaL2ID</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='bcaL2Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={'bcaL2ID'}
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					csvHeader='bca-L2'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>BCA L2</TableHeaderColumn>
				<TableHeaderColumn hidden export
					 dataField='bcaL3ID'
					 csvHeader='bca-L3-id'
				>bcaL3ID</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='bcaL3Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={'bcaL3ID'}
					csvHeader='bca-L3'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>BCA L3</TableHeaderColumn>
				<TableHeaderColumn hidden export
					 dataField='bcaL4ID'
					 csvHeader='bca-L4-id'
				>bcaL4ID</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='bcaL4Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={'bcaL4ID'}
					csvHeader='bca-L4'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>BCA L4</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

export default Report;
