import Utilities from './common/Utilities';

const decommissioningRE = /decommissioning/i;

const ONE_YEAR_BEFORE_DATE = new Date();
ONE_YEAR_BEFORE_DATE.setHours(0, 0, 0, 0);
ONE_YEAR_BEFORE_DATE.setFullYear(ONE_YEAR_BEFORE_DATE.getFullYear() - 1);
const ONE_YEAR_BEFORE = ONE_YEAR_BEFORE_DATE.getTime();

const ONE_YEAR_IN_FUTURE_DATE = new Date();
ONE_YEAR_IN_FUTURE_DATE.setHours(0, 0, 0, 0);
ONE_YEAR_IN_FUTURE_DATE.setFullYear(ONE_YEAR_IN_FUTURE_DATE.getFullYear() + 1);
const ONE_YEAR_IN_FUTURE = ONE_YEAR_IN_FUTURE_DATE.getTime();

const singleRules = [{
		name: 'has at least one application',
		appliesTo: (index, project) => {
			return _isInTimeframe(project);
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
			const subIndex = _isInTimeframe(project) && project.relProjectToApplication;
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
			return _isInTimeframe(project) && decommissioningRE.test(project.name) && _hasProjectType(index, project, 'Legacy');
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
			return _isInTimeframe(project) && _hasProjectType(index, project, 'Transformation');
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
			return _isInTimeframe(project);
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
			return true;
		},
		compute: (index, project, config) => {
			return _projectHaveLifeCycle(project, 'active') && (_projectHaveLifeCycle(project, 'endOfLife') ||  _projectHaveLifeCycle(project, 'phaseOut'));
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
	return Utilities.getLifecyclePhase(lifecycles,phase);
}

function _isInTimeframe(project) {
	const lifecycles = Utilities.getLifecycles(project);
	const active = Utilities.getLifecyclePhase(lifecycles, 'active');
	if(active) {
		return (active.startDate >= ONE_YEAR_BEFORE && active.startDate <= ONE_YEAR_IN_FUTURE);
	}
	const phaseOut = Utilities.getLifecyclePhase(lifecycles, 'phaseOut');
	if(phaseOut) {
		return (phaseOut.startDate >= ONE_YEAR_BEFORE && phaseOut.startDate <= ONE_YEAR_IN_FUTURE);
	}
	const endOfLife = Utilities.getLifecyclePhase(lifecycles, 'endOfLife');
	if(endOfLife) {
		return (endOfLife.startDate >= ONE_YEAR_BEFORE && endOfLife.startDate <= ONE_YEAR_IN_FUTURE);
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
