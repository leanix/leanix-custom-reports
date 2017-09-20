import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Chart, { getChartNodeID } from './Chart';

class Report extends Component {

	constructor(props) {
		super(props);
		this._initReport = this._initReport.bind(this);
		this._handleData = this._handleData.bind(this);
		this.state = {
			setup: null,
			data: []
		};
	}

	componentDidMount() {
		lx.init().then(this._initReport);
	}

	_initReport(setup) {
		// TODO create categories
		lx.ready(this._createConfig(setup));
		lx.showSpinner('Loading data ...');
		this.setState({
			setup: setup
		});
		// get all tags, then the data
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			const index = new DataIndex();
			index.put(tagGroups);
			const applicationTagId = index.getFirstTagID('Application Type', 'Application');
			const itTagId = index.getFirstTagID('CostCentre', 'IT');
			lx.executeGraphQL(this._createQuery(applicationTagId, itTagId)).then((data) => {
				index.put(data);
				this._handleData(index, applicationTagId, itTagId);
			});
		});
	}

	_createConfig(setup) {
		// TODO menuActions
		return {
			allowEditing: false,
			export: {
				autoScale: true,
				beforeExport: (exportElement) => {
					console.log(exportElement);
				},
				exportElementSelector: '#' + getChartNodeID(),
				format: 'A4',
				inputType: 'SVG',
				orientation: 'landscape'
			}
		};
	}

	_createQuery(applicationTagId, itTagId) {
		const applicationTagIdFilter = applicationTagId ? `, {facetKey: "Application Type", keys: ["${applicationTagId}"]}` : '';
		const itTagIdFilter = itTagId ? `, {facetKey: "CostCentre", keys: ["${itTagId}"]}` : '';
		let tagNameDef = 'tags { name }'; // initial assume to get it
		if (applicationTagIdFilter && itTagId) {
			tagNameDef = '';
		}
		return `{applications: allFactSheets(
					sort: { mode: BY_FIELD, key: "displayName", order: asc },
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Application"]}
						${applicationTagIdFilter}
						${itTagIdFilter}
					]}
				) {
					edges { node {
						id name ${tagNameDef}
						...on Application { lifecycle { phases { phase startDate } } }
					}}
				}}`;
	}

	_handleData(index, applicationTagId, itTagId) {
		const tableData = [];
		console.log(index);
		/*
		if (!applicationTagId && !index.includesTag(e, 'Application')) {
			return;
		}
		if (!itTagId && !index.includesTag(e, 'IT')) {
			return;
		}
		*/
		lx.hideSpinner();
		this.setState({
			data: tableData
		});
	}

	render() {
		if (this.state.data.length === 0) {
			return (<h4 className='text-center'>Loading data ...</h4>);
		}
		return (
			<div>
				<h3 id='title'>Application Burndown Chart</h3>
				<Chart
					categories={[{
						name: 'lala'
					}]}
					data={this.state.data} />
			</div>
		);
	}
}

export default Report;
