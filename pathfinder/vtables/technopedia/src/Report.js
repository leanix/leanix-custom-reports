import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Utilities from './common/Utilities';
import Table from './Table';

const CATEGORY_EXCLUDE_SERVICE = 'service';
const CATEGORY_EXCLUDE_DEVELOPMENT_TECHNOLOGY = 'developmentTechnology';

class Report extends Component {

	constructor(props) {
		super(props);
		this._initReport = this._initReport.bind(this);
		this._handleData = this._handleData.bind(this);
		this.CATEGORY_OPTIONS = {};
		// TODO: get Technopedia state from model as soon as it is available as attribute
		this.TECHNOP_STATE = {
			0: 'LINKED',
			1: 'IGNORED',
			2: 'MISSING',
			3: 'n/a'
		};
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
		const factsheetModel = setup.settings.dataModel.factSheets.ITComponent;
		this.CATEGORY_OPTIONS = Utilities.createOptionsObjFrom(
			factsheetModel, 'fields.category.values');
		// TODO exclusion in common unterbringen
		delete this.CATEGORY_OPTIONS[Utilities.getKeyToValue(this.CATEGORY_OPTIONS, CATEGORY_EXCLUDE_SERVICE)];
		delete this.CATEGORY_OPTIONS[Utilities.getKeyToValue(this.CATEGORY_OPTIONS, CATEGORY_EXCLUDE_DEVELOPMENT_TECHNOLOGY)];
		// get all tags, then the data
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			const index = new DataIndex();
			index.put(tagGroups);
			const applicationTagId = index.getFirstTagID('Application Type', 'Application');
			lx.executeGraphQL(this._createQuery(applicationTagId)).then((data) => {
				index.put(data);
				this._handleData(index, applicationTagId);
			});
		});
	}

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_createQuery(applicationTagId) {
		let applicationTagIdFilter = ''; // initial assume tagGroup.name changed or the id couldn't be determined otherwise
		let tagNameDef = 'tags { name }'; // initial assume to get it
		if (applicationTagId) {
			applicationTagIdFilter = `, {facetKey: "Application Type", keys: ["${applicationTagId}"]}`;
			tagNameDef = '';
		}
		return `{applications: allFactSheets(
					sort: { mode: BY_FIELD, key: "displayName", order: asc },
					filter: { facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Application"]}
						${applicationTagIdFilter}
					]}
				) {
					edges { node {
						id name ${tagNameDef}
						... on Application {
							relApplicationToITComponent {
								edges { node { factSheet { id } } }
							}
						}
					}}
				}
				itComponents: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["ITComponent"]},
						{facetKey: "category", keys: ["software", "hardware"]}
					]}
				) {
					edges { node {
						id name displayName
						... on ITComponent {
							category
							technopediaId { status }
							relITComponentToApplication {
								edges { node { factSheet { id } } }
							}
						}
					}}
				}}`;
	}

	_handleData(index, applicationTagId) {
		const tableData = [];
		index.applications.nodes.forEach((app) => {
			if (!applicationTagId && !index.includesTag(app, 'Application')) {
				return;
			}
			const subIndex = app.relApplicationToITComponent;
			if (!subIndex) {
				return;
			}

			subIndex.nodes.forEach((e2) => {
				// access itComponents (Software & Hardware)
				const itcmp = index.itComponents.byID[e2.id];
				if (!itcmp) {
					return;
				}
				tableData.push({
					id: app.id + '-' + itcmp.id,
					appName: app.name,
					appId: app.id,
					itcmpName: itcmp.category === 'hardware' ? itcmp.name : itcmp.displayName,
					itcmpId: itcmp.id,
					itcmpCategory: this._getOptionKeyFromValue(this.CATEGORY_OPTIONS, itcmp.category),
					state: this._getOptionKeyFromValue(this.TECHNOP_STATE, itcmp.technopediaId ? itcmp.technopediaId.status : 'n/a'),
					count: this._getCountInOtherMarkets(index, itcmp, Utilities.getMarket(app))
				});
			});
		});
		lx.hideSpinner();
		this.setState({
			data: tableData
		});
	}

	_getCountInOtherMarkets(index, itcmp, market) {
		if (!itcmp || !itcmp.relITComponentToApplication || !market) {
			return 0;
		}
		let count = 0;
		itcmp.relITComponentToApplication.nodes.forEach((e) => {
			// access applications
			const app = index.byID[e.id];
			const appmarket = Utilities.getMarket(app);
			if (appmarket && appmarket !== market) {
				count++;
			}
		});
		return count;
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
					category: this.CATEGORY_OPTIONS,
					technopState: this.TECHNOP_STATE
				}}
				setup={this.state.setup} />
		);
	}
}

export default Report;
