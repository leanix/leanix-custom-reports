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
		this._getMultipleOptionKeysFromValue = this._getMultipleOptionKeysFromValue.bind(this);
		this.LIFECYCLE_PHASE_OPTIONS = {};
		this.RECOMMENDATION_OPTIONS = {};
		this.MARKET_OPTIONS = {};
		this.COST_CENTRE_OPTIONS = {};
		this.ADM_SCOPE_OPTIONS = {};
		this.STACK_OPTIONS = {};
		this.COTS_PACKAGE_OPTIONS = {};
		this.LAST_MAJOR_UPGRADE_OPTIONS = {};
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
		this.OBSOLESCENCE_OPTIONS = {};
		this.CLOUD_MATURITY_OPTIONS = {};
		this.CLOUD_DEPLOYMENT_MODEL_OPTIONS = {};
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
		this.LIFECYCLE_PHASE_OPTIONS = Utilities.createOptionsObj(
			Utilities.getLifecycleModel(setup, 'Application'));
		const factsheetModel = setup.settings.dataModel.factSheets.Application;
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
		this.NETWORK_TECHNICAL_PRODUCT_FAMILY_OPTIONS = Utilities.createOptionsObjFrom(
			factsheetModel, 'fields.networkTechnicalProductFamily.values');
		// get all tags, then the data
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			const index = new DataIndex();
			index.put(tagGroups);
			const applicationTagId = index.getFirstTagID('Application Type', 'Application');
			const appMapId = index.getFirstTagID('BC Type', 'AppMap');
			this.RECOMMENDATION_OPTIONS = Utilities.createOptionsObj(index.getTags('Recommendation'));
			this.COST_CENTRE_OPTIONS = Utilities.createOptionsObj(index.getTags('CostCentre'));
			this.COTS_PACKAGE_OPTIONS = Utilities.createOptionsObj(index.getTags('COTS Package'));
			this.STACK_OPTIONS = Utilities.createOptionsObj(index.getTags('Stack'));
			this.OBSOLESCENCE_OPTIONS = Utilities.createOptionsObj(index.getTags('Obsolescence'));
			this.CLOUD_MATURITY_OPTIONS = Utilities.createOptionsObj(index.getTags('Cloud Maturity'));
			lx.executeGraphQL(this._createQuery(applicationTagId, appMapId)).then((data) => {
				index.put(data);
				this._handleData(index, applicationTagId, appMapId);
			});
		});
	}

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_createQuery(applicationTagId, appMapId) {
		const applicationTagIdFilter = applicationTagId ? `, {facetKey: "Application Type", keys: ["${applicationTagId}"]}` : '';
		let appMapIdFilter = ''; // initial assume tagGroup.name changed or the id couldn't be determined otherwise
		let tagNameDef = 'tags { name }'; // initial assume to get it
		if (appMapId) {
			appMapIdFilter = `, {facetKey: "BC Type", keys: ["${appMapId}"]}`;
			tagNameDef = '';
		}
		// TODO primaryTypeID fehlt an relApplicationToITComponent
		return `{applications: allFactSheets(
					sort: { mode: BY_FIELD, key: "displayName", order: asc },
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Application"]}
						${applicationTagIdFilter}
					]}
				) {
					edges { node {
						id name description tags { name }
						subscriptions { edges { node { roles { name } user { email } } } }
						... on Application {
							admScope customisationLevel functionalSuitability technicalSuitability
							applicationComplexity businessCriticality applicationUsage
							deployment alias externalId { externalId }
							soxPci accessType lifecycle { asString phases { phase startDate } }
							networkTechnicalProductFamily lastMajorUpgrade { phases { startDate } }
							relApplicationToBusinessCapability { edges { node { factSheet { id } } } }
							relApplicationToITComponent { edges { node { factSheet { id } } } }
							relApplicationToUserGroup { edges { node { factSheet { id } } } }
							relApplicationToSegment { edges { node { factSheet { id } } } }
							relApplicationToProvider { edges { node { factSheet { id } } } }
						}
					}}
				}
				itComponentsSoftware: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["ITComponent"]},
						{facetKey: "category", keys: ["software"]}
					]}
				) {
					edges { node {
						id name displayName tags { name }
						... on ITComponent {
							category
							relITComponentToProvider { edges { node { factSheet { id } } } }
						}
					}}
				}
				itComponentsOthers: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["ITComponent"]},
						{facetKey: "category", operator: OR, keys: ["hardware", "service", "developmentTechnology"]}
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
						${appMapIdFilter}
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

	_handleData(index, applicationTagId, appMapId) {
		const tableData = [];
		const markets = [];
		index.applications.nodes.forEach((e) => {
			if (!applicationTagId && !index.includesTag(e, 'Application')) {
				return;
			}
			const currentLifecycle = Utilities.getCurrentLifecycle(e);
			const lifecycles = Utilities.getLifecycles(e);
			const golive = Utilities.getLifecyclePhase(lifecycles, 'active');
			const retired = Utilities.getLifecyclePhase(lifecycles, 'endOfLife');
			const market = Utilities.getMarket(e);
			if (market && !markets.includes(market)) {
				markets.push(market);
			}
			const marketIndex = markets.indexOf(market);
			const cobras = [];
			const subIndexBCs = e.relApplicationToBusinessCapability;
			if (subIndexBCs) {
				subIndexBCs.nodes.forEach((e2) => {
					// access businessCapabilities
					const bc = index.byID[e2.id];
					if (!bc || (!appMapId && !index.includesTag(bc, 'AppMap'))) {
						return;
					}
					cobras.push(bc);
				});
			}
			const cotsSoftware = [];
			const remedies = [];
			const supports = [];
			const backends = [];
			const frontends = [];
			const subIndexITCs = e.relApplicationToITComponent;
			if (subIndexITCs) {
				subIndexITCs.nodes.forEach((e2) => {
					// access itComponentsSoftware & itComponentsOthers
					const itc = index.byID[e2.id];
					if (!itc) {
						return;
					}
					switch (itc.category) {
						case 'software':
							if (itc.name.endsWith('Software Product')) {
								break;
							}
							const provider = this._getProvider(index, itc);
							cotsSoftware.push({
								id: itc.id,
								name: itc.displayName,
								providerId: provider ? provider.id : undefined,
								provider: provider ? provider.name : undefined
							});
							break;
						case 'hardware':
							remedies.push(itc);
							break;
						case 'service':
							if (index.includesTag(itc, 'Development Technology')) {
								// TODO future note: data model changes
								if (itc.name.endsWith('(Back End)')) {
									backends.push(itc.name.replace(' (Back End)' , ''));
								} else if (itc.name.endsWith('(Front End)')) {
									frontends.push(itc.name.replace(' (Front End)' , ''));
								}
							} else {
								const provider = this._getProvider(index, itc);
								if (provider) {
									supports.push(provider);
								}
							}
							break;
						case 'developmentTechnology':
							// TODO check for duplicates
							// TODO future note: data model changes
							if (itc.name.endsWith('(Back End)')) {
								backends.push(itc.name.replace(' (Back End)' , ''));
							} else if (itc.name.endsWith('(Front End)')) {
								frontends.push(itc.name.replace(' (Front End)' , ''));
							}
							break;
					}
				});
			}
			const cotsVendors = this._getCotsVendors(cotsSoftware);
			const siProvidersSet = {};
			const subIndexProviders = e.relApplicationToProvider;
			if (subIndexProviders) {
				subIndexProviders.nodes.forEach((e2) => {
					// access providers
					const provider = index.byID[e2.id];
					if (provider) {
						siProvidersSet[provider.id] = provider;
					}
				});
			}
			const siProviders = [];
			for (let key in siProvidersSet) {
				siProviders.push(siProvidersSet[key]);
			}
			const itOwners = [];
			const businessOwners = [];
			const spocs = [];
			const operationsOwners = [];
			const subIndexSubs = e.subscriptions;
			if (subIndexSubs) {
				subIndexSubs.nodes.forEach((e2) => {
					const userEMail = Utilities.getFrom(e2, 'user.email');
					if (!userEMail) {
						return;
					}
					const roles = e2.roles;
					if (!roles) {
						return;
					}
					roles.forEach((e3) => {
						switch (e3.name) {
							case 'IT Owner':
								itOwners.push(userEMail);
								break;
							case 'Business Owner':
								businessOwners.push(userEMail);
								break;
							case 'SPOC':
								spocs.push(userEMail);
								break;
							case 'Operations Owner':
								operationsOwners.push(userEMail);
								break;
						}
					});
				});
			}
			const usedByMarkets = [];
			const subIndexUG = e.relApplicationToUserGroup;
			if (subIndexUG) {
				subIndexUG.nodes.forEach((e2) => {
					// access userGroups
					const userGroup = index.byID[e2.id];
					if (!userGroup) {
						return;
					}
					// v workspace note: relApplicationToUserGroup only contains usageType 'user'
					usedByMarkets.push(userGroup);
				});
			}
			const usedBySegments = [];
			const subIndexSegments = e.relApplicationToSegment;
			if (subIndexSegments) {
				subIndexSegments.nodes.forEach((e2) => {
					// access userGroups
					const userGroup = index.byID[e2.id];
					if (!userGroup || !index.includesTag(userGroup, 'Segment')) {
						return;
					}
					usedBySegments.push(userGroup);
				});
			}
			const lastUpgrade = this._getLastMajorUpgrade(e);
			tableData.push({
				id: e.id,
				name: e.name,
				description: e.description,
				cobraIds: cobras.map((e2) => {
					return e2.id;
				}),
				cobraNames: cobras.map((e2) => {
					return e2.name;
				}),
				lifecyclePhase: currentLifecycle ? this._getOptionKeyFromValue(this.LIFECYCLE_PHASE_OPTIONS, currentLifecycle.phase) : undefined,
				golive: golive ? new Date(golive.startDate) : undefined,
				retired: retired ? new Date(retired.startDate) : undefined,
				recommendation: this._getOptionKeyFromValue(this.RECOMMENDATION_OPTIONS, this._getTagFromGroup(index, e, 'Recommendation')),
				market: marketIndex < 0 ? undefined : marketIndex,
				costCentre: this._getOptionKeyFromValue(this.COST_CENTRE_OPTIONS, this._getTagFromGroup(index, e, 'CostCentre')),
				stack: this._getOptionKeyFromValue(this.STACK_OPTIONS, this._getTagFromGroup(index, e, 'Stack')),
				admScope: this._getOptionKeyFromValue(this.ADM_SCOPE_OPTIONS, e.admScope),
				cotsPackage: this._getOptionKeyFromValue(this.COTS_PACKAGE_OPTIONS, this._getTagFromGroup(index, e, 'COTS Package')),
				cotsSoftwareIds: cotsSoftware.map((e2) => {
					return e2.id;
				}),
				cotsSoftware: cotsSoftware.map((e2) => {
					return e2.name;
				}),
				cotsVendorIds: cotsVendors.map((e2) => {
					return e2.id;
				}),
				cotsVendors: cotsVendors.map((e2) => {
					return e2.name;
				}),
				lastUpgrade: lastUpgrade ? new Date(lastUpgrade) : undefined,
				remedyIds: remedies.map((e2) => {
					return e2.id;
				}),
				remedyNames: remedies.map((e2) => {
					return e2.name;
				}),
				supportIds: supports.map((e2) => {
					return e2.id;
				}),
				supportNames: supports.map((e2) => {
					return e2.name;
				}),
				siProviderIds: siProviders.map((e2) => {
					return e2.id;
				}),
				siProviderNames: siProviders.map((e2) => {
					return e2.name;
				}),
				customisation: this._getOptionKeyFromValue(this.CUSTOMISATION_LEVEL_OPTIONS, e.customisationLevel),
				businessValue: this._getOptionKeyFromValue(this.FUNCTIONAL_SUITABILITY_OPTIONS, e.functionalSuitability),
				technicalCondition: this._getOptionKeyFromValue(this.TECHNICAL_SUITABILITY_OPTIONS, e.technicalSuitability),
				complexity: this._getOptionKeyFromValue(this.APPLICATION_COMPLEXITY_OPTIONS, e.applicationComplexity),
				businessCriticality: this._getOptionKeyFromValue(this.BUSINESS_CRITICALITY_OPTIONS, e.businessCriticality),
				usage: this._getOptionKeyFromValue(this.APPLICATION_USAGE_OPTIONS, e.applicationUsage),
				alias: e.alias,
				externalId: Utilities.getFrom(e, 'externalId.externalId'),
				deployment: this._getOptionKeyFromValue(this.DEPLOYMENT_OPTIONS, e.deployment),
				soxpciFlag: this._getOptionKeyFromValue(this.SOX_PCI_OPTIONS, e.soxPci),
				itOwners: itOwners,
				businessOwners: businessOwners,
				spocs: spocs,
				operationsOwners: operationsOwners,
				accessType: this._getOptionKeyFromValue(this.ACCESS_TYPE_OPTIONS, e.accessType),
				usedByMarketIds: usedByMarkets.map((e2) => {
					return e2.id;
				}),
				usedByMarkets: usedByMarkets.map((e2) => {
					return e2.name;
				}),
				usedBySegmentIds: usedBySegments.map((e2) => {
					return e2.id;
				}),
				usedBySegments: usedBySegments.map((e2) => {
					return e2.name;
				}),
				networkProductFamilies: this._getMultipleOptionKeysFromValue(this.NETWORK_TECHNICAL_PRODUCT_FAMILY_OPTIONS, e.networkTechnicalProductFamily),
				obsolescence: this._getOptionKeyFromValue(this.OBSOLESCENCE_OPTIONS, this._getTagFromGroup(index, e, 'Obsolescence')),
				cloudMaturity: this._getOptionKeyFromValue(this.CLOUD_MATURITY_OPTIONS, this._getTagFromGroup(index, e, 'Cloud Maturity')),
				backends: backends,
				frontends: frontends
			});
		});
		this.MARKET_OPTIONS = Utilities.createOptionsObj(markets);
		lx.hideSpinner();
		this.setState({
			data: tableData
		});
	}

	_getLastMajorUpgrade(application) {
		const phases = Utilities.getFrom(application, 'lastMajorUpgrade.phases', []);
		if (phases.length === 0) {
			return;
		}
		// v workspace note: its always the first one
		const startDate = phases[0].startDate;
		if (!startDate) {
			return;
		}
		// that's a timestamp as number
		return Date.parse(startDate + ' 00:00:00');
	}

	_getProvider(index, itc) {
		const subIndex = itc.relITComponentToProvider;
		if (subIndex) {
			// v workspace note: only one provider possible
			const provId = subIndex.nodes[0].id;
			// access providers
			return index.byID[provId];
		}
	}

	_getCotsVendors(cotsSoftware) {
		const set = {};
		cotsSoftware.forEach((e) => {
			if (!e.providerId) {
				return;
			}
			set[e.providerId] = {
				id: e.providerId,
				name: e.provider
			};
		});
		const result = [];
		for (let key in set) {
			result.push(set[key]);
		}
		return result;
	}

	_getOptionKeyFromValue(options, value) {
		if (!value) {
			return undefined;
		}
		const key = Utilities.getKeyToValue(options, value);
		return key !== undefined && key !== null ? parseInt(key, 10) : undefined;
	}

	_getMultipleOptionKeysFromValue(options, values) {
		if (!values || !Array.isArray(values)) {
			return [];
		}
		const result = [];
		values.forEach((e) => {
			if (!e) {
				return;
			}
			const key = this._getOptionKeyFromValue(options, e);
			if (key !== undefined && key !== null) {
				result.push(key);
			}
		});
		return result;
	}

	_getTagFromGroup(index, node, tagGroupName) {
		const tag = index.getFirstTagFromGroup(node, tagGroupName);
		return tag ? tag.name : '';
	}

	render() {
		if (this.state.data.length === 0) {
			return (<h4 className='text-center'>Loading data ...</h4>);
		}
		return (
			<Table data={this.state.data}
				options={{
					lifecyclePhase: this.LIFECYCLE_PHASE_OPTIONS,
					recommendation: this.RECOMMENDATION_OPTIONS,
					market: this.MARKET_OPTIONS,
					costCentre: this.COST_CENTRE_OPTIONS,
					stack: this.STACK_OPTIONS,
					admScope: this.ADM_SCOPE_OPTIONS,
					cotsPackage: this.COTS_PACKAGE_OPTIONS,
					customisation: this.CUSTOMISATION_LEVEL_OPTIONS,
					functionalSuitability: this.FUNCTIONAL_SUITABILITY_OPTIONS,
					technicalSuitability: this.TECHNICAL_SUITABILITY_OPTIONS,
					applicationComplexity: this.APPLICATION_COMPLEXITY_OPTIONS,
					businessCriticality: this.BUSINESS_CRITICALITY_OPTIONS,
					applicationUsage: this.APPLICATION_USAGE_OPTIONS,
					deployment: this.DEPLOYMENT_OPTIONS,
					soxPci: this.SOX_PCI_OPTIONS,
					accessType: this.ACCESS_TYPE_OPTIONS,
					networkTechnicalProductFamily: this.NETWORK_TECHNICAL_PRODUCT_FAMILY_OPTIONS,
					obsolescence: this.OBSOLESCENCE_OPTIONS,
					cloudMaturity: this.CLOUD_MATURITY_OPTIONS
				}}
				setup={this.state.setup} />
		);
	}
}

export default Report;
