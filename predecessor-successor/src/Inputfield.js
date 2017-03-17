import React, { Component } from 'react';
import Autocomplete from 'react-autocomplete';

class Inputfield extends Component {

	constructor(props) {
		super(props);
		this.handleChange = this.handleChange.bind(this);
		this.handleSelect = this.handleSelect.bind(this);
		this.renderMenu = this.renderMenu.bind(this);
		this.renderItem = this.renderItem.bind(this);
		this.shouldItemRender = this.shouldItemRender.bind(this);
		this.sortItems = this.sortItems.bind(this);
		this.state = {
			value: ''
		};
	}
	
	handleChange(event, value) {
		this._handleValue(value);
	}
	
	handleSelect(value, element) {
		this._handleValue(value);
	}
	
	_handleValue(value) {
		const oldValue = this.state.value;
		this.setState({ value: value });
		if (value === oldValue) {
			// do not trigger a call for the same value
			return;
		}
		if (value.length === 0) {
			// empty value means reset on filter
			this.props.onChange(-1, null);
			return;
		}
		const index = this._indexOf(this.props.items.map(this.props.getItemValue), value);
		if (index < 0) {
			return;
		}
		this.props.onChange(index, this.props.items[index]);
	}
	
	_indexOf(array, value) {
		for (let i = 0, len = array.length; i < len; i++) {
			if (array[i].toLowerCase() === value.toLowerCase()) {
				return i;
			}
		}
		return -1;
	}
	
	shouldItemRender(item, value) {
		return this.props.getItemValue(item).toLowerCase().indexOf(value.toLowerCase()) !== -1;
	}
	
	sortItems(first, second, value) {
		const firstValue = this.props.getItemValue(first);
		const secondValue = this.props.getItemValue(second);
		if (value.length === 0) {
			return firstValue.localeCompare(secondValue);
		}
		const v = value.toLowerCase();
		const f = firstValue.toLowerCase().indexOf(v);
		const s = secondValue.toLowerCase().indexOf(v);
		if (f === s) {
			return firstValue.localeCompare(secondValue);
		}
		return f > s ? 1 : -1;
	}
	
	render() {
		if (this.props.items.length === 0) {
			return null;
		}
		return (
			<div className='form-group'>
				<label>{this.props.label}</label>
				{/* add white space for layouting */}
				&nbsp;
				<Autocomplete
					inputProps={{
						name: 'inputfield',
						placeholder: this.props.placeholder,
						className: 'form-control dropdown-toggle',
						'aria-haspopup': 'true',
						size: 60
					}}
					items={this.props.items}
					value={this.state.value}
					onChange={this.handleChange}
					onSelect={this.handleSelect}
					shouldItemRender={this.shouldItemRender}
					sortItems={this.sortItems}
					getItemValue={this.props.getItemValue}
					renderItem={this.renderItem}
					renderMenu={this.renderMenu}
					wrapperProps={{ className: 'dropdown' }}
					wrapperStyle={{ display: 'inline-block' }}
				/>
			</div>
		);
	}
	
	renderMenu(items, value, positionStyle) {
		if (items.length === 0) {
			return (
				<ul style={{ display: 'none' }} />
			);
		}
		return (
			<ul
				className='dropdown-menu inputfield-menu'
				style={{ minWidth: positionStyle.minWidth }}
				children={items}
			/>
		);
	}
	
	renderItem(item, isHighlighted) {
		const itemValue = this.props.getItemValue(item);
		return (
			<li
				key={itemValue}
				className={ isHighlighted ? 'bg-primary inputfield-menu-item' : 'inputfield-menu-item' }
				dangerouslySetInnerHTML={this._getRawMarkup(itemValue)}
			/>
		);
	}
	
	_getRawMarkup(itemValue) {
		const value = this.state.value;
		if (value.length === 0) {
			return { __html: itemValue };
		}
		return { __html: this._markItem(itemValue, value) };
	}
	
	_markItem(itemValue, value) {
		// TODO maybe use indexOf(searchvalue, startIndex) instead of regex for performance reasons?
		const regex = new RegExp(this._escapeRegExp(value), 'gi');
		let result = itemValue;
		while (regex.test(result)) {
			const end = regex.lastIndex;
			const begin = end - value.length;
			result = result.slice(0, begin) + '<mark>' + result.slice(begin, end) + '</mark>' + result.slice(end);
			regex.lastIndex += 6 /* <mark>.length */ + 7 /* </mark>.length */;
		}
		return result;
	}
	
	_escapeRegExp(string) {
		// from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions?redirectlocale=en-US&redirectslug=JavaScript%2FGuide%2FRegular_Expressions
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	}
}

Inputfield.propTypes = {
	label: React.PropTypes.string.isRequired,
	placeholder: React.PropTypes.string.isRequired,
	items: React.PropTypes.array.isRequired,
	getItemValue: React.PropTypes.func.isRequired,
	onChange: React.PropTypes.func.isRequired
};

export default Inputfield;