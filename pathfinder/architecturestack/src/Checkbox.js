import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Checkbox extends Component {

	constructor(props) {
		super(props);
		this._onChange = this._onChange.bind(this);
	}

	_onChange(event) {
		let val = event.target.checked;
		if (typeof val === 'string') {
			val = val === 'true';
		}
		this.props.onChange(val);
	}

	render() {
		return (
			<div className={ 'checkbox' + (this.props.useSmallerFontSize ? ' small' : '') }>
				<label htmlFor={this.props.id}>
					<input type='checkbox'
						id={this.props.id}
						name={'Checkbox-' + this.props.id}
						checked={this.props.value}
						onChange={this._onChange}
					/>
					{this.props.label}
				</label>
			</div>
		);
	}
}

Checkbox.propTypes = {
	id: PropTypes.string.isRequired,
	label: PropTypes.string.isRequired,
	onChange: PropTypes.func,
	value: PropTypes.bool.isRequired,
	useSmallerFontSize: PropTypes.bool
};

export default Checkbox;