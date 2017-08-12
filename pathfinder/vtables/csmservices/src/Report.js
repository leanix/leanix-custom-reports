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
		this._formatLink = this._formatLink.bind(this);
		this._formatArray = this._formatArray.bind(this);
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
		// get service status|classification|origin of CSM from data model
		this.SERVICE_STATUS_OPTIONS = this._getCsmServiceStatus(setup).
			reduce((r, e, i) => {
				r[i] = e;
				return r;
		}, {});
		this.SERVICE_CLASSIFICATION_OPTIONS = this._getCsmServiceClassification(setup).
			reduce((r, e, i) => {
				r[i] = e;
				return r;
		}, {});
		this.SERVICE_ORIGIN_OPTIONS = this._getCsmServiceOrigin(setup).
			reduce((r, e, i) => {
				r[i] = e;
				return r;
		}, {});
		// get all tags, then the data
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			const index = new DataIndex();
			index.put(tagGroups);
			// TODO: use correct tagGroup name ('CSM Type'?)
			const csmID = index.getFirstTagID('Application Type', 'CSM');
			lx.executeGraphQL(this._createQuery(csmID)).then((data) => {
				index.put(data);
				this._handleData(index, csmID);
			});
		});
	}

	_getCsmServiceStatus(setup) {
		const factsheetsModel = setup.settings.dataModel.factSheets;
		if (!factsheetsModel ||
			!factsheetsModel.CSM ||
			!factsheetsModel.CSM.fields ||
			!factsheetsModel.CSM.fields.serviceStatus ||
			!Array.isArray(factsheetsModel.CSM.fields.serviceStatus.values)
		   ) {
			return [];
		}
		return factsheetsModel.CSM.fields.serviceStatus.values;
	}

	_getCsmServiceClassification(setup) {
		const factsheetsModel = setup.settings.dataModel.factSheets;
		if (!factsheetsModel ||
			!factsheetsModel.CSM ||
			!factsheetsModel.CSM.fields ||
			!factsheetsModel.CSM.fields.serviceClassification ||
			!Array.isArray(factsheetsModel.CSM.fields.serviceClassification.values)
		   ) {
			return [];
		}
		return factsheetsModel.CSM.fields.serviceClassification.values;
	}

	_getCsmServiceOrigin(setup) {
		const factsheetsModel = setup.settings.dataModel.factSheets;
		if (!factsheetsModel ||
			!factsheetsModel.CSM ||
			!factsheetsModel.CSM.fields ||
			!factsheetsModel.CSM.fields.serviceOrigin ||
			!Array.isArray(factsheetsModel.CSM.fields.serviceOrigin.values)
		   ) {
			return [];
		}
		return factsheetsModel.CSM.fields.serviceOrigin.values;
	}

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_createQuery(csmID) {
		let csmIDFilter = ''; // initial assume tagGroup.name changed or the id couldn't be determined otherwise
		let tagNameDef = 'tags { name }'; // initial assume to get it
		if (csmID) {
			// query filtering only CSM with tag 'CSM'
			// TODO: use correct tagGroup name ('CSM Type'?)
			csmIDFilter = `, {facetKey: "Application Type", keys: ["${csmID}"]}`;
			tagNameDef = '';
		}
		return `{csm: allFactSheets(
					sort: {mode: BY_FIELD, key: "displayName", order: asc},
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["CSM"]},
						{facetKey: "hierarchyLevel", keys: ["2"]}
						${csmIDFilter}
					]}
				) {
					edges { node {
						id name description ${tagNameDef}
						... on CSM {
							serviceStatus serviceClassification serviceOrigin
							relToParent { edges { node { factSheet { id name } } } }
							relToRequires (facetFilters: [
								{facetKey: "FactSheetTypes", keys: ["Application"]}
							]) { edges { node { factSheet { id name tags { name } } } } }
							relCSMToDataObject { edges { node { factSheet { id name tags { name } } } } }
						}
					}}
				}}`;
	}

	_handleData(index, csmID) {
		const tableData = [];
		index.csm.nodes.forEach((csmL2) => {
			console.log('csmL2: ', csmL2);
			if (!csmID && !index.includesTag(csmL2, 'CSM')) {
				return;
			}
			const csmL1 = csmL2.relToParent ? csmL2.relToParent.nodes[0] : undefined;
			const platfProdByBCs = []; // TODO
			const platfConsByBCs = []; // TODO
			const bcaBCs = []; // TODO
			const tmfAPPs = csmL2.relToRequires ? csmL2.relToRequires.nodes.filter((e) => {
				// filter for tag name (unfortunately not possible in query on relation)
				return index.includesTag(e, 'TMF Open API');
			}) : [];
			const cimDOs = csmL2.relCSMToDataObject ? csmL2.relCSMToDataObject.nodes.filter((e) => {
				// filter for tag name (unfortunately not possible in query on relation)
				return index.includesTag(e, 'CIM');
			}) : [];
			tableData.push({
				csmL1ID: csmL1 ? csmL1.id : '',
				csmL1Name: csmL1 ? csmL1.name : '',
				csmL2ID: csmL2.id,
				csmL2Name: csmL2.name,
				csmL2Desc: csmL2.description,
				serviceStatus: this._getOptionKeyFromValue(this.SERVICE_STATUS_OPTIONS, csmL2.serviceStatus),
				serviceClass: this._getOptionKeyFromValue(this.SERVICE_CLASSIFICATION_OPTIONS, csmL2.serviceClassification),
				serviceOrigin: this._getOptionKeyFromValue(this.SERVICE_ORIGIN_OPTIONS, csmL2.serviceOrigin),
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

	_getOptionKeyFromValue(options, value) {
		if (!value) {
			return undefined;
		}
		const key = Utilities.getKeyToValue(options, value);
		return key !== undefined && key !== null ? parseInt(key, 10) : undefined;
	}

	/* formatting functions for the table */

	_formatLink(cell, row, extraData) {
		if (!cell) {
			return '';
		}
		return (<Link link={this.state.setup.settings.baseUrl + '/factsheet/' + extraData.type + '/' + row[extraData.id]} target='_blank' text={cell} />);
	}

	_formatArray(cell, row, extraData) {
		if (!cell) {
			return '';
		}
		return (
			<LinkList links={
				cell.reduce((arr, e, i) => {
					arr.push({
						link: this.state.setup.settings.baseUrl + '/factsheet/' + extraData.type + '/' + row[extraData.ids][i],
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
			<BootstrapTable data={this.state.data} keyField='csmL2ID'
				 striped hover search exportCSV
				 options={{ clearSearch: true }}>
				<TableHeaderColumn dataSort
					 dataField='csmL1Name'
					 width='200px'
					 dataAlign='left'
					 dataFormat={this._formatLink}
					 formatExtraData={{ type: 'CSM', id: 'csmL1ID' }}
					 csvHeader='serive-domain'
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>Service Domain</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='serviceClass'
					 width='200px'
					 dataAlign='left'
					 dataFormat={this._formatEnum}
					 formatExtraData={this.SERVICE_CLASSIFICATION_OPTIONS}
					 csvHeader='service-classification'
					 csvFormat={this._formatEnum}
					 csvFormatExtraData={this.SERVICE_CLASSIFICATION_OPTIONS}
					 filter={{ type: 'SelectFilter', condition: 'eq', placeholder: 'Please choose', options: this.SERVICE_CLASSIFICATION_OPTIONS }}
				>Service Classification</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='csmL2Name'
					 width='200px'
					 dataAlign='left'
					 dataFormat={this._formatLink}
					 formatExtraData={{ type: 'CSM', id: 'csmL2ID' }}
					 csvHeader='service-name'
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>Service Name</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='serviceOrigin'
					 width='200px'
					 dataAlign='left'
					 dataFormat={this._formatEnum}
					 formatExtraData={this.SERVICE_ORIGIN_OPTIONS}
					 csvHeader='service-origin'
					 csvFormat={this._formatEnum}
					 csvFormatExtraData={this.SERVICE_ORIGIN_OPTIONS}
					 filter={{ type: 'SelectFilter', condition: 'eq', placeholder: 'Please choose', options: this.SERVICE_ORIGIN_OPTIONS }}
				>Service Origin</TableHeaderColumn>
				<TableHeaderColumn dataSort tdStyle={{ fontSize: '.85em' }}
					 dataField='csmL2Desc'
					 width='200px'
					 dataAlign='left'
					 dataFormat={this._formatDescription}
					 csvHeader='Service-description'
					 csvFormat={this._formatDescription}
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>Service Description</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='serviceStatus'
					 width='200px'
					 dataAlign='left'
					 dataFormat={this._formatEnum}
					 formatExtraData={this.SERVICE_STATUS_OPTIONS}
					 csvHeader='service-status'
					 csvFormat={this._formatEnum}
					 csvFormatExtraData={this.SERVICE_STATUS_OPTIONS}
					 filter={{ type: 'SelectFilter', condition: 'eq', placeholder: 'Please choose', options: this.SERVICE_STATUS_OPTIONS }}
				>Service Status</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='bcaBCsNames'
					 width='200px'
					 dataAlign='left'
					 dataFormat={this._formatArray}
					 formatExtraData={{ type: 'BusinessCapability', ids: 'bcaBCsIDs' }}
					 csvHeader='bca'
					 csvFormat={this._csvFormatArray}
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>BCA</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='cimDOsNames'
					 width='200px'
					 dataAlign='left'
					 dataFormat={this._formatArray}
					 formatExtraData={{ type: 'DataObject', ids: 'cimDOsIDs' }}
					 csvHeader='cim'
					 csvFormat={this._csvFormatArray}
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>CIM</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='platfProdByBCsNames'
					 width='200px'
					 dataAlign='left'
					 dataFormat={this._formatArray}
					 formatExtraData={{ type: 'BusinessCapability', ids: 'platfProdByBCsIDs' }}
					 csvHeader='platform-produced-by'
					 csvFormat={this._csvFormatArray}
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>Platform (produced by)</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='platfConsByBCsNames'
					 width='210px'
					 dataAlign='left'
					 dataFormat={this._formatArray}
					 formatExtraData={{ type: 'BusinessCapability', ids: 'platfConsByBCsIDs' }}
					 csvHeader='platform-consumed-by'
					 csvFormat={this._csvFormatArray}
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>Platform (consumed by)</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='tmfAPPsNames'
					 width='200px'
					 dataAlign='left'
					 dataFormat={this._formatArray}
					 formatExtraData={{ type: 'Application', ids: 'tmfAPPsIDs' }}
					 csvHeader='tmf-open-api'
					 csvFormat={this._csvFormatArray}
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>TMF Open API</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

export default Report;
