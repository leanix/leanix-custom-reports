import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Label from './Label';

class Legend extends Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div>
				{this.props.items.map((e, i) => {
					return (
						<Label key={i + e.label}
							label={e.label}
							bgColor={e.bgColor}
							color={e.color}
							width={this.props.width}
						/>
					);
				})}
			</div>
		);
	}
}

Legend.propTypes = {
	items: PropTypes.arrayOf(
		PropTypes.shape({
			label: PropTypes.string.isRequired,
			bgColor: PropTypes.string.isRequired,
			color: PropTypes.string.isRequired
		})
	).isRequired,
	width: PropTypes.string.isRequired
};

export default Legend;