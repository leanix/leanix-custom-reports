import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import Link from './Link';

class SubTables extends Component {

	constructor(props) {
		super(props);
	}

	_formatName(cell, row) {
		if (!cell) {
			return '';
		}
		return (
			<span style={{ padding: '0 0 0 5%' }}>
				<Link link={'factsheet/Application/' + row.id} target='_blank' text={cell} />
			</span>
		);
	}

	_createTable(data, title) {
		if (data.length < 1) {
			return null;
		}
		return (
			<div>
				<h4 className='text-center'>{title}</h4>
				<BootstrapTable data={data} keyField='id'
					 maxHeight='300px' scrollTop='Top'
					 striped hover search exportCSV condensed
					 options={{ clearSearch: true }}>
					<TableHeaderColumn hidden export
						 dataField='id'
						>id</TableHeaderColumn>
					<TableHeaderColumn dataSort
						 dataField='name'
						 dataAlign='left'
						 dataFormat={this._formatName}
						 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
						>Name</TableHeaderColumn>
				</BootstrapTable>
			</div>
		);
	}

	render() {
		return (
			<div style={{ width: '100%' }}>
				<div style={{
					width: '50%',
					display: 'inline-block',
					padding: '0px 2% 0px 10%'
				}}>
					{this._createTable(this.props.data.compliantApps, 'Compliant Applications')}
				</div>
				<div style={{
					width: '50%',
					display: 'inline-block',
					padding: '0px 10% 0px 2%'
				}}>
					{this._createTable(this.props.data.nonCompliantApps, 'Non-Compliant Applications')}
				</div>
			</div>
		);
	}
}

SubTables.propTypes = {
	data: PropTypes.shape({
		compliantApps: PropTypes.arrayOf(PropTypes.shape({
				id: PropTypes.string.isRequired,
				name: PropTypes.string.isRequired
			}).isRequired
		).isRequired,
		nonCompliantApps: PropTypes.arrayOf(PropTypes.shape({
				id: PropTypes.string.isRequired,
				name: PropTypes.string.isRequired
			}).isRequired
		).isRequired
	}).isRequired
};

export default SubTables;