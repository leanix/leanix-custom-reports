import React, { Component } from 'react';
import PropTypes from 'prop-types';

class ModalDialog extends Component {

	constructor(props) {
		super(props);
	}

	render() {
		if (!this.props.show) {
			return null;
		}
		// first div prevents click triggers in the outside area
		return (
			<div style={{
				position: 'fixed',
				top: '0',
				left: '0',
				width: '100%',
				height: '100%',
				zIndex: '500'
			}}>
				<div style={{
					position: 'fixed',
					top: '2.5em',
					width: '100%',
					zIndex: '1000'
				}}>
					<div className='panel panel-default' style={{ width: this.props.width, margin: '0 auto' }}>
						<div className='panel-heading'>
							<h3 className='panel-title'>
								<button type='button' className='close' style={{ right: '0px' }}
									data-dismiss='alert' aria-label='Close'
									onClick={this.props.onClose}>
									<span aria-hidden='true'>&times;</span>
								</button>
								{this.props.title}
							</h3>
						</div>
						<div className='panel-body'>
							{this.props.content()}
						</div>
						{this._renderFooter()}
					</div>
				</div>
			</div>
		);
	}

	_renderFooter() {
		if (!this.props.onOK) {
			return null;
		}
		return (
			<div className='panel-footer clearfix'>
				<span className='pull-right'>
					<button type='button' className='btn btn-success btn-sm'
						aria-label='Apply'
						onClick={this.props.onOK}>
						Apply
					</button>
				</span>
				<span className='pull-right' style={{ marginRight: '0.4em' }}>
					<button type='button' className='btn btn-default btn-sm'
						aria-label='Cancel'
						onClick={this.props.onClose}>
						Cancel
					</button>
				</span>
			</div>
		);
	}
}

ModalDialog.propTypes = {
	show: PropTypes.bool.isRequired,
	width: PropTypes.string.isRequired,
	title: PropTypes.string.isRequired,
	content: PropTypes.func.isRequired,
	onClose: PropTypes.func.isRequired,
	onOK: PropTypes.func
};

export default ModalDialog;
