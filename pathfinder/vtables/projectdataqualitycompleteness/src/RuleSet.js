import Utilities from './common/Utilities';

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
		name: 'Linked project has a impact',
		additionalNote: 'If linked to an application, then it must have an project impact (e.g. \'Adds\', \'Modifies\', \'Sunsets\').',
		appliesTo: (index, project) => {
			return true;
		},
		compute: (index, project, config) => {
			const subIndex = project.relProjectToApplication;
			if (!subIndex) {
				return false;
			}
			return _hasImpact(subIndex);
		}
	}, {
		name: 'Linked \'Decommissions\' project has w/ impact \'Sunsets\' , w/ type \'Legacy\'',
		additionalNote: 'All  Legacy Decommissioning Projects must be linked to at least one application '
			+ 'and the ‘Project Impact’ must be \'Sunsets\' and \'Project Type\' tag must be \'Legacy\'.',
		appliesTo: (index, project) => {
			const decommissioningRE = /decommissioning/i;
			return decommissioningRE.test(project.name);
		},
		compute: (index, project, config) => {
			const subIndex = project.relProjectToApplication;
			if (!subIndex) {
				return false;
			}
			return _hasProjectWithImpact(subIndex, 'Sunsets') && _hasProjectType(index, project, 'Legacy');
		}
	}, {
		name: 'Linked projects has /w type \'Transformation\', w/ impact',
		additionalNote: 'All Projects with the Project Type set to \'Transformation\' must be linked to at least one application,'
		+ ' the ‘Project Impact’ must be set (\'Adds\', \'Sunsets\', \'Modifies\')',
		appliesTo: (index, project) => {
			return _hasProjectType(index, project, 'Transformation');
		},
		compute: (index, project, config) => {
			const subIndex = project.relProjectToApplication;
			if (!subIndex) {
				return false;
			}
			return _hasProjectWithImpact(subIndex, 'Modifies') || _hasProjectWithImpact(subIndex, 'Adds') || _hasProjectWithImpact(subIndex, 'Sunsets');
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
	return subIndex.nodes.some((e) => {
		const impact = e.relationAttr.projectImpact;
		if(!impact) {
			return false;
		}
		return true;
	});
}

function _hasProjectWithImpact(subIndex, impact) {
	return subIndex.nodes.some((e) => {
		return e.relationAttr.projectImpact === impact;
	});
}

function _hasProjectType(index, project, tag) {
	const hasProjectType = index.getFirstTagFromGroup(project, 'Project Type');
	if(hasProjectType) {
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
