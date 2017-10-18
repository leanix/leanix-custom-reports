import Utilities from './common/Utilities';

const decommissioningRE = /decommissioning/i;

const singleRules = [{
		name: 'Project must be linked to at least one application',
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
		name: 'has a impact',
		additionalNote: 'If linked to an application, then it must have a project impact.',
		appliesTo: (index, project) => {
			const subIndex = project.relProjectToApplication;
			if (!subIndex) {
				return false;
			}
			return true;
		},
		compute: (index, project, config) => {
			const subIndex = project.relProjectToApplication;
			return _hasImpact(subIndex);
		}
	}, {
		name: '\'Decommissions\' project has w/ type \'Legacy\', w/ impact \'Sunsets\'',
		additionalNote: 'All Decommissioning Projects with tag \'Legacy\' must be linked to at least one application '
			+ 'and the ‘Project Impact’ must be \'Sunsets\'.',
		appliesTo: (index, project) => {
			return decommissioningRE.test(project.name) && _hasProjectType(index, project, 'Legacy');
		},
		compute: (index, project, config) => {
			const subIndex = project.relProjectToApplication;
			if (!subIndex) {
				return false;
			}
			return _hasProjectWithImpact(subIndex, 'Sunsets');
		}
	}, {
		name: 'Projects has /w type \'Transformation\', w/ impact',
		additionalNote: 'All Projects with the Project Type set to \'Transformation\' must be linked to at least one application,'
		+ ' the ‘Project Impact’ must be set.',
		appliesTo: (index, project) => {
			return _hasProjectType(index, project, 'Transformation');
		},
		compute: (index, project, config) => {
			const subIndex = project.relProjectToApplication;
			if (!subIndex) {
				return false;
			}
			return _hasImpact(subIndex);
		}
	}, {
		name: 'has owning local market',
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
	}
];

function _hasImpact(subIndex) {
	return subIndex.nodes.every((e) => {
		const impact = e.relationAttr.projectImpact;
		if (!impact) {
			return false;
		}
		return true;
	});
}

function _hasProjectWithImpact(subIndex, impact) {
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
