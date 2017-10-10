import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import TableUtilities from './common/TableUtilities';

class Table extends Component {

	constructor(props) {
		super(props);
		this._formatRule = this._formatRule.bind(this);
		this._formatPercentage = this._formatPercentage.bind(this);
		this._sortPercentage = this._sortPercentage.bind(this);
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

	_formatCompliant(cell, row) {
		if (cell === undefined || cell === null || Number.isNaN(cell) || row.overallRule) {
			return '';
		}
		return cell;
	}

	_formatPercentage(cell, row) {
		if (cell === undefined || cell === null || Number.isNaN(cell)) {
			return '';
		}
		return (
			<div>
				<span className='label'
				 style={{
					display: 'inline-block',
					width: '1.4em',
					height: '1.3em',
					verticalAlign: '-20%',
					backgroundColor: this._getGreenToRed(cell)
				 }} />
				<span style={{
					display: 'inline-block',
					width: '3em',
					marginLeft: '0.2em',
					textAlign: 'right'
				}}>{cell + ' %'}</span>
			</div>
		);
	}

	_csvFormatPercentage(cell, row) {
		if (cell === undefined || cell === null || Number.isNaN(cell)) {
			return '';
		}
		return cell;
	}

	_getGreenToRed(percent) {
		// TODO nicer color fade
		const r = percent < 50 ? 255 : Math.floor(255 - (percent * 2 - 100) * 255 / 100);
		const g = percent > 50 ? 255 : Math.floor((percent * 2) * 255 / 100);
		return 'rgb(' + r + ',' + g + ',0)';
	}

	_trClassname(row, fieldValue, rowIdx, colIdx) {
		if (row.overallRule) {
			return 'info';
		}
		return '';
	}

	_sortPercentage(a, b, order) {
		if (order) {
			return order === 'desc' ? this._sortPercentage(b, a) : this._sortPercentage(a, b);
		}
		if (Number.isNaN(a.percentage)) {
			return Number.isNaN(b.percentage) ? 0 : 1;
		}

		if (Number.isNaN(b.percentage)) {
			return -1;
		}
		return a.percentage < b.percentage ? -1 : (a.percentage === b.percentage ? 0 : 1);
	}

	render() {
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
					 dataField='compliant'
					 width='180px'
					 dataAlign='left'
					 dataFormat={this._formatCompliant}
					 csvFormat={this._formatCompliant}
					 filter={TableUtilities.numberFilter}
					>Compliant</TableHeaderColumn>
				<TableHeaderColumn hidden export
					 dataField='compliantPrjs'
					 csvHeader='compliant-projects'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					>Compliant Projects</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='nonCompliant'
					 width='180px'
					 dataAlign='left'
					 csvHeader='non-compliant'
					 filter={TableUtilities.numberFilter}
					>Non-Compliant</TableHeaderColumn>
				<TableHeaderColumn columnClassName='small'
					 dataField='nonCompliantPrjs'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkArrayFactsheets(this.props.setup)}
					 formatExtraData={{ type: 'Project', id: 'nonCompliantPrjIds' }}
					 csvHeader='non-compliant-projects'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>Non-Compliant Projects</TableHeaderColumn>
				<TableHeaderColumn dataSort sortFunc={this._sortPercentage}
					 dataField='percentage'
					 width='180px'
					 dataAlign='left'
					 dataFormat={this._formatPercentage}
					 csvHeader='compliant-percentage'
					 csvFormat={this._csvFormatPercentage}
					 filter={TableUtilities.numberFilter}
					>% Compliant</TableHeaderColumn>
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
			overallRule: PropTypes.bool.isRequired,
			compliant: PropTypes.number.isRequired,
			compliantPrjIds: TableUtilities.PropTypes.idArray('compliantPrjs'),
			compliantPrjs: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			nonCompliant: PropTypes.number.isRequired,
			nonCompliantPrjIds: TableUtilities.PropTypes.idArray('nonCompliantPrjs'),
			nonCompliantPrjs: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			percentage: PropTypes.number.isRequired
		}).isRequired
	).isRequired,
	additionalNotes: PropTypes.object.isRequired,
	options: PropTypes.shape({
		market: TableUtilities.PropTypes.options,
		rule: TableUtilities.PropTypes.options
	}).isRequired,
	pageSize: PropTypes.number.isRequired,
	setup: PropTypes.object
};

export default Table;
