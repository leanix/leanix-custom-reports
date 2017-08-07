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
							relToParent {
								edges { node { factSheet { id name } } }
							}
							relBusinessCapabilityToProcess { edges { node { factSheet {
								id name
								... on Process {
									relToParent { edges { node { factSheet {
										id name
										... on Process {
											relToParent { edges { node { factSheet {
												id name
												... on Process {
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
			const subIndex = appMapL2.relBusinessCapabilityToProcess;
			if (!subIndex) {
				return;
			}
			let appMapL1 = appMapL2.relToParent ? appMapL2.relToParent.nodes[0] : undefined;
			if (!appMapL1) {
				appMapL1 = appMapL2;
				appMapL2 = undefined;
			}
			subIndex.nodes.forEach((e2) => {
				// please note: every process has an eTOM tag, no need to filter
				let etomL4 = e2;
				let etomL3 = etomL4.relToParent ? etomL4.relToParent.nodes[0] : undefined;
				let etomL2 = etomL3 && etomL3.relToParent ? etomL3.relToParent.nodes[0] : undefined;
				let etomL1 = etomL2 && etomL2.relToParent ? etomL2.relToParent.nodes[0] : undefined;
				while (!etomL1) {
					etomL1 = etomL2;
					etomL2 = etomL3;
					etomL3 = etomL4;
					etomL4 = undefined;
				}
				tableData.push({
					appMapL1ID: appMapL1 ? appMapL1.id : '',
					appMapL1Name: appMapL1 ? appMapL1.name : '',
					appMapL2ID: appMapL2 ? appMapL2.id : '',
					appMapL2Name: appMapL2 ? appMapL2.name : '',
					etomL1ID: etomL1 ? etomL1.id : '',
					etomL1Name: etomL1 ? etomL1.name : '',
					etomL2ID: etomL2 ? etomL2.id : '',
					etomL2Name: etomL2 ? etomL2.name : '',
					etomL3ID: etomL3 ? etomL3.id : '',
					etomL3Name: etomL3 ? etomL3.name : '',
					etomL4ID: etomL4 ? etomL4.id : '',
					etomL4Name: etomL4 ? etomL4.name : ''
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
					dataField='etomL1Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={{ type: 'Process', id: 'etomL1ID' }}
					csvHeader='etom-L1'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>eTOM L1</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='etomL2Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={{ type: 'Process', id: 'etomL2ID' }}
					csvHeader='etom-L2'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>eTOM L2</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='etomL3Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={{ type: 'Process', id: 'etomL3ID' }}
					csvHeader='etom-L3'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>eTOM L3</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='etomL4Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={{ type: 'Process', id: 'etomL4ID' }}
					csvHeader='etom-L4'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>eTOM L4</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

export default Report;
