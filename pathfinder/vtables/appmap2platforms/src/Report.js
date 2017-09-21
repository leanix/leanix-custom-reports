import React, {	Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Table from './Table';

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
			lx.executeGraphQL(this._createQuery(appMapId)).then((data) => {
				index.put(data);
				this._handleData(index, appMapId);
			});
		});
	}

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_createQuery(appMapId) {
		let appMapIdFilter = ''; // initial assume tagGroup.name changed or the id couldn't be determined otherwise
		let tagNameDef = 'tags { name }'; // initial assume to get it
		if (appMapId) {
			appMapIdFilter = `, {facetKey: "BC Type", keys: ["${appMapId}"]}`;
			tagNameDef = '';
		}
		return `{businessCapabilities: allFactSheets(
					sort: { mode: BY_FIELD, key: "displayName", order: asc },
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]}
						${appMapIdFilter}
					]}
				) {
					edges { node {
						id name ${tagNameDef}
						... on BusinessCapability {
							relBusinessCapabilityToPlatform {
								edges { node { factSheet {
									id name
									... on BusinessCapability {
										relToParent { edges { node { factSheet { id name } } } }
									}
								}}}
							}
							relToParent { edges { node { factSheet { id name } } } }
						}
					}}
				}}`;
	}

	_handleData(index, appMapId) {
		const tableData = [];
		index.businessCapabilities.nodes.forEach((e) => {
			let appMapL2 = e;
			if (!appMapId && !index.includesTag(appMapL2, 'AppMap')) {
				return;
			}
			const subIndex = appMapL2.relBusinessCapabilityToPlatform;
			if (!subIndex) {
				return;
			}
			let appMapL1 = appMapL2.relToParent ? appMapL2.relToParent.nodes[0] : undefined;
			if (!appMapL1) {
				appMapL1 = appMapL2;
				appMapL2 = undefined;
			}
			subIndex.nodes.forEach((e2) => {
				let platformL2 = e2;
				let platformL1 = platformL2.relToParent ? platformL2.relToParent.nodes[0] : undefined;
				if (!platformL1) {
					platformL1 = platformL2;
					platformL2 = undefined;
				}
				tableData.push({
					id: e.id + '-' + e2.id,
					appMapL1Id: appMapL1.id,
					appMapL1Name: appMapL1 ? appMapL1.name : '',
					appMapL2Id: appMapL2 ? appMapL2.id : '',
					appMapL2Name: appMapL2 ? appMapL2.name : '',
					platformL1Id: platformL1.id,
					platformL1Name: platformL1.name,
					platformL2Id: platformL2 ? platformL2.id : '',
					platformL2Name: platformL2 ? platformL2.name : ''
				});
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
				setup={this.state.setup} />
		);
	}
}

export default Report;
