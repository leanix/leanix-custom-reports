import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Utilities from './common/Utilities';
import SelectField from './SelectField';
import Legend from './Legend';
import Matrix from './Matrix';

const LOADING_INIT = 0;
const LOADING_SUCCESSFUL = 1;
const LOADING_ERROR = 2;

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
		this._createConfig = this._createConfig.bind(this);
		this._handleError = this._handleError.bind(this);
		this._handleFacetData = this._handleFacetData.bind(this);
		this._handleData = this._handleData.bind(this);
		this._handleViewSelect = this._handleViewSelect.bind(this);
		this._handleXAxisSelect = this._handleXAxisSelect.bind(this);
		this._handleYAxisSelect = this._handleYAxisSelect.bind(this);
		this._renderLoading = this._renderLoading.bind(this);
		this._renderError = this._renderError.bind(this);
		this._renderSuccessful = this._renderSuccessful.bind(this);
		this._renderSelectFields = this._renderSelectFields.bind(this);
		this.state = {
			setup: null,
			loadingState: LOADING_INIT,
			matrixData: []
		};
	}

	componentDidMount() {
		lx.init().then(this._initReport).catch(this._handleError);
	}

	_initReport(setup) {
		lx.showSpinner('Loading data...');
		// get all tags, then the data from facet config
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			const index = new DataIndex();
			index.put(tagGroups);
			lx.hideSpinner();
			lx.ready(this._createConfig(setup, index));
		}).catch(this._handleError);
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
				callback: (facetData) => {
					this._handleFacetData(index, facetData);
				},
				facetFiltersChangedCallback: (facetFilter) => {
					const factsheetTypeFilter = facetFilter.facets.find((e) => {
						return e.facetKey = 'FactSheetTypes';
					});
					this.selectedFactsheetType = factsheetTypeFilter ? factsheetTypeFilter.keys[0] : undefined;
				}
			}]
		};
	}

	_handleError(err) {
		console.error(err);
		this.setState({
			loadingState: LOADING_ERROR
		});
	}

	_handleFacetData(index, facetData) {
		// get remaining data based on selected combobox values
		lx.showSpinner('Loading data...');
		const ids = facetData.map((e) => {
			return '"' + e.id + '"';
		}).join(',');
		const factsheetType = this.selectedFactsheetType;
		const attributes = [];
		lx.executeGraphQL(this._createAdditionalDataQuery(ids, factsheetType, attributes)).then((additionalData) => {
			index.put(additionalData);
			this._handleData(index, facetData);
		}).catch(this._handleError);
	}

	_createAdditionalDataQuery(ids, factsheetType, attributes) {
		let attributeDef = 'id ' + attributes.join(' ');
		if (factsheetType) {
			attributeDef = `...on ${factsheetType} { ${attributeDef} }`;
		}
		return `{additionalData: allFactSheets(
					filter: { ids: [${ids}] }
				) {
					edges { node {
						${attributeDef}
					}}
				}}`;
	}

	_handleData(index, facetData) {
		console.log(index);
		console.log(facetData);
		// TODO create matrixData
		lx.hideSpinner();
		this.setState({
			matrixData: [],
			loadingState: LOADING_SUCCESSFUL
		});
	}

	_handleViewSelect(val) {
		console.log(val);
	}

	_handleXAxisSelect(val) {
		console.log(val);
	}

	_handleYAxisSelect(val) {
		console.log(val);
	}

	render() {
		switch (this.state.loadingState) {
			case LOADING_INIT:
				return this._renderLoading();
			case LOADING_SUCCESSFUL:
				return this._renderSuccessful();
			case LOADING_ERROR:
				return this._renderError();
			default:
				throw new Error('Unknown loading state: ' + this.state.loadingState);
		}
	}

	_renderLoading() {
		return (
			<div>
				<h4 className='text-center' style={{ position: 'absolute', width: '100%' }}>Loading data...</h4>
				{this._renderSelectFields([], undefined, [], undefined, [], undefined)}
			</div>
		);
	}

	_renderError() {
		return null;
	}

	_renderSuccessful() {
		const viewOptions = [{
			value: 'eins',
			label: 'Eins'
		}];
		const selectedViewOption = 'eins';
		const xAxisOptions = [{
			value: 'eins',
			label: 'Eins'
		}];
		const selectedXAxisOption = 'eins';
		const yAxisOptions = [{
			value: 'eins',
			label: 'Eins'
		}];
		const selectedYAxisOption = 'eins';
		const legendItems = [{
			label: 'n/a',
			bgColor: '#FFFFFF',
			color: '#000000'
		}];
		return (
			<div>
				{this._renderSelectFields(viewOptions, selectedViewOption, xAxisOptions, selectedXAxisOption, yAxisOptions, selectedYAxisOption)}
				<div className='inline' style={{
					paddingLeft: '2em',
					paddingTop: '0.5em'
				}}>
					<Legend items={legendItems} width='150px' />
					<Matrix />
				</div>
			</div>
		);
	}

	_renderSelectFields(viewOptions, selectedViewOption, xAxisOptions, selectedXAxisOption, yAxisOptions, selectedYAxisOption) {
		return (
			<div className='inline' style={{
				width: '200px'
			}}>
				<SelectField id='view' label='View'
					options={viewOptions}
					value={selectedViewOption}
					onChange={this._handleViewSelect}
				/>
				<SelectField id='x-axis' label='X-Axis'
					options={xAxisOptions}
					value={selectedXAxisOption}
					onChange={this._handleXAxisSelect}
				/>
				<SelectField id='y-axis' label='Y-Axis'
					options={yAxisOptions}
					value={selectedYAxisOption}
					onChange={this._handleYAxisSelect}
				/>
			</div>
		);
	}
}

export default Report;
