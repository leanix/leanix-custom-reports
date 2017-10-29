import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Utilities from './common/Utilities';
import Link from './common/Link';
import TableUtilities from './common/TableUtilities';
import Label from './Label';

class Matrix extends Component {

	constructor(props) {
		super(props);
		this._renderNoData = this._renderNoData.bind(this);
		this._renderMatrix = this._renderMatrix.bind(this);
		this._renderRow = this._renderRow.bind(this);
		this._renderEmptyCell = this._renderEmptyCell.bind(this);
		this._renderCell = this._renderCell.bind(this);
		this._renderLabelLinkList = this._renderLabelLinkList.bind(this);
		this._renderLabelLink = this._renderLabelLink.bind(this);
	}

	render() {
		const baseUrl = Utilities.getFrom(this.props.setup, 'settings.baseUrl');
		return (
			<div className='matrix'>
				{!this.props.dataAvailable ? this._renderNoData(baseUrl) : this._renderMatrix(baseUrl)}
			</div>
		);
	}

	_renderNoData(baseUrl) {
		return (
			<table>
				<tbody>
					{this.props.data.map((e, i) => {
						return this._renderRow(true, e, i, baseUrl);
					})}
				</tbody>
			</table>
		);
	}

	_renderMatrix(baseUrl) {
		return (
			<table>
				<tbody>
					{this.props.data.map((e, i) => {
						return this._renderRow(false, e, i, baseUrl);
					})}
				</tbody>
			</table>
		);
	}

	_renderRow(noData, row, rowIndex, baseUrl) {
		return (
			<tr key={rowIndex}>
				{row.map((e, i) => {
					if (noData) {
						if (rowIndex === 0 || i === 0) {
							// all header cells normally
							return this._renderCell(e, rowIndex, i, baseUrl);
						} else {
							// all other cells must be empty
							return this._renderEmptyCell(rowIndex, i);
						}
					}
					return this._renderCell(e, rowIndex, i, baseUrl);
				})}
			</tr>
		);
	}

	_renderEmptyCell(rowIndex, columnIndex) {
		return (
			<td key={rowIndex + '-' + columnIndex} />
		);
	}

	_renderCell(cell, rowIndex, columnIndex, baseUrl) {
		if (rowIndex === 0 && columnIndex === 0) {
			// first cell must be empty
			return (
				<th key={rowIndex + '-' + columnIndex} style={{ minWidth: this.props.cellWidth }} />
			);
		}
		// headers are strings, data values are arrays
		if (Array.isArray(cell)) {
			return (
				<td key={rowIndex + '-' + columnIndex}>
					<div style={TableUtilities.OVERFLOW_CELL_STYLE}>
						{this._renderLabelLinkList(cell, baseUrl)}
					</div>
				</td>
			);
		} else {
			return (
				<th key={rowIndex + '-' + columnIndex}
					className='text-center' style={{ minWidth: this.props.cellWidth }}>{cell}</th>
			);
		}
	}

	_renderLabelLinkList(list, baseUrl) {
		return (
			<span>
				{list.map((e, i) => {
					const link = baseUrl + '/factsheet/'
						+ this.props.factsheetType + '/' + e.id;
					if (i === 0) {
						return (
							<span key={i}>
								<Label
									label={this._renderLabelLink(e.name, link)}
									bgColor={e.viewModel.bgColor}
									color={e.viewModel.color}
									width={this.props.cellWidth}
								/>
							</span>
						);
					}
					return (
						<span key={i}>
							<br />
							<Label
								label={this._renderLabelLink(e.name, link)}
								bgColor={e.viewModel.bgColor}
								color={e.viewModel.color}
								width={this.props.cellWidth}
							/>
						</span>
					);
				})}
			</span>
		);
	}

	_renderLabelLink(text, link) {
		return () => {
			return (
				<Link link={link} target='_blank' text={text} />
			);
		}
	}
}

// TODO write validator for 'data'

Matrix.propTypes = {
	data: PropTypes.arrayOf(PropTypes.array.isRequired).isRequired,
	dataAvailable: PropTypes.bool.isRequired,
	cellWidth: PropTypes.string.isRequired,
	factsheetType: PropTypes.string,
	setup: PropTypes.object.isRequired
};

export default Matrix;