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
							relBusinessCapabilityToDataObject {
								edges { node { factSheet {
									id name tags { name }
									... on DataObject {
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
		index.businessCapabilities.nodes.forEach((e) => {
			let appMapL2 = e;
			if (!appMapID && !index.includesTag(appMapL2, 'AppMap')) {
				return;
			}
			const subIndex = appMapL2.relBusinessCapabilityToDataObject;
			if (!subIndex) {
				return;
			}
			let appMapL1 = appMapL2.relToParent ? appMapL2.relToParent.nodes[0] : undefined;
			if (!appMapL1) {
				appMapL1 = appMapL2;
				appMapL2 = undefined;
			}
			subIndex.nodes.forEach((e2) => {
				let cimL2 = e2;
				if (!index.includesTag(cimL2, 'CIM')) {
					return;
				}
				let cimL1 = cimL2.relToParent ? cimL2.relToParent.nodes[0] : undefined;
				if (!cimL1) {
					cimL1 = cimL2;
					cimL2 = undefined;
				}
				tableData.push({
					appMapL1ID: appMapL1 ? appMapL1.id : '',
					appMapL1Name: appMapL1 ? appMapL1.name : '',
					appMapL2ID: appMapL2 ? appMapL2.id : '',
					appMapL2Name: appMapL2 ? appMapL2.name : '',
					cimL1ID: cimL1 ? cimL1.id : '',
					cimL1Name: cimL1 ? cimL1.name : '',
					cimL2ID: cimL2 ? cimL2.id : '',
					cimL2Name: cimL2 ? cimL2.name : ''
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
					csvHeader='appmap-domain'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>AppMap Domain</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='appMapL2Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={{ type: 'BusinessCapability', id: 'appMapL2ID' }}
					csvHeader='appmap-solution-area'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>AppMap Solution Area</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='cimL1Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={{ type: 'DataObject', id: 'cimL1ID' }}
					csvHeader='cim-domain'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>CIM Domain</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='cimL2Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={{ type: 'DataObject', id: 'cimL2ID' }}
					csvHeader='cim-entity'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>CIM Entity</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

export default Report;
