import React, { Component } from 'react';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import CommonQueries from './CommonGraphQLQueries';
import DataIndex from './DataIndex';
import Link from './Link';
import LinkList from './LinkList';
import Utilities from './Utilities';

import $ from 'jquery';
import _ from 'lodash';

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
			// const appMapID = index.getFirstTagID('BC Type', 'AppMap');
			lx.executeGraphQL(this._createQuery()).then((data) => {
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

	_createQuery() {
		return `{applications: allFactSheets(
					sort: {mode: BY_FIELD, key: "displayName", order: asc},
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Application"]}
					]}
				) {
					edges {node {
						id name fullName displayName description
						... on Application {
							relToParent { edges { node { factSheet { id } } } }
							relApplicationToPlatform { edges { node { factSheet { id } } } }
						}
					}}
				}
				businessCapabilities: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]}
					]}
				) {
					edges { node { id displayName } }
				}}}`;
	}

	_handleData(index) {
		const tableData = [];
		// TODO
		this.setState({
			data: tableData
		});
	}

	/* formatting functions for the table */

	_formatName(cell, row, parent) {
		if (!cell) {
			return '';
		}
		return (<Link link={'factsheet/Application/' + (parent ? row.domainID : row.id)} target='_blank' text={cell} />);
	}

	_formatArray(cell, row) {
		if (!cell) {
			return '';
		}
		return (
			<LinkList links={
				cell.reduce((arr, e, i) => {
					arr.push({
						link: 'factsheet/BusinessCapability/' + row.appMapIDs[i],
						target: '_blank',
						text: e
					});
					return arr;
			}, [])} />
		);
	}

	_formatEnum(cell, row, enums) {
		if (!cell && cell !== 0) {
			return '';
		}
		return enums[cell] ? enums[cell] : '';
	}

	/* formatting functions for the csv export */

	_csvFormatArray(cell, row) {
		let names = '';
		if (!cell) {
			return names;
		}
		cell.forEach((e) => {
			if (names.length) {
				names += '\n';
			}
			names += e;
		});
		return names;
	}

	render() {
		const products = [{
				id: 1,
				name: "Item name 1",
				price: 100
			}, {
				id: 2,
				name: "Item name 2",
				price: 100
			}];
		return (
			<BootstrapTable data={this.state.data} keyField='id'
				 striped hover search exportCSV pagination ignoreSinglePage
				 options={{ clearSearch: true }}>
				<TableHeaderColumn dataSort dataField='id' dataAlign='center'>Product ID</TableHeaderColumn>
				<TableHeaderColumn dataSort dataField='name'>Product Name</TableHeaderColumn>
				<TableHeaderColumn dataField='price' dataFormat={this._priceFormatter}>Product Price</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

export default Report;
