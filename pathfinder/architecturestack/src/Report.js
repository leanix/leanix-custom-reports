import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Utilities from './common/Utilities';
import SelectField from './SelectField';
import Checkbox from './Checkbox';
import Legend from './Legend';
import Matrix from './Matrix';
import MissingDataAlert from './MissingDataAlert';
import ModalDialog from './ModalDialog';

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

const SWAP_BUTTON_STYLE = {
	display: 'inline-block',
	verticalAlign: 'top',
	marginTop: '1.5em',
	marginRight: '1em'
};

class Report extends Component {

	constructor(props) {
		super(props);
		this.index = new DataIndex();
		this._initReport = this._initReport.bind(this);
		this._createConfig = this._createConfig.bind(this);
		this._resetState = this._resetState.bind(this);
		this._handleRestoreError = this._handleRestoreError.bind(this);
		this._restoreStateFromFramework = this._restoreStateFromFramework.bind(this);
		this._publishStateToFramework = this._publishStateToFramework.bind(this);
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
		this._handleShowMissingDataWarningCheck = this._handleShowMissingDataWarningCheck.bind(this);
		this._handleShowEmptyRowsCheck = this._handleShowEmptyRowsCheck.bind(this);
		this._handleShowEmptyColumnsCheck = this._handleShowEmptyColumnsCheck.bind(this);
		this._handleSwapAxes = this._handleSwapAxes.bind(this);
		this._getSelectedViewOption = this._getSelectedViewOption.bind(this);
		this._getSelectedXAxisOption = this._getSelectedXAxisOption.bind(this);
		this._getSelectedYAxisOption = this._getSelectedYAxisOption.bind(this);
		this._renderLoading = this._renderLoading.bind(this);
		this._renderError = this._renderError.bind(this);
		this._renderSuccessful = this._renderSuccessful.bind(this);
		this._renderConfigContent = this._renderConfigContent.bind(this);
		this._renderSelectFields = this._renderSelectFields.bind(this);
		this._resetUIState = this._resetUIState.bind(this);
		this.state = {
			loadingState: LOADING_INIT,
			legendData: [],
			matrixData: [],
			matrixDataAvailable: false,
			missingData: [],
			showMissingDataWarning: true,
			showEmptyRows: false,
			showEmptyColumns: false,
			showConfigure: false
		};
		this.reportState = {
			configStore: {},
			factsheetModels: [],
			selectedFactsheetType: null,
			selectedView: null,
			selectedXAxis: null,
			selectedYAxis: null,
			viewOptions: {},
			lastFacetData: [],
			viewModel: {}
		};
	}

	componentDidMount() {
		lx.init().then(this._initReport).catch(this._handleError);
	}

	_initReport(setup) {
		this.setup = setup;
		lx.showSpinner('Loading data...');
		// get all factsheet defs from dataModel
		this.reportState.factsheetModels = Object.keys(Utilities.getFrom(setup, 'settings.dataModel.factSheets'));
		this.reportState.factsheetModels.sort();
		// get all tags, then the data from facet config
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			this.index.put(tagGroups);
			// get the views
			lx.executeGraphQL(this._createAllViewsQuery()).then((allViewData) => {
				// extract viewInfos
				for (let key in allViewData) {
					const fieldModels = Utilities.getFrom(setup, 'settings.dataModel.factSheets.' + key + '.fields');
					this.reportState.viewOptions[key] = allViewData[key].viewInfos.filter((e) => {
						switch (e.type) {
							case 'FIELD':
								// check if field type can be handled
								return this._checkFieldType(fieldModels[e.key].type);
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
				// filter out all that have less than 2 elements
				Object.keys(this.reportState.viewOptions).forEach((e) => {
					if (this.reportState.viewOptions[e].length < 2) {
						delete this.reportState.viewOptions[e];
					}
				});
				// re-assign updated factsheetModels
				this.reportState.factsheetModels = Object.keys(this.reportState.viewOptions);
				// load default state
				this._resetState();
				// then may restore saved state
				if (this.setup.savedState && this.setup.savedState.customState) {
					const result = this._restoreStateFromFramework(this.setup.savedState.customState);
					if (result) {
						this._handleRestoreError(result);
						lx.hideSpinner();
						return;
					}
				}
				if (!this.reportState.selectedFactsheetType) {
					// error, since there is no factsheet type with enough data
					this._handleError('There is no factsheet type with enough data.');
				lx.hideSpinner();
					return;
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
				key: this.reportState.selectedFactsheetType,
				label: lx.translateFactSheetType(this.reportState.selectedFactsheetType, 'plural'),
				fixedFactSheetType: this.reportState.selectedFactsheetType,
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
					this.reportState.lastFacetData = facetData;
					this._getAndHandleAdditionalData();
				}
			}],
			menuActions: {
				showConfigure: true,
				configureCallback: () => {
					if (this.state.loadingState !== LOADING_SUCCESSFUL) {
						return;
					}
					this.reportState.configStore = {
						factsheetType: this.reportState.selectedFactsheetType,
						showMissingDataWarning: this.state.showMissingDataWarning,
						showEmptyRows: this.state.showEmptyRows,
						showEmptyColumns: this.state.showEmptyColumns
					};
					this.setState({
						showConfigure: true
					});
				}
			},
			export: {
				autoScale: true,
				exportElementSelector: '#content',
				format: 'a1',
				inputType: 'HTML',
				orientation: 'landscape'
			},
			restoreStateCallback: (state) => {
				console.log('Callback:');
				console.log(state);
				const result = this._restoreStateFromFramework(state);
				if (result) {
					this._handleRestoreError(result);
					return;
				}
				// get new data and re-render
				this._getAndHandleAdditionalData();
			}
		};
	}

	_handleRestoreError(result) {
		switch (result.loadingState) {
			case LOADING_ERROR:
				this._handleError(result.msg);
				return;
			default:
				console.error('Unknown loading state after an unsuccessful restore op: '
					+ result.loadingState);
				this._handleError(result.msg);
				return;
		}
	}

	_resetState() {
		// first one should be Application, fallback: use first entry
		this.reportState.selectedFactsheetType = this.reportState.factsheetModels.find((e) => {
			return e === 'Application';
		});
		if (!this.reportState.selectedFactsheetType) {
			this.reportState.selectedFactsheetType = this.reportState.factsheetModels[0];
		}
		this.reportState.selectedView = null;
		this.reportState.selectedXAxis = null;
		this.reportState.selectedYAxis = null;
		this.state.showMissingDataWarning = true;
		this.state.showEmptyRows = false;
		this.state.showEmptyColumns = false;
	}

	_restoreStateFromFramework(newState) {
		// check if the state can be restored
		// if not then provide fallbacks or goto error screen
		this.reportState.selectedFactsheetType = newState.selectedFactsheetType;
		const viewOptions = this.reportState.viewOptions[newState.selectedFactsheetType];
		if (!viewOptions) {
			return {
				loadingState: LOADING_ERROR,
				msg: 'There isn\'t enough data for the factsheet type "' + newState.selectedFactsheetType
					+ '". Please delete this bookmark.'
			};
		}
		this.reportState.selectedView = viewOptions.find((e) => {
			return e.key === newState.selectedView.key;
		});
		if (!this.reportState.selectedView) {
			return {
				loadingState: LOADING_ERROR,
				msg: 'There is no view with the name "' + newState.selectedView.label
					+ '" defined. Please delete this bookmark.'
			};
		}
		this.reportState.selectedXAxis = viewOptions.find((e) => {
			return e.key === newState.selectedXAxis.key;
		});
		if (!this.reportState.selectedXAxis) {
			return {
				loadingState: LOADING_ERROR,
				msg: 'There is no X-Axis with the name "' + newState.selectedXAxis.label
					+ '" defined. Please delete this bookmark.'
			};
		}
		this.reportState.selectedYAxis = viewOptions.find((e) => {
			return e.key === newState.selectedYAxis.key;
		});
		if (!this.reportState.selectedYAxis) {
			return {
				loadingState: LOADING_ERROR,
				msg: 'There is no X-Axis with the name "' + newState.selectedYAxis.label
					+ '" defined. Please delete this bookmark.'
			};
		}
		this.state.showMissingDataWarning = newState.showMissingDataWarning;
		this.state.showEmptyRows = newState.showEmptyRows;
		this.state.showEmptyColumns = newState.showEmptyColumns;
	}

	_publishStateToFramework() {
		const factsheetType = this.reportState.selectedFactsheetType;
		const state = {
			selectedFactsheetType: factsheetType,
			selectedView: this._getSelectedViewOption(factsheetType),
			selectedXAxis: this._getSelectedXAxisOption(factsheetType),
			selectedYAxis: this._getSelectedYAxisOption(factsheetType),
			showMissingDataWarning: this.state.showMissingDataWarning,
			showEmptyRows: this.state.showEmptyRows,
			showEmptyColumns: this.state.showEmptyColumns
		};
		lx.publishState(state);
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
		const factsheetType = this.reportState.selectedFactsheetType;
		// get current selected values from SelectFields
		const viewOption = this._getSelectedViewOption(factsheetType);
		const xAxisOption = this._getSelectedXAxisOption(factsheetType);
		const yAxisOption = this._getSelectedYAxisOption(factsheetType);
		// get remaining data based on selected combobox values
		lx.showSpinner('Loading data...');
		const attributes = [];
		attributes.push(this._getQueryAttribute(viewOption.value, viewOption.type));
		attributes.push(this._getQueryAttribute(xAxisOption.value, xAxisOption.type));
		attributes.push(this._getQueryAttribute(yAxisOption.value, yAxisOption.type));
		lx.executeGraphQL(this._createAdditionalDataQuery(this.reportState.lastFacetData, factsheetType, attributes)).then((additionalData) => {
			this.index.put(additionalData);
			this._getAndHandleViewData();
		}).catch(this._handleError);
	}

	_createAllViewsQuery() {
		const query = this.reportState.factsheetModels.map((e) => {
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
		// create ids string, but pay attention to server-side limitation of 1024 entries
		const idsString = ids.length < 1025 ? ids.map((e) => {
			return '"' + e.id + '"';
		}).join(',') : undefined;
		// use either ids or at least the factsheet type for the filter
		const idFilter = idsString ? `(filter: { ids: [${idsString}] })`
			: (factsheetType ? `(filter: {facetFilters: [{facetKey: "FactSheetTypes", keys: ["${factsheetType}"]}]})` : '');
		let attributeDef = 'id ' + attributes.filter((e, i) => {
			// avoid duplicates
			return attributes.indexOf(e, i + 1) < 0;
		}).join(' ');
		if (factsheetType) {
			attributeDef = `...on ${factsheetType} { ${attributeDef} }`;
		}
		return `{additionalData: allFactSheets${idFilter} {
					edges { node {
						${attributeDef}
					}}
				}}`;
	}

	_getAndHandleViewData() {
		const factsheetType = this.reportState.selectedFactsheetType;
		const viewOption = this._getSelectedViewOption(factsheetType);
		if (this.reportState.viewModel && this.reportState.viewModel._key === viewOption.value) {
			// no need to query the same data again
			this._computeData();
			return;
		}
		lx.executeGraphQL(this._createViewQuery(factsheetType, viewOption.key)).then((viewData) => {
			const legendItems = Utilities.getFrom(viewData, 'view.legendItems');
			this.reportState.viewModel = legendItems.reduce((acc, e) => {
				acc[e.value] = e;
				return acc;
			}, {});
			this.reportState.viewModel._rawLegendItems = legendItems;
			this.reportState.viewModel._key = viewOption.value;
			this._computeData();
		}).catch(this._handleError);
	}

	_computeData() {
		const setup = this.setup;
		const index = this.index;
		const facetData = this.reportState.lastFacetData;
		const factsheetType = this.reportState.selectedFactsheetType;
		const viewOption = this._getSelectedViewOption(factsheetType);
		const viewModel = this.reportState.viewModel;
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
					reason: this._createMissingDataMsgForValues(xValue, yValue, xAxisOption.label, yAxisOption.label)
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
					reason: this._createMissingDataMsgForCoordinates(x, y, xValue, yValue, xAxisOption.label, yAxisOption.label)
				});
				return;
			}
			// determine view model for the label
			const itemViewModel = this._getViewModel(viewOption, additionalData);
			if (!itemViewModel || !itemViewModel.inLegend) {
				missingData.push({
					id: e.id,
					name: e.displayName,
					reason: this._createMissingDataMsgForIVMs(viewOption, itemViewModel ? itemViewModel.inLegend : true)
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
		// everytime save the state, b/c this method is called, when something
		// changes which needs to be published
		this._publishStateToFramework();
	}

	_createMissingDataMsgForValues(xValue, yValue, xAxisName, yAxisName) {
		if (!xValue && !yValue) {
			return 'Values for ' + xAxisName + ' & '
				+ yAxisName + ' are missing.';
		}
		if (!xValue) {
			return 'Value for ' + xAxisName + ' is missing.';
		} else {
			return 'Value for ' + yAxisName + ' is missing.';
		}
	}

	_createMissingDataMsgForCoordinates(x, y, xValue, yValue, xAxisName, yAxisName) {
		if (x < 1 && y < 1) {
			return 'Unknown values for ' + xAxisName + ' (' + xValue + ') & '
				+ yAxisName + ' (' + yValue + ').';
		}
		if (x < 1) {
			return 'Unknown value for ' + xAxisName + ' (' + xValue + ').';
		} else {
			return 'Unknown value for ' + yAxisName + ' (' + yValue + ').';
		}
	}

	_createMissingDataMsgForIVMs(viewOption, inLegend) {
		if (!inLegend) {
			return 'Value for view is marked as hidden.';
		}
		return 'There are no values defined for the selected view (' + viewOption.label + ').';
	}

	_checkFieldType(type) {
		switch (type) {
			case 'LIFECYCLE':
			case 'PROJECT_STATUS':
			case 'TAG':
			case 'SINGLE_SELECT':
				return true;
			default:
				console.error('_checkFieldType: Unknown type "' + type + '", which can not be handled by this report!');
				return false;
		}
	}

	_getQueryAttribute(fieldName, type) {
		switch (type) {
			case 'LIFECYCLE':
			case 'PROJECT_STATUS':
				return fieldName + ' { asString }';
			case 'TAG':
				return 'tags { name }';
			case 'SINGLE_SELECT':
				return fieldName;
			default:
				console.error('_getQueryAttribute: Unknown type "' + type + '" of data field "' + fieldName + '"!');
				return fieldName;
		}
	}

	_getValue(option, additionalData) {
		const index = this.index;
		switch (option.type) {
			case 'LIFECYCLE':
			case 'PROJECT_STATUS':
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
				console.error('_getValue: Unknown type in "' + option.type + '" of data field "' + option.value + '"!');
				return;
		}
	}

	_getViewModel(viewOption, additionalData) {
		const index = this.index;
		const viewModel = this.reportState.viewModel;
		switch (viewOption.type) {
			case 'LIFECYCLE':
			case 'PROJECT_STATUS':
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
				console.error('_getViewModel: Unknown type in "' + viewOption.type + '" of data field "' + viewOption.value + '"!');
				return viewModel['__missing__'];
		}
	}

	_getDataValues(option) {
		const factsheetType = this.reportState.selectedFactsheetType;
		const index = this.index;
		const setup = this.setup;
		switch (option.type) {
			case 'LIFECYCLE':
			case 'PROJECT_STATUS':
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
				console.error('_getDataValues: Unknown type in "' + option.type + '" of data field "' + option.value + '"!');
				return Utilities.getFrom(setup, 'settings.dataModel.factSheets.'
					+ factsheetType + '.fields.' + option.value + '.values');
		}
	}

	_handleViewSelect(val) {
		const factsheetType = this.reportState.selectedFactsheetType;
		const viewOption = this._getSelectedViewOption(factsheetType);
		if (viewOption.value === val.value) {
			return;
		}
		this.reportState.selectedView = val;
		this._resetUIState();
		this._getAndHandleAdditionalData();
	}

	_resetUIState() {
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
		const factsheetType = this.reportState.selectedFactsheetType;
		const xAxisOption = this._getSelectedXAxisOption(factsheetType);
		if (xAxisOption.value === val.value) {
			return;
		}
		this.reportState.selectedXAxis = val;
		this._resetUIState();
		this._getAndHandleAdditionalData();
	}

	_handleYAxisSelect(val) {
		const factsheetType = this.reportState.selectedFactsheetType;
		const yAxisOption = this._getSelectedYAxisOption(factsheetType);
		if (yAxisOption.value === val.value) {
			return;
		}
		this.reportState.selectedYAxis = val;
		this._resetUIState();
		this._getAndHandleAdditionalData();
	}

	_handleDismissAlertButton() {
		// set directly b/c 'setState' works async
		this.state.showMissingDataWarning = false;
		// publish call is special here, b/c this action doesn't trigger '_computeData'
		this._publishStateToFramework();
		// now trigger rendering
		this.setState({
			showMissingDataWarning: false
		});
	}

	_handleConfig(forClose) {
		if (forClose) {
			// close or cancel: do not update values
			return () => {
				this.reportState.configStore = {};
				this.setState({
					showConfigure: false
				});
			};
		} else {
			// OK: update values
			return () => {
				const oldSFT = this.reportState.selectedFactsheetType;
				this.reportState.selectedFactsheetType = this.reportState.configStore.factsheetType;
				// set directly b/c 'setState' works async
				this.state.showMissingDataWarning = this.reportState.configStore.showMissingDataWarning;
				this.state.showEmptyRows = this.reportState.configStore.showEmptyRows;
				this.state.showEmptyColumns = this.reportState.configStore.showEmptyColumns;
				this.setState({
					showConfigure: false
				});
				if (oldSFT === this.reportState.selectedFactsheetType) {
					// publish call is special here, b/c this action doesn't trigger '_computeData'
					this._publishStateToFramework();
					return;
				}
				// reset all select states, b/c factsheet type changed
				this.reportState.selectedView = null;
				this.reportState.selectedXAxis = null;
				this.reportState.selectedYAxis = null;
				// update report config, this will trigger the facet callback automatically
				lx.updateConfiguration(this._createConfig());
			};
		}
	}

	_handleFactsheetTypeSelect(val) {
		if (this.reportState.configStore.factsheetType === val.value) {
			return;
		}
		this.reportState.configStore.factsheetType = val.value;
		this.forceUpdate();
	}

	_handleShowMissingDataWarningCheck(val) {
		if (this.reportState.configStore.showMissingDataWarning === val) {
			return;
		}
		this.reportState.configStore.showMissingDataWarning = val;
		this.forceUpdate();
	}

	_handleShowEmptyRowsCheck(val) {
		if (this.reportState.configStore.showEmptyRows === !val) {
			return;
		}
		this.reportState.configStore.showEmptyRows = !val;
		this.forceUpdate();
	}

	_handleShowEmptyColumnsCheck(val) {
		if (this.reportState.configStore.showEmptyColumns === !val) {
			return;
		}
		this.reportState.configStore.showEmptyColumns = !val;
		this.forceUpdate();
	}

	_handleSwapAxes() {
		const factsheetType = this.reportState.selectedFactsheetType;
		const xAxisOption = this._getSelectedXAxisOption(factsheetType);
		const yAxisOption = this._getSelectedYAxisOption(factsheetType);
		this.reportState.selectedXAxis = yAxisOption;
		this.reportState.selectedYAxis = xAxisOption;
		this._computeData();
	}

	_getSelectedViewOption(factsheetType) {
		if (!this.reportState.selectedView) {
			// always fallback to the first one
			return this.reportState.viewOptions[factsheetType][0];
		}
		return this.reportState.selectedView;
	}

	_getSelectedXAxisOption(factsheetType) {
		if (!this.reportState.selectedXAxis) {
			const viewOptions = this.reportState.viewOptions[factsheetType];
			// view options have at least 2 elements, see '_initReport'
			switch (viewOptions.length) {
				case 2:
					return viewOptions[0];
				default:
					return viewOptions[1];
			}
		}
		return this.reportState.selectedXAxis;
	}

	_getSelectedYAxisOption(factsheetType) {
		if (!this.reportState.selectedYAxis) {
			const viewOptions = this.reportState.viewOptions[factsheetType];
			// view options have at least 2 elements, see '_initReport'
			// choose an option which is different from x-axis
			switch (viewOptions.length) {
				case 2:
					return viewOptions[1];
				default:
					return viewOptions[2];
			}
		}
		return this.reportState.selectedYAxis;
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
		const factsheetType = this.reportState.selectedFactsheetType;
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
						showEmptyRows={this.state.showEmptyRows}
						showEmptyColumns={this.state.showEmptyColumns}
					/>
				</div>
			</div>
		);
	}

	_renderConfigContent() {
		const options = this.reportState.factsheetModels.map((e) => {
			return {
				value: e,
				label: lx.translateFactSheetType(e, 'plural')
			};
		});
		return (
			<div>
				<SelectField id='factsheetType' label='Type'
					options={options}
					useSmallerFontSize
					value={this.reportState.configStore.factsheetType}
					onChange={this._handleFactsheetTypeSelect} />
				<Checkbox id='showEmptyRows' label='Hide empty rows'
					useSmallerFontSize
					value={!this.reportState.configStore.showEmptyRows}
					onChange={this._handleShowEmptyRowsCheck} />
				<Checkbox id='showEmptyColumns' label='Hide empty columns'
					useSmallerFontSize
					value={!this.reportState.configStore.showEmptyColumns}
					onChange={this._handleShowEmptyColumnsCheck} />
				<Checkbox id='showMissingDataWarning' label='Show missing data warning'
					useSmallerFontSize
					value={this.reportState.configStore.showMissingDataWarning}
					onChange={this._handleShowMissingDataWarningCheck} />
			</div>
		);
	}

	_renderSelectFields() {
		const factsheetType = this.reportState.selectedFactsheetType;
		let viewOptions = [];
		let xAxisOptions = [];
		let yAxisOptions = [];
		let selectedViewOption = undefined;
		let selectedXAxisOption = undefined;
		let selectedYAxisOption = undefined;
		if (factsheetType) {
			viewOptions = this.reportState.viewOptions[factsheetType];
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
						value={selectedViewOption} onChange={viewOptions && viewOptions.length === 0 ? undefined : this._handleViewSelect} />
				</span>
				<span style={SELECT_FIELD_STYLE}>
					<SelectField id='x-axis' label='X-Axis' options={xAxisOptions} useSmallerFontSize
						value={selectedXAxisOption} onChange={xAxisOptions && xAxisOptions.length === 0 ? undefined : this._handleXAxisSelect} />
				</span>
				<span style={SWAP_BUTTON_STYLE}>
					<button type='button' className='btn btn-default btn-xs'
						aria-label='Swap axes' title='Swap axes'
						disabled={(xAxisOptions && xAxisOptions.length < 1) || (yAxisOptions && yAxisOptions.length < 1)}
						onClick={this._handleSwapAxes}
					>
						<span className='glyphicon glyphicon-retweet' aria-hidden='true' />
						<span className='sr-only'>Swap axes</span>
					</button>
				</span>
				<span style={SELECT_FIELD_STYLE}>
					<SelectField id='y-axis' label='Y-Axis' options={yAxisOptions} useSmallerFontSize
						value={selectedYAxisOption} onChange={yAxisOptions && yAxisOptions.length === 0 ? undefined : this._handleYAxisSelect} />
				</span>
			</div>
		);
	}
}

export default Report;
