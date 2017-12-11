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
					 csvHeader='appmap-L1'
					 filter={TableUtilities.textFilter}
					>AppMap L1</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='appMapL2Name'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'BusinessCapability', id: 'appMapL2Id' }}
					 csvHeader='appmap-L2'
					 filter={TableUtilities.textFilter}
					>AppMap L2</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='bcaL1Name'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'BusinessCapability', id: 'bcaL1Id' }}
					 csvHeader='bca-L1'
					 filter={TableUtilities.textFilter}
					>BCA L1</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='bcaL2Name'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'BusinessCapability', id: 'bcaL2Id' }}
					 csvHeader='bca-L2'
					 filter={TableUtilities.textFilter}
					>BCA L2</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='bcaL3Name'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'BusinessCapability', id: 'bcaL3Id' }}
					 csvHeader='bca-L3'
					 filter={TableUtilities.textFilter}
					>BCA L3</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='bcaL4Name'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'BusinessCapability', id: 'bcaL4Id' }}
					 csvHeader='bca-L4'
					 filter={TableUtilities.textFilter}
					>BCA L4</TableHeaderColumn>
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
			bcaL1Id: PropTypes.string.isRequired,
			bcaL1Name: PropTypes.string.isRequired,
			bcaL2Id: PropTypes.string,
			bcaL2Name: PropTypes.string,
			bcaL3Id: PropTypes.string,
			bcaL3Name: PropTypes.string,
			bcaL4Id: PropTypes.string,
			bcaL4Name: PropTypes.string
		}).isRequired
	).isRequired,
	setup: PropTypes.object
};

export default Table;