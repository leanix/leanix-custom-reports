import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Utilities from './common/Utilities';
import Table from './Table';

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
		lx.showSpinner('Loading data ...');
		this.setState({
			setup: setup
		});
		// get options from data model
		const factsheetModel = setup.settings.dataModel.factSheets.CSM;
		this.SERVICE_STATUS_OPTIONS = Utilities.createOptionsObjFrom(
			factsheetModel, 'fields.serviceStatus.values');
		this.SERVICE_CLASSIFICATION_OPTIONS = Utilities.createOptionsObjFrom(
			factsheetModel, 'fields.serviceClassification.values');
		this.SERVICE_ORIGIN_OPTIONS = Utilities.createOptionsObjFrom(
			factsheetModel, 'fields.serviceOrigin.values');
		// get all tags, then the data
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			const index = new DataIndex();
			index.put(tagGroups);
			const csmId = index.getFirstTagID('CSM Type', 'CSM');
			const cimId = index.getFirstTagID('Category', 'CIM');
			const appMapId = index.getFirstTagID('BC Type', 'AppMap');
			const tmfId = index.getFirstTagID('CSM Type', 'TMF2');
			lx.executeGraphQL(this._createQuery(csmId, cimId, appMapId, tmfId)).then((data) => {
				index.put(data);
				this._handleData(index, csmId, cimId, appMapId, tmfId);
			});
		});
	}

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_createQuery(csmId, cimId, appMapId, tmfId) {
		// initial assume tagGroup.name changed or the id couldn't be determined otherwise
		let idFilter = { csm: '', cim: '', appMap: '', tmf: '' };
		// initial assume to get it
		let tagNameDef = {
			csm: 'tags { name }',
			cim: 'tags { name }',
			appMap: 'tags { name }',
			tmf: 'tags { name }'
		};
		if (csmId) {
			idFilter.csm = `, {facetKey: "CSM Type", keys: ["${csmId}"]}`;
			tagNameDef.csm = '';
		}
		if (cimId) {
			idFilter.cim = `, {facetKey: "Category", keys: ["${cimId}"]}`;
			tagNameDef.cim = '';
		}
		if (appMapId) {
			idFilter.appMap = `, {facetKey: "BC Type", keys: ["${appMapId}"]}`;
			tagNameDef.appMap = '';
		}
		if (tmfId) {
			idFilter.tmf = `, {facetKey: "CSM Type", keys: ["${tmfId}"]}`;
			tagNameDef.tmf = '';
		}
		return `{csm: allFactSheets(
					sort: { mode: BY_FIELD, key: "displayName", order: asc },
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["CSM"]},
						{facetKey: "hierarchyLevel", keys: ["2"]}
						${idFilter.csm}
					]}
				) {
					edges { node {
						id name description ${tagNameDef.csm}
						... on CSM {
							serviceStatus serviceClassification serviceOrigin
							relToParent { edges { node { factSheet { id name } } } }
							relToRequires (facetFilters: [
								{facetKey: "FactSheetTypes", keys: ["CSM"]}
							]) {
								edges { node { factSheet { id } } }
							}
							relCSMToDataObject { edges { node { factSheet { id } } } }
						}
					}}
				}
				csmTmf: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["CSM"]}
						${idFilter.tmf}
					]}
				) {
					edges { node {
						id name ${tagNameDef.tmf}
					}}
				}
				doCim: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["DataObject"]}
						${idFilter.cim}
					]}
				) {
					edges { node {
						id name ${tagNameDef.cim}
						... on DataObject {
							relDataObjectToBusinessCapability { edges { node { factSheet { id } } } }
						}
					}}
				}
				bcAppMap: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]}
						${idFilter.appMap}
					]}
				) {
					edges { node {
						id ${tagNameDef.appMap}
						... on BusinessCapability {
							relBusinessCapabilityToBCA { edges { node { factSheet { id name } } } }
							relBusinessCapabilityToPlatform { edges { node { factSheet { id name } } } }
						}
					}}
				}}`;
	}

	_handleData(index, csmId, cimId, appMapId, tmfId) {
		const tableData = [];
		index.csm.nodes.forEach((csmL2) => {
			if (!csmId && !index.includesTag(csmL2, 'CSM')) {
				return;
			}
			const csmL1 = csmL2.relToParent ? csmL2.relToParent.nodes[0] : undefined;
			const tmfApps = [];
			const subIndexRequires = csmL2.relToRequires;
			if (subIndexRequires) {
				subIndexRequires.nodes.forEach((e) => {
					// access csmTmf
					const tmf = index.csmTmf.byID[e.id];
					if (!tmf || (!tmfId && !index.includesTag(tmf, 'TMF2'))) {
						return;
					}
					tmfApps.push(tmf);
				});
			}
			const cimDOs = [];
			const subIndexCIM = csmL2.relCSMToDataObject;
			if (subIndexCIM) {
				subIndexCIM.nodes.forEach((e) => {
					// access doCim
					const cim = index.doCim.byID[e.id];
					if (!cim || (!cimId && !index.includesTag(cim, 'CIM'))) {
						return;
					}
					cimDOs.push(cim);
				});
			}
			const platformBCsSet = {};
			const bcaBCsSet = {};
			cimDOs.forEach((cim) => {
				const appMapBCs = [];
				const subIndexAppMapBCs = cim.relDataObjectToBusinessCapability;
				if (subIndexAppMapBCs) {
					subIndexAppMapBCs.nodes.forEach((e) => {
						// access bcAppMap
						const appMap = index.byID[e.id];
						if (!appMap || (!appMapId && !index.includesTag(appMap, 'AppMap'))) {
							return;
						}
						const subIndexBcaBCs = appMap.relBusinessCapabilityToBCA;
						if (subIndexBcaBCs) {
							subIndexBcaBCs.nodes.forEach((e2) => {
								bcaBCsSet[e2.id] = e2;
							});
						}
						const subIndexPlatformBCs = appMap.relBusinessCapabilityToPlatform;
						if (subIndexPlatformBCs) {
							subIndexPlatformBCs.nodes.forEach((e2) => {
								platformBCsSet[e2.id] = e2;
							});
						}
					});
				}
			});
			const platformBCs = [];
			for (let key in platformBCsSet) {
				platformBCs.push(platformBCsSet[key]);
			}
			const bcaBCs = [];
			for (let key in bcaBCsSet) {
				bcaBCs.push(bcaBCsSet[key]);
			}
			tableData.push({
				csmL1Id: csmL1 ? csmL1.id : '',
				csmL1Name: csmL1 ? csmL1.name : '',
				csmL2Id: csmL2.id,
				csmL2Name: csmL2.name,
				csmL2Desc: csmL2.description,
				serviceStatus: this._getOptionKeyFromValue(
					this.SERVICE_STATUS_OPTIONS, csmL2.serviceStatus),
				serviceClass: this._getOptionKeyFromValue(
					this.SERVICE_CLASSIFICATION_OPTIONS, csmL2.serviceClassification),
				serviceOrigin: this._getOptionKeyFromValue(
					this.SERVICE_ORIGIN_OPTIONS, csmL2.serviceOrigin),
				platformBCsIds: platformBCs.map((e) => {
					return e.id;
				}),
				platformBCsNames: platformBCs.map((e) => {
					return e.name;
				}),
				bcaBCsIds: bcaBCs.map((e) => {
					return e.id;
				}),
				bcaBCsNames: bcaBCs.map((e) => {
					return e.name;
				}),
				tmfAppIds: tmfApps.map((e) => {
					return e.id;
				}),
				tmfAppNames: tmfApps.map((e) => {
					return e.name;
				}),
				cimDOsIds: cimDOs.map((e) => {
					return e.id;
				}),
				cimDOsNames: cimDOs.map((e) => {
					return e.name;
				})
			});
		});
		lx.hideSpinner();
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

	render() {
		if (this.state.data.length === 0) {
			return (<h4 className='text-center'>Loading data ...</h4>);
		}
		return (
			<Table data={this.state.data}
				options={{
					serviceStatus: this.SERVICE_STATUS_OPTIONS,
					serviceClassification: this.SERVICE_CLASSIFICATION_OPTIONS,
					serviceOrigin: this.SERVICE_ORIGIN_OPTIONS
				}}
				setup={this.state.setup} />
		);
	}
}

export default Report;
