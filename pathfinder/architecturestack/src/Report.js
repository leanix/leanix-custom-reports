import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Utilities from './common/Utilities';

/*

1.	factsheet ids, displayNames, type & filterOptions from facet config
2.a	build view & axis drop downs from filterOptions & dataModel
2.b	build legend from drop downs & viewModel
3.	build matrix query
4.	build matrix from matrix query result

*/

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
		lx.showSpinner('Loading data...');
		// get all tags, then the data from facet config
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			const index = new DataIndex();
			index.put(tagGroups);
			lx.hideSpinner();
			lx.ready(this._createConfig(setup, index));
		});
		this.setState({
			setup: setup
		});
	}

	_createConfig(setup, index) {
		return {
			allowEditing: false,
			facets: [{
				key: 'query',
				label: 'Query',
				attributes: ['id', 'displayName', 'type'],
				sorting: [{
						key: 'displayName',
						mode: 'BY_FIELD',
						order: 'asc'
					}
				],
				callback: (data) => {
					// TODO
				}
			}]
		};
	}

	_createAdditionalDataQuery(ids, factsheetType, attributes) {
		const idsFilter = ids.map((e) => {
			return '"' + e + '"';
		}).join(',');
		let factsheetTypeFilter = '';
		let attributeDef = attributes.join(' ');
		if (factsheetType) {
			factsheetTypeFilter = `, facetFilters: [{facetKey: "FactSheetTypes", keys: ["${factsheetType}"]}]`;
			attributeDef = `...on ${factsheetType} { ${attributeDef} }`;
		}
		return `{additional: allFactSheets(
					filter: { ids: ${idsFilter} ${factsheetTypeFilter} }
				) {
					edges { node {
						id ${attributeDef}
					}}
				}}`;
	}

	_handleData(index) {
		// TODO
		lx.hideSpinner();
		this.setState({
			data: []
		});
	}

	render() {
		if (this.state.data.length === 0) {
			return (<h4 className='text-center'>Loading data...</h4>);
		}
		console.log(this.state.data);
		return (
			<div>

			</div>
		);
	}
}

export default Report;
