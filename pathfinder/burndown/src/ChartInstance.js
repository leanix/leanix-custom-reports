import c3 from 'c3';

class ChartInstance {

	constructor(categories) {
		this.chart = c3.generate({
				bindto: '#chart',
				data: {
					columns: [categories],
					x: 'time',
					names: {
						total: 'In production',
						retired: 'Retired',
						added: 'In planning stage'
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
					groups: [
						['retired', 'added']
					],
					colors: {
						total: 'dodgerblue',
						retired: 'mediumseagreen',
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
						height: 100,
						label: {
							text: 'Quarters (YYYY-mm-dd)',
							position: 'outer-center'
						}
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

	update(chartData) {
		const unload = [];
		// remove old data, if chartData can be considered empty
		if (chartData[1].length < 2 || chartData[2].length < 2 || chartData[3].length < 2) {
			unload.push(chartData[1][0], chartData[2][0], chartData[3][0]);
		}
		this.chart.load({
			columns: chartData,
			unload: unload
		});
		if (unload.length > 1) {
			// dirty hack for c3: legend rect is still shown if no data
			// will be regenerated from c3, if needed -> safe to remove svg element
			// do not use jquery, it can't deal with svg elements
			const legendBackground = document.getElementById('chart').getElementsByClassName('c3-legend-background')[0];
			if (legendBackground) {
				const parentLegendBackground = legendBackground.parentElement;
				parentLegendBackground.removeChild(legendBackground);
			}
		}
	}

	destroy() {
		this.chart.destroy();
	}
}

export default ChartInstance;
