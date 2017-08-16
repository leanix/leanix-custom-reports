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
			<BootstrapTable data={this.props.data} keyField='appMapL1ID'
				striped hover search pagination ignoreSinglePage exportCSV
				options={{ clearSearch: true }}>
				<TableHeaderColumn dataSort
					 dataField='appMapL1Name'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'BusinessCapability', id: 'appMapL1ID' }}
					 csvHeader='appmap-L1'
					 filter={TableUtilities.textFilter}
					>App Map L1</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='appMapL2Name'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'BusinessCapability', id: 'appMapL2ID' }}
					 csvHeader='appmap-L2'
					 filter={TableUtilities.textFilter}
					>App Map L2</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='bcaL1Name'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'BusinessCapability', id: 'bcaL1ID' }}
					 csvHeader='bca-L1'
					 filter={TableUtilities.textFilter}
					>BCA L1</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='bcaL2Name'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'BusinessCapability', id: 'bcaL2ID' }}
					 csvHeader='bca-L2'
					 filter={TableUtilities.textFilter}
					>BCA L2</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='bcaL3Name'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'BusinessCapability', id: 'bcaL3ID' }}
					 csvHeader='bca-L3'
					 filter={TableUtilities.textFilter}
					>BCA L3</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='bcaL4Name'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'BusinessCapability', id: 'bcaL4ID' }}
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
			appMapL1ID: PropTypes.string.isRequired,
			appMapL1Name: PropTypes.string.isRequired,
			appMapL2ID: PropTypes.string,
			appMapL2Name: PropTypes.string,
			bcaL1ID: PropTypes.string.isRequired,
			bcaL1Name: PropTypes.string.isRequired,
			bcaL2ID: PropTypes.string,
			bcaL2Name: PropTypes.string,
			bcaL3ID: PropTypes.string,
			bcaL3Name: PropTypes.string,
			bcaL4ID: PropTypes.string,
			bcaL4Name: PropTypes.string
		}).isRequired
	).isRequired,
	setup: PropTypes.object
};

export default Table;