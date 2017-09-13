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
		// get all tags, then the data
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			const index = new DataIndex();
			index.put(tagGroups);
			const csmId = index.getFirstTagID('CSM Type', 'CSM');
			const cimId = index.getFirstTagID('Category', 'CIM');
			const appMapId = index.getFirstTagID('BC Type', 'AppMap');
			const tmfId = index.getFirstTagID('CSM Type', 'TMF Open API');
			const platformId = index.getFirstTagID('BC Type', 'Platform');
			const bcaId = index.getFirstTagID('BC Type', 'BCA');
			lx.executeGraphQL(this._createQuery(csmId, cimId, appMapId, tmfId, platformId, bcaId)).then((data) => {
				index.put(data);
				this._handleData(index, csmId, cimId, appMapId, tmfId, platformId, bcaId);
			});
		});
	}

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_createQuery(csmId, cimId, appMapId, tmfId, platformId, bcaId) {
		// initial assume tagGroup.name changed or the id couldn't be determined otherwise
		let idFilter = { csm: '', cim: '', appMap: '', tmf: '', platform: '', bca: '' };
		// initial assume to get it
		let tagNameDef = {
			csm: 'tags { name }',
			cim: 'tags { name }',
			appMap: 'tags { name }',
			tmf: 'tags { name }',
			platform: 'tags { name }',
			bca: 'tags { name }'
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
		if (platformId) {
			idFilter.platform = `, {facetKey: "BC Type", keys: ["${platformId}"]}`;
			tagNameDef.platform = '';
		}
		if (bcaId) {
			idFilter.bca = `, {facetKey: "BC Type", keys: ["${bcaId}"]}`;
			tagNameDef.bca = '';
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
							serviceStatus serviceClassification
							relToParent { edges { node { factSheet { id name } } } }
							relToRequires (facetFilters: [
								{facetKey: "FactSheetTypes", keys: ["CSM"]}
							]) {
								edges { node { factSheet { id } } }
							}
							relCSMToPlatform { edges { node { factSheet { id } } } }
							relCSMToDataObject { edges { node { factSheet { id } } } }
							relCSMToUserGroup { edges { node { factSheet { id } } } }
						}
					}}
				}
				ug: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["UserGroup"]}
					]}
				) {
					edges { node {
						id name
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
						id name ${tagNameDef.appMap}
						... on BusinessCapability {
							relBusinessCapabilityToBCA { edges { node { factSheet { id } } } }
							relBusinessCapabilityToPlatform { edges { node { factSheet { id } } } }
						}
					}}
				}
				bcPlatform: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]}
						${idFilter.platform}
					]}
				) {
					edges { node {
						id name ${tagNameDef.platform}
					}}
				}
				bcBca: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]}
						${idFilter.bca}
					]}
				) {
					edges { node {
						id name ${tagNameDef.bca}
						... on BusinessCapability {
							relToParent {
								edges { node { factSheet { id } } }
							}
						}
					}}
				}}`;
	}

	_handleData(index, csmId, cimId, appMapId, tmfId, platformId, bcaId) {
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
					if (!tmf || (!tmfId && !index.includesTag(tmf, 'TMF Open API'))) {
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
			const platfConsBCs = [];
			const subIndexPlatformCons = csmL2.relCSMToPlatform;
			if (subIndexPlatformCons) {
				subIndexPlatformCons.nodes.forEach((e) => {
					// access bcPlatform
					const platform = index.bcPlatform.byID[e.id];
					if (!platform || (!platformId && !index.includesTag(platform, 'Platform'))) {
						return;
					}
					platfConsBCs.push(platform);
				});
			}
			const appMapBCsSet = {};
			const platformBCsSet = {};
			const bcaL4BCsSet = {};
			cimDOs.forEach((cim) => {
				const subIndexAppMapBCs = cim.relDataObjectToBusinessCapability;
				if (subIndexAppMapBCs) {
					subIndexAppMapBCs.nodes.forEach((e) => {
						// access bcAppMap
						const appMap = index.bcAppMap.byID[e.id];
						if (!appMap || (!appMapId && !index.includesTag(appMap, 'AppMap'))) {
							return;
						}
						appMapBCsSet[appMap.id] = appMap;
						const subIndexBcaBCs = appMap.relBusinessCapabilityToBCA;
						if (subIndexBcaBCs) {
							subIndexBcaBCs.nodes.forEach((e2) => {
								// access bcBca
								const bca = index.bcBca.byID[e2.id];
								bcaL4BCsSet[e2.id] = bca;
							});
						}
						const subIndexPlatformBCs = appMap.relBusinessCapabilityToPlatform;
						if (subIndexPlatformBCs) {
							subIndexPlatformBCs.nodes.forEach((e2) => {
								// access bcPlatform
								const platform = index.bcPlatform.byID[e2.id];
								if (!platform) {
									return;
								}
								platformBCsSet[platform.id] = platform;
							});
						}
					});
				}
			});
			const appMapBCs = [];
			for (let key in appMapBCsSet) {
				appMapBCs.push(appMapBCsSet[key]);
			}
			const platformBCs = [];
			for (let key in platformBCsSet) {
				platformBCs.push(platformBCsSet[key]);
			}
			const bcaL4BCs = [];
			for (let key in bcaL4BCsSet) {
				bcaL4BCs.push(bcaL4BCsSet[key]);
			}
			const bcaL1BCsSet = {};
			bcaL4BCs.forEach((bcaL4) => {
				const parent = this._getL1Parent(index, 'bcBca', bcaL4);
				if (!parent) {
					return;
				}
				bcaL1BCsSet[parent.id] = parent;
			});
			const bcaL1BCs = [];
			for (let key in bcaL1BCsSet) {
				bcaL1BCs.push(bcaL1BCsSet[key]);
			}
			const serviceOriginUGs = [];
			const subIndexUg = csmL2.relCSMToUserGroup;
			if (subIndexUg) {
				subIndexUg.nodes.forEach((e) => {
					// access ug
					const ug = index.ug.byID[e.id];
					if (!ug) {
						return;
					}
					serviceOriginUGs.push(ug);
				});
			}
			tableData.push({
				csmL1Id: csmL1 ? csmL1.id : '',
				csmL1Name: csmL1 ? this._removeNumbering(csmL1.name) : '',
				csmL2Id: csmL2.id,
				csmL2Name: this._removeNumbering(csmL2.name),
				csmL2Desc: csmL2.description,
				serviceStatus: this._getOptionKeyFromValue(
					this.SERVICE_STATUS_OPTIONS, csmL2.serviceStatus),
				serviceClass: this._getOptionKeyFromValue(
					this.SERVICE_CLASSIFICATION_OPTIONS, csmL2.serviceClassification),
				serviceOriginUGsIds: serviceOriginUGs.map((e) => {
					return e.id;
				}),
				serviceOriginUGsNames: serviceOriginUGs.map((e) => {
					return e.name;
				}),
				platformBCsIds: platformBCs.map((e) => {
					return e.id;
				}),
				platformBCsNames: platformBCs.map((e) => {
					return e.name;
				}),
				bcaL1BCsIds: bcaL1BCs.map((e) => {
					return e.id;
				}),
				bcaL1BCsNames: bcaL1BCs.map((e) => {
					return e.name;
				}),
				bcaL4BCsIds: bcaL4BCs.map((e) => {
					return e.id;
				}),
				bcaL4BCsNames: bcaL4BCs.map((e) => {
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
				}),
				appMapBCsIds: appMapBCs.map((e) => {
					return e.id;
				}),
				appMapBCsNames: appMapBCs.map((e) => {
					return e.name;
				}),
				platfConsBCsIds: platfConsBCs.map((e) => {
					return e.id;
				}),
				platfConsBCsNames: platfConsBCs.map((e) => {
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

	// TODO candidate for DataIndex.js?
	_getL1Parent(index, fromOrigin, from) {
		if (!index || !index[fromOrigin] || !from) {
			return;
		}
		const parent = index.getParent(fromOrigin, from.id);
		return !parent ? from : this._getL1Parent(index, fromOrigin, parent);
	}

	// TODO move _removeNumbering to Utilities.js
	_removeNumbering(name) {
		const hierarchyNumberRE = /^([0-9]{2}(\.[0-9]{2})*\s)/;
		if (!name) {
			return;
		}
		const n = hierarchyNumberRE.exec(name);
		if (!n) {
			return name;
		}
		// first one (n[1]) is the match, followed by group matches
		return name.substring(n[1].length);
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
				}}
				setup={this.state.setup} />
		);
	}
}

export default Report;
