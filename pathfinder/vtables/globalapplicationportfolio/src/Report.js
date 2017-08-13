import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Utilities from './common/Utilities';
import Table from './Table';

// TODO https://facebook.github.io/react/docs/optimizing-performance.html#webpack

class Report extends Component {

	constructor(props) {
		super(props);
		this._initReport = this._initReport.bind(this);
		this._handleData = this._handleData.bind(this);
		this.LIFECYCLE_PHASE_OPTIONS = {};
		this.RECOMMENDATION_OPTIONS = {};
		this.MARKET_OPTIONS = {}; // TODO
		this.COST_CENTRE_OPTIONS = {};
		this.ADM_SCOPE_OPTIONS = {};
		this.STACK_OPTIONS = {};
		this.COTS_PACKAGE_OPTIONS = {};
		this.LAST_MAJOR_UPGRADE_OPTIONS = {}; // TODO
		this.CUSTOMISATION_LEVEL_OPTIONS = {};
		this.FUNCTIONAL_SUITABILITY_OPTIONS = {};
		this.TECHNICAL_SUITABILITY_OPTIONS = {};
		this.APPLICATION_COMPLEXITY_OPTIONS = {};
		this.BUSINESS_CRITICALITY_OPTIONS = {};
		this.APPLICATION_USAGE_OPTIONS = {};
		this.DEPLOYMENT_OPTIONS = {};
		this.SOX_PCI_OPTIONS = {};
		this.ACCESS_TYPE_OPTIONS = {};
		this.NETWORK_TECHNICAL_PRODUCT_FAMILY_OPTIONS = {};
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
		this.LIFECYCLE_PHASE_OPTIONS = Utilities.createOptionsObj(
			Utilities.getLifecycleModel(setup, 'Application'));
		const factsheetModel = setup.settings.dataModel.factSheets.Application;
		this.STACK_OPTIONS = Utilities.createOptionsObjFrom(
			factsheetModel, 'fields.stack.values');
		this.ADM_SCOPE_OPTIONS = Utilities.createOptionsObjFrom(
			factsheetModel, 'fields.admScope.values');
		this.CUSTOMISATION_LEVEL_OPTIONS = Utilities.createOptionsObjFrom(
			factsheetModel, 'fields.customisationLevel.values');
		this.FUNCTIONAL_SUITABILITY_OPTIONS = Utilities.createOptionsObjFrom(
			factsheetModel, 'fields.functionalSuitability.values');
		this.TECHNICAL_SUITABILITY_OPTIONS = Utilities.createOptionsObjFrom(
			factsheetModel, 'fields.technicalSuitability.values');
		this.APPLICATION_COMPLEXITY_OPTIONS = Utilities.createOptionsObjFrom(
			factsheetModel, 'fields.applicationComplexity.values');
		this.BUSINESS_CRITICALITY_OPTIONS = Utilities.createOptionsObjFrom(
			factsheetModel, 'fields.businessCriticality.values');
		this.APPLICATION_USAGE_OPTIONS = Utilities.createOptionsObjFrom(
			factsheetModel, 'fields.applicationUsage.values');
		this.DEPLOYMENT_OPTIONS = Utilities.createOptionsObjFrom(
			factsheetModel, 'fields.deployment.values');
		this.SOX_PCI_OPTIONS = Utilities.createOptionsObjFrom(
			factsheetModel, 'fields.soxPci.values');
		this.ACCESS_TYPE_OPTIONS = Utilities.createOptionsObjFrom(
			factsheetModel, 'fields.accessType.values');
		// TODO falsch im data modell -> muss multi select sein
		this.NETWORK_TECHNICAL_PRODUCT_FAMILY_OPTIONS = Utilities.createOptionsObjFrom(
			factsheetModel, 'fields.networkTechnicalProductFamily.values');
		// get all tags, then the data
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			const index = new DataIndex();
			index.put(tagGroups);
			const applicationTagID = index.getFirstTagID('Application Type', 'Application');
			const appMapID = index.getFirstTagID('BC Type', 'AppMap');
			this.RECOMMENDATION_OPTIONS = Utilities.createOptionsObj(index.getTags('Recommendation'));
			this.COST_CENTRE_OPTIONS = Utilities.createOptionsObj(index.getTags('CostCentre'));
			this.COTS_PACKAGE_OPTIONS = Utilities.createOptionsObj(index.getTags('COTS Package'));
			// TODO ist nun daten feld
			this.LAST_MAJOR_UPGRADE_OPTIONS = Utilities.createOptionsObj(
				index.getTags('Last Major Upgrade'));
			lx.executeGraphQL(this._createQuery(applicationTagID, appMapID)).then((data) => {
				index.put(data);
				this._handleData(index, applicationTagID, appMapID);
			});
		});
	}

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_createQuery(applicationTagID, appMapID) {
		const applicationTagIDFilter = applicationTagID ? `, {facetKey: "Application Type", keys: ["${applicationTagID}"]}` : '';
		let appMapIDFilter = ''; // initial assume tagGroup.name changed or the id couldn't be determined otherwise
		let tagNameDef = 'tags { name }'; // initial assume to get it
		if (appMapID) {
			appMapIDFilter = `, {facetKey: "BC Type", keys: ["${appMapID}"]}`;
			tagNameDef = '';
		}
		// TODO primaryTypeID fehlt an relApplicationToITComponent
		// bc w/ AppMap only
		return `{applications: allFactSheets(
					sort: {mode: BY_FIELD, key: "displayName", order: asc},
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Application"]}
						${applicationTagIDFilter}
					]}
				) {
					edges { node {
						id name description tags { name }
						subscriptions { edges { node { roles { name } user { email } } } }
						... on Application {
							stack admScope
							lastMajorUpgrade { asString phases { phase startDate } }
							customisationLevel functionalSuitability technicalSuitability
							applicationComplexity businessCriticality applicationUsage
							deployment alias externalId { externalId }
							soxPci accessType networkTechnicalProductFamily
							lifecycle { asString phases { phase startDate } }
							relApplicationToBusinessCapability { edges { node { factSheet { id } } } }
							relApplicationToITComponent { edges { node { factSheet { id } } } }
							relApplicationToUserGroup { edges { node { usageType factSheet { id } } } }
						}
					}}
				}
				itComponents: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["ITComponent"]},
						{facetKey: "category", operator: OR, keys: ["software", "hardware"]}
					]}
				) {
					edges { node {
						id name tags { name }
						... on ITComponent {
							category
							relITComponentToProvider { edges { node { factSheet { id } } } }
						}
					}}
				}
				providers: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Provider"]}
					]}
				) {
					edges { node { id name } }
				}
				businessCapabilities: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]}
						${appMapIDFilter}
					]}
				) {
					edges { node { id name ${tagNameDef} } }
				}
				userGroups: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["UserGroup"]}
					]}
				) {
					edges { node { id name tags { name } } }
				}}`;
	}

	_handleData(index, applicationTagID, appMapID) {
		const tableData = [];
		// TODO
		const tableDataItem = {
			id: '',
			name: '',
			description: '',
			cobraIds: [],
			cobraNames: [],
			lifecyclePhase: 0,
			golive: new Date(),
			retired: new Date(),
			recommendation: 0,
			market: 0,
			costCentre: 0,
			stack: 0,
			admScope: 0,
			cotsPackage: 0,
			cotsSoftwareIds: [],
			cotsSoftware: [],
			cotsVendor: '', // TODO koennte array sein
			lastUpgrade: 0,
			remedyNames: [],
			supportIds: [],
			supportNames: [],
			customisation: 0,
			businessValue: 0,
			technicalCondition: 0,
			complexity: 0,
			businessCriticality: 0,
			usage: 0,
			alias: '',
			externalId: '',
			deployment: 0,
			soxpciFlag: 0,
			itOwner: [],
			businessOwner: [],
			spoc: [],
			operationsOwner: [],
			accessType: 0,
			usedByMarkets: [],
			usedBySegments: [],
			networkProductFamilies: [],
			backend: [],
			frontend: []
		};
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

	_getTagFromGroup(index, node, tagGroupName) {
		const tag = index.getFirstTagFromGroup(node, tagGroupName);
		return tag ? tag.name : '';
	}

	render() {
		return (
			<Table data={this.state.data} options={{
				lifecyclePhase: this.LIFECYCLE_PHASE_OPTIONS,
				recommendation: this.RECOMMENDATION_OPTIONS,
				market: this.MARKET_OPTIONS,
				costCentre: this.COST_CENTRE_OPTIONS,
				stack: this.STACK_OPTIONS,
				admScope: this.ADM_SCOPE_OPTIONS,
				cotsPackage: this.COTS_PACKAGE_OPTIONS,
				lastMajorUpgrade: this.LAST_MAJOR_UPGRADE_OPTIONS,
				customisation: this.CUSTOMISATION_LEVEL_OPTIONS,
				functionalSuitability: this.FUNCTIONAL_SUITABILITY_OPTIONS,
				technicalSuitability: this.TECHNICAL_SUITABILITY_OPTIONS,
				applicationComplexity: this.APPLICATION_COMPLEXITY_OPTIONS,
				businessCriticality: this.BUSINESS_CRITICALITY_OPTIONS,
				applicationUsage: this.APPLICATION_USAGE_OPTIONS,
				deployment: this.DEPLOYMENT_OPTIONS,
				soxPci: this.SOX_PCI_OPTIONS,
				accessType: this.ACCESS_TYPE_OPTIONS
			}} />
		);
	}
}

export default Report;
