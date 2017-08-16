import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import TableUtilities from './common/TableUtilities';
import Link from './common/Link';

class Table extends Component {

	constructor(props) {
		super(props);
	}

	/* formatting functions for the table */

	_formatState(cell, row, enums) {
		if ((!cell && cell !== 0) || cell === 3) {
			return '';
		}
		if (cell === 0) {
			return (<Link link={row.stateRef} target='_blank' text={enums[cell]} />);
		}
		return enums[cell] ? enums[cell] : '';
	}

	render() {
		return (
			<BootstrapTable data={this.props.data} keyField='id'
				 striped hover search exportCSV
				 pagination ignoreSinglePage
				 options={{ clearSearch: true }}>
				<TableHeaderColumn dataSort
					 dataField='appName'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'Application', id: 'appId' }}
					 csvHeader='application-name'
					 filter={TableUtilities.textFilter}
					>Application name</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='itcmpName'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'ITComponent', id: 'itcmpId' }}
					 csvHeader='it-component-name'
					 filter={TableUtilities.textFilter}
					>IT Component name</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='itcmpCategory'
					 width='180px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.category}
					 csvHeader='it-component-type'
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.category}
					 filter={TableUtilities.selectFilter(this.props.options.category)}
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
					 width='200px'
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
			id: PropTypes.string.isRequired,
			appName: PropTypes.string.isRequired,
			appId: PropTypes.string.isRequired,
			itcmpName: PropTypes.string.isRequired,
			itcmpId: PropTypes.string.isRequired,
			itcmpCategory: PropTypes.number,
			state: PropTypes.number,
			stateRef: PropTypes.string,
			count: PropTypes.number.isRequired
		}).isRequired
	).isRequired,
	options: PropTypes.shape({
		category: TableUtilities.PropTypes.options,
		technopState: TableUtilities.PropTypes.options
	}).isRequired,
	setup: PropTypes.object
};

export default Table;