import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Utilities from './common/Utilities';
import SelectField from './SelectField';
import Legend from './Legend';
import Matrix from './Matrix';
import MissingDataAlert from './MissingDataAlert';
import ModalDialog from './ModalDialog';

// TODO save feature

const LOADING_INIT = 0;
const LOADING_NEW_DATA = 1;
const LOADING_SUCCESSFUL = 2;
const LOADING_ERROR = 3;

const SELECT_FIELD_STYLE = {
	width: '250px',
	display: 'inline-block',
	verticalAlign: 'top',
	marginRight: '1em'
};

class Report extends Component {

	constructor(props) {
		super(props);
		this.index = new DataIndex();
		this._initReport = this._initReport.bind(this);
		this._createConfig = this._createConfig.bind(this);
		this._handleError = this._handleError.bind(this);
		this._getAndHandleAdditionalData = this._getAndHandleAdditionalData.bind(this);
		this._createAllViewsQuery = this._createAllViewsQuery.bind(this);
		this._getAndHandleViewData = this._getAndHandleViewData.bind(this);
		this._computeData = this._computeData.bind(this);
		this._getValue = this._getValue.bind(this);
		this._getViewModel = this._getViewModel.bind(this);
		this._getDataValues = this._getDataValues.bind(this);
		this._handleViewSelect = this._handleViewSelect.bind(this);
		this._handleXAxisSelect = this._handleXAxisSelect.bind(this);
		this._handleYAxisSelect = this._handleYAxisSelect.bind(this);
		this._handleDismissAlertButton = this._handleDismissAlertButton.bind(this);
		this._handleConfig = this._handleConfig.bind(this);
		this._handleFactsheetTypeSelect = this._handleFactsheetTypeSelect.bind(this);
		this._getSelectedViewOption = this._getSelectedViewOption.bind(this);
		this._getSelectedXAxisOption = this._getSelectedXAxisOption.bind(this);
		this._getSelectedYAxisOption = this._getSelectedYAxisOption.bind(this);
		this._renderLoading = this._renderLoading.bind(this);
		this._renderError = this._renderError.bind(this);
		this._renderSuccessful = this._renderSuccessful.bind(this);
		this._renderConfigContent = this._renderConfigContent.bind(this);
		this._renderSelectFields = this._renderSelectFields.bind(this);
		this._resetState = this._resetState.bind(this);
		this.state = {
			loadingState: LOADING_INIT,
			legendData: [],
			matrixData: [],
			matrixDataAvailable: false,
			missingData: [],
			showMissingDataWarning: true,
			showConfigure: false,
			configStore: {}
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
		// first one should be Application, fallback: use first entry
		// TODO was wenn es leer ist oder es nicht genügens ViewOptions gibt?
		this.selectedFactsheetType = this.factsheetModels.find((e) => {
			return e === 'Application';
		});
		if (!this.selectedFactsheetType) {
			this.selectedFactsheetType = this.factsheetModels[0];
		}
		// get all tags, then the data from facet config
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			this.index.put(tagGroups);
			// get the views
			lx.executeGraphQL(this._createAllViewsQuery()).then((allViewData) => {
				// extract viewInfos
				this.viewOptions = {};
				// TODO viewModel könnte factsheets enthalten, die keine oder zu wenige Einträge hat
				for (let key in allViewData) {
					const fieldModels = Utilities.getFrom(setup, 'settings.dataModel.factSheets.' + key + '.fields');
					this.viewOptions[key] = allViewData[key].viewInfos.filter((e) => {
						switch (e.type) {
							case 'FIELD':
								return true;
							case 'TAG':
								// only single selectable tag groups are allowed
								const tagGroup = this.index.tagGroups.byID[e.key.slice(5)];
								return tagGroup && tagGroup.mode === 'SINGLE';
							default:
								return false;
						}
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
		return {
			allowEditing: false,
			facets: [{
				key: this.selectedFactsheetType,
				label: lx.translateFactSheetType(this.selectedFactsheetType, 'plural'),
				fixedFactSheetType: this.selectedFactsheetType,
				attributes: ['id', 'displayName'],
				sorting: [{
						key: 'displayName',
						mode: 'BY_FIELD',
						order: 'asc'
					}
				],
				callback: (facetData) => {
					if (this.state.loadingState === LOADING_SUCCESSFUL) {
						this.setState({
							loadingState: LOADING_NEW_DATA
						});
					}
					this.lastFacetData = facetData;
					this._getAndHandleAdditionalData();
				}
			}],
			menuActions: {
				showConfigure: true,
				configureCallback: () => {
					if (this.state.loadingState !== LOADING_SUCCESSFUL) {
						return;
					}
					this.setState({
						showConfigure: true,
						configStore: {
							factsheetType: this.selectedFactsheetType
						}
					});
				}
			},
			export: {
				autoScale: true,
				exportElementSelector: '#content',
				format: 'a1',
				inputType: 'HTML',
				orientation: 'landscape'
			}
		};
	}

	_handleError(err) {
		console.error(err);
		this.setState({
			loadingState: LOADING_ERROR
		});
	}

	_getAndHandleAdditionalData() {
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
			this._getAndHandleViewData(this._computeData);
		}).catch(this._handleError);
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
		let attributeDef = 'id ' + attributes.filter((e, i) => {
			// avoid duplicates
			return attributes.indexOf(e, i + 1) < 0;
		}).join(' ');
		if (factsheetType) {
			attributeDef = `...on ${factsheetType} { ${attributeDef} }`;
		}
		// TODO deactivated idFilter b/c of a server-side limitation of 1024 entries
		const idFilter = factsheetType ? `(filter: {facetFilters: [{facetKey: "FactSheetTypes", keys: ["${factsheetType}"]}]})` : ''; // `(filter: { ids: [${ids}] })`;
		return `{additionalData: allFactSheets${idFilter} {
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

	_computeData() {
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
		if (yAxisOption.type === 'TAG') {
			yAxisValues.forEach((e) => {
				// extend the row with empty arrays for later use
				matrixData.push([e].concat(xAxisValues.map(() => {
					// all other rows contain the values from the y axis option as their first value
					return [];
				})));
			});
		} else {
			yAxisValues.forEach((e) => {
				// extend the row with empty arrays for later use
				matrixData.push([lx.translateFieldValue(factsheetType, yAxisOption.value, e)].concat(xAxisValues.map(() => {
					// all other rows contain the values from the y axis option as their first value
					return [];
				})));
			});
		}
		// now add the data
		let matrixDataAvailable = false;
		const missingData = [];
		facetData.forEach((e) => {
			const id = e.id;
			const additionalData = index.additionalData.byID[id];
			// get the data values
			const xValue = this._getValue(xAxisOption, additionalData);
			const yValue = this._getValue(yAxisOption, additionalData);
			if (!xValue || !yValue) {
				missingData.push({
					id: e.id,
					name: e.displayName,
					reason: 'TODO #1'
				});
				return;
			}
			// determine the coordinates (+1 for both since 0 positions are reserved)
			let x = xAxisValues.indexOf(xValue) + 1;
			let y = yAxisValues.indexOf(yValue) + 1;
			if (x < 1 || y < 1) {
				missingData.push({
					id: e.id,
					name: e.displayName,
					reason: 'TODO #2'
				});
				return;
			}
			// determine view model for the label
			const itemViewModel = this._getViewModel(viewOption, additionalData);
			if (!itemViewModel || !itemViewModel.inLegend) {
				missingData.push({
					id: e.id,
					name: e.displayName,
					reason: 'TODO #3'
				});
				return;
			}
			matrixDataAvailable = true;
			matrixData[y][x].push({
				id: id,
				name: e.displayName,
				viewModel: itemViewModel
			});
		});
		lx.hideSpinner();
		this.setState({
			legendData: legendData,
			matrixData: matrixData,
			matrixDataAvailable: matrixDataAvailable,
			missingData: missingData,
			loadingState: LOADING_SUCCESSFUL
		});
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

	_getValue(option, additionalData) {
		const index = this.index;
		switch (option.type) {
			case 'LIFECYCLE':
				const lifecycleData = additionalData[option.value];
				if (!lifecycleData) {
					return;
				}
				return lifecycleData.asString;
			case 'SINGLE_SELECT':
				const dataValue = additionalData[option.value];
				if (!dataValue) {
					return;
				}
				return dataValue;
			case 'TAG':
				const tags = index.getTagsFromGroup(additionalData, option.originalLabel);
				if (tags.length === 0) {
					return;
				}
				return tags[0].name;
			default:
				console.warn('_getValue: Unknown type in "' + option.type + '" of data field "' + option.value + '"!');
				return;
		}
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
				const tags = index.getTagsFromGroup(additionalData, viewOption.originalLabel);
				if (tags.length === 0) {
					return viewModel['__missing__'];
				}
				return viewModel[tags[0].name];
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
		this._resetState();
		this._getAndHandleAdditionalData();
	}

	_resetState() {
		// do not reset all states!
		this.setState({
			loadingState: LOADING_NEW_DATA,
			legendData: [],
			matrixData: [],
			matrixDataAvailable: false,
			missingData: []
		});
	}

	_handleXAxisSelect(val) {
		const factsheetType = this.selectedFactsheetType;
		const xAxisOption = this._getSelectedXAxisOption(factsheetType);
		if (xAxisOption.value === val.value) {
			return;
		}
		this.selectedXAxis = val;
		this._resetState();
		this._getAndHandleAdditionalData();
	}

	_handleYAxisSelect(val) {
		const factsheetType = this.selectedFactsheetType;
		const yAxisOption = this._getSelectedYAxisOption(factsheetType);
		if (yAxisOption.value === val.value) {
			return;
		}
		this.selectedYAxis = val;
		this._resetState();
		this._getAndHandleAdditionalData();
	}

	_handleDismissAlertButton() {
		this.setState({
			showMissingDataWarning: false
		});
	}

	_handleConfig(forClose) {
		if (forClose) {
			// close or cancel
			return () => {
				this.setState({
					showConfigure: false,
					configStore: {}
				});
			};
		} else {
			// OK
			return () => {
				const old = this.selectedFactsheetType;
				this.selectedFactsheetType = this.state.configStore.factsheetType;
				this.setState({
					showConfigure: false,
					configStore: {}
				});
				if (old === this.selectedFactsheetType) {
					return;
				}
				// update report config, this will trigger the facet callback automatically
				lx.updateConfiguration(this._createConfig());
			};
		}
	}

	_handleFactsheetTypeSelect(val) {
		const factsheetType = this.selectedFactsheetType;
		if (this.state.configStore.factsheetType === val.value) {
			return;
		}
		this.setState({
			configStore: {
				factsheetType: val.value
			}
		});
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
				return this._renderInit();
			case LOADING_NEW_DATA:
				return this._renderLoading();
			case LOADING_SUCCESSFUL:
				return this._renderSuccessful();
			case LOADING_ERROR:
				return this._renderError();
			default:
				throw new Error('Unknown loading state: ' + this.state.loadingState);
		}
	}

	_renderInit() {
		return (
			<div>
				{this._renderSelectFields()}
				<h4 className='text-center' style={{ width: '100%' }}>Initialise report...</h4>
				<div id='content' />
			</div>
		);
	}

	_renderLoading() {
		return (
			<div>
				{this._renderSelectFields()}
				<h4 className='text-center' style={{ width: '100%' }}>Loading data...</h4>
				<div id='content' />
			</div>
		);
	}

	_renderError() {
		return (<div id='content' />);
	}

	_renderSuccessful() {
		const factsheetType = this.selectedFactsheetType;
		return (
			<div>
				<ModalDialog show={this.state.showConfigure}
					width='500px'
					title='Configure'
					content={this._renderConfigContent}
					onClose={this._handleConfig(true)}
					onOK={this._handleConfig(false)}
				/>
				{this._renderSelectFields()}
				<MissingDataAlert
					show={this.state.showMissingDataWarning}
					missingData={this.state.missingData}
					onClose={this._handleDismissAlertButton}
					factsheetType={factsheetType}
					setup={this.setup} />
				<div id='content'>
					<Legend items={this.state.legendData} itemWidth='150px' />
					<Matrix setup={this.setup} cellWidth='180px'
						factsheetType={factsheetType}
						data={this.state.matrixData}
						dataAvailable={this.state.matrixDataAvailable}
					/>
				</div>
			</div>
		);
	}

	_renderConfigContent() {
		const options = this.factsheetModels.map((e) => {
			return {
				value: e,
				label: lx.translateFactSheetType(e, 'plural')
			};
		});
		return (
			<SelectField id='factsheetType' label='Type'
				options={options}
				useSmallerFontSize
				value={this.state.configStore.factsheetType}
				onChange={this._handleFactsheetTypeSelect} />
		);
	}

	_renderSelectFields() {
		const factsheetType = this.selectedFactsheetType;
		let viewOptions = [];
		let xAxisOptions = [];
		let yAxisOptions = [];
		let selectedViewOption = undefined;
		let selectedXAxisOption = undefined;
		let selectedYAxisOption = undefined;
		if (factsheetType) {
			viewOptions = this.viewOptions[factsheetType];
			selectedViewOption = this._getSelectedViewOption(factsheetType).value;
			selectedXAxisOption = this._getSelectedXAxisOption(factsheetType).value;
			selectedYAxisOption = this._getSelectedYAxisOption(factsheetType).value;
			xAxisOptions = Utilities.copyArray(viewOptions).filter((e) => {
				// remove selected options from y axis options
				return e.value !== selectedYAxisOption;
			});
			yAxisOptions = Utilities.copyArray(viewOptions).filter((e) => {
				// remove selected options from x axis options
				return e.value !== selectedXAxisOption;
			});
		}
		return (
			<div>
				<span style={SELECT_FIELD_STYLE}>
					<SelectField id='view' label='View' options={viewOptions} useSmallerFontSize
						value={selectedViewOption} onChange={viewOptions.length === 0 ? undefined : this._handleViewSelect} />
				</span>
				<span style={SELECT_FIELD_STYLE}>
					<SelectField id='x-axis' label='X-Axis' options={xAxisOptions} useSmallerFontSize
						value={selectedXAxisOption} onChange={xAxisOptions.length === 0 ? undefined : this._handleXAxisSelect} />
				</span>
				<span style={SELECT_FIELD_STYLE}>
					<SelectField id='y-axis' label='Y-Axis' options={yAxisOptions} useSmallerFontSize
						value={selectedYAxisOption} onChange={yAxisOptions.length === 0 ? undefined : this._handleYAxisSelect} />
				</span>
			</div>
		);
	}
}

export default Report;
