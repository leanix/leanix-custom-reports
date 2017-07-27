import React, {	Component } from 'react';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import CommonQueries from './CommonGraphQLQueries';
import DataIndex from './DataIndex';
import Link from './Link';
import LinkList from './LinkList';

const LEVEL_OPTIONS = [1, 2, 3];

class Report extends Component {

	constructor(props) {
		super(props);
		this._initReport = this._initReport.bind(this);
		this._handleData = this._handleData.bind(this);
		this.OPERATION_STATUS_OPTIONS = {};
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
			let csmID = index.getTags('Application Type', 'CSM');
			if (csmID.length > 0) {
				csmID = csmID[0].id;
			} else {
				csmID = undefined;
			}
			let platformID = index.getTags('BC Type', 'Platform');
			if (platformID.length > 0) {
				platformID = platformID[0].id;
			} else {
				platformID = undefined;
			}
			this.OPERATION_STATUS_OPTIONS = index.getTags('Service Status').reduce((r, e, i) => {
				r[i] = e.name;
				return r;
			}, {});
			lx.executeGraphQL(this._createQuery(csmID, platformID)).then((data) => {
				index.put(data);
				this._handleData(index, csmID, platformID);
			});
		});
	}

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_createQuery(csmID, platformID) {
		if (csmID && platformID) {
			return `{applications: allFactSheets(
						sort: {mode: BY_FIELD, key: "displayName", order: asc},
						filter: {facetFilters: [
							{facetKey: "FactSheetTypes", keys: ["Application"]},
							{facetKey: "Application Type", keys: ["${csmID}"]},
							{facetKey: "hierarchyLevel", operator: OR, keys: ["1", "2", "3"]}
						]}
					) {
						edges { node {
							id name description level tags { name }
							... on Application {
								relToParent { edges { node { factSheet { id } } } }
								relApplicationToPlatform { edges { node { factSheet { id } } } }
							}
						}}
					}
					businessCapabilities: allFactSheets(
						filter: {facetFilters: [
							{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]},
							{facetKey: "BC Type", keys: ["${platformID}"]}
						]}
					) {
						edges { node { id displayName } }
					}}`;
		} else {
			return `{applications: allFactSheets(
						sort: {mode: BY_FIELD, key: "displayName", order: asc},
						filter: {facetFilters: [
							{facetKey: "FactSheetTypes", keys: ["Application"]},
							{facetKey: "hierarchyLevel", operator: OR, keys: ["1", "2", "3"]}
						]}
					) {
						edges { node {
							id name description level tags { name }
							... on Application {
								relToParent { edges { node { factSheet { id } } } }
								relApplicationToPlatform { edges { node { factSheet { id } } } }
							}
						}}
					}
					businessCapabilities: allFactSheets(
						filter: {facetFilters: [
							{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]}
						]}
					) {
						edges { node { id displayName tags { name } } }
					}}`;
		}
	}

	_handleData(index, csmID, platformID) {
		const tableData = [];
		index.applications.nodes.forEach((e) => {
			if (!csmID && !index.includesTag(e2, 'CSM')) {
				return;
			}
			const hierarchy = {};
			let tmp = e;
			while (tmp) {
				hierarchy['L' + tmp.level] = tmp;
				tmp = index.getParent('applications', tmp.id);
			}
			let platformBCs = [];
			const subIndex = e.relApplicationToPlatform;
			if (subIndex) {
				platformBCs = subIndex.nodes.map((e2) => {
					return index.businessCapabilities.byID[e2.id];
				}).filter((e2) => {
					return e2 !== undefined && e2 !== null;
				});
				if (!platformID) {
					// filter for tag name
					platformBCs = platformBCs.filter((e2) => {
						return index.includesTag(e2, 'Platform');
					});
				}
			}
			const operationStatus = index.getFirstTagFromGroup(e, 'Service Status');
			tableData.push({
				id: e.id,
				level: e.level,
				hierarchy: hierarchy,
				domain: hierarchy.L1 ? hierarchy.L1.name : '',
				name: hierarchy.L2 ? hierarchy.L2.name : '',
				operation: hierarchy.L3 ? hierarchy.L3.name : '',
				description: e.description ? e.description : '',
				operationStatus: this._getOperationStatusValue(operationStatus),
				platforms: platformBCs.map((e2) => {
					return e2.displayName;
				}),
				platformIDs: platformBCs.map((e2) => {
					return e2.id;
				})
			});
		});
		this.setState({
			data: tableData
		});
	}

	_getOperationStatusValue(operationStatus) {
		if (!operationStatus) {
			return -1;
		}
		for (let key in this.OPERATION_STATUS_OPTIONS) {
			if (this.OPERATION_STATUS_OPTIONS[key] === operationStatus.name) {
				return key;
			}
		}
		return -1;
	}

	/* formatting functions for the table */

	_formatName(cell, row, level) {
		if (!cell) {
			return '';
		}
		return (<Link link={'factsheet/Application/' + row.hierarchy[level].id} target='_blank' text={cell} />);
	}

	_formatArray(cell, row) {
		if (!cell) {
			return '';
		}
		return (
			<LinkList links={
				cell.reduce((arr, e, i) => {
					arr.push({
						link: 'factsheet/BusinessCapability/' + row.platformIDs[i],
						target: '_blank',
						text: e
					});
					return arr;
			}, [])} />
		);
	}

	_formatEnum(cell, row, enums) {
		if (cell < 0) {
			return '';
		}
		return enums[cell];
	}

	/* formatting functions for the csv export */

	_csvFormatArray(cell, row) {
		let names = '';
		if (!cell) {
			return names;
		}
		cell.forEach((e) => {
			if (names.length) {
				names += '\n';
			}
			names += e;
		});
		return names;
	}

	render() {
		if (this.state.data.length === 0) {
			return null;
		}
		return (
			<BootstrapTable data={this.state.data} keyField='id'
				 striped hover search exportCSV
				 options={{ clearSearch: true }}>
				<TableHeaderColumn dataSort row='0' rowSpan='2'
					 dataField='level'
					 width='150px'
					 headerAlign='left'
					 dataAlign='left'
					 filter={{ type: 'NumberFilter', placeholder: 'Please choose', options: LEVEL_OPTIONS, numberComparators: ['<='], defaultValue: { number: LEVEL_OPTIONS[LEVEL_OPTIONS.length - 1], comparator: '<=' } }}
					>Level</TableHeaderColumn>
				<TableHeaderColumn row='0' colSpan='5'
					 headerAlign='center'
					 csvHeader='service'
					>Service</TableHeaderColumn>
				<TableHeaderColumn dataSort row='1'
					 dataField='domain'
					 width='200px'
					 headerAlign='left'
					 dataAlign='left'
					 dataFormat={this._formatName}
					 formatExtraData='L1'
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Domain</TableHeaderColumn>
				<TableHeaderColumn dataSort row='1'
					 dataField='name'
					 width='250px'
					 headerAlign='left'
					 dataAlign='left'
					 dataFormat={this._formatName}
					 formatExtraData='L2'
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Name</TableHeaderColumn>
				<TableHeaderColumn dataSort row='1'
					 dataField='operation'
					 width='300px'
					 headerAlign='left'
					 dataAlign='left'
					 dataFormat={this._formatName}
					 formatExtraData='L3'
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Operation</TableHeaderColumn>
				<TableHeaderColumn row='1' tdStyle={{ fontSize: '.85em' }}
					 dataField='description'
					 width='300px'
					 headerAlign='left'
					 dataAlign='left'
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Description</TableHeaderColumn>
				{/* a header column for csv export only */}
				<TableHeaderColumn hidden export row='0'
					 csvHeader='service'
					>Service</TableHeaderColumn>
				<TableHeaderColumn hidden export row='1'
					 dataField='id'
					>id</TableHeaderColumn>
				<TableHeaderColumn dataSort row='1'
					 dataField='operationStatus'
					 width='150px'
					 headerAlign='left'
					 dataAlign='left'
					 dataFormat={this._formatEnum}
					 formatExtraData={this.OPERATION_STATUS_OPTIONS}
					 csvFormat={this._formatEnum}
					 csvFormatExtraData={this.OPERATION_STATUS_OPTIONS}
					 filterFormatted
					 filter={{ type: 'SelectFilter', placeholder: 'Please choose', options: this.OPERATION_STATUS_OPTIONS }}
					>Operation Status</TableHeaderColumn>
				<TableHeaderColumn row='0' rowSpan='2'
					 dataField='platforms'
					 width='250px'
					 headerAlign='left'
					 dataAlign='left'
					 dataFormat={this._formatArray}
					 csvHeader='platform-names'
					 csvFormat={this._csvFormatArray}
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Platforms</TableHeaderColumn>
				<TableHeaderColumn hidden export row='0' rowSpan='2'
					 dataField='platformIDs'
					 csvHeader='platform-ids'
					 csvFormat={this._csvFormatArray}
					>platform ids</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

export default Report;
