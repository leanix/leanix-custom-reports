import React, {	Component } from 'react';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import CommonQueries from './CommonGraphQLQueries';
import DataIndex from './DataIndex';
import Link from './Link';
import LinkList from './LinkList';

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
		let appMapIDFilter = undefined;
		let tagNameDef = undefined;
		if (appMapID) {
			appMapIDFilter = `, {facetKey: "BC Type", keys: ["${appMapID}"]}`;
			tagNameDef = '';
		} else {
			// tagGroup.name changed or id couldn't be determined otherwise -> need a query with tags for bc's
			appMapIDFilter = '';
			tagNameDef = 'tags { name }';
		}
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
						{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]} ${appMapIDFilter}
					]}
				) {
					edges { node { id displayName ${tagNameDef} } }
				}}`;
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
						return index.includesTag(e2, 'AppMap');
					});
				}
			}
			tableData.push({
				domainID: parent && parent.id ? parent.id : '',
				domainName: parent && parent.name ? parent.name : '',
				domainDescription: parent && parent.description ? parent.description : '',
				id: e.id,
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
		if (!cell) {
			return '';
		}
		return (<Link link={'factsheet/DataObject/' + (parent ? row.domainID : row.id)} target='_blank' text={cell} />);
	}

	_formatArray(cell, row) {
		if (!cell) {
			return '';
		}
		return (
			<LinkList links={
				cell.reduce((arr, e, i) => {
					arr.push({
						link: 'factsheet/BusinessCapability/' + row.appMapIDs[i],
						target: '_blank',
						text: e
					});
					return arr;
			}, [])} />
		);
	}

	_formatEnum(cell, row, enums) {
		if (cell < 0) {
			return '';
		}
		return enums[cell];
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
		if (this.state.data.length === 0) {
			return null;
		}
		return (
			<BootstrapTable data={this.state.data} keyField='id'
				 striped hover search exportCSV
				 options={{ clearSearch: true }}>
				<TableHeaderColumn row='0' colSpan='4'
					 headerAlign='center'
					 csvHeader='entity'
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
				{/* a header column for csv export only */}
				<TableHeaderColumn hidden export row='0'
					 csvHeader='entity'
					>Entity</TableHeaderColumn>
				<TableHeaderColumn hidden export row='1'
					 dataField='domainID'
					 csvHeader='domain-id'
					>domain-id</TableHeaderColumn>
				<TableHeaderColumn row='1' tdStyle={{ fontSize: '.85em' }}
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
				{/* a header column for csv export only */}
				<TableHeaderColumn hidden export row='0'
					 csvHeader='entity'
					>Entity</TableHeaderColumn>
				<TableHeaderColumn hidden export row='1'
					 dataField='id'
					>id</TableHeaderColumn>
				<TableHeaderColumn row='1' tdStyle={{ fontSize: '.85em' }}
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
					 csvHeader='landscape-available'
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
					 dataFormat={this._formatArray}
					 csvHeader='appmap-names'
					 csvFormat={this._csvFormatArray}
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Mappings to AppMap</TableHeaderColumn>
				<TableHeaderColumn hidden export row='0' rowSpan='2'
					 dataField='appMapIDs'
					 csvHeader='appmap-ids'
					 csvFormat={this._csvFormatAppMaps}
					>appmap ids</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

export default Report;
