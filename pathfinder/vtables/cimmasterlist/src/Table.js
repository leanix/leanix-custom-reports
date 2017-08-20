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
				 options={{ clearSearch: true }}>
				<TableHeaderColumn dataSort
					 dataField='domainName'
					 width='200px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'DataObject', id: 'domainId' }}
					 csvHeader='domain-name'
					 filter={TableUtilities.textFilter}
					>Domain</TableHeaderColumn>
				<TableHeaderColumn columnClassName='small'
					 dataField='domainDescription'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatOptionalText}
					 csvHeader='domain-description'
					 csvFormat={TableUtilities.formatOptionalText}
					 csvFormatExtraData={true}
					 filter={TableUtilities.textFilter}
					>Domain Description</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='name'
					 width='250px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'DataObject', id: 'id' }}
					 csvHeader='entity-name'
					 filter={TableUtilities.textFilter}
					>Entity name</TableHeaderColumn>
				<TableHeaderColumn columnClassName='small'
					 dataField='description'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatOptionalText}
					 csvHeader='entity-description'
					 csvFormat={TableUtilities.formatOptionalText}
					 csvFormatExtraData={true}
					 filter={TableUtilities.textFilter}
					>Entity description</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='landscapeAvailable'
					 width='130px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.landscape}
					 csvHeader='landscape-available'
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.landscape}
					 filter={TableUtilities.selectFilter(this.props.options.landscape)}
					>Landscape Available?</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='appMaps'
					 width='250px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkArrayFactsheets(this.props.setup)}
					 formatExtraData={{ type: 'BusinessCapability', id: 'appMapIds' }}
					 csvHeader='appmap-names'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>Mappings to AppMap</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

Table.propTypes = {
	data: PropTypes.arrayOf(
		PropTypes.shape({
			domainId: PropTypes.string,
			domainName: PropTypes.string,
			domainDescription: PropTypes.string,
			id: PropTypes.string.isRequired,
			name: PropTypes.string.isRequired,
			description: PropTypes.string,
			landscapeAvailable: PropTypes.number,
			appMapIds: TableUtilities.PropTypes.idArray('appMaps'),
			appMaps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired
		}).isRequired
	).isRequired,
	options: PropTypes.shape({
		landscape: TableUtilities.PropTypes.options
	}).isRequired,
	setup: PropTypes.object
};

export default Table;