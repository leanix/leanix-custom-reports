import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import TableUtilities from './common/TableUtilities';

class Table extends Component {

	constructor(props) {
		super(props);
	}

	/* formatting functions for the table */

	_formatState(cell, row, status) {
		if (!cell) {
			return '';
		}
		if (cell === 1) {
			return (<Link link={row.stateRef} target='_blank' text={status[cell]} />);
		}
		return status[cell] ? status[cell] : '';
	}

	render() {
		return (
			<BootstrapTable data={this.props.data} keyField='appID'
				 striped hover search exportCSV pagination ignoreSinglePage
				 options={{ clearSearch: true }}>
				<TableHeaderColumn dataSort
					 dataField='appName'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'Application', id: 'appID' }}
					 csvHeader='application-name'
					 filter={TableUtilities.textFilter}
				>Application name</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='itcmpName'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'ITComponent', id: 'itcmpID' }}
					 csvHeader='it-component-name'
					 filter={TableUtilities.textFilter}
				>IT Component name</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='itcmpCategory'
					 width='180px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.itcmpCategory}
					 csvHeader='it-component-type'
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.itcmpCategory}
					 filter={TableUtilities.selectFilter(this.props.options.itcmpCategory)}
				>IT Component type</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='state'
					 width='180px'
					 dataAlign='left'
					 dataFormat={this._formatState}
					 formatExtraData={this.props.options.technopState}
					 csvHeader='technopedia-status'
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.technopState}
					 filter={TableUtilities.selectFilter(this.props.options.technopState)}
				>Technopedia status</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='count'
					 width='200'
					 dataAlign='right'
					 csvHeader='count-in-other-markets'
					 filter={TableUtilities.numberFilter}
				>Count in other markets</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

Table.propTypes = {
	data: PropTypes.arrayOf(
		PropTypes.shape({
			appName: PropTypes.string.isRequired,
			appID: PropTypes.string.isRequired,
			itcmpName: PropTypes.string.isRequired,
			itcmpID: PropTypes.string.isRequired,
			itcmpCategory: PropTypes.number,
			state: PropTypes.number,
			stateRef: PropTypes.string,
			count: PropTypes.number
		}).isRequired
	).isRequired,
	options: PropTypes.shape({
		itcmpCategory: TableUtilities.PropTypes.options,
		technopState: TableUtilities.PropTypes.options
	}).isRequired,
	setup: PropTypes.object
};

export default Table;