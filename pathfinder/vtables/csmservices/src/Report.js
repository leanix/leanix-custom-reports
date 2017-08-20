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
		this.SERVICE_ORIGIN_OPTIONS = {}
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
		this.SERVICE_ORIGIN_OPTIONS = Utilities.createOptionsObjFrom(
			factsheetModel, 'fields.serviceOrigin.values');
		// get all tags, then the data
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			const index = new DataIndex();
			index.put(tagGroups);
			const csmId = index.getFirstTagID('CSM Type', 'CSM');
			lx.executeGraphQL(this._createQuery(csmId)).then((data) => {
				index.put(data);
				this._handleData(index, csmId);
			});
		});
	}

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_createQuery(csmId) {
		let csmIdFilter = ''; // initial assume tagGroup.name changed or the id couldn't be determined otherwise
		let tagNameDef = 'tags { name }'; // initial assume to get it
		if (csmId) {
			csmIdFilter = `, {facetKey: "CSM Type", keys: ["${csmId}"]}`;
			tagNameDef = '';
		}
		return `{csm: allFactSheets(
					sort: { mode: BY_FIELD, key: "displayName", order: asc },
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["CSM"]},
						{facetKey: "hierarchyLevel", keys: ["2"]}
						${csmIdFilter}
					]}
				) {
					edges { node {
						id name description ${tagNameDef}
						... on CSM {
							serviceStatus serviceClassification serviceOrigin
							relToParent { edges { node { factSheet { id name } } } }
							relToRequires (facetFilters: [
								{facetKey: "FactSheetTypes", keys: ["Application"]}
							]) { edges { node { factSheet { id name tags { name } } } } }
							relCSMToDataObject { edges { node { factSheet { id name tags { name } } } } }
						}
					}}
				}}`;
	}

	_handleData(index, csmId) {
		const tableData = [];
		index.csm.nodes.forEach((csmL2) => {
			if (!csmId && !index.includesTag(csmL2, 'CSM')) {
				return;
			}
			const csmL1 = csmL2.relToParent ? csmL2.relToParent.nodes[0] : undefined;
			const platfProdByBCs = []; // TODO
			const platfConsByBCs = []; // TODO
			const bcaBCs = []; // TODO
			const tmfAPPs = csmL2.relToRequires ? csmL2.relToRequires.nodes.filter((e) => {
				// filter for tag name (unfortunately not possible in query on relation)
				return index.includesTag(e, 'TMF2');
			}) : [];
			const cimDOs = csmL2.relCSMToDataObject ? csmL2.relCSMToDataObject.nodes.filter((e) => {
				// filter for tag name (unfortunately not possible in query on relation)
				return index.includesTag(e, 'CIM');
			}) : [];
			tableData.push({
				csmL1Id: csmL1 ? csmL1.id : '',
				csmL1Name: csmL1 ? csmL1.name : '',
				csmL2Id: csmL2.id,
				csmL2Name: csmL2.name,
				csmL2Desc: csmL2.description,
				serviceStatus: this._getOptionKeyFromValue(
					this.SERVICE_STATUS_OPTIONS, csmL2.serviceStatus),
				serviceClass: this._getOptionKeyFromValue(
					this.SERVICE_CLASSIFICATION_OPTIONS, csmL2.serviceClassification),
				serviceOrigin: this._getOptionKeyFromValue(
					this.SERVICE_ORIGIN_OPTIONS, csmL2.serviceOrigin),
				platfProdByBCsIds: platfProdByBCs.map((e) => {
					return e.id;
				}),
				platfProdByBCsNames: platfProdByBCs.map((e) => {
					return e.name;
				}),
				platfConsByBCsIds: platfConsByBCs.map((e) => {
					return e.id;
				}),
				platfConsByBCsNames: platfConsByBCs.map((e) => {
					return e.name;
				}),
				bcaBCsIds: bcaBCs.map((e) => {
					return e.id;
				}),
				bcaBCsNames: bcaBCs.map((e) => {
					return e.name;
				}),
				tmfAppIds: tmfAPPs.map((e) => {
					return e.id;
				}),
				tmfAppNames: tmfAPPs.map((e) => {
					return e.name;
				}),
				cimDOsIds: cimDOs.map((e) => {
					return e.id;
				}),
				cimDOsNames: cimDOs.map((e) => {
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

	render() {
		if (this.state.data.length === 0) {
			return (<h4 className='text-center'>Loading data ...</h4>);
		}
		return (
			<Table data={this.state.data}
				options={{
					serviceStatus: this.SERVICE_STATUS_OPTIONS,
					serviceClassification: this.SERVICE_CLASSIFICATION_OPTIONS,
					serviceOrigin: this.SERVICE_ORIGIN_OPTIONS
				}}
				setup={this.state.setup} />
		);
	}
}

export default Report;
