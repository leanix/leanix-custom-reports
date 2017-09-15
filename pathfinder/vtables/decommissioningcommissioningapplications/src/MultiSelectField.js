import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import TableUtilities from './common/TableUtilities';
import Utilities from './common/Utilities';

class MultiSelectField extends Component {

	constructor(props) {
		super(props);
		this._onChange = this._onChange.bind(this);
	}

	_onChange(val) {
		const values = !val ? [] : val.map((e) => {
			return e.label;
		});
		this.props.onChange(values);
	}

	_sortByLabel(a, b) {
		return a.label.localeCompare(b.label);
	}

	render() {
		if (Object.keys(this.props.items).length === 0) {
			return null;
		}
		const options = [];
		for (let key in this.props.items) {
			options.push({
				value: parseInt(key),
				label: this.props.items[key]
			});
		}
		options.sort(this._sortByLabel);
		const values = this.props.values.map((e) => {
			const value = Utilities.getKeyToValue(this.props.items, e);
			if (!value) {
				return;
			}
			return {
				value: parseInt(value),
				label: e
			};
		}).filter((e) => {
			return e !== undefined;
		});
		return (
			<div className='form-group'>
				<label>{this.props.label}</label>
				<Select multi
					name='MultiSelectField'
					placeholder={this.props.placeholder}
					options={options}
					matchPos='start'
					matchProp='label'
					ignoreCase={true}
					value={values}
					onChange={this._onChange} />
			</div>
		);
	}
}

MultiSelectField.propTypes = {
	label: PropTypes.string.isRequired,
	placeholder: PropTypes.string.isRequired,
	items: TableUtilities.PropTypes.options,
	onChange: PropTypes.func.isRequired,
	values: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired
};

export default MultiSelectField;