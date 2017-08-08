import React, { Component } from 'react';
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
							relBusinessCapabilityToBCA { edges { node { factSheet {
								id name
								... on BusinessCapability {
									relToParent { edges { node { factSheet {
										id name
										... on BusinessCapability {
											relToParent { edges { node { factSheet {
												id name
												... on BusinessCapability {
													relToParent { edges { node {
														factSheet { id name }
													}}}
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
		index.businessCapabilities.nodes.forEach((e) => {
			let appMapL2 = e;
			if (!appMapID && !index.includesTag(appMapL2, 'AppMap')) {
				return;
			}
			const subIndex = appMapL2.relBusinessCapabilityToBCA;
			if (!subIndex) {
				return;
			}
			let appMapL1 = appMapL2.relToParent ? appMapL2.relToParent.nodes[0] : undefined;
			if (!appMapL1) {
				appMapL1 = appMapL2;
				appMapL2 = undefined;
			}
			subIndex.nodes.forEach((e2) => {
				let bcaL4 = e2;
				let bcaL3 = bcaL4.relToParent ? bcaL4.relToParent.nodes[0] : undefined;
				let bcaL2 = bcaL3 && bcaL3.relToParent ? bcaL3.relToParent.nodes[0] : undefined;
				let bcaL1 = bcaL2 && bcaL2.relToParent ? bcaL2.relToParent.nodes[0] : undefined;
				while (!bcaL1) {
					bcaL1 = bcaL2;
					bcaL2 = bcaL3;
					bcaL3 = bcaL4;
					bcaL4 = undefined;
				}
				tableData.push({
					appMapL1ID: appMapL1 ? appMapL1.id : '',
					appMapL1Name: appMapL1 ? appMapL1.name : '',
					appMapL2ID: appMapL2 ? appMapL2.id : '',
					appMapL2Name: appMapL2 ? appMapL2.name : '',
					bcaL1ID: bcaL1 ? bcaL1.id : '',
					bcaL1Name: bcaL1 ? bcaL1.name : '',
					bcaL2ID: bcaL2 ? bcaL2.id : '',
					bcaL2Name: bcaL2 ? bcaL2.name : '',
					bcaL3ID: bcaL3 ? bcaL3.id : '',
					bcaL3Name: bcaL3 ? bcaL3.name : '',
					bcaL4ID: bcaL4 ? bcaL4.id : '',
					bcaL4Name: bcaL4 ? bcaL4.name : ''
				});
			});
		});
		this.setState({
			data: tableData
		});
	}

	/* formatting functions for the table */

	_formatLink(cell, row, extraData) {
		if (!cell) {
			return '';
		}
		return (<Link link={'factsheet/' + extraData.type + '/' + row[extraData.id]} target='_blank' text={cell} />);
	}

	render() {
		return (
			<BootstrapTable data={this.state.data} keyField='appMapL2ID'
				striped hover search pagination ignoreSinglePage exportCSV
				options={{ clearSearch: true }}>
				<TableHeaderColumn dataSort
					dataField='appMapL1Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={{ type: 'BusinessCapability', id: 'appMapL1ID' }}
					csvHeader='appmap-L1'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>App Map L1</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='appMapL2Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={{ type: 'BusinessCapability', id: 'appMapL2ID' }}
					csvHeader='appmap-L2'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>App Map L2</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='bcaL1Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={{ type: 'BusinessCapability', id: 'bcaL1ID' }}
					csvHeader='bca-L1'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>BCA L1</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='bcaL2Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={{ type: 'BusinessCapability', id: 'bcaL2ID' }}
					csvHeader='bca-L2'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>BCA L2</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='bcaL3Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={{ type: 'BusinessCapability', id: 'bcaL3ID' }}
					csvHeader='bca-L3'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>BCA L3</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='bcaL4Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={{ type: 'BusinessCapability', id: 'bcaL4ID' }}
					csvHeader='bca-L4'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>BCA L4</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

export default Report;
