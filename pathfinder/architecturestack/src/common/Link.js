import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Link extends Component {

	constructor(props) {
		super(props);
		this._handleClick = this._handleClick.bind(this);
	}

	_handleClick(e) {
		e.preventDefault();
		lx.openLink(this.props.link, this.props.target);
	}

	render() {
		if (!this.props.link || !this.props.target || !this.props.text) {
			return null;
		}
		switch (this.props.target) {
			case '_blank':
				return (
					<a href={this.props.link}
						title='Opens a new tab/window.'
						target={this.props.target}
						onClick={this._handleClick}
					>{this.props.text}</a>
				);
			default:
				return (
					<a href={this.props.link}
						target={this.props.target}
						onClick={this._handleClick}
					>{this.props.text}</a>
				);
		}
	}
}

Link.propTypes = {
	link: PropTypes.string.isRequired,
	target: PropTypes.string.isRequired,
	text: PropTypes.string.isRequired
};

export default Link;
