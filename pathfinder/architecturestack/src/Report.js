import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Utilities from './common/Utilities';
import Link from './common/Link';
import SelectField from './SelectField';
import Legend from './Legend';
import Matrix from './Matrix';

const LOADING_INIT = 0;
const LOADING_SUCCESSFUL = 1;
const LOADING_ERROR = 2;

class Report extends Component {

	constructor(props) {
		super(props);
		this.index = new DataIndex();
		this._initReport = this._initReport.bind(this);
		this._createConfig = this._createConfig.bind(this);
		this._handleError = this._handleError.bind(this);
		this._handleFacetData = this._handleFacetData.bind(this);
		this._createAllViewsQuery = this._createAllViewsQuery.bind(this);
		this._getAndHandleViewData = this._getAndHandleViewData.bind(this);
		this._handleData = this._handleData.bind(this);
		this._getViewModel = this._getViewModel.bind(this);
		this._getDataValues = this._getDataValues.bind(this);
		this._handleViewSelect = this._handleViewSelect.bind(this);
		this._handleXAxisSelect = this._handleXAxisSelect.bind(this);
		this._handleYAxisSelect = this._handleYAxisSelect.bind(this);
		this._getSelectedViewOption = this._getSelectedViewOption.bind(this);
		this._getSelectedXAxisOption = this._getSelectedXAxisOption.bind(this);
		this._getSelectedYAxisOption = this._getSelectedYAxisOption.bind(this);
		this._renderLoading = this._renderLoading.bind(this);
		this._renderError = this._renderError.bind(this);
		this._renderSuccessful = this._renderSuccessful.bind(this);
		this._renderSelectFields = this._renderSelectFields.bind(this);
		this.state = {
			loadingState: LOADING_INIT,
			legendData: [],
			matrixData: []
		};
	}

	componentDidMount() {
		lx.init().then(this._initReport).catch(this._handleError);
	}

	_initReport(setup) {
		this.setup = setup;
		lx.showSpinner('Loading data...');
		// get all factsheet defs from dataModel
		this.factsheetModels = Object.keys(Utilities.getFrom(setup, 'settings.dataModel.factSheets'));
		this.factsheetModels.sort();
		// get all tags, then the data from facet config
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			this.index.put(tagGroups);
			// get the views
			lx.executeGraphQL(this._createAllViewsQuery()).then((allViewData) => {
				// extract viewInfos
				this.viewOptions = {};
				for (let key in allViewData) {
					const fieldModels = Utilities.getFrom(setup, 'settings.dataModel.factSheets.' + key + '.fields');
					this.viewOptions[key] = allViewData[key].viewInfos.filter((e) => {
						return e.type === 'FIELD' || e.type === 'TAG';
					}).map((e) => {
						if (e.type === 'TAG') {
							return {
								type: e.type,
								key: e.key,
								value: e.key.slice(5),
								label: 'Tag group: ' + e.label,
								originalLabel: e.label
							};
						}
						return {
							type: fieldModels[e.key].type,
							key: e.key,
							value: e.key,
							label: lx.translateField(key, e.key),
							originalLabel: e.label
						};
					});
				}
				lx.hideSpinner();
				lx.ready(this._createConfig());
			}).catch(this._handleError);
		}).catch(this._handleError);
	}

	_createConfig() {
		// create facet configs
		const facets = [];
		this.factsheetModels.forEach((e) => {
			// just applications at the moment for performance reasons
			// TODO B/C EVERY FACET CONFIG WILL TRIGGER AN I/O OPERATION IMMEDIATELY FFS!
			if (e !== 'Application') {
				return;
			}
			facets.push({
				key: e,
				label: lx.translateFactSheetType(e, 'plural'),
				fixedFactSheetType: e,
				attributes: ['id', 'displayName'],
				sorting: [{
						key: 'displayName',
						mode: 'BY_FIELD',
						order: 'asc'
					}
				],
				callback: (facetData) => {
					this.lastFacetData = facetData;
					this.selectedFactsheetType = e;
					this._handleFacetData();
				}
			});
		});
		return {
			allowEditing: false,
			facets: facets
		};
	}

	_handleError(err) {
		console.error(err);
		this.setState({
			loadingState: LOADING_ERROR
		});
	}

	_handleFacetData() {
		// remove previous data
		this.index.remove('additionalData');
		const factsheetType = this.selectedFactsheetType;
		// get current selected values from SelectFields
		const viewOption = this._getSelectedViewOption(factsheetType);
		const xAxisOption = this._getSelectedXAxisOption(factsheetType);
		const yAxisOption = this._getSelectedYAxisOption(factsheetType);
		// get remaining data based on selected combobox values
		lx.showSpinner('Loading data...');
		const ids = this.lastFacetData.map((e) => {
			return '"' + e.id + '"';
		}).join(',');
		const attributes = [];
		attributes.push(this._getQueryAttribute(viewOption.value, viewOption.type));
		attributes.push(this._getQueryAttribute(xAxisOption.value, xAxisOption.type));
		attributes.push(this._getQueryAttribute(yAxisOption.value, yAxisOption.type));
		lx.executeGraphQL(this._createAdditionalDataQuery(ids, factsheetType, attributes)).then((additionalData) => {
			this.index.put(additionalData);
			this._getAndHandleViewData(this._handleData);
		}).catch(this._handleError);
	}

	_getQueryAttribute(fieldName, type) {
		switch (type) {
			case 'LIFECYCLE':
				return fieldName + ' { asString }';
			case 'TAG':
				return 'tags { name }';
			case 'SINGLE_SELECT':
				return fieldName;
			default:
				console.warn('_getQueryAttribute: Unknown type "' + type + '" of data field "' + fieldName + '"!');
				return fieldName;
		}
	}

	_createAllViewsQuery() {
		const query = this.factsheetModels.map((e) => {
			return `${e}:view(
						filter: {facetFilters: [{facetKey: "FactSheetTypes", keys: ["${e}"]}]}
					) {
						viewInfos { key label type }
					}`;
		}).join('\n');
		return `{${query}}`;
	}

	_createViewQuery(factsheetType, viewKey) {
		return `{view(
					key: "${viewKey}",
					filter: {facetFilters: [{facetKey: "FactSheetTypes", keys: ["${factsheetType}"]}]}
				) {
					legendItems { id value bgColor color transparency inLegend }
				}}`;
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

	_getAndHandleViewData(then) {
		const factsheetType = this.selectedFactsheetType;
		const viewOption = this._getSelectedViewOption(factsheetType);
		if (this.viewModel && this.viewModel._key === viewOption.value) {
			// no need to query the same data again
			then();
			return;
		}
		lx.executeGraphQL(this._createViewQuery(factsheetType, viewOption.key)).then((viewData) => {
			const legendItems = Utilities.getFrom(viewData, 'view.legendItems');
			this.viewModel = legendItems.reduce((acc, e) => {
				acc[e.value] = e;
				return acc;
			}, {});
			this.viewModel._rawLegendItems = legendItems;
			this.viewModel._key = viewOption.value;
			then();
		}).catch(this._handleError);
	}

	_handleData() {
		console.log(this.index);
		console.log(this.lastFacetData);
		console.log(this.selectedFactsheetType);
		console.log(this._getSelectedViewOption(this.selectedFactsheetType));
		console.log(this._getSelectedXAxisOption(this.selectedFactsheetType));
		console.log(this._getSelectedYAxisOption(this.selectedFactsheetType));
		console.log(this.viewModel);
		const setup = this.setup;
		const index = this.index;
		const facetData = this.lastFacetData;
		const factsheetType = this.selectedFactsheetType;
		const viewOption = this._getSelectedViewOption(factsheetType);
		const viewModel = this.viewModel;
		const xAxisOption = this._getSelectedXAxisOption(factsheetType);
		const yAxisOption = this._getSelectedYAxisOption(factsheetType);
		// create legend data
		const legendData = [];
		viewModel._rawLegendItems.forEach((e) => {
			if (!e.inLegend) {
				return;
			}
			legendData.push({
				label: () => {
					// TODO remove hack
					// see https://github.com/leanix/leanix-reporting/issues/7
					if (e.value === '__missing__') {
						return 'n/a';
					}
					return lx.translateFieldValue(factsheetType, viewOption.value, e.value);
				},
				bgColor: e.bgColor,
				color: e.color
			});
		});
		// create matrixData
		const xAxisValues = this._getDataValues(xAxisOption);
		const yAxisValues = this._getDataValues(yAxisOption);
		const matrixData = []; // position (0,0) will always be empty
		// the first row contains the values from the x axis option
		if (xAxisOption.type === 'TAG') {
			matrixData.push([undefined].concat(xAxisValues.map((e) => {
				return e;
			})));
		} else {
			matrixData.push([undefined].concat(xAxisValues.map((e) => {
				return lx.translateFieldValue(factsheetType, xAxisOption.value, e);
			})));
		}
		// all other rows contain the values from the y axis option as their first value
		if (yAxisOption.type === 'TAG') {
			yAxisValues.forEach((e) => {
				matrixData.push([e]);
			});
		} else {
			yAxisValues.forEach((e) => {
				matrixData.push([lx.translateFieldValue(factsheetType, yAxisOption.value, e)]);
			});
		}
		// now add the data
		facetData.forEach((e) => {
			const id = e.id;
			const additionalData = index.additionalData.byID[id];
			// get the data values
			const xValue = additionalData[xAxisOption.value]; // TODO andere data typen unterstützen!
			const yValue = additionalData[yAxisOption.value];
			if (!xValue || !yValue) {
				return;
			}
			// determine the coordinates (+1 for both since 0 positions are reserved)
			let x = xAxisValues.indexOf(xValue) + 1;
			let y = yAxisValues.indexOf(yValue) + 1;
			if (x < 1 || y < 1) {
				return;
			}
			// determine view model for the label
			const itemViewModel = this._getViewModel(viewOption, additionalData);
			if (!itemViewModel || !itemViewModel.inLegend) {
				return;
			}
			let cellValues = matrixData[y][x];
			if (!cellValues) {
				cellValues = [];
				matrixData[y][x] = cellValues;
			}
			cellValues.push({
				id: id,
				name: e.displayName,
				viewModel: itemViewModel
			});
		});
		console.log(matrixData);
		lx.hideSpinner();
		this.setState({
			legendData: legendData,
			matrixData: matrixData,
			loadingState: LOADING_SUCCESSFUL
		});
	}

	_getViewModel(viewOption, additionalData) {
		const index = this.index;
		const viewModel = this.viewModel;
		switch (viewOption.type) {
			case 'LIFECYCLE':
				const lifecycleData = additionalData[viewOption.value];
				if (!lifecycleData) {
					return viewModel['__missing__'];
				}
				return viewModel[lifecycleData.asString];
			case 'SINGLE_SELECT':
				const dataValue = additionalData[viewOption.value];
				if (!dataValue) {
					return viewModel['__missing__'];
				}
				return viewModel[dataValue];
			case 'TAG':
				// TODO what if the tag group isn't a single select type?
				const tags = index.getTagsFromGroup(additionalData, viewOption.originalLabel);
				if (tags.length === 0) {
					return viewModel['__missing__'];
				}
				return viewModel[tags[0]];
			default:
				console.warn('_getViewModel: Unknown type in "' + viewOption.type + '" of data field "' + viewOption.value + '"!');
				return viewModel['__missing__'];
		}
	}

	_getDataValues(option) {
		const factsheetType = this.selectedFactsheetType;
		const index = this.index;
		const setup = this.setup;
		switch (option.type) {
			case 'LIFECYCLE':
			case 'SINGLE_SELECT':
				return Utilities.getFrom(setup, 'settings.dataModel.factSheets.'
					+ factsheetType + '.fields.' + option.value + '.values');
			case 'TAG':
				const tagGroup = index.tagGroups.byID[option.value];
				if (!tagGroup) {
					return [];
				}
				const tags = tagGroup.tags;
				if (!tags) {
					return [];
				}
				return tags.nodes.map((e) => {
					return e.name;
				});
			default:
				console.warn('_getDataValues: Unknown type in "' + option.type + '" of data field "' + option.value + '"!');
				return Utilities.getFrom(setup, 'settings.dataModel.factSheets.'
					+ factsheetType + '.fields.' + option.value + '.values');
		}
	}

	_handleViewSelect(val) {
		const factsheetType = this.selectedFactsheetType;
		const viewOption = this._getSelectedViewOption(factsheetType);
		if (viewOption.value === val.value) {
			return;
		}
		this.selectedView = val;
		this._handleFacetData();
	}

	_handleXAxisSelect(val) {
		const factsheetType = this.selectedFactsheetType;
		const xAxisOption = this._getSelectedXAxisOption(factsheetType);
		if (xAxisOption.value === val.value) {
			return;
		}
		this.selectedXAxis = val;
		this._handleFacetData();
	}

	_handleYAxisSelect(val) {
		const factsheetType = this.selectedFactsheetType;
		const yAxisOption = this._getSelectedYAxisOption(factsheetType);
		if (yAxisOption.value === val.value) {
			return;
		}
		this.selectedYAxis = val;
		this._handleFacetData();
	}

	_getSelectedViewOption(factsheetType) {
		if (!this.selectedView) {
			return this.viewOptions[factsheetType][0];
		}
		return this.selectedView;
	}

	_getSelectedXAxisOption(factsheetType) {
		if (!this.selectedXAxis) {
			return this.viewOptions[factsheetType][1];
		}
		return this.selectedXAxis;
	}

	_getSelectedYAxisOption(factsheetType) {
		if (!this.selectedYAxis) {
			return this.viewOptions[factsheetType][2];
		}
		return this.selectedYAxis;
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
				{this._renderSelectFields()}
			</div>
		);
	}

	_renderError() {
		return null;
	}

	_renderSuccessful() {
		const factsheetType = this.selectedFactsheetType;
		const viewOptions = !factsheetType ? [] : this.viewOptions[factsheetType];
		const selectedViewOption = !factsheetType ? undefined : this._getSelectedViewOption(factsheetType).value;
		const selectedXAxisOption = !factsheetType ? undefined : this._getSelectedXAxisOption(factsheetType).value;
		const selectedYAxisOption = !factsheetType ? undefined : this._getSelectedYAxisOption(factsheetType).value;
		const xAxisOptions = !factsheetType ? [] : Utilities.copyArray(viewOptions).filter((e) => {
			// remove selected options from y axis options
			return e.value !== selectedYAxisOption;
		});
		const yAxisOptions = !factsheetType ? [] : Utilities.copyArray(viewOptions).filter((e) => {
			// remove selected options from x axis options
			return e.value !== selectedXAxisOption;
		});
		return (
			<div>
				{this._renderSelectFields(viewOptions, xAxisOptions, yAxisOptions, selectedViewOption, selectedXAxisOption, selectedYAxisOption)}
				<div className='inline' style={{ paddingLeft: '2em', paddingTop: '0.5em' }}>
					<Legend items={this.state.legendData} width='150px' />
					<Matrix />
				</div>
			</div>
		);
	}

	_renderSelectFields(viewOptions, xAxisOptions, yAxisOptions, selectedViewOption, selectedXAxisOption, selectedYAxisOption) {
		if (!viewOptions) {
			viewOptions = [];
		}
		if (!xAxisOptions) {
			xAxisOptions = [];
		}
		if (!yAxisOptions) {
			yAxisOptions = [];
		}
		return (
			<div className='inline' style={{ width: '250px' }}>
				<SelectField id='view' label='View' options={viewOptions}
					value={selectedViewOption} onChange={viewOptions.length === 0 ? undefined : this._handleViewSelect} />
				<SelectField id='x-axis' label='X-Axis' options={xAxisOptions}
					value={selectedXAxisOption} onChange={xAxisOptions.length === 0 ? undefined : this._handleXAxisSelect} />
				<SelectField id='y-axis' label='Y-Axis' options={yAxisOptions}
					value={selectedYAxisOption} onChange={yAxisOptions.length === 0 ? undefined : this._handleYAxisSelect} />
			</div>
		);
	}
}

export default Report;
