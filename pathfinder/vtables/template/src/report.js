import React, {	Component } from 'react';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import $ from 'jquery';
import _ from 'lodash';

class Report extends Component {

	constructor(props) {
		super(props);
		this._initReport = this._initReport.bind(this);
		this._handleData = this._handleData.bind(this);
		this.state = {
			setup: null,
			data: null
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
		return `{allFactSheets(factSheetType:Application) {
			edges {node {
				name
				type
			}}
		}}`;
	}
	
	_handleData(data) {
		this.setState({
			data: data
		});
	}
	
	/* formatting functions for the table */

	_priceFormatter(cell, row) {
		return '<i class="glyphicon glyphicon-usd"></i> ' + cell;
	}
	
	render() {
		console.log(this.state.setup);
		console.log(this.state.data);
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
			<BootstrapTable data={products} striped={true} hover={true}>
				<TableHeaderColumn dataField='id' isKey={true} dataAlign='center' dataSort={true}>Product ID</TableHeaderColumn>
				<TableHeaderColumn dataField='name' dataSort={true}>Product Name</TableHeaderColumn>
				<TableHeaderColumn dataField='price' dataFormat={this._priceFormatter}>Product Price</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

export default Report;
