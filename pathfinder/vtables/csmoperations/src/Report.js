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
			const csmID = index.getFirstTagID('CSM Type', 'CSM');
			const platformID = index.getFirstTagID('BC Type', 'Platform');
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
		let csmIDFilter = ''; // initial assume tagGroup.name changed or the id couldn't be determined otherwise
		let csmTagNameDef = 'tags { name }'; // initial assume to get it
		if (csmID) {
			csmIDFilter = `, {facetKey: "CSM Type", keys: ["${csmID}"]}`;
			csmTagNameDef = '';
		}
		let platformIDFilter = ''; // initial assume tagGroup.name changed or the id couldn't be determined otherwise
		let platfTagNameDef = 'tags { name }'; // initial assume to get it
		if (platformID) {
			platformIDFilter = `, {facetKey: "BC Type", keys: ["${platformID}"]}`;
			platfTagNameDef = '';
		}
		// TODO: add 'relation CSM to Platform' to the query
		return `{csm: allFactSheets(
					sort: {mode: BY_FIELD, key: "displayName", order: asc},
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["CSM"]},
						{facetKey: "hierarchyLevel", operator: OR, keys: ["1", "2", "3"]}
						${csmIDFilter}
					]}
				) {
					edges { node {
						id name description level ${csmTagNameDef}
						... on CSM {
							serviceStatus
							relToParent { edges { node { factSheet { id } } } }
						}
					}}
				}
				businessCapabilities: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]}
						${platformIDFilter}
					]}
				) {
					edges { node { id name ${platfTagNameDef} } }
				}}`;
	}

	_handleData(index, csmID, platformID) {
		const tableData = [];
		index.csm.nodes.forEach((e) => {
			if (!csmID && !index.includesTag(e, 'CSM')) {
				return;
			}
			const hierarchy = {};
			let tmp = e;
			while (tmp) {
				hierarchy['L' + tmp.level] = tmp;
				tmp = index.getParent('csm', tmp.id);
			}
			let platformBCs = [];
			// TODO: relation CSM to Platform
			/* const subIndex = e.relCsmToPlatform;
			if (subIndex) {
				subIndex.nodes.forEach((e2) => {
					// access businessCapabilities
					const bc = index.byID[e2.id];
					if (!bc || (!platformID && !index.includesTag(e2, 'Platform'))) {
						return;
					}
					platformBCs.push(bc);
				});
			} */
			tableData.push({
				id: e.id,
				level: e.level,
				domainId: hierarchy.L1 ? hierarchy.L1.id : '',
				domain: hierarchy.L1 ? hierarchy.L1.name : '',
				nameId: hierarchy.L2 ? hierarchy.L2.id : '',
				name: hierarchy.L2 ? hierarchy.L2.name : '',
				operationId: hierarchy.L3 ? hierarchy.L3.id : '',
				operation: hierarchy.L3 ? hierarchy.L3.name : '',
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
