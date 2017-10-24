import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Label extends Component {

	constructor(props) {
		super(props);
	}

	render() {
		const style = {
			display: 'inline-block',
			textOverflow: 'ellipsis',
			overflow: 'hidden',
			width: this.props.width ? this.props.width : 'auto',
			backgroundColor: this.props.bgColor,
			color: this.props.color
		};
		switch (style.backgroundColor) {
			case 'white':
			case '#FFFFFF':
			case '#FFF':
			case '#FF':
			case 'rgb(255,255,255)':
				style.border = '1px solid silver';
				break;
			default:
				break;
		}
		return (
			<span className='label' style={style}>
				{this.props.label}
			</span>
		);
	}
}

Label.propTypes = {
	label: PropTypes.string.isRequired,
	bgColor: PropTypes.string.isRequired,
	color: PropTypes.string.isRequired,
	width: PropTypes.string
};

export default Label;