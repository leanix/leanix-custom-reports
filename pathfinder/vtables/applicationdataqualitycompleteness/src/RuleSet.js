import Utilities from './common/Utilities';

const ONE_YEAR_BEFORE_DATE = new Date();
ONE_YEAR_BEFORE_DATE.setHours(0, 0, 0, 0);
ONE_YEAR_BEFORE_DATE.setFullYear(ONE_YEAR_BEFORE_DATE.getFullYear() - 1);
const ONE_YEAR_BEFORE = ONE_YEAR_BEFORE_DATE.getTime();

const singleRules = [{
		name: 'Adding application has project (w/ impact \'Adds\')',
		additionalNote: 'Rule includes applications which have a current life cycle phase of either '
			+ '\'Phase In\', \'Active\' or \'Phase Out\' and the start date of this phase must be greater than or equal to '
			+ ONE_YEAR_BEFORE_DATE.toLocaleDateString() + '.',
		appliesTo: (index, application) => {
			return _hasProductionLifecycle(application);
		},
		compute: (index, application, config) => {
			const subIndex = application.relApplicationToProject;
			if (!subIndex) {
				return false;
			}
			return _hasProjectWithImpact(subIndex, 'Adds');
		}
	}, {
		name: 'Retiring application has project (w/ impact \'Sunsets\')',
		additionalNote: 'Rule includes applications which have a life cycle phase of '
			+ '\'End Of Life\' and the start date of this phase must be greater than or equal to '
			+ ONE_YEAR_BEFORE_DATE.toLocaleDateString() + '.',
		appliesTo: (index, application) => {
			return _isRetiring(application);
		},
		compute: (index, application, config) => {
			const subIndex = application.relApplicationToProject;
			if (!subIndex) {
				return false;
			}
			return _hasProjectWithImpact(subIndex, 'Sunsets');
		}
	}, {
		name: 'has COBRA (only active, exactly one)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			const subIndex = application.relApplicationToBusinessCapability;
			if (!subIndex) {
				return false;
			}
			const compliantBCs = subIndex.nodes.filter((e) => {
					// access businessCapabilities
					const bc = index.byID[e.id];
					return bc && (!config.appMapId ? index.includesTag(bc, 'AppMap') : true);
				});
			return compliantBCs.length === 1;
		}
	}, {
		name: 'has \'COTS Package\' TagGroup assigned (only active)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			return index.getFirstTagFromGroup(application, 'COTS Package') ? true : false;
		}
	}, {
		name: 'has Software Product (only active, w/ Tag \'COTS Package\')',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active'
			 && index.includesTag(application, 'COTS Package');
		},
		compute: (index, application, config) => {
			const subIndex = application.relApplicationToITComponent;
			if (!subIndex) {
				return false;
			}
			const compliantITComp = subIndex.nodes.find((e) => {
					// access itComponents
					return index.byID[e.id];
				});
			return compliantITComp ? true : false;
		}
	}, {
		name: 'has Software Product, but no Placeholder (only active, w/ Tag \'COTS Package\')',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active'
			 && index.includesTag(application, 'COTS Package')
			 && application.relApplicationToITComponent;
		},
		compute: (index, application, config) => {
			const subIndex = application.relApplicationToITComponent;
			const compliantITComp = subIndex.nodes.find((e) => {
					// access itComponents
					return index.byID[e.id];
				});
			// access itComponents
			return !index.includesTag(compliantITComp ? index.byID[compliantITComp.id] : undefined, 'Placeholder');
		}
	}, {
		name: 'has Description (only active)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			return application.description ? true : false;
		}
	}, {
		name: 'has Lifecycle',
		appliesTo: (index, application) => {
			return true;
		},
		compute: (index, application, config) => {
			// getCurrentLifecycle has always a return value if there is at least one phase defined
			return Utilities.getCurrentLifecycle(application) ? true : false;
		}
	}, {
		name: 'has IT Owner (only active)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			return _hasSubscriptionRole(application, 'IT Owner');
		}
	}, {
		name: 'has SPOC (only active)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			return _hasSubscriptionRole(application, 'SPOC');
		}
	}, {
		name: 'has Business Value (only active)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			return application.functionalSuitability ? true : false;
		}
	}, {
		name: 'has Technical Condition (only active)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			return application.technicalSuitability ? true : false;
		}
	}, {
		name: 'has \'Cost Centre\' TagGroup assigned (only active)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			return index.getFirstTagFromGroup(application, 'CostCentre') ? true : false;
		}
	}, {
		name: 'has an owning local market',
		appliesTo: (index, application) => {
			return true;
		},
		compute: (index, application, config) => {
			const subIndex = application.relApplicationToOwningUserGroup;
			return subIndex && subIndex.nodes.length === 1;
		}
	},
	/* {
		name: 'An application is compliant if it\'s name start with it\'s owning user group.',
		additionalNote: 'Exceptions:' +
		'- Applications starting with \'UK\' or \'CW\' are allowed to have the owning user group \'UK\'.' +
		'- Applications starting with \'VGS\' are allowed to have the owning user group \'Vodafone Service Companies / VGS\'.',
		appliesTo: (index, application) => {
			return true;
		},
		compute: (index, application, config) => {
			const subIndex = application.relApplicationToOwningUserGroup;
			if (!subIndex || subIndex.nodes.length < 1) {
				return false;
			}
			const compliant = subIndex.nodes.find((e) => {
				// access itComponents
				return e.name;
			});
			console.log(compliant);
			console.log(application.name);
			return true;
		}
	}, */
	{
		name: 'has \'Recommendation\' TagGroup assigned',
		appliesTo: (index, application) => {
			return true;
		},
		compute: (index, application, config) => {
			return index.getFirstTagFromGroup(application, 'Recommendation') ? true : false;
		}
	}, {
		name: 'Retiring application has a recommendation of \'Decommission\', \'Replace\' or \'Consolidate\'',
		additionalNote: 'Rule includes applications which have a life cycle phase of '
			+ '\'End Of Life\' and \'Recommendation\' TagGroup assignment defined.',
		appliesTo: (index, application) => {
			const recommendationTag = index.getFirstTagFromGroup(application, 'Recommendation');
			return recommendationTag && _hasEndOfLife(application);
		},
		compute: (index, application, config) => {
			const recommendationTag = index.getFirstTagFromGroup(application, 'Recommendation');
			switch (recommendationTag.name) {
				case 'Decommission':
				case 'Replace':
				case 'Consolidate':
					return true;
				default:
					return false;
			}
		}
	}, {
		name: 'Non-retiring application has a recommendation of \'Sustain\', \'Enhance\', \'Remediate\' or \'Re-Platform\'',
		additionalNote: 'Rule includes applications which don\'t have a life cycle phase of '
			+ '\'End Of Life\' and \'Recommendation\' TagGroup assignment defined.',
		appliesTo: (index, application) => {
			const recommendationTag = index.getFirstTagFromGroup(application, 'Recommendation');
			return recommendationTag && !_hasEndOfLife(application);
		},
		compute: (index, application, config) => {
			const recommendationTag = index.getFirstTagFromGroup(application, 'Recommendation');
			switch (recommendationTag.name) {
				case 'Sustain':
				case 'Enhance':
				case 'Remediate':
				case 'Re-Platform':
					return true;
				default:
					return false;
			}
		}
	}, {
		name: 'has \'Cloud Maturity\' TagGroup assigned',
		appliesTo: (index, application) => {
			return true;
		},
		compute: (index, application, config) => {
			return index.getFirstTagFromGroup(application, 'Cloud Maturity') ? true : false;
		}
	}
];

function _hasProductionLifecycle(application) {
	const currentLifecycle = Utilities.getCurrentLifecycle(application);
	return Utilities.isProductionPhase(currentLifecycle) && currentLifecycle.startDate >= ONE_YEAR_BEFORE;
}

function _hasEndOfLife(application) {
	if (!application || !application.lifecycle || !application.lifecycle.phases
		 || !Array.isArray(application.lifecycle.phases)) {
		return false;
	}
	const phase = application.lifecycle.phases.find((e) => {
			return e.phase === 'endOfLife';
		});
	return phase !== undefined && phase !== null;
}

function _isRetiring(application) {
	if (!application || !application.lifecycle || !application.lifecycle.phases
		 || !Array.isArray(application.lifecycle.phases)) {
		return false;
	}
	const phase = application.lifecycle.phases.find((e) => {
			return e.phase === 'endOfLife' && e.startDate && Date.parse(e.startDate + ' 00:00:00') >= ONE_YEAR_BEFORE;
		});
	return phase !== undefined && phase !== null;
}

function _hasProjectWithImpact(subIndex, impact) {
	return subIndex.nodes.some((e) => {
		return e.relationAttr.projectImpact === impact;
	});
}

function _hasSubscriptionRole(application, subscriptionRole) {
	const subIndex = application.subscriptions;
	if (!subIndex) {
		return false;
	}
	return subIndex.nodes.find((e) => {
		const roles = e.roles;
		return roles && roles.find((e2) => {
			return e2.name === subscriptionRole;
		});
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
