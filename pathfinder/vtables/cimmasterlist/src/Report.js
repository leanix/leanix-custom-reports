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
			const cimID = index.getFirstTagID('Category', 'CIM');
			lx.executeGraphQL(this._createQuery(cimID, appMapID)).then((data) => {
				index.put(data);
				this._handleData(index, cimID, appMapID);
			});
		});
	}

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_createQuery(cimID, appMapID) {
		const cimIDFilter = cimID ? `, {facetKey: "Category", keys: ["${cimID}"]}` : '';
		let appMapIDFilter = ''; // initial assume tagGroup.name changed or the id couldn't be determined otherwise
		let tagNameDef = 'tags { name }'; // initial assume to get it
		if (appMapID) {
			appMapIDFilter = `, {facetKey: "BC Type", keys: ["${appMapID}"]}`;
			tagNameDef = '';
		}
		return `{dataObjectsL1: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["DataObject"]},
						{facetKey: "hierarchyLevel", keys: ["1"]}
						${cimIDFilter}
					]}
				) {
					edges { node { id name description } }
				}
				dataObjectsL2: allFactSheets(
					sort: {mode: BY_FIELD, key: "name", order: asc},
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["DataObject"]},
						{facetKey: "hierarchyLevel", keys: ["2"]}
						${cimIDFilter}
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
						${appMapIDFilter}
					]}
				) {
					edges { node { id displayName ${tagNameDef} } }
				}}`;
	}

	_handleData(index, cimID, appMapID) {
		const tableData = [];
		index.dataObjectsL2.nodes.forEach((e) => {
			if (!cimID && !index.includesTag(e, 'CIM')) {
				return;
			}
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
				domainID: parent ? parent.id : '',
				domainName: parent ? parent.name : '',
				domainDescription: parent ? parent.description : '',
				id: e.id,
				name: e.name,
				description: e.description,
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

	_formatDescription(cell, row) {
		if (!cell) {
			return '';
		}
		return cell;
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
		if (!cell && cell !== 0) {
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
		return (
			<BootstrapTable data={this.state.data} keyField='id'
				 striped hover search exportCSV
				 options={{ clearSearch: true }}>
				<TableHeaderColumn dataSort
					 dataField='domainName'
					 width='200px'
					 dataAlign='left'
					 dataFormat={this._formatName}
					 formatExtraData={true}
					 csvHeader='domain-name'
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Domain</TableHeaderColumn>
				<TableHeaderColumn tdStyle={{ fontSize: '.85em' }}
					 dataField='domainDescription'
					 width='300px'
					 dataAlign='left'
					 dataFormat={this._formatDescription}
					 csvHeader='domain-description'
					 csvFormat={this._formatDescription}
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Domain Description</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='name'
					 width='250px'
					 dataAlign='left'
					 dataFormat={this._formatName}
					 formatExtraData={false}
					 csvHeader='entity-name'
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Entity name</TableHeaderColumn>
				<TableHeaderColumn tdStyle={{ fontSize: '.85em' }}
					 dataField='description'
					 width='300px'
					 dataAlign='left'
					 dataFormat={this._formatDescription}
					 csvHeader='entity-description'
					 csvFormat={this._formatDescription}
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Entity description</TableHeaderColumn>
				<TableHeaderColumn dataSort
					 dataField='landscapeAvailable'
					 width='130px'
					 dataAlign='left'
					 dataFormat={this._formatEnum}
					 formatExtraData={LANDSCAPE_OPTIONS}
					 csvHeader='landscape-available'
					 csvFormat={this._formatEnum}
					 csvFormatExtraData={LANDSCAPE_OPTIONS}
					 filter={{ type: 'SelectFilter', placeholder: 'Please choose', options: LANDSCAPE_OPTIONS }}
					>Landscape Available?</TableHeaderColumn>
				<TableHeaderColumn
					 dataField='appMaps'
					 width='250px'
					 dataAlign='left'
					 dataFormat={this._formatArray}
					 csvHeader='appmap-names'
					 csvFormat={this._csvFormatArray}
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Mappings to AppMap</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

export default Report;
