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
	} , {
		name: 'has a user group',
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
	}
];

function _hasImpact(subIndex) {
	return subIndex.nodes.some((e) => {
		const impact = e.relationAttr.projectImpact;
		if (!impact) {
			return false;
		}
			return true;
	});
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
