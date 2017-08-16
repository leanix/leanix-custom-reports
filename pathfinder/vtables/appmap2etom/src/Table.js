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
					 dataField='etomL1Name'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'Process', id: 'etomL1ID' }}
					 csvHeader='etom-L1'
					 filter={TableUtilities.textFilter}
					>eTOM L1</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='etomL2Name'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'Process', id: 'etomL2ID' }}
					 csvHeader='etom-L2'
					 filter={TableUtilities.textFilter}
					>eTOM L2</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='etomL3Name'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'Process', id: 'etomL3ID' }}
					 csvHeader='etom-L3'
					 filter={TableUtilities.textFilter}
					>eTOM L3</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='etomL4Name'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'Process', id: 'etomL4ID' }}
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
			appMapL1ID: PropTypes.string.isRequired,
			appMapL1Name: PropTypes.string.isRequired,
			appMapL2ID: PropTypes.string,
			appMapL2Name: PropTypes.string,
			etomL1ID: PropTypes.string.isRequired,
			etomL1Name: PropTypes.string.isRequired,
			etomL2ID: PropTypes.string,
			etomL2Name: PropTypes.string,
			etomL3ID: PropTypes.string,
			etomL3Name: PropTypes.string,
			etomL4ID: PropTypes.string,
			etomL4Name: PropTypes.string
		}).isRequired
	).isRequired,
	setup: PropTypes.object
};

export default Table;