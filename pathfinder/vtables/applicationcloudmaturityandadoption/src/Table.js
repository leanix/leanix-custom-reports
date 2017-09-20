import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import TableUtilities from './common/TableUtilities';
import Helper from './Helper';

class Table extends Component {

	constructor(props) {
		super(props);
		this._formatNumber = this._formatNumber.bind(this);
		this.fiscalYear = props.setup.fiscalYear;
	}

	_formatNumber(cell, row) {
		if (cell === undefined || cell === null || Number.isNaN(cell)) {
			return '';
		}

		if (row.percentage) {
			let v = Math.round(cell * 10)/10; // auf 1 Nachkommastelle reduzieren
			return (
				<div>
					<span style={{
						display: 'inline-block',
						width: '4em',
						marginLeft: '0.2em',
						textAlign: 'right'
					}}>{v}%</span>
				</div>
			);
		}
		return (
			<div>
				<span style={{
					display: 'inline-block',
					width: '4em',
					marginLeft: '0.2em',
					textAlign: 'right',
					paddingRight: '1em'
				}}>{cell}</span>
			</div>
		);
	}

	render() {
		let rules = [];
		return (
			<BootstrapTable data={this.props.data} keyField='id'
				 striped hover exportCSV
				 pagination ignoreSinglePage
				 options={{ clearSearch: true }}>
				<TableHeaderColumn
					 dataField='market'
					 dataAlign='right'
					 csvHeader='Market'
					 width='100px'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.market}
					 filter={TableUtilities.selectFilter(this.props.options.market)}
					>Market</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='rule'
					 dataAlign='left'
					 csvHeader='Adoption & Maturity Applications'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.rules}
					 filter={TableUtilities.selectFilter(this.props.options.rules)}
					>Adoption & Maturity Applications</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='fy0'
					 dataAlign='center'
					 dataFormat={this._formatNumber}
					 csvHeader='Current FY'
					>FY{this.fiscalYear + 0}/{this.fiscalYear + 1}</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='fy1'
					 dataAlign='center'
					 dataFormat={this._formatNumber}
					 csvHeader='FY plus 1'
					>FY{this.fiscalYear + 1}/{this.fiscalYear + 2}</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='fy2'
					 dataAlign='center'
					 dataFormat={this._formatNumber}
					 csvHeader='FY plus 2'
					>FY{this.fiscalYear + 2}/{this.fiscalYear + 3}</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='fy3'
					 dataAlign='center'
					 dataFormat={this._formatNumber}
					 csvHeader='FY plus 3'
					>FY{this.fiscalYear + 3}/{this.fiscalYear + 4}</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='fy4'
					 dataAlign='center'
					 dataFormat={this._formatNumber}
					 csvHeader='FY plus 4'
					>FY{this.fiscalYear + 4}/{this.fiscalYear + 5}</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

Table.propTypes = {
	data: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			market: PropTypes.number.isRequired, // the index of the market's name
			rule: PropTypes.number.isRequired,   // the index of the rule's name
			percentage: PropTypes.bool.isRequired, // a Percentage value?
			fy0: PropTypes.number.isRequired,    // current year's value
			fy1: PropTypes.number.isRequired,    // next year's value
			fy2: PropTypes.number.isRequired,    // ...
			fy3: PropTypes.number.isRequired,    // ...
			fy4: PropTypes.number.isRequired     // ...
		}).isRequired
	).isRequired,
	setup: PropTypes.object
};

export default Table;