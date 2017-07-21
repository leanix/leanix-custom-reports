import $ from 'jquery';
import _ from 'lodash';
import c3 from 'c3';

import mapper from './mapper';

const ID_FACTSHEET_TYPE_DROPDOWN = 'FACTSHEET_TYPE_DROPDOWN';
const LIFECYCLE_PHASES = ['plan', 'phaseIn', 'active', 'phaseOut', 'endOfLife'];

class Report {

	constructor(setup) {
		this.setup = setup;
		this._createConfig();
		this._createChart();
	}

	_createConfig() {
		// get all factsheet types from workspace
		const factsheetTypes = _.filter(this.setup.config.dataModel.factSheets, (value, key) => {
				// exclude all factsheet types, which have no lifecycle definition and don't show in view
				// lifecycle definition:
				//  - must have a field 'lifecycle'
				//  - field 'lifecycle' must have a property 'type' with a value 'LIFECYCLE'
				//  - field 'lifecycle' must have a property 'inView' with a value true
				//  - field 'lifecycle' must have a property 'inFacet' with a value true
				//  - field 'lifecylce' must have a property 'values' with a value that is an array equal to LIFECYCLE_PHASES
				if (value && value.fields && value.fields.lifecycle && value.fields.lifecycle.type === 'LIFECYCLE'
					 && value.fields.lifecycle.inView && value.fields.lifecycle.inFacet
					 && Array.isArray(value.fields.lifecycle.values) && value.fields.lifecycle.values.length === LIFECYCLE_PHASES.length
					 && _.differenceWith(LIFECYCLE_PHASES, value.fields.lifecycle.values, _.isEqual).length === 0) {
					value.type = key;
					return true;
				}
				return false;
			});
		this.factsheetTypes = _.sortBy(factsheetTypes, [(value) => {
						return value.type;
					}
				]);
		// define a dropdown entry for each factsheet type
		const dropdownEntries = [];
		this.factsheetTypes.forEach(((value) => {
				const key = value.type;
				dropdownEntries.push({
					id: key,
					name: key,
					callback: ((dde) => {
						this._getDataAndUpdate(dde.id);
					}).bind(this)
				});
			}).bind(this));
		this.config = {
			allowEditing: false,
			export: {
				beforeExport: (exportElement) => {
					console.log('beforeExport.exportElement:');
					console.log(exportElement);
					return exportElement;
				}
			}
		};
		// TODO remove hack, once fixed in reporting framework
		if (dropdownEntries.length !== 0) {
			this.config.menuActions = {
				customDropdowns: [{
						id: ID_FACTSHEET_TYPE_DROPDOWN,
						name: 'Factsheet Type',
						entries: dropdownEntries
					}
				]
			};
		}
	}

	init() {
		if (_.size(this.factsheetTypes) > 0) {
			// init the report with the first factsheet type
			this._getDataAndUpdate(this.factsheetTypes[0].type);
		} else {
			// there are no factsheet types, that can be used for the report -> show error message
			this.chartInstance.destroy();
			this._updateTitle('There are no Factsheet Types applicable');
			const chartElement = $('#chart');
			chartElement.css('text-align', 'center');
			chartElement.text('Please check if your data model is applicable for this report.');
		}
	}

	_getDataAndUpdate(factsheetType) {
		if (this.currentFactsheetType === factsheetType) {
			// nothing to do
			return;
		}
		// getting the data
		this._updateTitle('Loading data for ' + factsheetType);
		lx.executeGraphQL(this._createQuery(factsheetType)).then(((data) => {
				console.log(data);
				// TODO what about errors?
				// update content
				this.currentFactsheetType = factsheetType;
				const factsheetTypeObject = this._getFactsheetTypeObject(factsheetType);
				this._updateTitle('Received data for ' + factsheetType);
				this._updateChart(mapper.map(data, factsheetTypeObject, this.categories));
				this._updateTitle(factsheetType + ' Burndown Chart');
			}).bind(this));
	}

	_createQuery(factsheetTypes) {
		return `{allFactSheets(factSheetType:${factsheetTypes}) {
			edges {node {
				tags {name}
				...on ${factsheetTypes} {
					lifecycle {
						phases {phase startDate}
					}
				}
			}}
		}}`;
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

	_updateChart(chartData) {
		this.chartInstance.axis.range({
			min: chartData.min,
			max: chartData.max
		});
		// combine chart data with categories
		const data = [];
		data.push(this.categories);
		chartData.data.forEach((e) => data.push(e));
		this.chartInstance.load({
			columns: data
		});
	}

	_createChart() {
		this.categories = _.concat(['time'], mapper.createCategories());
		this.chartInstance = c3.generate({
				bindto: '#chart',
				data: {
					columns: [this.categories],
					x: 'time',
					names: {
						total: 'In production',
						retired: 'Retired',
						added: 'New'
					},
					axes: {
						total: 'y2',
						retired: 'y',
						added: 'y'
					},
					types: {
						total: 'spline',
						retired: 'bar',
						added: 'bar'
					},
					colors: {
						total: 'dodgerblue',
						retired: 'darkseagreen',
						added: 'red'
					},
					empty: {
						label: {
							text: 'No data'
						}
					}
				},
				axis: {
					x: {
						type: 'category',
						tick: {
							format: '%Y-%m-%d',
							rotate: -50,
							multiline: false
						},
						height: 70
					},
					y: {
						label: {
							text: 'Count of Transitions',
							position: 'outer-middle'
						},
						center: 0,
						tick: {
							outer: false
						}
					},
					y2: {
						show: true,
						label: {
							text: 'Count in Production',
							position: 'outer-middle'
						},
						tick: {
							outer: false
						}
					}
				},
				grid: {
					y: {
						show: true
					},
					focus: {
						show: false
					}
				},
				legend: {
					position: 'inset',
					inset: {
						anchor: 'top-right',
						x: 20,
						y: 0,
						step: 3
					}
				},
				zoom: {
					enabled: true
				}
			});
	}
}

export default Report;
