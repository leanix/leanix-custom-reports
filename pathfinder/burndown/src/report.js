import $ from 'jquery';
import _ from 'lodash';

import ChartInstance from './ChartInstance';
import DataProvider from './DataProvider';

class Report {

	constructor(setup) {
		this.setup = setup;
		this._createConfig();
		this.chartInstance = new ChartInstance(DataProvider.getCategories());
	}

	_createConfig() {
		this.factsheetTypes = DataProvider.getFactsheetTypesObjects(this.setup.settings.dataModel.factSheets);
		// define a dropdown entry for each factsheet type
		const dropdownEntries = [];
		this.factsheetTypes.forEach(((value) => {
				const key = value.type;
				dropdownEntries.push({
					id: key,
					name: key,
					callback: ((currentEntry) => {
						this._updateFactsheetType(currentEntry.id);
					}).bind(this)
				});
			}).bind(this));
		this.config = {
			allowEditing: false,
			export: {
				beforeExport: (exportElement) => {
					// TODO
					console.log('beforeExport.exportElement:');
					console.log(exportElement);
					return exportElement;
				}
			}
		};
		// TODO remove hack, once fixed in reporting framework
		// see https://github.com/leanix/leanix-reporting/issues/3
		if (dropdownEntries.length !== 0) {
			this.config.menuActions = {
				customDropdowns: [{
						id: 'FACTSHEET_TYPE_DROPDOWN',
						name: 'Factsheet Type',
						entries: dropdownEntries
					}, {
						id: 'PLAN_PHASE_STACK_DROPDOWN',
						name: 'In planning stage data',
						entries: [{
								id: DataProvider.DONT_STACK_BEFORE_PRODUCTION,
								name: 'count last occurrence',
								callback: ((currentEntry) => {
									this._updateStackPlanPhase(currentEntry.id);
								}).bind(this)
							}, {
								id: DataProvider.DONT_STACK_POINT_IN_TIME,
								name: 'count first occurrence',
								callback: ((currentEntry) => {
									this._updateStackPlanPhase(currentEntry.id);
								}).bind(this)
							}, {
								id: DataProvider.STACK,
								name: 'count every occurrence',
								callback: ((currentEntry) => {
									this._updateStackPlanPhase(currentEntry.id);
								}).bind(this)
							}
						]
					}
				]
			};
		}
	}

	init() {
		if (_.size(this.factsheetTypes) > 0) {
			this.currentStackPlanPhase = DataProvider.DONT_STACK_BEFORE_PRODUCTION
			// init the report with the first factsheet type
			this._updateFactsheetType(this.factsheetTypes[0].type);
		} else {
			// there are no factsheet types, that can be used for the report -> show error message
			this.chartInstance.destroy();
			this._updateTitle('There are no Factsheet Types applicable');
			const chartElement = $('#chart');
			chartElement.css('text-align', 'center');
			chartElement.text('Please check if your data model is applicable for this report.');
		}
	}

	_update() {
		const factsheetTypeObject = this._getFactsheetTypeObject(this.currentFactsheetType);
		this.chartInstance.update(DataProvider.getChartData(this.currentData, factsheetTypeObject, this.currentStackPlanPhase));
	}

	_updateStackPlanPhase(stackPlanPhase) {
		if (this.currentStackPlanPhase === stackPlanPhase|| !this.currentFactsheetType || !this.currentData) {
			// nothing to do
			return;
		}
		this.currentStackPlanPhase = stackPlanPhase;
		this._update();
	}

	_updateFactsheetType(factsheetType) {
		if (this.currentFactsheetType === factsheetType) {
			// nothing to do
			return;
		}
		// getting the data
		this._updateTitle('Loading data for ' + factsheetType);
		lx.executeGraphQL(DataProvider.getQuery(factsheetType)).then(((data) => {
				// TODO what about errors?
				// update content
				this.currentFactsheetType = factsheetType;
				this.currentData = data;
				this._updateTitle('Received data for ' + factsheetType);
				this._update();
				this._updateTitle(factsheetType + ' Burndown Chart');
			}).bind(this));
	}

	_getFactsheetTypeObject(factsheetType) {
		for (let i = 0; i < this.factsheetTypes.length; i++) {
			const factsheetTypeObject = this.factsheetTypes[i];
			if (factsheetTypeObject.type === factsheetType) {
				return factsheetTypeObject;
			}
		}
	}

	_updateTitle(text) {
		$('#title').text(text);
	}
}

export default Report;
