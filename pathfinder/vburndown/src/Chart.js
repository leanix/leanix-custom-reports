import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import C3ChartInstance from './C3ChartInstance';

export function getChartNodeID() {
	return 'chart';
}

class Chart extends Component {

	constructor(props) {
		super(props);
	}

	componentDidMount() {
		if (this.chartInstance) {
			return;
		}
		// gets the div with id 'chart'
		const chartDiv = ReactDOM.findDOMNode(this);
		if (!chartDiv || !this.props.categories) {
			return;
		}
		this.chartInstance = new C3ChartInstance(chartDiv, this.props.categories);
	}

	componentWillUnmount() {
		if (this.chartInstance) {
			this.chartInstance.destroy();
			this.chartInstance = undefined;
		}
	}

	render() {
		if (this.chartInstance) {
			this.chartInstance.update(this.props.data);
		}
		return (
			<div id={getChartNodeID()} />
		);
	}
}

Chart.propTypes = {
	categories: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
	data: PropTypes.arrayOf(PropTypes.array.isRequired).isRequired
};

export default Chart;