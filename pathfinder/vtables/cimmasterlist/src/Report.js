import React, {	Component } from 'react';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import CommonQueries from './CommonGraphQLQueries';
import DataIndex from './DataIndex';
import Link from './Link';

const LANDSCAPE_OPTIONS = {
	0: 'Yes',
	1: 'No'
};

class Report extends Component {

	constructor(props) {
		super(props);
		this._initReport = this._initReport.bind(this);
		this._handleData = this._handleData.bind(this);
		this._formatName = this._formatName.bind(this);
		this._formatAppMaps = this._formatAppMaps.bind(this);
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
			let appMapID = index.getTags('BC Type', 'AppMap');
			if (appMapID.length > 0) {
				appMapID = appMapID[0].id;
			} else {
				appMapID = undefined;
			}
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
		if (appMapID) {
			return `{dataObjectsL1: allFactSheets(
						filter: {facetFilters: [{facetKey: "FactSheetTypes", keys: ["DataObject"]}, {facetKey: "hierarchyLevel", keys: ["1"]}]}
					) {
						edges { node { id name description } }
					}
					dataObjectsL2: allFactSheets(
						sort: {mode: BY_FIELD, key: "name", order: asc},
						filter: {facetFilters: [{facetKey: "FactSheetTypes", keys: ["DataObject"]}, {facetKey: "hierarchyLevel", keys: ["2"]}]}
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
							{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]},
							{facetKey: "BC Type", keys: ["${appMapID}"]}
						]}
					) {
						edges { node { id displayName } }
					}}`;
		} else {
			// tagGroup.name changed or id couldn't be determined otherwise -> need a query with tags for bc's
			return `{dataObjectsL1: allFactSheets(
						filter: {facetFilters: [{facetKey: "FactSheetTypes", keys: ["DataObject"]}, {facetKey: "hierarchyLevel", keys: ["1"]}]}
					) {
						edges { node { id name description } }
					}
					dataObjectsL2: allFactSheets(
						sort: {mode: BY_FIELD, key: "name", order: asc},
						filter: {facetFilters: [{facetKey: "FactSheetTypes", keys: ["DataObject"]}, {facetKey: "hierarchyLevel", keys: ["2"]}]}
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
						filter: {facetFilters: [{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]}]}
					) {
						edges { node { id displayName tags { name } } }
					}}`;
		}
	}

	_handleData(index, appMapID) {
		const tableData = [];
		index.dataObjectsL2.nodes.forEach((e) => {
			const parent = index.getParent('dataObjectsL2', e.id);
			let appMapBCs = [];
			const subIndex = e.relDataObjectToBusinessCapability;
			if (subIndex) {
				appMapBCs = subIndex.nodes.map((e2) => {
					return index.businessCapabilities.byID[e2.id];
				}).filter((e2) => {
					return e2 !== undefined && e2 !== null;
				});
				if (!appMapID) {
					// filter for tag name
					appMapBCs = appMapBCs.filter((e2) => {
						return e2 && index.includesTag(e2, 'AppMap');
					});
				}
			}
			tableData.push({
				domainID: parent && parent.id ? parent.id : '',
				domainName: parent && parent.name ? parent.name : '',
				domainDescription: parent && parent.description ? parent.description : '',
				id: e.id ? e.id : '',
				name: e.name ? e.name : '',
				description: e.description ? e.description : '',
				landscapeAvailable: index.includesTag(e, 'Landscape Available') ? 0 : 1,
				appMaps: appMapBCs.map((e2) => {
					return e2.displayName;
				}),
				appMapIDs: appMapBCs.map((e2) => {
					return e2.id;
				})
			});
		});
		this.setState({
			data: tableData
		});
	}

	/* formatting functions for the table */

	_formatName(cell, row, parent) {
		return (<Link link={'factsheet/DataObject/' + (parent ? row.domainID : row.id)} target='_blank' text={cell} />);
	}

	_formatAppMaps(cell, row) {
		if (!cell) {
			return '';
		}
		return (
			<span>
				{cell.map((e, i) => {
					if (i > 0) {
						return (<span key={i}><br/><Link link={'factsheet/BusinessCapability/' + row.appMapIDs[i]} target='_blank' text={e} /></span>);
					}
					return (<span key={i}><Link link={'factsheet/BusinessCapability/' + row.appMapIDs[i]} target='_blank' text={e} /></span>);
				})}
			</span>
		);
	}

	_formatEnum(cell, row, enums) {
		return enums[cell];
	}

	/* formatting functions for the csv export */

	_csvFormatAppMaps(cell, row) {
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
		if (this.state.data.length === 0) {
			return null;
		}
		return (
			<BootstrapTable data={this.state.data} keyField='id'
				 striped hover search exportCSV
				 options={{ clearSearch: true }}>
				<TableHeaderColumn row='0' colSpan='4'
					 headerAlign='center'
					 csvHeader='Entity'
					>Entity</TableHeaderColumn>
				<TableHeaderColumn dataSort row='1'
					 dataField='domainName'
					 width='200px'
					 headerAlign='left'
					 dataAlign='left'
					 dataFormat={this._formatName}
					 formatExtraData={true}
					 csvHeader='domain-name'
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Domain</TableHeaderColumn>
				<TableHeaderColumn hidden export row='0' colSpan='1'
					 csvHeader='Entity'
					>Entity</TableHeaderColumn>
				<TableHeaderColumn hidden export row='1'
					 dataField='domainID'
					 csvHeader='domain-id'
					>domain-id</TableHeaderColumn>
				<TableHeaderColumn row='1' tdStyle={{ fontSize: '.9em' }}
					 dataField='domainDescription'
					 width='300px'
					 headerAlign='left'
					 dataAlign='left'
					 csvHeader='domain-description'
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Domain Description</TableHeaderColumn>
				<TableHeaderColumn dataSort row='1'
					 dataField='name'
					 width='250px'
					 headerAlign='left'
					 dataAlign='left'
					 dataFormat={this._formatName}
					 formatExtraData={false}
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Name</TableHeaderColumn>
				<TableHeaderColumn hidden export row='0' colSpan='1'
					 csvHeader='Entity'
					>Entity</TableHeaderColumn>
				<TableHeaderColumn hidden export row='1'
					 dataField='id'
					>id</TableHeaderColumn>
				<TableHeaderColumn row='1' tdStyle={{ fontSize: '.9em' }}
					 dataField='description'
					 width='300px'
					 headerAlign='left'
					 dataAlign='left'
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Description</TableHeaderColumn>
				<TableHeaderColumn dataSort row='0' rowSpan='2'
					 dataField='landscapeAvailable'
					 width='130px'
					 headerAlign='left'
					 dataAlign='left'
					 dataFormat={this._formatEnum}
					 formatExtraData={LANDSCAPE_OPTIONS}
					 csvFormat={this._formatEnum}
					 csvFormatExtraData={LANDSCAPE_OPTIONS}
					 filterFormatted
					 filter={{ type: 'SelectFilter', placeholder: 'Please choose', options: LANDSCAPE_OPTIONS }}
					>Landscape Available?</TableHeaderColumn>
				<TableHeaderColumn row='0' rowSpan='2'
					 dataField='appMaps'
					 width='250px'
					 headerAlign='left'
					 dataAlign='left'
					 dataFormat={this._formatAppMaps}
					 csvHeader='appmap-names'
					 csvFormat={this._csvFormatAppMaps}
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Mappings to AppMap</TableHeaderColumn>
				<TableHeaderColumn hidden export row='0' rowSpan='2'
					 dataField='appMapIDs'
					 csvHeader='appmap-ids'
					 csvFormat={this._csvFormatAppMaps}
					>domain-id</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

export default Report;
