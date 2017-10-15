import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import TableUtilities from './common/TableUtilities';

class Table extends Component {

	constructor(props) {
		super(props);
		this._formatRule = this._formatRule.bind(this);
	}

	_formatRule(cell, row, enums) {
		const text = TableUtilities.formatEnum(cell, row, enums);
		const additionalNote = this.props.additionalNotes[text];
		if (additionalNote) {
			const marker = additionalNote.marker + 1;
			return text + ' <sup><b>[' + marker + ']</b></sup>';
		}
		return text;
	}

	_formatNumber(cell, row) {
		if (cell === undefined || cell === null || Number.isNaN(cell)) {
			return '';
		}
		if (row.isPercentage) {
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
		if (cell === 0) {
			return '';
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

	_trClassname(row, fieldValue, rowIdx, colIdx) {
		if (row.overallRule) {
			return 'info';
		}
		return '';
	}

	render() {
		const financialYear = this.props.currentFYear - 2000;
		return (
			<BootstrapTable data={this.props.data} keyField='id'
				 striped hover exportCSV condensed
				 pagination
				 options={{
					sizePerPage: this.props.pageSize,
					hideSizePerPage: true
				 }}
				 trClassName={this._trClassname}>
				<TableHeaderColumn dataSort
					 dataField='market'
					 width='100px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.market}
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.market}
					 filter={TableUtilities.selectFilter(this.props.options.market)}
					>Market</TableHeaderColumn>
				<TableHeaderColumn dataSort columnClassName='small'
					 dataField='rule'
					 width='500px'
					 dataAlign='left'
					 dataFormat={this._formatRule}
					 formatExtraData={this.props.options.rule}
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.rule}
					 filter={TableUtilities.selectFilter(this.props.options.rule)}
					>Rule</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='fy0'
					 dataAlign='right'
					 headerAlign='left'
					 dataFormat={this._formatNumber}
					 csvHeader={'fy-' + financialYear + '/' + (financialYear + 1)}
					 csvFormat={this._csvFormatNumber}
					>FY {financialYear}/{financialYear + 1}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					 dataField='fy0Apps'
					 csvHeader={'fy-' + financialYear + '/' + (financialYear + 1) + '-apps'}
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					>FY {financialYear}/{financialYear + 1} - Applications</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='fy1'
					 dataAlign='right'
					 headerAlign='left'
					 dataFormat={this._formatNumber}
					 csvHeader={'fy-' + (financialYear + 1) + '/' + (financialYear + 2)}
					 csvFormat={this._csvFormatNumber}
					>FY {financialYear + 1}/{financialYear + 2}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					 dataField='fy1Apps'
					 csvHeader={'fy-' + (financialYear + 1) + '/' + (financialYear + 2) + '-apps'}
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					>FY {financialYear + 1}/{financialYear + 2} - Applications</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='fy2'
					 dataAlign='right'
					 headerAlign='left'
					 dataFormat={this._formatNumber}
					 csvHeader={'fy-' + (financialYear + 2) + '/' + (financialYear + 3)}
					 csvFormat={this._csvFormatNumber}
					>FY {financialYear + 2}/{financialYear + 3}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					 dataField='fy2Apps'
					 csvHeader={'fy-' + (financialYear + 2) + '/' + (financialYear + 3) + '-apps'}
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					>FY {financialYear + 2}/{financialYear + 3} - Applications</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='fy3'
					 dataAlign='right'
					 headerAlign='left'
					 dataFormat={this._formatNumber}
					 csvHeader={'fy-' + (financialYear + 3) + '/' + (financialYear + 4)}
					 csvFormat={this._csvFormatNumber}
					>FY {financialYear + 3}/{financialYear + 4}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					 dataField='fy3Apps'
					 csvHeader={'fy-' + (financialYear + 3) + '/' + (financialYear + 4) + '-apps'}
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					>FY {financialYear + 3}/{financialYear + 4} - Applications</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='fy4'
					 dataAlign='right'
					 headerAlign='left'
					 dataFormat={this._formatNumber}
					 csvHeader={'fy-' + (financialYear + 4) + '/' + (financialYear + 5)}
					 csvFormat={this._csvFormatNumber}
					>FY {financialYear + 4}/{financialYear + 5}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					 dataField='fy4Apps'
					 csvHeader={'fy-' + (financialYear + 4) + '/' + (financialYear + 5) + '-apps'}
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					>FY {financialYear + 4}/{financialYear + 5} - Applications</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='fy5'
					 dataAlign='right'
					 headerAlign='left'
					 dataFormat={this._formatNumber}
					 csvHeader={'fy-' + (financialYear + 5) + '/' + (financialYear + 6)}
					 csvFormat={this._csvFormatNumber}
					>FY {financialYear + 5}/{financialYear + 6}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					 dataField='fy5Apps'
					 csvHeader={'fy-' + (financialYear + 5) + '/' + (financialYear + 6) + '-apps'}
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					>FY {financialYear + 5}/{financialYear + 6} - Applications</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

Table.propTypes = {
	data: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			market: PropTypes.number.isRequired,
			rule: PropTypes.number.isRequired,
			overallRule: PropTypes.bool,
			isPercentage: PropTypes.bool.isRequired,
			fy0: PropTypes.number.isRequired,
			fy0Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy1: PropTypes.number.isRequired,
			fy1Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy2: PropTypes.number.isRequired,
			fy2Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy3: PropTypes.number.isRequired,
			fy3Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy4: PropTypes.number.isRequired,
			fy4Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy5: PropTypes.number.isRequired,
			fy5Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired
		}).isRequired
	).isRequired,
	currentFYear: PropTypes.number.isRequired,
	additionalNotes: PropTypes.object.isRequired,
	options: PropTypes.shape({
		market: TableUtilities.PropTypes.options,
		rule: TableUtilities.PropTypes.options
	}).isRequired,
	pageSize: PropTypes.number.isRequired,
	setup: PropTypes.object
};

export default Table;