import React, { Component } from 'react';
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
		this.setState({
			setup: setup
		});
		// get all tags, then the data
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			const index = new DataIndex();
			index.put(tagGroups);
			const appMapID = index.getFirstTagID('BC Type', 'AppMap');
			lx.executeGraphQL(this._createQuery(appMapID)).then((data) => {
				index.put(data);
				this._handleData(index, appMapID);
			});
		});
	}

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_createQuery(appMapID) {
		let appMapIDFilter = ''; // initial assume tagGroup.name changed or the id couldn't be determined otherwise
		let tagNameDef = 'tags { name }'; // initial assume to get it
		if (appMapID) {
			appMapIDFilter = `, {facetKey: "BC Type", keys: ["${appMapID}"]}`;
			tagNameDef = '';
		}
		return `{businessCapabilities: allFactSheets(
					sort: {mode: BY_FIELD, key: "displayName", order: asc},
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]}
						${appMapIDFilter}
					]}
				) {
					edges { node {
						id name ${tagNameDef}
						... on BusinessCapability {
							relToParent {
								edges { node { factSheet { id name } } }
							}
							relBusinessCapabilityToProcess { edges { node { factSheet {
								id name
								... on Process {
									relToParent { edges { node { factSheet {
										id name
										... on Process {
											relToParent { edges { node { factSheet {
												id name
												... on Process {
													relToParent { edges { node {
														factSheet { id name }
													}}}
												}
											}}}}
										}
									}}}}
								}
							}}}}
						}
					}}
				}}`;
	}

	_handleData(index, appMapID) {
		const tableData = [];
		index.businessCapabilities.nodes.forEach((e) => {
			let appMapL2 = e;
			if (!appMapID && !index.includesTag(appMapL2, 'AppMap')) {
				return;
			}
			const subIndex = appMapL2.relBusinessCapabilityToProcess;
			if (!subIndex) {
				return;
			}
			let appMapL1 = appMapL2.relToParent ? appMapL2.relToParent.nodes[0] : undefined;
			if (!appMapL1) {
				appMapL1 = appMapL2;
				appMapL2 = undefined;
			}
			subIndex.nodes.forEach((e2) => {
				// please note: every process has an eTOM tag, no need to filter
				let etomL4 = e2;
				let etomL3 = etomL4.relToParent ? etomL4.relToParent.nodes[0] : undefined;
				let etomL2 = etomL3 && etomL3.relToParent ? etomL3.relToParent.nodes[0] : undefined;
				let etomL1 = etomL2 && etomL2.relToParent ? etomL2.relToParent.nodes[0] : undefined;
				while (!etomL1) {
					etomL1 = etomL2;
					etomL2 = etomL3;
					etomL3 = etomL4;
					etomL4 = undefined;
				}
				tableData.push({
					id: e.id + '-' + e2.id,
					appMapL1Id: appMapL1.id,
					appMapL1Name: appMapL1.name,
					appMapL2Id: appMapL2 ? appMapL2.id : '',
					appMapL2Name: appMapL2 ? appMapL2.name : '',
					etomL1Id: etomL1.id,
					etomL1Name: etomL1.name,
					etomL2Id: etomL2 ? etomL2.id : '',
					etomL2Name: etomL2 ? etomL2.name : '',
					etomL3Id: etomL3 ? etomL3.id : '',
					etomL3Name: etomL3 ? etomL3.name : '',
					etomL4Id: etomL4 ? etomL4.id : '',
					etomL4Name: etomL4 ? etomL4.name : ''
				});
			});
		});
		this.setState({
			data: tableData
		});
	}

	render() {
		return (
			<Table data={this.state.data}
				setup={this.state.setup} />
		);
	}
}

export default Report;
