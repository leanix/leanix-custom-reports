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
			<BootstrapTable data={this.props.data} keyField='itemId'
				 striped hover search exportCSV
				 pagination
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
				<TableHeaderColumn dataSort
					 dataField='costCentre'
					 width='150px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.costCentre}
					 csvHeader='cost-centre'
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.costCentre}
					 filter={TableUtilities.selectFilter(this.props.options.costCentre)}
					>Cost Centre</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='deployment'
					 width='320px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.deployment}
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.deployment}
					 filter={TableUtilities.selectFilter(this.props.options.deployment)}
					>Deployment</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='lifecyclePhase'
					 width='120px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.lifecyclePhase}
					 csvHeader='lifecycle-phase'
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.lifecyclePhase}
					 filter={TableUtilities.selectFilter(this.props.options.lifecyclePhase)}
					>Phase</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='lifecycleStart'
					 width='250px'
					 headerAlign='left'
					 dataAlign='right'
					 dataFormat={TableUtilities.formatDate}
					 csvHeader='lifecycle-phase-start'
					 csvFormat={TableUtilities.csvFormatDate}
					 filter={TableUtilities.dateFilter}
					>Phase start</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='projectName'
					 width='300px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: 'Project', id: 'projectId' }}
					 csvHeader='project-name'
					 filter={TableUtilities.textFilter}
					>Project name</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='projectImpact'
					 width='150px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.projectImpact}
					 csvHeader='project-impact'
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.projectImpact}
					 filter={TableUtilities.selectFilter(this.props.options.projectImpact)}
					>Project impact</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='projectType'
					 width='150px'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatEnum}
					 formatExtraData={this.props.options.projectType}
					 csvHeader='project-type'
					 csvFormat={TableUtilities.formatEnum}
					 csvFormatExtraData={this.props.options.projectType}
					 filter={TableUtilities.selectFilter(this.props.options.projectType)}
					>Project type</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

Table.propTypes = {
	data: PropTypes.arrayOf(
		PropTypes.shape({
			itemId: PropTypes.string.isRequired,
			name: PropTypes.string.isRequired,
			id: PropTypes.string.isRequired,
			costCentre: PropTypes.number,
			deployment: PropTypes.number,
			projectId: PropTypes.string,
			projectName: PropTypes.string,
			projectImpact: PropTypes.number,
			projectType: PropTypes.number,
			lifecyclePhase: PropTypes.number,
			lifecycleStart: PropTypes.instanceOf(Date)
		}).isRequired
	).isRequired,
	options: PropTypes.shape({
		costCentre: TableUtilities.PropTypes.options,
		deployment: TableUtilities.PropTypes.options,
		lifecyclePhase: TableUtilities.PropTypes.options,
		projectImpact: TableUtilities.PropTypes.options,
		projectType: TableUtilities.PropTypes.options
	}).isRequired,
	setup: PropTypes.object
};

export default Table;