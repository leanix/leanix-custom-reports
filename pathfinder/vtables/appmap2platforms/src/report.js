import React, {	Component } from 'react';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import CommonQueries from './CommonGraphQLQueries';
import DataIndex from './DataIndex';
import Link from './Link';

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
		lx.ready(this._createConfig());
		this.setState({
			setup: setup
		});
		// get all tags, then the data
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			const index = new DataIndex();
			index.put(tagGroups);
			let appMapID = index.getTags('BC Type', 'AppMap');
			if (appMapID.length > 0) {
				appMapID = appMapID[0].id;
			} else {
				appMapID = undefined;
			}
			lx.executeGraphQL(this._createQuery(appMapID)).then((data) => {
				index.put(data);
				this._handleData(index, appMapID);
			});
		});
	}

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_createQuery(appMapID) {
		let appMapIDFilter = ''; // initial assume tagGroup.name changed or the id couldn't be determined otherwise
		let tagNameDef = 'tags { name }'; // initial assume to get it
		if (appMapID) {
			// query filtering only bc with tag 'AppMap'
			appMapIDFilter = `, {facetKey: "BC Type", keys: ["${appMapID}"]}`;
			tagNameDef = '';
		}
		return `{businessCapabilities: allFactSheets(
						sort: {mode: BY_FIELD, key: "displayName", order: asc}, 
						filter: {facetFilters: [
							{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]}
							${appMapIDFilter}
						]}
					) {
						edges { node {
							id fullName ${tagNameDef}
							... on BusinessCapability {
								relBusinessCapabilityToPlatform {
									edges { node {
										factSheet {
											id fullName
											... on BusinessCapability {
												relToParent {
													edges { node {
														factSheet { id fullName }
													}}
												}
											}
										}
									}}
								}
								relToParent {
									edges { node {
										factSheet { id fullName }
									}}
								}
							}
						}}
					}
				}`;
	}

	_handleData(index, appMapID) {
		const tableData = [];
		index.businessCapabilities.nodes.forEach((appMapL2) => {
			if (appMapID || (!appMapID && index.includesTag(appMapL2, 'AppMap'))) {
				if (appMapL2.relBusinessCapabilityToPlatform) {
					appMapL2.relBusinessCapabilityToPlatform.nodes.forEach((platformL2) => {
						let platformL1 = undefined;
						if (platformL2.relToParent) {
							platformL1 = platformL2.relToParent.nodes[0];
						}
						
						let appMapL1 = undefined;
						if (appMapL2.relToParent) {
							appMapL1 = appMapL2.relToParent.nodes[0];
						}
						
						tableData.push({
							appMapL1ID: appMapL1 && appMapL1.id ? appMapL1.id : '',
							appMapL1Name: appMapL1 && appMapL1.fullName ? appMapL1.fullName : '',
							appMapL2ID: appMapL2.id,
							appMapL2Name: appMapL2.fullName,
							platformL1ID: platformL1 && platformL1.id ? platformL1.id : '',
							platformL1Name: platformL1 && platformL1.fullName ? platformL1.fullName : '',
							platformL2ID: platformL2 && platformL2.id ? platformL2.id : '',
							platformL2Name: platformL2 && platformL2.fullName ? platformL2.fullName : '',
						});
					});
				}
			}
		});
		this.setState({
			data: tableData
		});
	}

	/* formatting functions for the table */

	_formatLink(cell, row, idName) {
		let id = row[idName];
		if (!cell || !id) {
			return '';
		}
		return (<Link link={'factsheet/BusinessCapability/' + id} target='_blank' text={cell} />);
	}

	render() {
		if (this.state.data.length === 0) {
			return null;
		}		
		return (
			<BootstrapTable data={this.state.data} keyField='appMapL2ID'
				striped hover search pagination ignoreSinglePage exportCSV 
				options={{ clearSearch: true }}>
				<TableHeaderColumn dataSort
					dataField='appMapL1Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={'appMapL1ID'}
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					csvHeader='appmap-domain'
				>AppMap Domain</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='appMapL2Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={'appMapL2ID'}
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					csvHeader='appmap-solution-area'
				>AppMap Solution Area</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='platformL1Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={'platformL1ID'}
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					csvHeader='platform-layer'
				>Platform Layer</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='platformL2Name'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={'platformL2ID'}
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					csvHeader='platform'
				>Platform</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

export default Report;
