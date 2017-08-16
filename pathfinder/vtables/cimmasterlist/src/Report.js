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
		this.setState({
			setup: setup
		});
		// get all tags, then the data
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			const index = new DataIndex();
			index.put(tagGroups);
			const appMapId = index.getFirstTagID('BC Type', 'AppMap');
			const cimId = index.getFirstTagID('Category', 'CIM');
			lx.executeGraphQL(this._createQuery(cimId, appMapId)).then((data) => {
				index.put(data);
				this._handleData(index, cimId, appMapId);
			});
		});
	}

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_createQuery(cimId, appMapId) {
		const cimIdFilter = cimId ? `, {facetKey: "Category", keys: ["${cimId}"]}` : '';
		let appMapIdFilter = ''; // initial assume tagGroup.name changed or the id couldn't be determined otherwise
		let tagNameDef = 'tags { name }'; // initial assume to get it
		if (appMapId) {
			appMapIdFilter = `, {facetKey: "BC Type", keys: ["${appMapId}"]}`;
			tagNameDef = '';
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
				businessCapabilities: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]}
						${appMapIdFilter}
					]}
				) {
					edges { node { id name ${tagNameDef} } }
				}}`;
	}

	_handleData(index, cimId, appMapId) {
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
					// access businessCapabilities
					const bc = index.byID[e2.id];
					if (!bc || (!appMapId && !index.includesTag(e2, 'AppMap'))) {
						return;
					}
					appMapBCs.push(bc);
				});
			}
			tableData.push({
				domainId: parent ? parent.id : '',
				domainName: parent ? parent.name : '',
				domainDescription: parent ? parent.description : '',
				id: e.id,
				name: e.name,
				description: e.description,
				landscapeAvailable: index.includesTag(e, 'Landscape Available') ? 0 : 1,
				appMaps: appMapBCs.map((e2) => {
					return e2.name;
				}),
				appMapIds: appMapBCs.map((e2) => {
					return e2.id;
				})
			});
		});
		this.setState({
			data: tableData
		});
	}

	render() {
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
