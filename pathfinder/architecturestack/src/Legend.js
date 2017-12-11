import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Label from './Label';

class Legend extends Component {

	constructor(props) {
		super(props);
	}

	render() {
		if (!this.props.items || this.props.items.length === 0) {
			return null;
		}
		return (
			<div className='legend'>
				{this.props.items.map((e, i) => {
					return (
						<span key={i} style={{ marginRight: '0.4em' }}>
							<Label
								label={e.label}
								bgColor={e.bgColor}
								color={e.color}
								width={this.props.itemWidth}
							/>
						</span>
					);
				})}
			</div>
		);
	}
}

Legend.propTypes = {
	items: PropTypes.arrayOf(
		PropTypes.shape({
			label: PropTypes.func.isRequired,
			bgColor: PropTypes.string.isRequired,
			color: PropTypes.string.isRequired
		}).isRequired
	).isRequired,
	itemWidth: PropTypes.string.isRequired
};

export default Legend;