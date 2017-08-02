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
			let appMapID = index.getTags('BC Type', 'AppMap');
			if (appMapID.length > 0) {
				appMapID = appMapID[0].id;
			} else {
				appMapID = undefined;
			}
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
							id fullName ${tagNameDef}
							... on BusinessCapability {
								relToParent {
									edges { node { factSheet { id fullName }}}
								}
								relBusinessCapabilityToBCA { edges { node { factSheet { id fullName
									... on BusinessCapability {
										relToParent { edges { node { factSheet {id fullName
											... on BusinessCapability {
												relToParent { edges { node { factSheet {id fullName
													... on BusinessCapability {
														relToParent { edges { node { factSheet { id fullName }}}}
													}
												}}}}
											}
										}}}}
									}
								}}}}
							}
						}}
					}
				}`;
	}

	_handleData(index, appMapID) {
		const tableData = [];
		index.businessCapabilities.nodes.forEach((appMapL2) => {
			if (appMapID || (!appMapID && index.includesTag(appMapL2, 'AppMap'))) {
				if (appMapL2.relBusinessCapabilityToBCA) {
					appMapL2.relBusinessCapabilityToBCA.nodes.forEach((bcaL4) => {
						let appMapL1 = undefined;
						if (appMapL2.relToParent) {
							appMapL1 = appMapL2.relToParent.nodes[0];
						}
						
						let bcaL3 = undefined;
						if (bcaL4.relToParent) {
							bcaL3 = bcaL4.relToParent.nodes[0];
						}
						
						let bcaL2 = undefined;
						if (bcaL3 && bcaL3.relToParent) {
							bcaL2 = bcaL3.relToParent.nodes[0];
						}
						
						let bcaL1 = undefined;
						if (bcaL2 && bcaL2.relToParent) {
							bcaL1 = bcaL2.relToParent.nodes[0];
						}
						
						tableData.push({
							appMapL1ID: appMapL1 && appMapL1.id ? appMapL1.id : '',
							appMapL1Name: appMapL1 && appMapL1.fullName ? appMapL1.fullName : '',
							appMapL2ID: appMapL2.id,
							appMapL2Name: appMapL2.fullName,
							bcaL1ID: bcaL1 && bcaL1.id ? bcaL1.id : '',
							bcaL1Name: bcaL1 && bcaL1.fullName ? bcaL1.fullName : '',
							bcaL2ID: bcaL2 && bcaL2.id ? bcaL2.id : '',
							bcaL2Name: bcaL2 && bcaL2.fullName ? bcaL2.fullName : '',
							bcaL3ID: bcaL3 && bcaL3.id ? bcaL3.id : '',
							bcaL3Name: bcaL3 && bcaL3.fullName ? bcaL3.fullName : '',
							bcaL4ID: bcaL4.id,
							bcaL4Name: bcaL4.fullName,
						});
					});
				}
			}
		});
		this.setState({
			data: tableData
		});
	}

	/* formatting functions for the table */

	_formatLink(cell, row, idName) {
		let id = row[idName];
		if (!cell || !id) {
			return '';
		}
		return (<Link link={'factsheet/BusinessCapability/' + id} target='_blank' text={cell} />);
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
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					csvHeader='appmap-L1'
				>App Map L1</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='appMapL2Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={'appMapL2ID'}
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					csvHeader='appmap-L2'
				>App Map L2</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='bcaL1Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={'bcaL1ID'}
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					csvHeader='bca-L1'
				>BCA L1</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='bcaL2Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={'bcaL2ID'}
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					csvHeader='bca-L2'
				>BCA L2</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='bcaL3Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={'bcaL3ID'}
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					csvHeader='bca-L3'
				>BCA L3</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='bcaL4Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={'bcaL4ID'}
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					csvHeader='bca-L4'
				>BCA L4</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

export default Report;
