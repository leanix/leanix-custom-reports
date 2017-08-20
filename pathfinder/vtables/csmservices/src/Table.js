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
			<BootstrapTable data={this.props.data} keyField='csmL2Id'
				 striped hover search exportCSV
				 options={{ clearSearch: true }}>
				<TableHeaderColumn dataSort
					 dataField='csmL1Name'
					 width='250px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'CSM', id: 'csmL1Id' }}
					 csvHeader='serive-domain'
					 filter={TableUtilities.textFilter}
					>Service Domain</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='serviceClass'
					 width='200px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.serviceClassification}
					 csvHeader='service-classification'
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.serviceClassification}
					 filter={TableUtilities.selectFilter(this.props.options.serviceClassification)}
					>Service Classification</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='csmL2Name'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'CSM', id: 'csmL2Id' }}
					 csvHeader='service-name'
					 filter={TableUtilities.textFilter}
					>Service Name</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='serviceOrigin'
					 width='200px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.serviceOrigin}
					 csvHeader='service-origin'
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.serviceOrigin}
					 filter={TableUtilities.selectFilter(this.props.options.serviceOrigin)}
					>Service Origin</TableHeaderColumn>
				<TableHeaderColumn columnClassName='small'
					 dataField='csmL2Desc'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatOptionalText}
					 csvHeader='service-description'
					 csvFormat={TableUtilities.formatOptionalText}
					 csvFormatExtraData={true}
					 filter={TableUtilities.textFilter}
					>Service Description</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='serviceStatus'
					 width='200px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.serviceStatus}
					 csvHeader='service-status'
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.serviceStatus}
					 filter={TableUtilities.selectFilter(this.props.options.serviceStatus)}
					>Service Status</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='bcaBCsNames'
					 width='250px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkArrayFactsheets(this.props.setup)}
					 formatExtraData={{ type: 'BusinessCapability', id: 'bcaBCsIds' }}
					 csvHeader='bca'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>BCA</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='cimDOsNames'
					 width='250px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkArrayFactsheets(this.props.setup)}
					 formatExtraData={{ type: 'DataObject', id: 'cimDOsIds' }}
					 csvHeader='cim'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>CIM</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='platfProdByBCsNames'
					 width='250px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkArrayFactsheets(this.props.setup)}
					 formatExtraData={{ type: 'BusinessCapability', id: 'platfProdByBCsIds' }}
					 csvHeader='platform-produced-by'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>Platform (produced by)</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='platfConsByBCsNames'
					 width='250px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkArrayFactsheets(this.props.setup)}
					 formatExtraData={{ type: 'BusinessCapability', id: 'platfConsByBCsIds' }}
					 csvHeader='platform-consumed-by'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>Platform (consumed by)</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='tmfAppNames'
					 width='250px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkArrayFactsheets(this.props.setup)}
					 formatExtraData={{ type: 'Application', id: 'tmfAppIds' }}
					 csvHeader='tmf-open-api'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>TMF Open API</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

Table.propTypes = {
	data: PropTypes.arrayOf(
		PropTypes.shape({
			csmL1Id: PropTypes.string,
			csmL1Name: PropTypes.string,
			csmL2Id: PropTypes.string.isRequired,
			csmL2Name: PropTypes.string.isRequired,
			csmL2Desc: PropTypes.string,
			serviceStatus: PropTypes.number,
			serviceClass: PropTypes.number,
			serviceOrigin: PropTypes.number,
			platfProdByBCsIds: TableUtilities.PropTypes.idArray('platfProdByBCsNames'),
			platfProdByBCsNames: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			platfConsByBCsIds: TableUtilities.PropTypes.idArray('platfConsByBCsNames'),
			platfConsByBCsNames: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			bcaBCsIds: TableUtilities.PropTypes.idArray('bcaBCsNames'),
			bcaBCsNames: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			tmfAppIds: TableUtilities.PropTypes.idArray('tmfAppNames'),
			tmfAppNames: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			cimDOsIds: TableUtilities.PropTypes.idArray('cimDOsNames'),
			cimDOsNames: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired
		}).isRequired
	).isRequired,
	options: PropTypes.shape({
		serviceStatus: TableUtilities.PropTypes.options,
		serviceClassification: TableUtilities.PropTypes.options,
		serviceOrigin: TableUtilities.PropTypes.options
	}).isRequired,
	setup: PropTypes.object
};

export default Table;