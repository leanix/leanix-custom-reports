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
				 pagination ignoreSinglePage
				 options={
					 { clearSearch: true },
					 { sizePerPageList: [
						{ text: '5', value: 5 },
						{ text: '25', value: 25 },
						{ text: '50', value: 50 },
						{ text: 'All', value: this.props.data.length }
						],
						sizePerPage: 5
					 }
				 }
				>
				<TableHeaderColumn dataSort
					 dataField='level'
					 width='150px'
					 dataAlign='left'
					 filter={{
						type: 'NumberFilter',
						placeholder: 'Please choose',
						options: this.props.options.level,
						numberComparators: ['<=', '=', '>='],
						defaultValue: {
							number: this.props.options.level[this.props.options.level.length - 1],
							comparator: '<='
						}
					 }}
					>Level</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='domain'
					 width='200px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'CSM', id: 'domainId' }}
					 csvHeader='service-domain'
					 filter={TableUtilities.textFilter}
					>Service Domain</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='name'
					 width='250px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'CSM', id: 'nameId' }}
					 csvHeader='service-name'
					 filter={TableUtilities.textFilter}
					>Service Name</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='operation'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'CSM', id: 'operationId' }}
					 csvHeader='service-operation'
					 filter={TableUtilities.textFilter}
					>Service Operation</TableHeaderColumn>
				<TableHeaderColumn columnClassName='small'
					 dataField='description'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatOptionalText}
					 csvHeader='service-description'
					 csvFormat={TableUtilities.formatOptionalText}
					 csvFormatExtraData={true}
					 filter={TableUtilities.textFilter}
					>Service Description</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='operationStatus'
					 width='200px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.serviceStatus}
					 csvHeader='service-operation-status'
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.serviceStatus}
					 filter={TableUtilities.selectFilter(this.props.options.serviceStatus)}
					>Service Operation Status</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='platforms'
					 width='250px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkArrayFactsheets(this.props.setup)}
					 formatExtraData={{ type: 'BusinessCapability', id: 'platformIds' }}
					 csvHeader='platforms-provided'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>Platforms (provided)</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

Table.propTypes = {
	data: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			level: PropTypes.number.isRequired,
			domainId: PropTypes.string,
			domain: PropTypes.string,
			nameId: PropTypes.string,
			name: PropTypes.string,
			operationId: PropTypes.string,
			operation: PropTypes.string,
			description: PropTypes.string,
			operationStatus: PropTypes.number,
			platformIds: TableUtilities.PropTypes.idArray('platforms'),
			platforms: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired
		}).isRequired
	).isRequired,
	options: PropTypes.shape({
		level: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
		serviceStatus: TableUtilities.PropTypes.options
	}).isRequired,
	setup: PropTypes.object
};

export default Table;