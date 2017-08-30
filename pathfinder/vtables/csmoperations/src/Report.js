import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Utilities from './common/Utilities';
import Table from './Table';

const LEVEL_OPTIONS = [1, 2, 3];

class Report extends Component {

	constructor(props) {
		super(props);
		this._initReport = this._initReport.bind(this);
		this._handleData = this._handleData.bind(this);
		this.SERVICE_STATUS_OPTIONS = {};
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
		// get all tags, then the data
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			const index = new DataIndex();
			index.put(tagGroups);
			const csmId = index.getFirstTagID('CSM Type', 'CSM');
			const cimId = index.getFirstTagID('Category', 'CIM');
			const appMapId = index.getFirstTagID('BC Type', 'AppMap');
			lx.executeGraphQL(this._createQuery(csmId, cimId, appMapId)).then((data) => {
				index.put(data);
				this._handleData(index, csmId, cimId, appMapId);
			});
		});
	}

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_createQuery(csmId, cimId, appMapId) {
		// initial assume tagGroup.name changed or the id couldn't be determined otherwise
		let idFilter = { csm: '', cim: '', appMap: '' };
		// initial assume to get it
		let tagNameDef = {
			csm: 'tags { name }',
			cim: 'tags { name }',
			appMap: 'tags { name }'
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
		return `{csm: allFactSheets(
					sort: { mode: BY_FIELD, key: "displayName", order: asc },
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["CSM"]},
						{facetKey: "hierarchyLevel", operator: OR, keys: ["1", "2", "3"]}
						${idFilter.csm}
					]}
				) {
					edges { node {
						id name description level ${tagNameDef.csm}
						... on CSM {
							serviceStatus
							relToParent { edges { node { factSheet { id } } } }
							relCSMToDataObject { edges { node { factSheet { id } } } }
						}
					}}
				}
				doCim: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["DataObject"]}
						${idFilter.cim}
					]}
				){
					edges {node {
						id ${tagNameDef.cim}
						... on DataObject {
							relDataObjectToBusinessCapability { edges { node { factSheet { id } } } }
						}
					}}
				},
				bcAppMap: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]}
						${idFilter.appMap}
					]}
				){
					edges { node {
						id ${tagNameDef.appMap}
						... on BusinessCapability {
							relBusinessCapabilityToPlatform { edges { node { factSheet { id name } } } }
						}
					}}
				}}`;
	}

	_handleData(index, csmId, cimId, appMapId) {
		const tableData = [];
		index.csm.nodes.forEach((e) => {
			if (!csmId && !index.includesTag(e, 'CSM')) {
				return;
			}
			const hierarchy = {};
			let tmp = e;
			while (tmp) {
				hierarchy['L' + tmp.level] = tmp;
				tmp = index.getParent('csm', tmp.id);
			}
			const cimDOs = [];
			const subIndexCIM = e.relCSMToDataObject;
			if (subIndexCIM) {
				subIndexCIM.nodes.forEach((e2) => {
					// access doCim
					const cim = index.doCim.byID[e2.id];
					if (!cim || (!cimId && !index.includesTag(cim, 'CIM'))) {
						return;
					}
					cimDOs.push(cim);
				});
			}
			const platformBCsSet = {};
			cimDOs.forEach((cim) => {
				const appMapBCs = [];
				const subIndexAppMapBCs = cim.relDataObjectToBusinessCapability;
				if (subIndexAppMapBCs) {
					subIndexAppMapBCs.nodes.forEach((e2) => {
						// access bcAppMap
						const appMap = index.bcAppMap.byID[e2.id];
						if (!appMap || (!appMapId && !index.includesTag(appMap, 'AppMap'))) {
							return;
						}
						const subIndexPlatformBCs = appMap.relBusinessCapabilityToPlatform;
						if (subIndexPlatformBCs) {
							subIndexPlatformBCs.nodes.forEach((e3) => {
								platformBCsSet[e3.id] = e3;
							});
						}
					});
				}
			});
			const platformBCs = [];
			for (let key in platformBCsSet) {
				platformBCs.push(platformBCsSet[key]);
			}
			tableData.push({
				id: e.id,
				level: e.level,
				domainId: hierarchy.L1 ? hierarchy.L1.id : '',
				domain: hierarchy.L1 ? this._removeNumbering(hierarchy.L1.name) : '',
				nameId: hierarchy.L2 ? hierarchy.L2.id : '',
				name: hierarchy.L2 ? this._removeNumbering(hierarchy.L2.name) : '',
				operationId: hierarchy.L3 ? hierarchy.L3.id : '',
				operation: hierarchy.L3 ? this._removeNumbering(hierarchy.L3.name) : '',
				description: e.description,
				operationStatus: this._getOptionKeyFromValue(
					this.SERVICE_STATUS_OPTIONS, e.serviceStatus),
				platforms: platformBCs.map((e2) => {
					return e2.name;
				}),
				platformIds: platformBCs.map((e2) => {
					return e2.id;
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
					level: LEVEL_OPTIONS,
					serviceStatus: this.SERVICE_STATUS_OPTIONS
				}}
				setup={this.state.setup} />
		);
	}
}

export default Report;
