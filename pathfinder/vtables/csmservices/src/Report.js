import React, { Component } from 'react';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import CommonQueries from './CommonGraphQLQueries';
import DataIndex from './DataIndex';
import Link from './Link';
import LinkList from './LinkList';
import Utilities from './Utilities';

class Report extends Component {

	constructor(props) {
		super(props);
		this._initReport = this._initReport.bind(this);
		this._handleData = this._handleData.bind(this);
		this.SERVICE_STATUS_OPTIONS = {},
		this.SERVICE_CLASSIFICATION_OPTIONS = {},
		this.SERVICE_ORIGIN_OPTIONS = {}
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
			this.SERVICE_STATUS_OPTIONS = index.getTags('Service Status').reduce((r, e, i) => {
				r[i] = e.name;
				return r;
			}, {});
			this.SERVICE_CLASSIFICATION_OPTIONS = index.getTags('Service Classification').reduce((r, e, i) => {
				r[i] = e.name;
				return r;
			}, {});
			this.SERVICE_ORIGIN_OPTIONS = index.getTags('Service Origin').reduce((r, e, i) => {
				r[i] = e.name;
				return r;
			}, {});
			lx.executeGraphQL(this._createQuery(csmID)).then((data) => {
				index.put(data);
				this._handleData(index, csmID);
			});
		});
	}

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_createQuery(csmID) {
		const csmIDFilter = csmID ? `, {facetKey: "Application Type", keys: ["${csmID}"]}` : '';
		return `{applications: allFactSheets(
					sort: {mode: BY_FIELD, key: "displayName", order: asc},
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Application"]},
						{facetKey: "hierarchyLevel", keys: ["2"]}
						${csmIDFilter}
					]}
				) {
					edges { node {
						id name description tags { name }
						... on Application {
							relToParent { edges { node { factSheet { id name } } } }
							relApplicationToPlatform { edges { node { factSheet { id name } } } }
							relToRequiredBy (facetFilters: [
								{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]}
							]) { edges { node { factSheet { id name tags { name } } } } }
							relApplicationToBCA { edges { node { factSheet { id name } } } }
							relToRequires (facetFilters: [
								{facetKey: "FactSheetTypes", keys: ["Application"]}
							]) { edges { node { factSheet { id name tags { name } } } } }
							relApplicationToDataObject { edges { node { factSheet { id name tags { name } } } } }
						}
					}}
				}}`;
	}

	_handleData(index, csmID) {
		const tableData = [];
		index.applications.nodes.forEach((appMapL2) => {
			if (!csmID && !index.includesTag(appMapL2, 'CSM')) {
				return;
			}
			const appMapL1 = appMapL2.relToParent ? appMapL2.relToParent.nodes[0] : undefined;
			const platfProdByBCs = appMapL2.relApplicationToPlatform ? appMapL2.relApplicationToPlatform.nodes : [];
			// if COBRA works fine it should not be neccessary to filter for tag name 'Platform'
			const platfConsByBCs = appMapL2.relToRequiredBy ? appMapL2.relToRequiredBy.nodes.filter((e) => {
				// filter for tag name (unfortunately not possible in query on relation)
				return index.includesTag(e, 'Platform');
			}) : [];
			const bcaBCs = appMapL2.relApplicationToBCA ? appMapL2.relApplicationToBCA.nodes : [];
			// if COBRA works fine it should not be neccessary to filter for tag name 'BCA'
			const tmfAPPs = appMapL2.relToRequires ? appMapL2.relToRequires.nodes.filter((e) => {
				// filter for tag name (unfortunately not possible in query on relation)
				return index.includesTag(e, 'TMF Open API');
			}) : [];
			const cimDOs = appMapL2.relApplicationToDataObject ? appMapL2.relApplicationToDataObject.nodes.filter((e) => {
				// filter for tag name (unfortunately not possible in query on relation)
				return index.includesTag(e, 'CIM');
			}) : [];
			tableData.push({
				appMapL1ID: appMapL1 ? appMapL1.id : '',
				appMapL1Name: appMapL1 ? appMapL1.name : '',
				appMapL2ID: appMapL2.id,
				appMapL2Name: appMapL2.name,
				appMapL2Desc: appMapL2.description,
				serviceStatus: this._getStatusValue(this.SERVICE_STATUS_OPTIONS, index.getFirstTagFromGroup(appMapL2, 'Service Status')),
				serviceClass: this._getStatusValue(this.SERVICE_CLASSIFICATION_OPTIONS, index.getFirstTagFromGroup(appMapL2, 'Service Classification')),
				serviceOrigin: this._getStatusValue(this.SERVICE_ORIGIN_OPTIONS, index.getFirstTagFromGroup(appMapL2, 'Service Origin')),
				platfProdByBCsNames: platfProdByBCs.map((e) => {
					return e.name;
				}),
				platfProdByBCsIDs: platfProdByBCs.map((e) => {
					return e.id;
				}),
				platfConsByBCsNames: platfConsByBCs.map((e) => {
					return e.name;
				}),
				platfConsByBCsIDs: platfConsByBCs.map((e) => {
					return e.id;
				}),
				bcaBCsNames: bcaBCs.map((e) => {
					return e.name;
				}),
				bcaBCsIDs: bcaBCs.map((e) => {
					return e.id;
				}),
				tmfAPPsNames: tmfAPPs.map((e) => {
					return e.name;
				}),
				tmfAPPsIDs: tmfAPPs.map((e) => {
					return e.id;
				}),
				cimDOsNames: cimDOs.map((e) => {
					return e.name;
				}),
				cimDOsIDs: cimDOs.map((e) => {
					return e.id;
				})
			});
		});
		this.setState({
			data: tableData
		});
	}

	_getStatusValue(statusGroup, status) {
		if (!status) {
			return undefined;
		}
		const key = Utilities.getKeyToValue(statusGroup, status.name);
		return key !== undefined && key !== null ? parseInt(key, 10) : undefined;
	}

	/* formatting functions for the table */

	_formatLink(cell, row, extraData) {
		if (!cell) {
			return '';
		}
		return (<Link link={'factsheet/' + extraData.type + '/' + row[extraData.id]} target='_blank' text={cell} />);
	}

	_formatArray(cell, row, extraData) {
		if (!cell) {
			return '';
		}
		return (
			<LinkList links={
				cell.reduce((arr, e, i) => {
					arr.push({
						link: 'factsheet/' + extraData.type + '/' + row[extraData.ids][i],
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
		return enums[cell];
	}

	_formatDescription(cell, row) {
		if (!cell) {
			return '';
		}
		return cell;
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
			<BootstrapTable data={this.state.data} keyField='appMapL2ID'
				 striped hover search exportCSV
				 options={{ clearSearch: true }}>
				<TableHeaderColumn dataSort
					 dataField='appMapL1Name'
					 width='200px'
					 dataAlign='left'
					 dataFormat={this._formatLink}
					 formatExtraData={{ type: 'Application', id: 'appMapL1ID' }}
					 csvHeader='hierarchyL0Name'
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>Service Domain</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='serviceClass'
					 width='200px'
					 dataAlign='left'
					 dataFormat={this._formatEnum}
					 formatExtraData={this.SERVICE_CLASSIFICATION_OPTIONS}
					 csvHeader='serviceClassification'
					 csvFormat={this._formatEnum}
					 csvFormatExtraData={this.SERVICE_CLASSIFICATION_OPTIONS}
					 filter={{ type: 'SelectFilter', placeholder: 'Select Service Classifikation', options: this.SERVICE_CLASSIFICATION_OPTIONS }}
				>Service Classification</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='appMapL2Name'
					 width='200px'
					 dataAlign='left'
					 dataFormat={this._formatLink}
					 formatExtraData={{ type: 'Application', id: 'appMapL2ID' }}
					 csvHeader='hierarchyL1Name'
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>Service Name</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='serviceOrigin'
					 width='200px'
					 dataAlign='left'
					 dataFormat={this._formatEnum}
					 formatExtraData={this.SERVICE_ORIGIN_OPTIONS}
					 csvHeader='serviceOrigin'
					 csvFormat={this._formatEnum}
					 csvFormatExtraData={this.SERVICE_ORIGIN_OPTIONS}
					 filter={{ type: 'SelectFilter', placeholder: 'Select Service Origin', options: this.SERVICE_ORIGIN_OPTIONS }}
				>Service Origin</TableHeaderColumn>
				<TableHeaderColumn dataSort  tdStyle={{ fontSize: '.85em' }}
					 dataField='appMapL2Desc'
					 width='200px'
					 dataAlign='left'
					 dataFormat={this._formatDescription}
					 csvHeader='description'
					 csvFormat={this._formatDescription}
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>Service Description</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='serviceStatus'
					 width='200px'
					 dataAlign='left'
					 dataFormat={this._formatEnum}
					 formatExtraData={this.SERVICE_STATUS_OPTIONS}
					 csvHeader='status'
					 csvFormat={this._formatEnum}
					 csvFormatExtraData={this.SERVICE_STATUS_OPTIONS}
					 filter={{ type: 'SelectFilter', placeholder: 'Select Service Status', options: this.SERVICE_STATUS_OPTIONS }}
				>Service Status</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='bcaBCsNames'
					 width='200px'
					 dataAlign='left'
					 dataFormat={this._formatArray}
					 formatExtraData={{ type: 'BusinessCapability', ids: 'bcaBCsIDs' }}
					 csvHeader='bcaName'
					 csvFormat={this._csvFormatArray}
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>BCA</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='cimDOsNames'
					 width='200px'
					 dataAlign='left'
					 dataFormat={this._formatArray}
					 formatExtraData={{ type: 'DataObject', ids: 'cimDOsIDs' }}
					 csvHeader='cimName'
					 csvFormat={this._csvFormatArray}
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>CIM</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='platfProdByBCsNames'
					 width='200px'
					 dataAlign='left'
					 dataFormat={this._formatArray}
					 formatExtraData={{ type: 'BusinessCapability', ids: 'platfProdByBCsIDs' }}
					 csvHeader='platformName'
					 csvFormat={this._csvFormatArray}
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>Platform (Produced By)</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='platfConsByBCsNames'
					 width='210px'
					 dataAlign='left'
					 dataFormat={this._formatArray}
					 formatExtraData={{ type: 'BusinessCapability', ids: 'platfConsByBCsIDs' }}
					 csvHeader='platform2Name'
					 csvFormat={this._csvFormatArray}
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>Platform (Consumed By)</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='tmfAPPsNames'
					 width='200px'
					 dataAlign='left'
					 dataFormat={this._formatArray}
					 formatExtraData={{ type: 'Application', ids: 'tmfAPPsIDs' }}
					 csvHeader='tmfName'
					 csvFormat={this._csvFormatArray}
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>TMF Open API</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

export default Report;
