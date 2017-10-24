import Utilities from './common/Utilities';

const decommissioningRE = /decommissioning/i;

const singleRules = [{
		name: 'has at least one application',
		appliesTo: (index, project) => {
			return true;
		},
		compute: (index, project, config) => {
			const subIndex = project.relProjectToApplication;
			if (!subIndex) {
				return false;
			}
			return true;
		}
	}, {
		name: 'has applications w/ an impact',
		additionalNote: 'Rule includes projects which have relations to applications.',
		appliesTo: (index, project) => {
			const subIndex = project.relProjectToApplication;
			if (!subIndex) {
				return false;
			}
			return true;
		},
		compute: (index, project, config) => {
			const subIndex = project.relProjectToApplication;
			return _allNodesHaveImpact(subIndex);
		}
	}, {
		name: 'Decommissioning project has relations to applications w/ impact \'Sunsets\'',
		additionalNote: 'Rule includes projects which have \'Decommissioning\' in name and '
			+ 'a \'Project Type\' tag group assignment of \'Legacy\'.',
		appliesTo: (index, project) => {
			return decommissioningRE.test(project.name) && _hasProjectType(index, project, 'Legacy');
		},
		compute: (index, project, config) => {
			const subIndex = project.relProjectToApplication;
			if (!subIndex) {
				return false;
			}
			return _allNodesHaveImpact(subIndex, 'Sunsets');
		}
	}, {
		name: 'Transformation project has relations to applications w/ any impact',
		additionalNote: 'Rule includes projects which have a \'Project Type\' tag group assignment of \'Transformation\'.',
		appliesTo: (index, project) => {
			return _hasProjectType(index, project, 'Transformation');
		},
		compute: (index, project, config) => {
			const subIndex = project.relProjectToApplication;
			if (!subIndex) {
				return false;
			}
			return _allNodesHaveImpact(subIndex);
		}
	}, {
		name: 'has at least one affected user group',
		appliesTo: (index, project) => {
			return true;
		},
		compute: (index, project, config) => {
			const subIndex = project.relProjectToUserGroup;
			if (!subIndex) {
				return false;
			}
			return true;
		}
	}, {
		name: 'has Lifecycle',
		additionalNote: 'Rule includes projects which have a life cycle phase of \'Active\' and a life cycle phase of \'End Of Life\' or \'Phase Out\'.',
		appliesTo: (index, project) => {
			return _projectHaveLifeCycle(project, 'active');
		},
		compute: (index, project, config) => {
			return true;
		}
	}
];

function _allNodesHaveImpact(subIndex, impact) {
	if (!impact) {
		return subIndex.nodes.every((e) => {
			const impact = e.relationAttr.projectImpact;
			if (!impact) {
				return false;
			}
			return true;
		});
	}
	return subIndex.nodes.every((e) => {
		return e.relationAttr.projectImpact === impact;
	});
}

function _hasProjectType(index, project, tag) {
	const hasProjectType = index.getFirstTagFromGroup(project, 'Project Type');
	if (hasProjectType) {
		return hasProjectType.name === tag;
	}
	return false;
}

function _projectHaveLifeCycle(project, phase) {
	const lifecycles = Utilities.getLifecycles(project);
	for (let i = 0; i < lifecycles.length; i++) {
		const lifecycle = lifecycles[i];
		if (lifecycle.phase === phase) {
			return true;
		}
	}
	return false;
}

const overallRule = {
	name: 'Overall Quality',
	compute: (compliants, nonCompliants, config) => {
		const result = {
			compliant: 0,
			nonCompliant: 0
		};
		for (let key in compliants) {
			result.compliant += compliants[key].length;
			result.nonCompliant += nonCompliants[key].length;
		}
		return result;
	}
};

export default {
	ruleCount: singleRules.length + 1,
	singleRules: singleRules,
	overallRule: overallRule
};
