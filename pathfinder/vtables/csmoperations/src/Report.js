import React, { Component } from 'react';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import CommonQueries from './CommonGraphQLQueries';
import DataIndex from './DataIndex';
import Link from './Link';
import LinkList from './LinkList';
import Utilities from './Utilities';

const LEVEL_OPTIONS = [1, 2, 3];

class Report extends Component {

	constructor(props) {
		super(props);
		this._initReport = this._initReport.bind(this);
		this._handleData = this._handleData.bind(this);
		this._formatName = this._formatName.bind(this);
		this._formatArray = this._formatArray.bind(this);
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
			const csmID = index.getFirstTagID('Application Type', 'CSM');
			const platformID = index.getFirstTagID('BC Type', 'Platform');
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
		const csmIDFilter = csmID ? `, {facetKey: "Application Type", keys: ["${csmID}"]}` : '';
		let platformIDFilter = ''; // initial assume tagGroup.name changed or the id couldn't be determined otherwise
		let tagNameDef = 'tags { name }'; // initial assume to get it
		if (platformID) {
			platformIDFilter = `, {facetKey: "BC Type", keys: ["${platformID}"]}`;
			tagNameDef = '';
		}
		return `{applications: allFactSheets(
					sort: {mode: BY_FIELD, key: "displayName", order: asc},
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Application"]},
						{facetKey: "hierarchyLevel", operator: OR, keys: ["1", "2", "3"]}
						${csmIDFilter}
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
						${platformIDFilter}
					]}
				) {
					edges { node { id displayName ${tagNameDef} } }
				}}`;
	}

	_handleData(index, csmID, platformID) {
		const tableData = [];
		index.applications.nodes.forEach((e) => {
			if (!csmID && !index.includesTag(e, 'CSM')) {
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
				description: e.description,
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
			return undefined;
		}
		const key = Utilities.getKeyToValue(this.OPERATION_STATUS_OPTIONS, operationStatus.name);
		return key !== undefined && key !== null ? parseInt(key, 10) : undefined;
	}

	/* formatting functions for the table */

	_formatName(cell, row, level) {
		if (!cell) {
			return '';
		}
		return (<Link link={this.state.setup.settings.baseUrl + '/factsheet/Application/' + row.hierarchy[level].id} target='_blank' text={cell} />);
	}

	_formatDescription(cell, row) {
		if (!cell) {
			return '';
		}
		return cell;
	}

	_formatArray(cell, row) {
		if (!cell) {
			return '';
		}
		return (
			<LinkList links={
				cell.reduce((arr, e, i) => {
					arr.push({
						link: this.state.setup.settings.baseUrl + '/factsheet/BusinessCapability/' + row.platformIDs[i],
						target: '_blank',
						text: e
					});
					return arr;
			}, [])} />
		);
	}

	_formatEnum(cell, row, enums) {
		if (!cell && cell !== 0) {
			return '';
		}
		return enums[cell] ? enums[cell] : '';
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
		return (
			<BootstrapTable data={this.state.data} keyField='id'
				 striped hover search exportCSV
				 options={{ clearSearch: true }}>
				<TableHeaderColumn dataSort row='0' rowSpan='2'
					 dataField='level'
					 width='150px'
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
					 dataAlign='left'
					 dataFormat={this._formatName}
					 formatExtraData='L1'
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Domain</TableHeaderColumn>
				<TableHeaderColumn dataSort row='1'
					 dataField='name'
					 width='250px'
					 dataAlign='left'
					 dataFormat={this._formatName}
					 formatExtraData='L2'
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Name</TableHeaderColumn>
				<TableHeaderColumn dataSort row='1'
					 dataField='operation'
					 width='300px'
					 dataAlign='left'
					 dataFormat={this._formatName}
					 formatExtraData='L3'
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Operation</TableHeaderColumn>
				<TableHeaderColumn row='1' tdStyle={{ fontSize: '.85em' }}
					 dataField='description'
					 width='300px'
					 dataAlign='left'
					 dataFormat={this._formatDescription}
					 csvFormat={this._formatDescription}
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Description</TableHeaderColumn>
				<TableHeaderColumn dataSort row='1'
					 dataField='operationStatus'
					 width='170px'
					 dataAlign='left'
					 dataFormat={this._formatEnum}
					 formatExtraData={this.OPERATION_STATUS_OPTIONS}
					 csvFormat={this._formatEnum}
					 csvFormatExtraData={this.OPERATION_STATUS_OPTIONS}
					 filter={{ type: 'SelectFilter', condition: 'eq', placeholder: 'Please choose', options: this.OPERATION_STATUS_OPTIONS }}
					>Operation Status</TableHeaderColumn>
				<TableHeaderColumn row='0' rowSpan='2'
					 dataField='platforms'
					 width='250px'
					 dataAlign='left'
					 dataFormat={this._formatArray}
					 csvHeader='platform-names'
					 csvFormat={this._csvFormatArray}
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Platforms</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

export default Report;
