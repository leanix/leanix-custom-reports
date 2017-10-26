import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Matrix extends Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div style={{
				overflow: 'auto',
				width: '1200px',
				height: '800px',
				backgroundColor: 'green'
			}}>
				TODO
			</div>
		);
	}

	_renderLabelLink(text, link) {
		if (!link) {
			return () => {
				return text;
			}
		}
		return () => {
			return (
				<Link link={link} target='_blank' text={text} />
			);
		}
	}
}

Matrix.propTypes = {
};

export default Matrix;