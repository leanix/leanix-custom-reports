import React, { Component } from 'react';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Link from './common/Link';
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
		this.setState({
			setup: setup
		});
		// get options from data model
		this.LIFECYCLE_PHASE_OPTIONS = Utilities.createOptionsObj(
			Utilities.getLifecycleModel(setup, 'Application'));
		const factsheetModel = setup.settings.dataModel.factSheets.Application;
		this.DEPLOYMENT_OPTIONS = Utilities.createOptionsObjFrom(
			factsheetModel, 'fields.deployment.values');
		const relationModel = setup.settings.dataModel.relations;
		this.PROJECT_IMPACT_OPTIONS = Utilities.createOptionsObjFrom(
			relationModel, 'applicationProjectRelation.fields.projectImpact.values');
		// get all tags, then the data
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			const index = new DataIndex();
			index.put(tagGroups);
			const applicationTagID = index.getFirstTagID('Application Type', 'Application');
			this.COST_CENTRE_OPTIONS = Utilities.createOptionsObj(index.getTags('CostCentre'));
			this.PROJECT_TYPE_OPTIONS = Utilities.createOptionsObj(index.getTags('Project Type'));
			lx.executeGraphQL(this._createQuery(applicationTagID)).then((data) => {
				index.put(data);
				this._handleData(index, applicationTagID);
			});
		});
	}

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_createQuery(applicationTagID) {
		const applicationTagIDFilter = applicationTagID ? `, {facetKey: "Application Type", keys: ["${applicationTagID}"]}` : '';
		return `{applications: allFactSheets(
					sort: {mode: BY_FIELD, key: "displayName", order: asc},
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Application"]}
						${applicationTagIDFilter}
					]}
				) {
					edges { node {
						id name tags { name }
						... on Application {
							deployment
							lifecycle { phases { phase startDate } }
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

	_handleData(index, applicationTagID) {
		const tableData = [];
		const decommissioningRE = /decommissioning/i;
		const addSubNodes = (subIndex, outputItem, idPrefix, check) => {
			let nothingAdded = true;
			subIndex.nodes.forEach((e) => {
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
					copiedItem.projectImpact = this._getOptionKeyFromValue(this.PROJECT_IMPACT_OPTIONS, projectImpact);
					copiedItem.projectType = this._getOptionKeyFromValue(this.PROJECT_TYPE_OPTIONS, this._getTagFromGroup(index, project, 'Project Type'));
					tableData.push(copiedItem);
					nothingAdded = false;
				}
			});
			return nothingAdded;
		};
		index.applications.nodes.forEach((e) => {
			if (!applicationTagID && !index.includesTag(e, 'Application')) {
				return;
			}
			const lifecycles = Utilities.getLifecycles(e);
			const subIndex = e.relApplicationToProject;
			lifecycles.forEach((e2) => {
				const outputItem = {
					itemId: e.id,
					name: e.name,
					id: e.id,
					costCentre: this._getOptionKeyFromValue(this.COST_CENTRE_OPTIONS, this._getTagFromGroup(index, e, 'CostCentre')),
					deployment: this._getOptionKeyFromValue(this.DEPLOYMENT_OPTIONS, e.deployment),
					projectId: '',
					projectName: '',
					projectImpact: undefined,
					projectType: undefined,
					lifecyclePhase: this._getOptionKeyFromValue(this.LIFECYCLE_PHASE_OPTIONS, e2.phase),
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
							return !decommissioningRE.test(name) && impact === 'adds';
						});
						break;
					case 'active':
						nothingAdded = addSubNodes(subIndex, outputItem, e2.phase, (name, impact) => {
							// project doesn't contain decommissioning in name and impact is 'adds', 'modifies' or no impact
							return !decommissioningRE.test(name)
								&& (!impact || impact === 'adds' || impact === 'modifies');
						});
						break;
					case 'phaseOut':
					case 'endOfLife':
						nothingAdded = addSubNodes(subIndex, outputItem, e2.phase, (name, impact) => {
							// project does contain decommissioning in name or impact is 'sunsets'
							return decommissioningRE.test(name) || impact === 'sunsets';
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
