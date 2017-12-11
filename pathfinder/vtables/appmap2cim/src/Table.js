import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import TableUtilities from './common/TableUtilities';

class Table extends Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<BootstrapTable data={this.props.data} keyField='id'
				 striped hover search exportCSV
				 pagination
				 options={{ clearSearch: true }}>
				<TableHeaderColumn dataSort
					 dataField='appMapL1Name'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'BusinessCapability', id: 'appMapL1Id' }}
					 csvHeader='appmap-domain'
					 filter={TableUtilities.textFilter}
					>AppMap Domain</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='appMapL2Name'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'BusinessCapability', id: 'appMapL2Id' }}
					 csvHeader='appmap-solution-area'
					 filter={TableUtilities.textFilter}
					>AppMap Solution Area</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='cimL1Name'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'DataObject', id: 'cimL1Id' }}
					 csvHeader='cim-domain'
					 filter={TableUtilities.textFilter}
					>CIM Domain</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='cimL2Name'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'DataObject', id: 'cimL2Id' }}
					 csvHeader='cim-entity'
					 filter={TableUtilities.textFilter}
					>CIM Entity</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

Table.propTypes = {
	data: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			appMapL1Id: PropTypes.string.isRequired,
			appMapL1Name: PropTypes.string.isRequired,
			appMapL2Id: PropTypes.string,
			appMapL2Name: PropTypes.string,
			cimL1Id: PropTypes.string.isRequired,
			cimL1Name: PropTypes.string.isRequired,
			cimL2Id: PropTypes.string,
			cimL2Name: PropTypes.string
		}).isRequired
	).isRequired,
	setup: PropTypes.object
};

export default Table;