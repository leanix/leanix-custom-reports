import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import TableUtilities from './common/TableUtilities';
import Helper from './Helper';

class Table extends Component {

	constructor(props) {
		super(props);
		this._formatNumber = this._formatNumber.bind(this);
		this.fiscalYear = props.fiscalYear;
	}

	_formatNumber(cell, row) {
		if (cell === undefined || cell === null || Number.isNaN(cell)) {
			return '';
		}
		if (row.percentage) {
			return (
				<div>
					<span style={{
						display: 'inline-block',
						width: '4em',
						marginLeft: '0.2em',
						textAlign: 'right'
					}}>{cell} %</span>
				</div>
			);
		}

		return (
			<div>
				<span style={{
					display: 'inline-block',
					width: '4em',
					marginLeft: '0.2em',
					textAlign: 'right'
				}}>{cell}</span>
			</div>
		);
	}

	_csvFormatNumber(cell, row) {
		if (cell === undefined || cell === null || Number.isNaN(cell)) {
			return '';
		}
		return cell;
	}

	render() {
		let rules = [];
		return (
			<BootstrapTable data={this.props.data} keyField='id'
				 striped hover exportCSV
				 pagination
				 options={{ clearSearch: true }}>
				<TableHeaderColumn
					 dataField='market'
					 dataAlign='left'
					 headerAlign='left'
					 csvHeader='market'
					 width='100px'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.market}
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.market}
					 filter={TableUtilities.selectFilter(this.props.options.market)}
					>Market</TableHeaderColumn>
				<TableHeaderColumn columnClassName='small'
					 dataField='rule'
					 dataAlign='left'
					 headerAlign='left'
					 csvHeader='rule'
					 width='40%'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.rules}
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.rules}
					 filter={TableUtilities.selectFilter(this.props.options.rules)}
					>Rule</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='fy0'
					 dataAlign='right'
					 headerAlign='left'
					 dataFormat={this._formatNumber}
					 csvHeader={'fy-' + this.fiscalYear + '/' + (this.fiscalYear + 1)}
					 csvFormat={this._csvFormatNumber}
					>FY{this.fiscalYear + 0}/{this.fiscalYear + 1}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					 dataField='fy0Apps'
					 csvHeader={'fy-' + (this.fiscalYear + 0) + '/' + (this.fiscalYear + 1) + '-appl'}
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					>FY{this.fiscalYear + 0}/{this.fiscalYear + 1} - Applications</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='fy1'
					 dataAlign='right'
					 headerAlign='left'
					 dataFormat={this._formatNumber}
					 csvHeader={'fy-' + (this.fiscalYear + 1) + '/' + (this.fiscalYear + 2)}
					 csvFormat={this._csvFormatNumber}
					>FY{this.fiscalYear + 1}/{this.fiscalYear + 2}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					 dataField='fy1Apps'
					 csvHeader={'fy-' + (this.fiscalYear + 1) + '/' + (this.fiscalYear + 2) + '-appl'}
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					>FY{this.fiscalYear + 1}/{this.fiscalYear + 2} - Applications</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='fy2'
					 dataAlign='right'
					 headerAlign='left'
					 dataFormat={this._formatNumber}
					 csvHeader={'fy-' + (this.fiscalYear + 2) + '/' + (this.fiscalYear + 3)}
					 csvFormat={this._csvFormatNumber}
					>FY{this.fiscalYear + 2}/{this.fiscalYear + 3}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					 dataField='fy2Apps'
					 csvHeader={'fy-' + (this.fiscalYear + 2) + '/' + (this.fiscalYear + 3) + '-appl'}
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					>FY{this.fiscalYear + 2}/{this.fiscalYear + 3} - Applications</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='fy3'
					 dataAlign='right'
					 headerAlign='left'
					 dataFormat={this._formatNumber}
					 csvHeader={'fy-' + (this.fiscalYear + 3) + '/' + (this.fiscalYear + 4)}
					 csvFormat={this._csvFormatNumber}
					>FY{this.fiscalYear + 3}/{this.fiscalYear + 4}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					 dataField='fy3Apps'
					 csvHeader={'fy-' + (this.fiscalYear + 3) + '/' + (this.fiscalYear + 4) + '-appl'}
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					>FY{this.fiscalYear + 3}/{this.fiscalYear + 4} - Applications</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='fy4'
					 dataAlign='right'
					 headerAlign='left'
					 dataFormat={this._formatNumber}
					 csvHeader={'fy-' + (this.fiscalYear + 4) + '/' + (this.fiscalYear + 5)}
					 csvFormat={this._csvFormatNumber}
					>FY{this.fiscalYear + 4}/{this.fiscalYear + 5}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					 dataField='fy4Apps'
					 csvHeader={'fy-' + (this.fiscalYear + 4) + '/' + (this.fiscalYear + 5) + '-appl'}
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					>FY{this.fiscalYear + 4}/{this.fiscalYear + 5} - Applications</TableHeaderColumn>
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
			fy0Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,    // current year's application list
			fy1: PropTypes.number.isRequired,    // next year's value
			fy1Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,    // next year's application list
			fy2: PropTypes.number.isRequired,    // ...
			fy2Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,    // ...
			fy3: PropTypes.number.isRequired,    // ...
			fy3Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,    // ...
			fy4: PropTypes.number.isRequired,     // ...
			fy4Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,    // ...
		}).isRequired
	).isRequired,
	setup: PropTypes.object
};

export default Table;