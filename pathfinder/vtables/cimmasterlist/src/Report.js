import React, {	Component } from 'react';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import $ from 'jquery';
import _ from 'lodash';
import DataIndex from './DataIndex';

const LANDSCAPE_OPTIONS = {
	0: 'Yes',
	1: 'No'
};

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
		lx.executeGraphQL(this._createQuery()).then(this._handleData);
	}

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_createQuery() {
		return `{dataObjectsL1: allFactSheets(filter: {facetFilters: [{facetKey: "FactSheetTypes", keys: ["DataObject"]}, {facetKey: "hierarchyLevel", keys: ["1"]}]}) {
					edges { node { id fullName name displayName description tags { name } } }
				}
				dataObjectsL2: allFactSheets(filter: {facetFilters: [{facetKey: "FactSheetTypes", keys: ["DataObject"]}, {facetKey: "hierarchyLevel", keys: ["2"]}]}) {
					edges { node {
						id fullName name displayName description tags { name }
						... on DataObject {
							relToParent { edges { node { factSheet { id } } } }
							relDataObjectToBusinessCapability { edges { node { factSheet { id } } } }
						}
					}}
				}
				businessCapabilities: allFactSheets(factSheetType: BusinessCapability) {
					edges { node { id displayName tags { name } } }
				}}`;
	}

	_handleData(data) {
		const index = new DataIndex(data);
		const tableData = [];
		index.dataObjectsL2.nodes.forEach((e) => {
			const parent = index.getParent('dataObjectsL2', e.id);
			let appMapBCs = [];
			const subIndex = e.relDataObjectToBusinessCapability;
			if (subIndex) {
				appMapBCs = subIndex.nodes.map((e2) => {
					return index.businessCapabilities.byID[e2.id];
				}).filter((e2) => {
					return e2 && index.includesTag(e2, 'AppMap');
				});
			}
			tableData.push({
				id: e.id,
				l1: parent,
				l2: e,
				landscapeAvailable: index.includesTag(e, 'Landscape Available') ? LANDSCAPE_OPTIONS[0] : LANDSCAPE_OPTIONS[1],
				appMaps: appMapBCs
			});
		});
		this.setState({
			data: tableData
		});
	}

	/* formatting functions for the table */

	_formatName(cell, row, hierarchy) {
		if (!row) {
			return '';
		}
		const dataObject = row[hierarchy];
		if (dataObject) {
			return dataObject.fullName;
		}
		return '';
	}

	_formatDescription(cell, row, hierarchy) {
		if (!row) {
			return '';
		}
		const dataObject = row[hierarchy];
		if (dataObject) {
			return dataObject.description;
		}
		return '';
	}

	_formatAppMaps(cell, row) {
		let names = '';
		if (!cell) {
			return names;
		}
		cell.forEach((e) => {
			if (names.length) {
				names += '<br>';
			}
			names += e.displayName;
		});
		return names;
	}

	render() {
		if (this.state.data.length === 0) {
			return null;
		}
		// TODO sorting und search beachten
		// https://github.com/incowia/leanix-application-context/blob/master/src/TableView.js
		// TODO styling der description spalten bedenken
		// TODO verlinkung für Domain, Name und AppMaps
		return (
			<BootstrapTable data={this.state.data} keyField='id'
				 striped hover search exportCSV
				 options={{ clearSearch: true }}>
				<TableHeaderColumn hidden
					 dataField='id'
					>id</TableHeaderColumn>
				<TableHeaderColumn row='0' colSpan='4'
					headerAlign='center'
					csvHeader='Entity'
					>Entity</TableHeaderColumn>
				<TableHeaderColumn dataSort row='1'
					 dataField='l1'
					 width='200px'
					 headerAlign='left'
					 dataAlign='left'
					 dataFormat={this._formatName}
					 formatExtraData='l1'
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Domain</TableHeaderColumn>
				<TableHeaderColumn row='1'
					 dataField='l1'
					 width='200px'
					 headerAlign='left'
					 dataAlign='left'
					 dataFormat={this._formatDescription}
					 formatExtraData='l1'
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Domain Description</TableHeaderColumn>
				<TableHeaderColumn dataSort row='1'
					 dataField='l2'
					 width='200px'
					 headerAlign='left'
					 dataAlign='left'
					 dataFormat={this._formatName}
					 formatExtraData='l2'
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Name</TableHeaderColumn>
				<TableHeaderColumn row='1'
					 dataField='l2'
					 width='200px'
					 headerAlign='left'
					 dataAlign='left'
					 dataFormat={this._formatDescription}
					 formatExtraData='l2'
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Description</TableHeaderColumn>
				<TableHeaderColumn dataSort row='0' rowSpan='2'
					 dataField='landscapeAvailable'
					 width='200px'
					 headerAlign='left'
					 dataAlign='left'
					 filter={{ type: 'SelectFilter', options: LANDSCAPE_OPTIONS }}
					>Landscape Available?</TableHeaderColumn>
				<TableHeaderColumn row='0' rowSpan='2'
					 dataField='appMaps'
					 width='200px'
					 headerAlign='left'
					 dataAlign='left'
					 dataFormat={this._formatAppMaps}
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Mappings to AppMap</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

export default Report;
