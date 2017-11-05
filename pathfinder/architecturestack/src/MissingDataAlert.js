import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ModalDialog from './ModalDialog';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import TableUtilities from './common/TableUtilities';

class MissingDataAlert extends Component {

	constructor(props) {
		super(props);
		this._renderPopup = this._renderPopup.bind(this);
		this._renderPopupContent = this._renderPopupContent.bind(this);
		this.state = {
			showList: false
		};
	}

	_handleShowList(setTo) {
		return () => {
			return this.setState({
				showList: setTo
			});
		}
	}

	render() {
		if (!this.props.show || this.props.missingData.length < 1) {
			return null;
		}
		const factsheet = lx.translateFactSheetType(this.props.factsheetType, this.props.missingData.length > 1 ? 'plural' : 'singular');
		return (
			<div>
				{this._renderPopup(factsheet)}
				<div className='alert alert-warning alert-dismissible small' role='alert' style={{ padding: '0.75em' }}>
					<button type='button' className='close' style={{ right: '0px' }}
							data-dismiss='alert' aria-label='Close'
							onClick={this.props.onClose}>
						<span aria-hidden='true'>&times;</span>
					</button>
					<strong>Attention:</strong> {this.props.missingData.length} {factsheet} not
					included in this report due to missing
					data: <a href='#' className='alert-link' onClick={this._handleShowList(true)}>Show list</a>
				</div>
			</div>
		);
	}

	_renderPopup(type) {
		if (!this.state.showList) {
			return null;
		}
		return (
			<ModalDialog show={this.state.showList}
				width='700px'
				title={'List of excluded ' + type}
				content={this._renderPopupContent}
				onClose={this._handleShowList(false)}
			/>
		);
	}

	_renderPopupContent() {
		const factsheet = lx.translateFactSheetType(this.props.factsheetType, 'singular');
		return (
			<BootstrapTable data={this.props.missingData} keyField='id'
				 striped hover search exportCSV height='450px'
				 options={{ clearSearch: true }}>
				<TableHeaderColumn dataSort
					 dataField='name'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ type: this.props.factsheetType, id: 'id' }}
					 csvHeader={factsheet + '-name'}
					 filter={TableUtilities.textFilter}
					>{factsheet} name</TableHeaderColumn>
				<TableHeaderColumn columnClassName='small'
					 dataField='reason'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatOptionalText}
					 csvHeader='reason'
					 filter={TableUtilities.textFilter}
					>Reason</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

MissingDataAlert.propTypes = {
	show: PropTypes.bool.isRequired,
	missingData: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			name: PropTypes.string.isRequired,
			reason: PropTypes.string.isRequired
		}).isRequired
	).isRequired,
	onClose: PropTypes.func.isRequired,
	factsheetType: PropTypes.string.isRequired,
	setup: PropTypes.object.isRequired
};

export default MissingDataAlert;
