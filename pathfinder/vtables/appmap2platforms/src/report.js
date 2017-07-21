import React, {	Component } from 'react';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import $ from 'jquery';

class Report extends Component {

	constructor(props) {
		super(props);
		this._setData = this._setData.bind(this);
		this.state = {
			setup: null,
			data: null
		};

	}

	componentDidMount() {
		lx.init().then(((setup) => {
				lx.ready(this._createConfig());
				this.setState({
					setup: setup
				});
				lx.executeGraphQL(this._createQuery()).then(this._setData);
			}).bind(this));
	}

	_createQuery() {
		return `{allFactSheets(factSheetType:Application) {
			edges {node {
				name
				type
			}}
		}}`;
	}
	
	_setData(data) {
		this.setState({
			data: data
		});
	}

	_createConfig() {
		return {
			allowEditing: false
		};

	}

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
