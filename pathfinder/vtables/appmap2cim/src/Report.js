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
									id name
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
		index.businessCapabilities.nodes.forEach((appMapL2) => {
			if (!appMapID && !index.includesTag(appMapL2, 'AppMap')) {
				return;
			}
			const subIndex = appMapL2.relBusinessCapabilityToDataObject;
			if (!subIndex) {
				return;
			}
			subIndex.nodes.forEach((cimL2) => {
				const cimL1 = cimL2.relToParent ? cimL2.relToParent.nodes[0] : undefined;
				const appMapL1 = appMapL2.relToParent ? appMapL2.relToParent.nodes[0] : undefined;
				tableData.push({
					appMapL1ID: appMapL1 ? appMapL1.id : '',
					appMapL1Name: appMapL1 ? appMapL1.name : '',
					appMapL2ID: appMapL2.id,
					appMapL2Name: appMapL2.name,
					cimL1ID: cimL1 ? cimL1.id : '',
					cimL1Name: cimL1 ? cimL1.name : '',
					cimL2ID: cimL2.id,
					cimL2Name: cimL2.name
				});
			});
		});
		this.setState({
			data: tableData
		});
	}

	/* formatting functions for the table */

	_formatLinkBC(cell, row, idName) {
		if (!cell) {
			return '';
		}
		return (<Link link={'factsheet/BusinessCapability/' + row[idName]} target='_blank' text={cell} />);
	}

	_formatLinkDO(cell, row, idName) {
		if (!cell) {
			return '';
		}
		return (<Link link={'factsheet/DataObject/' + row[idName]} target='_blank' text={cell} />);
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
					 csvHeader='appmap-domain-id'
					>appMapL1ID</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='appMapL1Name'
					dataAlign='left'
					dataFormat={this._formatLinkBC}
					formatExtraData={'appMapL1ID'}
					csvHeader='appmap-domain'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>AppMap Domain</TableHeaderColumn>
				<TableHeaderColumn hidden export
					 dataField='appMapL2ID'
					 csvHeader='appmap-solution-area-id'
					>appMapL2ID</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='appMapL2Name'
					dataAlign='left'
					dataFormat={this._formatLinkBC}
					formatExtraData={'appMapL2ID'}
					csvHeader='appmap-solution-area'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>AppMap Solution Area</TableHeaderColumn>
				<TableHeaderColumn hidden export
					 dataField='cimL1ID'
					 csvHeader='cim-domain-id'
					>cimL1ID</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='cimL1Name'
					dataAlign='left'
					dataFormat={this._formatLinkDO}
					formatExtraData={'cimL1ID'}
					csvHeader='cim-domain'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>CIM Domain</TableHeaderColumn>
				<TableHeaderColumn hidden export
					 dataField='cimL2ID'
					 csvHeader='cim-entity-id'
					>cimL2ID</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='cimL2Name'
					dataAlign='left'
					dataFormat={this._formatLinkDO}
					formatExtraData={'cimL2ID'}
					csvHeader='cim-entity'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>CIM Entity</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

export default Report;
