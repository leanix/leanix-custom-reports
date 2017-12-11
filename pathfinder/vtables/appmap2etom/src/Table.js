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
					 dataField='etomL1Name'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'Process', id: 'etomL1Id' }}
					 csvHeader='etom-L1'
					 filter={TableUtilities.textFilter}
					>eTOM L1</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='etomL2Name'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'Process', id: 'etomL2Id' }}
					 csvHeader='etom-L2'
					 filter={TableUtilities.textFilter}
					>eTOM L2</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='etomL3Name'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'Process', id: 'etomL3Id' }}
					 csvHeader='etom-L3'
					 filter={TableUtilities.textFilter}
					>eTOM L3</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='etomL4Name'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'Process', id: 'etomL4Id' }}
					 csvHeader='etom-L4'
					 filter={TableUtilities.textFilter}
					>eTOM L4</TableHeaderColumn>
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
			etomL1Id: PropTypes.string.isRequired,
			etomL1Name: PropTypes.string.isRequired,
			etomL2Id: PropTypes.string,
			etomL2Name: PropTypes.string,
			etomL3Id: PropTypes.string,
			etomL3Name: PropTypes.string,
			etomL4Id: PropTypes.string,
			etomL4Name: PropTypes.string
		}).isRequired
	).isRequired,
	setup: PropTypes.object
};

export default Table;