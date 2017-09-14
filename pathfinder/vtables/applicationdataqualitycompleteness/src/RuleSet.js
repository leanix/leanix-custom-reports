import Utilities from './common/Utilities';

const ONE_YEAR_BEFORE_DATE = new Date();
ONE_YEAR_BEFORE_DATE.setHours(0, 0, 0, 0);
ONE_YEAR_BEFORE_DATE.setFullYear(ONE_YEAR_BEFORE_DATE.getFullYear() - 1);
const ONE_YEAR_BEFORE = ONE_YEAR_BEFORE_DATE.getTime();

const singleRules = [{
		name: 'Adding application has project (w/ impact \'Adds\')',
		additionalNote: 'Rule includes applications which have a current life cycle phase of either '
			+ '"Phase In", "Active" or "Phase Out" and the start date of this phase must be greater than or equal to '
			+ ONE_YEAR_BEFORE_DATE.toLocaleDateString() + '.',
		appliesTo: (index, application) => {
			return _hasProductionLifecycle(application);
		},
		compute: (index, application, config) => {
			const subIndex = application.relApplicationToProject;
			if (!subIndex) {
				return false;
			}
			return subIndex.nodes.length > 0 && _hasProjectWithImpact(subIndex, 'adds');
		}
	}, {
		name: 'Retiring application has project (w/ impact \'Sunsets\')',
		additionalNote: 'Rule includes applications which have a life cycle phase of '
			+ '"End Of Life" and the start date of this phase must be greater than or equal to '
			+ ONE_YEAR_BEFORE_DATE.toLocaleDateString() + '.',
		appliesTo: (index, application) => {
			return _isRetiring(application);
		},
		compute: (index, application, config) => {
			const subIndex = application.relApplicationToProject;
			if (!subIndex) {
				return false;
			}
			return subIndex.nodes.length > 0 && _hasProjectWithImpact(subIndex, 'sunsets');
		}
	}, {
		name: 'has COBRA (only active, exactly one)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			const subIndex = application.relApplicationToBusinessCapability;
			if (!subIndex || subIndex.nodes.length < 1) {
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
		name: 'has COTS Package TagGroup assigned (only active)',
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
			if (!subIndex || subIndex.nodes.length < 1) {
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
			 && application.relApplicationToITComponent
			 && application.relApplicationToITComponent.nodes.length > 0;
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
		name: 'has Cost Centre (only active)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			return index.getFirstTagFromGroup(application, 'CostCentre') ? true : false;
		}
	}
];

function _hasProductionLifecycle(application) {
	if (!application || !application.lifecycle || !application.lifecycle.phases
		 || !Array.isArray(application.lifecycle.phases)) {
		return false;
	}
	const currentLifecycle = Utilities.getCurrentLifecycle(application);
	return Utilities.isProductionPhase(currentLifecycle) && currentLifecycle.startDate >= ONE_YEAR_BEFORE;
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
	if (!subIndex || subIndex.nodes.length < 1) {
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
