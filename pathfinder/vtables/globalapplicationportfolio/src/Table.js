import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import TableUtilities from './common/TableUtilities';

class Table extends Component {

	constructor(props) {
		super(props);
	}

	_formatToCSV(cell,row){
		if (!cell) {
			return '';
		}
		var b = cell.replace(/"/g, `'`);
		console.log(cell);
	}

	render() {
		return (
			<BootstrapTable data={this.props.data} keyField='id'
				 striped hover search exportCSV
				 pagination ignoreSinglePage
				 options={{ clearSearch: true }}>
				<TableHeaderColumn dataSort
					 dataField='name'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'Application', id: 'id' }}
					 csvHeader='application-name'
					 filter={TableUtilities.textFilter}
					>Application name</TableHeaderColumn>
				<TableHeaderColumn columnClassName='small'
					 dataField='description'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatOptionalText}
					 csvHeader='description'
					 csvFormat={ this._formatToCSV }
					 csvFormatExtraData={true}
					 filter={TableUtilities.textFilter}
					>Description</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='cobraNames'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkArrayFactsheets(this.props.setup)}
					 formatExtraData={{ type: 'BusinessCapability', id: 'cobraIds' }}
					 csvHeader='cobras'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>COBRAs</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='lifecyclePhase'
					 width='100px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.lifecyclePhase}
					 csvHeader='lifecycle-phase'
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.lifecyclePhase}
					 filter={TableUtilities.selectFilter(this.props.options.lifecyclePhase)}
					>Phase</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='golive'
					 width='250px'
					 headerAlign='left'
					 dataAlign='right'
					 dataFormat={TableUtilities.formatDate}
					 csvHeader='go-live-date'
					 csvFormat={TableUtilities.csvFormatDate}
					 filter={TableUtilities.dateFilter}
					>Go live date</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='retired'
					 width='250px'
					 headerAlign='left'
					 dataAlign='right'
					 dataFormat={TableUtilities.formatDate}
					 csvHeader='retired-date'
					 csvFormat={TableUtilities.csvFormatDate}
					 filter={TableUtilities.dateFilter}
					>Retired date</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='recommendation'
					 width='160px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.recommendation}
					 csvHeader='recommendation'
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.recommendation}
					 filter={TableUtilities.selectFilter(this.props.options.recommendation)}
					>Recommendation</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='market'
					 width='100px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.market}
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.market}
					 filter={TableUtilities.selectFilter(this.props.options.market)}
					>Market</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='costCentre'
					 width='160px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.costCentre}
					 csvHeader='cost-centre'
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.costCentre}
					 filter={TableUtilities.selectFilter(this.props.options.costCentre)}
					>Cost centre</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='stack'
					 width='160px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.stack}
					 csvHeader='stack'
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.stack}
					 filter={TableUtilities.selectFilter(this.props.options.stack)}
					>Stack</TableHeaderColumn>
				<TableHeaderColumn dataSort
				   dataField='admScope'
				   width='150px'
				   dataAlign='left'
				   dataFormat={TableUtilities.formatEnum}
				   formatExtraData={this.props.options.admScope}
				   csvHeader='in-adm-scope'
				   csvFormat={TableUtilities.formatEnum}
				   csvFormatExtraData={this.props.options.admScope}
				   filter={TableUtilities.selectFilter(this.props.options.admScope)}
				>In AD&M scope</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='cotsPackage'
					 width='160px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.cotsPackage}
					 csvHeader='cots-package'
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.cotsPackage}
					 filter={TableUtilities.selectFilter(this.props.options.cotsPackage)}
					>COTS package</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='cotsSoftware'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkArrayFactsheets(this.props.setup)}
					 formatExtraData={{ type: 'ITComponent', id: 'cotsSoftwareIds' }}
					 csvHeader='cots-software'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>COTS software</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='cotsVendors'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkArrayFactsheets(this.props.setup)}
					 formatExtraData={{ type: 'Provider', id: 'cotsVendorIds' }}
					 csvHeader='cots-vendors'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>COTS vendors</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='lastUpgrade'
					 width='250px'
					 headerAlign='left'
					 dataAlign='right'
					 dataFormat={TableUtilities.formatDate}
					 csvHeader='last-major-upgrade'
					 csvFormat={TableUtilities.csvFormatDate}
					 filter={TableUtilities.dateFilter}
					>Last major upgrade</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='remedyNames'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkArrayFactsheets(this.props.setup)}
					 formatExtraData={{ type: 'ITComponent', id: 'remedyIds' }}
					 csvHeader='remedy-business-services'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>Remedy business services</TableHeaderColumn>
				<TableHeaderColumn dataSort
				   dataField='supportNames'
				   width='300px'
				   dataAlign='left'
				   dataFormat={TableUtilities.formatLinkArrayFactsheets(this.props.setup)}
				   formatExtraData={{ type: 'Provider', id: 'supportIds' }}
				   csvHeader='supported-by'
				   csvFormat={TableUtilities.formatArray}
				   csvFormatExtraData=';'
				   filter={TableUtilities.textFilter}
				>Supported by</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='siProviderNames'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkArrayFactsheets(this.props.setup)}
					 formatExtraData={{ type: 'Provider', id: 'siProviderIds' }}
					 csvHeader='si-providers'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>SI providers</TableHeaderColumn>
				<TableHeaderColumn dataSort
				   dataField='customisation'
				   width='150px'
				   dataAlign='left'
				   dataFormat={TableUtilities.formatEnum}
				   formatExtraData={this.props.options.customisation}
				   csvHeader='level-of-customisation'
				   csvFormat={TableUtilities.formatEnum}
				   csvFormatExtraData={this.props.options.customisation}
				   filter={TableUtilities.selectFilter(this.props.options.customisation)}
				>Level of customisation</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='businessValue'
					 width='150px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.functionalSuitability}
					 csvHeader='business-value'
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.functionalSuitability}
					 filter={TableUtilities.selectFilter(this.props.options.functionalSuitability)}
					>Business value</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='technicalCondition'
					 width='140px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.technicalSuitability}
					 csvHeader='technical-condition'
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.technicalSuitability}
					 filter={TableUtilities.selectFilter(this.props.options.technicalSuitability)}
					>Technical condition</TableHeaderColumn>
				<TableHeaderColumn dataSort
				   dataField='complexity'
				   width='130px'
				   dataAlign='left'
				   dataFormat={TableUtilities.formatEnum}
				   formatExtraData={this.props.options.applicationComplexity}
				   csvHeader='application-complexity'
				   csvFormat={TableUtilities.formatEnum}
				   csvFormatExtraData={this.props.options.applicationComplexity}
				   filter={TableUtilities.selectFilter(this.props.options.applicationComplexity)}
				>Application complexity</TableHeaderColumn>
				<TableHeaderColumn dataSort
				   dataField='businessCriticality'
				   width='170px'
				   dataAlign='left'
				   dataFormat={TableUtilities.formatEnum}
				   formatExtraData={this.props.options.businessCriticality}
				   csvHeader='business-criticality'
				   csvFormat={TableUtilities.formatEnum}
				   csvFormatExtraData={this.props.options.businessCriticality}
				   filter={TableUtilities.selectFilter(this.props.options.businessCriticality)}
				>Business criticality</TableHeaderColumn>
				<TableHeaderColumn dataSort
				   dataField='usage'
				   width='130px'
				   dataAlign='left'
				   dataFormat={TableUtilities.formatEnum}
				   formatExtraData={this.props.options.applicationUsage}
				   csvHeader='application-usage'
				   csvFormat={TableUtilities.formatEnum}
				   csvFormatExtraData={this.props.options.applicationUsage}
				   filter={TableUtilities.selectFilter(this.props.options.applicationUsage)}
				>Application usage</TableHeaderColumn>
				<TableHeaderColumn dataSort columnClassName='small'
				   dataField='alias'
				   width='250px'
				   dataAlign='left'
				   dataFormat={TableUtilities.formatOptionalText}
				   csvHeader='alternate-names'
				   csvFormat={TableUtilities.formatOptionalText}
				   csvFormatExtraData={true}
				   filter={TableUtilities.textFilter}
				>Alternate names</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='deployment'
					 width='250px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.deployment}
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.deployment}
					 filter={TableUtilities.selectFilter(this.props.options.deployment)}
					>Deployment</TableHeaderColumn>
				<TableHeaderColumn dataSort
				   dataField='soxpciFlag'
				   width='160px'
				   dataAlign='left'
				   dataFormat={TableUtilities.formatEnum}
				   formatExtraData={this.props.options.soxPci}
				   csvHeader='sox-pci'
				   csvFormat={TableUtilities.formatEnum}
				   csvFormatExtraData={this.props.options.soxPci}
				   filter={TableUtilities.selectFilter(this.props.options.soxPci)}
				>SOX / PCI</TableHeaderColumn>
				<TableHeaderColumn dataSort columnClassName='small'
					 dataField='itOwners'
					 width='280px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatArray}
					 formatExtraData='<br/>'
					 csvHeader='it-owners'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>IT owners</TableHeaderColumn>
				<TableHeaderColumn dataSort columnClassName='small'
				   dataField='businessOwners'
				   width='280px'
				   dataAlign='left'
				   dataFormat={TableUtilities.formatArray}
				   formatExtraData='<br/>'
				   csvHeader='business-owners'
				   csvFormat={TableUtilities.formatArray}
				   csvFormatExtraData=';'
				   filter={TableUtilities.textFilter}
				>Business owners</TableHeaderColumn>
				<TableHeaderColumn dataSort columnClassName='small'
					 dataField='spocs'
					 width='280px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatArray}
					 formatExtraData='<br/>'
					 csvHeader='spocs'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>SPOCs</TableHeaderColumn>
				<TableHeaderColumn dataSort columnClassName='small'
				   dataField='operationsOwners'
				   width='280px'
				   dataAlign='left'
				   dataFormat={TableUtilities.formatArray}
				   formatExtraData='<br/>'
				   csvHeader='operations-owners'
				   csvFormat={TableUtilities.formatArray}
				   csvFormatExtraData=';'
				   filter={TableUtilities.textFilter}
				>Operations owners</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='usedByMarkets'
					 width='250px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkArrayFactsheets(this.props.setup)}
					 formatExtraData={{ type: 'UserGroup', id: 'usedByMarketIds', delimiter: ', ' }}
					 csvHeader='used-by-markets'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>Used by markets</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='usedBySegments'
					 width='250px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkArrayFactsheets(this.props.setup)}
					 formatExtraData={{ type: 'UserGroup', id: 'usedBySegmentIds', delimiter: ', ' }}
					 csvHeader='used-by-segments'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>Used by segments</TableHeaderColumn>
				<TableHeaderColumn dataSort
				   dataField='networkProductFamilies'
				   width='220px'
				   dataAlign='left'
				   dataFormat={TableUtilities.formatEnumArray}
				   formatExtraData={{
					   enums: this.props.options.networkTechnicalProductFamily,
					   delimiter: '<br/>'
				   }}
				   csvHeader='network-product-families'
				   csvFormat={TableUtilities.formatEnumArray}
				   csvFormatExtraData={{
					   enums: this.props.options.networkTechnicalProductFamily,
					   delimiter: ';'
				   }}
				   filterValue={(cell, row) => {
					   return TableUtilities.formatEnumArray(cell, row, {
						   enums: this.props.options.networkTechnicalProductFamily,
						   delimiter: ','
					   });
				   }}
				   filter={TableUtilities.textFilter}
				>Network product families</TableHeaderColumn>
				<TableHeaderColumn dataSort columnClassName='small'
				   dataField='backends'
				   width='250px'
				   dataAlign='left'
				   dataFormat={TableUtilities.formatArray}
				   formatExtraData=', '
				   csvHeader='backend-technologies'
				   csvFormat={TableUtilities.formatArray}
				   csvFormatExtraData=';'
				   filter={TableUtilities.textFilter}
				>Backend technologies</TableHeaderColumn>
				<TableHeaderColumn dataSort columnClassName='small'
				   dataField='frontends'
				   width='250px'
				   dataAlign='left'
				   dataFormat={TableUtilities.formatArray}
				   formatExtraData=', '
				   csvHeader='frontend-technologies'
				   csvFormat={TableUtilities.formatArray}
				   csvFormatExtraData=';'
				   filter={TableUtilities.textFilter}
				>Frontend technologies</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='obsolescence'
					 width='160px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.obsolescence}
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.obsolescence}
					 filter={TableUtilities.selectFilter(this.props.options.obsolescence)}
					>Obsolescence</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='cloudMaturity'
					 width='160px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.cloudMaturity}
					 csvHeader='cloud-maturity'
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.cloudMaturity}
					 filter={TableUtilities.selectFilter(this.props.options.cloudMaturity)}
					>Cloud maturity</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='accessType'
					 width='130px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.accessType}
					 csvHeader='access-type'
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.accessType}
					 filter={TableUtilities.selectFilter(this.props.options.accessType)}
					>Access type</TableHeaderColumn>
				<TableHeaderColumn dataSort columnClassName='small'
				   dataField='externalId'
				   width='250px'
				   dataAlign='left'
				   dataFormat={TableUtilities.formatOptionalText}
				   csvHeader='external-id'
				   csvFormat={TableUtilities.formatOptionalText}
				   csvFormatExtraData={true}
				   filter={TableUtilities.textFilter}
				>External ID</TableHeaderColumn>
				<TableHeaderColumn dataSort columnClassName='small'
				   dataField='leanixV3Id'
				   width='130px'
				   dataAlign='left'
				   dataFormat={TableUtilities.formatOptionalText}
				   csvHeader='leanix-v3-id'
				   csvFormat={TableUtilities.formatOptionalText}
				   csvFormatExtraData={true}
				   filter={TableUtilities.textFilter}
				>LeanIX v3 ID</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

Table.propTypes = {
	data: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			name: PropTypes.string.isRequired,
			description: PropTypes.string,
			cobraIds: TableUtilities.PropTypes.idArray('cobraNames'),
			cobraNames: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			lifecyclePhase: PropTypes.number,
			golive: PropTypes.instanceOf(Date),
			retired: PropTypes.instanceOf(Date),
			recommendation: PropTypes.number,
			market: PropTypes.number,
			costCentre: PropTypes.number,
			stack: PropTypes.number,
			admScope: PropTypes.number,
			cotsPackage: PropTypes.number,
			cotsSoftwareIds: TableUtilities.PropTypes.idArray('cotsSoftware'),
			cotsSoftware: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			cotsVendorIds: TableUtilities.PropTypes.idArray('cotsVendors'),
			cotsVendors: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			lastUpgrade: PropTypes.instanceOf(Date),
			remedyIds: TableUtilities.PropTypes.idArray('remedyNames'),
			remedyNames: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			supportIds: TableUtilities.PropTypes.idArray('supportNames'),
			supportNames: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			siProviderIds: TableUtilities.PropTypes.idArray('siProviderNames'),
			siProviderNames: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			customisation: PropTypes.number,
			businessValue: PropTypes.number,
			technicalCondition: PropTypes.number,
			complexity: PropTypes.number,
			businessCriticality: PropTypes.number,
			usage: PropTypes.number,
			alias: PropTypes.string,
			externalId: PropTypes.string,
			leanixV3Id: PropTypes.string,
			deployment: PropTypes.number,
			soxpciFlag: PropTypes.number,
			itOwners: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			businessOwners: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			spocs: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			operationsOwners: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			accessType: PropTypes.number,
			usedByMarketIds: TableUtilities.PropTypes.idArray('usedByMarkets'),
			usedByMarkets: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			usedBySegmentIds: TableUtilities.PropTypes.idArray('usedBySegments'),
			usedBySegments: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			networkProductFamilies: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
			obsolescence: PropTypes.number,
			cloudMaturity: PropTypes.number,
			backends: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			frontends: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired
		}).isRequired
	).isRequired,
	options: PropTypes.shape({
		lifecyclePhase: TableUtilities.PropTypes.options,
		recommendation: TableUtilities.PropTypes.options,
		market: TableUtilities.PropTypes.options,
		costCentre: TableUtilities.PropTypes.options,
		stack: TableUtilities.PropTypes.options,
		admScope: TableUtilities.PropTypes.options,
		cotsPackage: TableUtilities.PropTypes.options,
		customisation: TableUtilities.PropTypes.options,
		functionalSuitability: TableUtilities.PropTypes.options,
		technicalSuitability: TableUtilities.PropTypes.options,
		applicationComplexity: TableUtilities.PropTypes.options,
		businessCriticality: TableUtilities.PropTypes.options,
		applicationUsage: TableUtilities.PropTypes.options,
		deployment: TableUtilities.PropTypes.options,
		soxPci: TableUtilities.PropTypes.options,
		accessType: TableUtilities.PropTypes.options,
		networkTechnicalProductFamily: TableUtilities.PropTypes.options,
		obsolescence: TableUtilities.PropTypes.options,
		cloudMaturity: TableUtilities.PropTypes.options
	}).isRequired,
	setup: PropTypes.object
};

export default Table;
