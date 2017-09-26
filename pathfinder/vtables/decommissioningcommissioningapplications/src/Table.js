import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import TableUtilities from './common/TableUtilities';

class Table extends Component {

	constructor(props) {
		super(props);
	}

	render() {
		const currentYear = this.props.currentYear;
		const nextYear = currentYear + 1;
		return (
			<BootstrapTable data={this.props.data} keyField='id'
				 striped hover exportCSV condensed>
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
				<TableHeaderColumn
					 dataField='baselineApr'
					 headerAlign='left'
					 dataAlign='right'
					 csvHeader={'application-baseline-apr-' + currentYear}
					>Baseline Apr {currentYear}</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='decommissionsActuals'
					 headerAlign='left'
					 dataAlign='right'
					 csvHeader='decommissions-actuals'
					>Decommissions (Actuals)</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='commissionsActuals'
					 headerAlign='left'
					 dataAlign='right'
					 csvHeader='commissions-actuals'
					>Commissions (Actuals)</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='baselineToday'
					 headerAlign='left'
					 dataAlign='right'
					 csvHeader='application-baseline-today'
					>Baseline as of today</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='decommissionsPlanned'
					 headerAlign='left'
					 dataAlign='right'
					 csvHeader='decommissions-planned'
					>Decommissions (Planned)</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='commissionsPlanned'
					 headerAlign='left'
					 dataAlign='right'
					 csvHeader='commissions-planned'
					>Commissions (Planned)</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='baselineMar'
					 headerAlign='left'
					 dataAlign='right'
					 csvHeader={'application-baseline-mar-' + nextYear}
					>Baseline Mar {nextYear}</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

Table.propTypes = {
	data: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			market: PropTypes.number.isRequired,
			baselineApr: PropTypes.number.isRequired,
			decommissionsPlanned: PropTypes.number.isRequired,
			decommissionsActuals: PropTypes.number.isRequired,
			commissionsPlanned: PropTypes.number.isRequired,
			commissionsActuals: PropTypes.number.isRequired,
			baselineMar: PropTypes.number.isRequired,
			baselineToday: PropTypes.number.isRequired
		}).isRequired
	).isRequired,
	currentYear: PropTypes.number.isRequired,
	options: PropTypes.shape({
		market: TableUtilities.PropTypes.options
	}).isRequired,
	setup: PropTypes.object
};

export default Table;