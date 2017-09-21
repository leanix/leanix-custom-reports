import React, {	Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Table from './Table';

const LANDSCAPE_OPTIONS = {
	0: 'Yes',
	1: 'No'
};

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
		lx.showSpinner('Loading data...');
		this.setState({
			setup: setup
		});
		// get all tags, then the data
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			const index = new DataIndex();
			index.put(tagGroups);
			const appMapId = index.getFirstTagID('BC Type', 'AppMap');
			const cimId = index.getFirstTagID('Category', 'CIM');
			const platformId = index.getFirstTagID('BC Type', 'Platform');
			lx.executeGraphQL(this._createQuery(cimId, appMapId, platformId)).then((data) => {
				index.put(data);
				this._handleData(index, cimId, appMapId, platformId);
			});
		});
	}

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_createQuery(cimId, appMapId, platformId) {
		const cimIdFilter = cimId ? `, {facetKey: "Category", keys: ["${cimId}"]}` : '';
		let appMapIdFilter = ''; // initial assume tagGroup.name changed or the id couldn't be determined otherwise
		let tagNameDef = 'tags { name }'; // initial assume to get it
		if (appMapId) {
			appMapIdFilter = `, {facetKey: "BC Type", keys: ["${appMapId}"]}`;
			tagNameDef = '';
		}
		let platformIdFilter = ''; // initial assume tagGroup.name changed or the id couldn't be determined otherwise
		let platformTagNameDef = 'tags { name }'; // initial assume to get it
		if (platformId) {
			platformIdFilter = `, {facetKey: "BC Type", keys: ["${platformId}"]}`;
			platformTagNameDef = '';
		}
		return `{dataObjectsL1: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["DataObject"]},
						{facetKey: "hierarchyLevel", keys: ["1"]}
						${cimIdFilter}
					]}
				) {
					edges { node { id name description } }
				}
				dataObjectsL2: allFactSheets(
					sort: { mode: BY_FIELD, key: "name", order: asc },
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["DataObject"]},
						{facetKey: "hierarchyLevel", keys: ["2"]}
						${cimIdFilter}
					]}
				) {
					edges { node {
						id name description tags { name }
						... on DataObject {
							relToParent { edges { node { factSheet { id } } } }
							relDataObjectToBusinessCapability { edges { node { factSheet { id } } } }
						}
					}}
				}
				bcAppMap: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]}
						${appMapIdFilter}
					]}
				) {
					edges { node {
						id name ${tagNameDef}
						... on BusinessCapability {
							relToParent { edges { node { factSheet { id } } } }
							relBusinessCapabilityToPlatform { edges { node { factSheet { id } } } }
						}
					} }
				}
				bcPlatform: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]}
						${platformIdFilter}
					]}
				) {
					edges { node {
						id name ${platformTagNameDef}
					}}
				}}`;
	}

	_handleData(index, cimId, appMapId, platformId) {
		const tableData = [];
		index.dataObjectsL2.nodes.forEach((e) => {
			if (!cimId && !index.includesTag(e, 'CIM')) {
				return;
			}
			const parent = index.getParent('dataObjectsL2', e.id);
			const appMapBCs = [];
			const subIndex = e.relDataObjectToBusinessCapability;
			if (subIndex) {
				subIndex.nodes.forEach((e2) => {
					// access bcAppMap
					const bc = index.byID[e2.id];
					if (!bc || (!appMapId && !index.includesTag(e2, 'AppMap'))) {
						return;
					}
					appMapBCs.push(bc);
				});
			}
			const platformBCsSet = {};
			appMapBCs.forEach((e2) => {
				const subIndex = e2.relBusinessCapabilityToPlatform;
				if (subIndex) {
					subIndex.nodes.forEach((e3) => {
						// access bcPlatform
						const platform = index.bcPlatform.byID[e3.id];
						if (!platform || (!platformId && !index.includesTag(platform, 'Platform'))) {
							return;
						}
						platformBCsSet[platform.id] = platform;
					});
				}
			});
			const platformBCs = [];
			for (let key in platformBCsSet) {
				platformBCs.push(platformBCsSet[key]);
			}
			const appMapL1BCsSet = {};
			appMapBCs.forEach((e2) => {
				let parent2 = index.getParent('bcAppMap', e2.id);
				if (!parent2) {
					// e2 belongs to L1
					parent2 = {
						name: e2.name,
						id: e2.id
					};
					e2.id = '';
				}
				appMapL1BCsSet[parent2.id] = parent2;
			});
			const appMapL1BCs = [];
			for (let key in appMapL1BCsSet) {
				appMapL1BCs.push(appMapL1BCsSet[key]);
			}
			const appMapL2BCs = appMapBCs.filter((e2) => {
				return e2.id.length;
			});
			tableData.push({
				domainId: parent ? parent.id : '',
				domainName: parent ? parent.name : '',
				domainDescription: parent ? parent.description : '',
				id: e.id,
				name: e.name,
				description: e.description,
				landscapeAvailable: index.includesTag(e, 'Landscape Available') ? 0 : 1,
				appMapsL1: appMapL1BCs.map((e2) => {
					return e2.name;
				}),
				appMapIdsL1: appMapL1BCs.map((e2) => {
					return e2.id;
				}),
				appMapsL2: appMapL2BCs.map((e2) => {
					return e2.name;
				}),
				appMapIdsL2: appMapL2BCs.map((e2) => {
					return e2.id;
				}),
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

	render() {
		if (this.state.data.length === 0) {
			return (<h4 className='text-center'>Loading data...</h4>);
		}
		return (
			<Table data={this.state.data}
				options={{
					landscape: LANDSCAPE_OPTIONS
				}}
				setup={this.state.setup} />
		);
	}
}

export default Report;
