import React, { Component } from 'react';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import CommonQueries from './CommonGraphQLQueries';
import DataIndex from './DataIndex';
import Link from './Link';
import Utilities from './Utilities';

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
		// get lifecycle from data model
		const lifecycles = Utilities.getLifecycleModel(setup, 'Application');
		this.LIFECYCLE_PHASE_OPTIONS = lifecycles.reduce((r, e, i) => {
			r[i] = e;
			return r;
		}, {});
		// get project impacts from data model
		this.PROJECT_IMPACT_OPTIONS = this._getProjectImpacts(setup).reduce((r, e, i) => {
			r[i] = e;
			return r;
		}, {});
		// get all tags, then the data
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			const index = new DataIndex();
			index.put(tagGroups);
			const applicationTagID = index.getFirstTagID('Application Type', 'Application');
			this.COST_CENTRE_OPTIONS = index.getTags('CostCentre').reduce((r, e, i) => {
				r[i] = e.name;
				return r;
			}, {});
			this.DEPLOYMENT_OPTIONS = index.getTags('Deployment').reduce((r, e, i) => {
				r[i] = e.name;
				return r;
			}, {});
			this.PROJECT_TYPE_OPTIONS = index.getTags('Project Type').reduce((r, e, i) => {
				r[i] = e.name;
				return r;
			}, {});
			lx.executeGraphQL(this._createQuery(applicationTagID)).then((data) => {
				index.put(data);
				this._handleData(index, applicationTagID);
			});
		});
	}

	_getProjectImpacts(setup) {
		const relationModel = setup.settings.dataModel.relations.applicationProjectRelation;
		if (!relationModel || !relationModel.fields || !relationModel.fields.projectImpact
			 || !Array.isArray(relationModel.fields.projectImpact.values)) {
			return [];
		}
		return relationModel.fields.projectImpact.values;
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
		const addSubNodes = function (subIndex, outputItem, idPrefix, check) {
			let nothingAdded = true;
			subIndex.nodes.forEach((e) => {
				const project = index.byID[e.id];
				if (!project) {
					return;
				}
				const projectId = project.id;
				const projectName = project.name;
				const projectImpact = e.relationAttr.projectImpact;
				const projectType = this._getOptionKeyFromValue(
					this.PROJECT_TYPE_OPTIONS, this._getTagFromGroup(index, project, 'Project Type'));
				if (check(projectName, projectImpact)) {
					const copiedItem = Utilities.copyObject(outputItem);
					copiedItem.itemId += '-' + idPrefix + '-' + projectId;
					copiedItem.projectId = projectId;
					copiedItem.projectName = projectName;
					copiedItem.projectImpact = this._getOptionKeyFromValue(this.PROJECT_IMPACT_OPTIONS, projectImpact);
					copiedItem.projectType = projectType;
					tableData.push(copiedItem);
					nothingAdded = false;
				}
			});
			return nothingAdded;
		}.bind(this);
		index.applications.nodes.forEach((e) => {
			if (!applicationTagID && !index.includesTag(e, 'Application')) {
				return;
			}
			const lifecycles = Utilities.getLifecycles(e);
			const costCentre = this._getOptionKeyFromValue(
				this.COST_CENTRE_OPTIONS, this._getTagFromGroup(index, e, 'CostCentre'));
			const deployment = this._getOptionKeyFromValue(
				this.DEPLOYMENT_OPTIONS, this._getTagFromGroup(index, e, 'Deployment'));
			const subIndex = e.relApplicationToProject;
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

	/* formatting functions for the table */

	_formatName(cell, row, idProperty) {
		if (!cell) {
			return '';
		}
		switch (idProperty) {
			case 'id':
				return (<Link link={'factsheet/Application/' + row[idProperty]} target='_blank' text={cell} />);
			case 'projectId':
				return (<Link link={'factsheet/Project/' + row[idProperty]} target='_blank' text={cell} />);
			default:
				return '';
		}
	}

	_formatEnum(cell, row, enums) {
		if (!cell && cell !== 0) {
			return '';
		}
		return enums[cell];
	}

	_formatDate(cell, row) {
		if (!cell) {
			return '';
		}
		return (
			<span style={{ paddingRight: '10%' }}>
				{cell.toLocaleDateString()}
			</span>
		);
	}

	/* formatting functions for the csv export */

	_csvFormatDate(cell, row) {
		if (!cell) {
			return '';
		}
		return cell.toLocaleDateString();
	}

	render() {
		return (
			<BootstrapTable data={this.state.data} keyField='itemId'
				 striped hover search pagination ignoreSinglePage exportCSV
				 options={{ clearSearch: true }}>
				<TableHeaderColumn dataSort row='0' rowSpan='2'
					 dataField='name'
					 width='300px'
					 dataAlign='left'
					 dataFormat={this._formatName}
					 formatExtraData='id'
					 csvHeader='application-name'
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Application name</TableHeaderColumn>
				<TableHeaderColumn dataSort row='0' rowSpan='2'
					 dataField='costCentre'
					 width='150px'
					 dataAlign='left'
					 dataFormat={this._formatEnum}
					 formatExtraData={this.COST_CENTRE_OPTIONS}
					 csvHeader='cost-centre'
					 csvFormat={this._formatEnum}
					 csvFormatExtraData={this.COST_CENTRE_OPTIONS}
					 filter={{ type: 'SelectFilter', placeholder: 'Please choose', options: this.COST_CENTRE_OPTIONS }}
					>Cost Centre</TableHeaderColumn>
				<TableHeaderColumn dataSort row='0' rowSpan='2'
					 dataField='deployment'
					 width='180px'
					 dataAlign='left'
					 dataFormat={this._formatEnum}
					 formatExtraData={this.DEPLOYMENT_OPTIONS}
					 csvFormat={this._formatEnum}
					 csvFormatExtraData={this.DEPLOYMENT_OPTIONS}
					 filter={{ type: 'SelectFilter', placeholder: 'Please choose', options: this.DEPLOYMENT_OPTIONS }}
					>Deployment</TableHeaderColumn>
				<TableHeaderColumn dataSort row='0' rowSpan='2'
					 dataField='lifecyclePhase'
					 width='120px'
					 dataAlign='left'
					 dataFormat={this._formatEnum}
					 formatExtraData={this.LIFECYCLE_PHASE_OPTIONS}
					 csvHeader='lifecycle-phase'
					 csvFormat={this._formatEnum}
					 csvFormatExtraData={this.LIFECYCLE_PHASE_OPTIONS}
					 filter={{ type: 'SelectFilter', placeholder: 'Please choose', options: this.LIFECYCLE_PHASE_OPTIONS }}
					>Phase</TableHeaderColumn>
				<TableHeaderColumn dataSort row='0' rowSpan='2'
					 dataField='lifecycleStart'
					 width='250px'
					 headerAlign='left'
					 dataAlign='right'
					 dataFormat={this._formatDate}
					 csvHeader='lifecycle-phase-start'
					 csvFormat={this._csvFormatDate}
					 filter={{ type: 'DateFilter' }}
					>Phase start</TableHeaderColumn>
				<TableHeaderColumn row='0' colSpan='3'
					 headerAlign='center'
					 csvHeader='project'
					>Project</TableHeaderColumn>
				<TableHeaderColumn dataSort row='1'
					 dataField='projectName'
					 width='300px'
					 dataAlign='left'
					 dataFormat={this._formatName}
					 formatExtraData='projectId'
					 csvHeader='project-name'
					 filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
					>Name</TableHeaderColumn>
				<TableHeaderColumn dataSort row='1'
					 dataField='projectImpact'
					 width='150px'
					 dataAlign='left'
					 dataFormat={this._formatEnum}
					 formatExtraData={this.PROJECT_IMPACT_OPTIONS}
					 csvHeader='project-impact'
					 csvFormat={this._formatEnum}
					 csvFormatExtraData={this.PROJECT_IMPACT_OPTIONS}
					 filter={{ type: 'SelectFilter', placeholder: 'Please choose', options: this.PROJECT_IMPACT_OPTIONS }}
					>Impact</TableHeaderColumn>
				<TableHeaderColumn dataSort row='1'
					 dataField='projectType'
					 width='150px'
					 dataAlign='left'
					 dataFormat={this._formatEnum}
					 formatExtraData={this.PROJECT_TYPE_OPTIONS}
					 csvHeader='project-type'
					 csvFormat={this._formatEnum}
					 csvFormatExtraData={this.PROJECT_TYPE_OPTIONS}
					 filter={{ type: 'SelectFilter', placeholder: 'Please choose', options: this.PROJECT_TYPE_OPTIONS }}
					>Type</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

export default Report;
