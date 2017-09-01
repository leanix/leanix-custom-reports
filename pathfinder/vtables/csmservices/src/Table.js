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
					 dataField='csmL1Name'
					 width='250px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'CSM', id: 'csmL1Id' }}
					 csvHeader='service-domain'
					 filter={TableUtilities.textFilter}
					>Service domain</TableHeaderColumn>
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
					>Service classification</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='csmL2Name'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'CSM', id: 'csmL2Id' }}
					 csvHeader='service-name'
					 filter={TableUtilities.textFilter}
					>Service name</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='serviceOrigin'
					 width='150px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.serviceOrigin}
					 csvHeader='service-origin'
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.serviceOrigin}
					 filter={TableUtilities.selectFilter(this.props.options.serviceOrigin)}
					>Service origin</TableHeaderColumn>
				<TableHeaderColumn columnClassName='small'
					 dataField='csmL2Desc'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatOptionalText}
					 csvHeader='service-description'
					 csvFormat={TableUtilities.formatOptionalText}
					 csvFormatExtraData={true}
					 filter={TableUtilities.textFilter}
					>Service description</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='serviceStatus'
					 width='170px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.serviceStatus}
					 csvHeader='service-status'
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.serviceStatus}
					 filter={TableUtilities.selectFilter(this.props.options.serviceStatus)}
					>Service status</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='bcaL1BCsNames'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkArrayFactsheets(this.props.setup)}
					 formatExtraData={{ type: 'BusinessCapability', id: 'bcaL1BCsIds' }}
					 csvHeader='bca-L1'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>BCAs L1</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='bcaL4BCsNames'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkArrayFactsheets(this.props.setup)}
					 formatExtraData={{ type: 'BusinessCapability', id: 'bcaL4BCsIds' }}
					 csvHeader='bca-L4'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>BCAs L4</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='cimDOsNames'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkArrayFactsheets(this.props.setup)}
					 formatExtraData={{ type: 'DataObject', id: 'cimDOsIds' }}
					 csvHeader='cim'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>CIMs</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='appMapBCsNames'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkArrayFactsheets(this.props.setup)}
					 formatExtraData={{ type: 'BusinessCapability', id: 'appMapBCsIds' }}
					 csvHeader='appmap'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>AppMaps</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='platformBCsNames'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkArrayFactsheets(this.props.setup)}
					 formatExtraData={{ type: 'BusinessCapability', id: 'platformBCsIds' }}
					 csvHeader='platforms-provided'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>Platforms (provided)</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='platfConsBCsNames'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkArrayFactsheets(this.props.setup)}
					 formatExtraData={{ type: 'BusinessCapability', id: 'platfConsBCsIds' }}
					 csvHeader='platforms-consumed'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>Platforms (consumed)</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='tmfAppNames'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkArrayFactsheets(this.props.setup)}
					 formatExtraData={{ type: 'CSM', id: 'tmfAppIds' }}
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
			platformBCsIds: TableUtilities.PropTypes.idArray('platformBCsNames'),
			platformBCsNames: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			bcaL1BCsIds: TableUtilities.PropTypes.idArray('bcaL1BCsNames'),
			bcaL1BCsNames: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			bcaL4BCsIds: TableUtilities.PropTypes.idArray('bcaL4BCsNames'),
			bcaL4BCsNames: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			tmfAppIds: TableUtilities.PropTypes.idArray('tmfAppNames'),
			tmfAppNames: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			cimDOsIds: TableUtilities.PropTypes.idArray('cimDOsNames'),
			cimDOsNames: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			appMapBCsIds: TableUtilities.PropTypes.idArray('appMapBCsNames'),
			appMapBCsNames: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			platfConsBCsIds: TableUtilities.PropTypes.idArray('platfConsBCsNames'),
			platfConsBCsNames: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired
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