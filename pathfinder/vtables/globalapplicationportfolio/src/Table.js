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
				 striped hover search exportCSV pagination ignoreSinglePage
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
				<TableHeaderColumn tdStyle={{ fontSize: '.85em' }}
					 dataField='description'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatOptionalText}
					 csvHeader='description'
					 csvFormat={TableUtilities.formatOptionalText}
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
					 csvHeader='lifecycle-phase'
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
					>Cost Centre</TableHeaderColumn>
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
					>In AD&M Scope</TableHeaderColumn>
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
					>COTS Package</TableHeaderColumn>
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
					>COTS Software</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='cotsVendors'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatArray}
					 formatExtraData='<br/>'
					 csvHeader='cots-vendors'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>COTS Vendors</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='lastUpgrade'
					 width='140px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.lastMajorUpgrade}
					 csvHeader='last-major-upgrade'
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.lastMajorUpgrade}
					 filterFormatted
					 filter={TableUtilities.textFilter}
					>Last major upgrade</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='remedyNames'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatArray}
					 formatExtraData='<br/>'
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
					 formatExtraData={{ type: 'ITComponent', id: 'supportIds' }}
					 csvHeader='supported-by'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>Supported by</TableHeaderColumn>
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
					>Application Complexity</TableHeaderColumn>
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
					>Business Criticality</TableHeaderColumn>
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
					>Application Usage</TableHeaderColumn>
				<TableHeaderColumn dataSort tdStyle={{ fontSize: '.85em' }}
					 dataField='alias'
					 width='250px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatOptionalText}
					 csvHeader='alternate-names'
					 csvFormat={TableUtilities.formatOptionalText}
					 csvFormatExtraData={true}
					 filter={TableUtilities.textFilter}
					>Alternate names</TableHeaderColumn>
				<TableHeaderColumn dataSort tdStyle={{ fontSize: '.85em' }}
					 dataField='externalId'
					 width='250px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatOptionalText}
					 csvHeader='external-id'
					 csvFormat={TableUtilities.formatOptionalText}
					 csvFormatExtraData={true}
					 filter={TableUtilities.textFilter}
					>External ID</TableHeaderColumn>
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
				<TableHeaderColumn dataSort tdStyle={{ fontSize: '.85em' }}
					 dataField='itOwners'
					 width='280px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatArray}
					 formatExtraData='<br/>'
					 csvHeader='it-owners'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>IT Owners</TableHeaderColumn>
				<TableHeaderColumn dataSort tdStyle={{ fontSize: '.85em' }}
					 dataField='businessOwners'
					 width='280px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatArray}
					 formatExtraData='<br/>'
					 csvHeader='business-owners'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>Business Owners</TableHeaderColumn>
				<TableHeaderColumn dataSort tdStyle={{ fontSize: '.85em' }}
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
				<TableHeaderColumn dataSort tdStyle={{ fontSize: '.85em' }}
					 dataField='operationsOwners'
					 width='280px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatArray}
					 formatExtraData='<br/>'
					 csvHeader='operations-owners'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>Operations Owners</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='accessType'
					 width='130px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.accessType}
					 csvHeader='sox-pci'
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.accessType}
					 filter={TableUtilities.selectFilter(this.props.options.accessType)}
					>Access type</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='usedByMarkets'
					 width='250px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatArray}
					 formatExtraData=', '
					 csvHeader='used-by-markets'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>Used by markets</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='usedBySegments'
					 width='250px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatArray}
					 formatExtraData=', '
					 csvHeader='used-by-segments'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>Used by segments</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='networkProductFamilies'
					 width='220px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatArray}
					 formatExtraData='<br/>'
					 csvHeader='network-product-families'
					 csvFormat={TableUtilities.formatArray}
					 csvFormatExtraData=';'
					 filter={TableUtilities.textFilter}
					>Network Product Families</TableHeaderColumn>
				<TableHeaderColumn dataSort tdStyle={{ fontSize: '.85em' }}
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
				<TableHeaderColumn dataSort tdStyle={{ fontSize: '.85em' }}
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
			cobraNames: PropTypes.arrayOf(PropTypes.string).isRequired,
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
			cotsSoftware: PropTypes.arrayOf(PropTypes.string).isRequired,
			cotsVendors: PropTypes.arrayOf(PropTypes.string).isRequired,
			lastUpgrade: PropTypes.number,
			remedyNames: PropTypes.arrayOf(PropTypes.string).isRequired,
			supportIds: TableUtilities.PropTypes.idArray('supportNames'),
			supportNames: PropTypes.arrayOf(PropTypes.string).isRequired,
			customisation: PropTypes.number,
			businessValue: PropTypes.number,
			technicalCondition: PropTypes.number,
			complexity: PropTypes.number,
			businessCriticality: PropTypes.number,
			usage: PropTypes.number,
			alias: PropTypes.string,
			externalId: PropTypes.string,
			deployment: PropTypes.number,
			soxpciFlag: PropTypes.number,
			itOwners: PropTypes.arrayOf(PropTypes.string).isRequired,
			businessOwners: PropTypes.arrayOf(PropTypes.string).isRequired,
			spocs: PropTypes.arrayOf(PropTypes.string).isRequired,
			operationsOwners: PropTypes.arrayOf(PropTypes.string).isRequired,
			accessType: PropTypes.number,
			usedByMarkets: PropTypes.arrayOf(PropTypes.string).isRequired,
			usedBySegments: PropTypes.arrayOf(PropTypes.string).isRequired,
			networkProductFamilies: PropTypes.arrayOf(PropTypes.string).isRequired,
			backends: PropTypes.arrayOf(PropTypes.string).isRequired,
			frontends: PropTypes.arrayOf(PropTypes.string).isRequired
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
		lastMajorUpgrade: TableUtilities.PropTypes.options,
		customisation: TableUtilities.PropTypes.options,
		functionalSuitability: TableUtilities.PropTypes.options,
		technicalSuitability: TableUtilities.PropTypes.options,
		applicationComplexity: TableUtilities.PropTypes.options,
		businessCriticality: TableUtilities.PropTypes.options,
		applicationUsage: TableUtilities.PropTypes.options,
		deployment: TableUtilities.PropTypes.options,
		soxPci: TableUtilities.PropTypes.options,
		accessType: TableUtilities.PropTypes.options
	}).isRequired,
	setup: PropTypes.object
};

export default Table;