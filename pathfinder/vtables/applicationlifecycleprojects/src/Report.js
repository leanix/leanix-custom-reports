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
		this.COST_CENTRE_OPTIONS = {};
		this.DEPLOYMENT_OPTIONS = {};
		this.LIFECYCLE_PHASE_OPTIONS = {};
		this.PROJECT_IMPACT_OPTIONS = {};
		this.PROJECT_TYPE_OPTIONS = {};
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
		this.DEPLOYMENT_OPTIONS = Utilities.createOptionsObjFrom(
			factsheetModel, 'fields.deployment.values');
		const relationModel = setup.settings.dataModel.relations.applicationProjectRelation;
		this.PROJECT_IMPACT_OPTIONS = Utilities.createOptionsObjFrom(
			relationModel, 'fields.projectImpact.values');
		// get all tags, then the data
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			const index = new DataIndex();
			index.put(tagGroups);
			const applicationTagId = index.getFirstTagID('Application Type', 'Application');
			this.COST_CENTRE_OPTIONS = Utilities.createOptionsObj(index.getTags('CostCentre'));
			this.PROJECT_TYPE_OPTIONS = Utilities.createOptionsObj(index.getTags('Project Type'));
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
		const applicationTagIdFilter = applicationTagId ? `, {facetKey: "Application Type", keys: ["${applicationTagId}"]}` : '';
		return `{applications: allFactSheets(
					sort: { mode: BY_FIELD, key: "displayName", order: asc },
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Application"]}
						${applicationTagIdFilter}
					]}
				) {
					edges { node {
						id name tags { name }
						... on Application {
							deployment lifecycle { phases { phase startDate } }
							relApplicationToProject { edges { node { projectImpact factSheet { id } } } }
						}
					}}
				}
				projects: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Project"]}
					]}
				) {
					edges { node { id name tags { name } } }
				}}`;
	}

	_handleData(index, applicationTagId) {
		const tableData = [];
		const decommissioningRE = /decommissioning/i;
		const addSubNodes = (subIndex, outputItem, idPrefix, check) => {
			let nothingAdded = true;
			subIndex.nodes.forEach((e) => {
				// access projects
				const project = index.byID[e.id];
				if (!project) {
					return;
				}
				const projectId = project.id;
				const projectName = project.name;
				const projectImpact = e.relationAttr.projectImpact;
				if (check(projectName, projectImpact)) {
					const copiedItem = Utilities.copyObject(outputItem);
					copiedItem.itemId += '-' + idPrefix + '-' + projectId;
					copiedItem.projectId = projectId;
					copiedItem.projectName = projectName;
					copiedItem.projectImpact = this._getOptionKeyFromValue(
						this.PROJECT_IMPACT_OPTIONS, projectImpact);
					copiedItem.projectType = this._getOptionKeyFromValue(
						this.PROJECT_TYPE_OPTIONS, this._getTagFromGroup(index, project, 'Project Type'));
					tableData.push(copiedItem);
					nothingAdded = false;
				}
			});
			return nothingAdded;
		};
		index.applications.nodes.forEach((e) => {
			if (!applicationTagId && !index.includesTag(e, 'Application')) {
				return;
			}
			const lifecycles = Utilities.getLifecycles(e);
			const subIndex = e.relApplicationToProject;
			const costCentre = this._getOptionKeyFromValue(
				this.COST_CENTRE_OPTIONS, this._getTagFromGroup(index, e, 'CostCentre'));
			const deployment = this._getOptionKeyFromValue(
				this.DEPLOYMENT_OPTIONS, e.deployment);
			lifecycles.forEach((e2) => {
				const outputItem = {
					itemId: e.id,
					name: e.name,
					id: e.id,
					costCentre: costCentre,
					deployment: deployment,
					projectId: '',
					projectName: '',
					projectImpact: undefined,
					projectType: undefined,
					lifecyclePhase: this._getOptionKeyFromValue(
						this.LIFECYCLE_PHASE_OPTIONS, e2.phase),
					lifecycleStart: new Date(e2.startDate)
				};
				if (!subIndex) {
					// add directly, if no projects
					tableData.push(outputItem);
					return;
				}
				let nothingAdded = true;
				// add duplicates with project information according to lifecycle rules
				switch (e2.phase) {
					case 'plan':
					case 'phaseIn':
						nothingAdded = addSubNodes(subIndex, outputItem, e2.phase, (name, impact) => {
							// project doesn't contain decommissioning in name and impact is 'adds'
							return impact === 'adds' && !decommissioningRE.test(name);
						});
						break;
					case 'active':
						nothingAdded = addSubNodes(subIndex, outputItem, e2.phase, (name, impact) => {
							// project doesn't contain decommissioning in name and impact is 'adds', 'modifies' or no impact
							return (!impact || impact === 'adds' || impact === 'modifies')
								&& !decommissioningRE.test(name);
						});
						break;
					case 'phaseOut':
					case 'endOfLife':
						nothingAdded = addSubNodes(subIndex, outputItem, e2.phase, (name, impact) => {
							// project does contain decommissioning in name or impact is 'sunsets'
							return impact === 'sunsets' || decommissioningRE.test(name);
						});
						break;
					default:
						throw new Error('Unknown phase: ' + e2.phase);
				}
				if (nothingAdded) {
					// add directly, if no rule applies, but without project information
					tableData.push(outputItem);
				}
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
					costCentre: this.COST_CENTRE_OPTIONS,
					deployment: this.DEPLOYMENT_OPTIONS,
					lifecyclePhase: this.LIFECYCLE_PHASE_OPTIONS,
					projectImpact: this.PROJECT_IMPACT_OPTIONS,
					projectType: this.PROJECT_TYPE_OPTIONS
				}}
				setup={this.state.setup} />
		);
	}
}

export default Report;
