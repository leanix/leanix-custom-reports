import Utilities from './common/Utilities';

export default [{
		name: 'Adding applications, but no project',
		compute: (index, applications, config) => {
			const result = {
				compliant: [],
				nonCompliant: []
			};
			applications.all.forEach((e) => {
				if (!_hasProductionLifecycle(e)) {
					return;
				}
				const subIndex = e.relApplicationToProject;
				if (!subIndex) {
					result.nonCompliant.push(e);
					return;
				}
				if (subIndex.nodes.length > 0) {
					result.compliant.push(e);
				} else {
					result.nonCompliant.push(e);
				}
			});
			return result;
		}
	}, {
		name: 'Retiring applications, but no project',
		compute: (index, applications, config) => {
			const result = {
				compliant: [],
				nonCompliant: []
			};
			applications.all.forEach((e) => {
				if (!_isRetired(e)) {
					return;
				}
				const subIndex = e.relApplicationToProject;
				if (!subIndex) {
					result.nonCompliant.push(e);
					return;
				}
				if (subIndex.nodes.length > 0) {
					result.compliant.push(e);
				} else {
					result.nonCompliant.push(e);
				}
			});
			return result;
		}
	}, {
		name: 'has COBRA (only active, exactly one)',
		compute: (index, applications, config) => {
			const result = {
				compliant: [],
				nonCompliant: []
			};
			applications.onlyActive.forEach((e) => {
				const subIndex = e.relApplicationToBusinessCapability;
				if (!subIndex || subIndex.nodes.length < 1) {
					result.nonCompliant.push(e);
					return;
				}
				const compliantBCs = subIndex.nodes.filter((e2) => {
					// access businessCapabilities
					const bc = index.byID[e2.id];
					// TODO ueberarbeiten
					return bc && (!config.appMapId ? index.includesTag(bc, 'AppMap') : true);
				});
				if (compliantBCs.length === 1) {
					result.compliant.push(e);
				} else {
					result.nonCompliant.push(e);
				}
			});
			return result;
		}
	}, {
		name: 'has COTS Package TagGroup assigned (only active)',
		compute: (index, applications, config) => {
			const result = {
				compliant: [],
				nonCompliant: []
			};
			applications.onlyActive.forEach((e) => {
				if (index.getFirstTagFromGroup(e, 'COTS Package')) {
					result.compliant.push(e);
				} else {
					result.nonCompliant.push(e);
				}
			});
			return result;
		}
	}, {
		name: 'has Software Product (only active, w/ Tag "COTS Package")',
		compute: (index, applications, config) => {
			const result = {
				compliant: [],
				nonCompliant: []
			};
			applications.onlyActiveCOTSPackage.forEach((e) => {
				const subIndex = e.relApplicationToITComponent;
				if (!subIndex || subIndex.nodes.length < 1) {
					result.nonCompliant.push(e);
					return;
				}
				const compliantITComp = subIndex.nodes.find((e2) => {
					// access itComponents
					return index.byID[e2.id];
				});
				if (compliantITComp) {
					result.compliant.push(e);
				} else {
					result.nonCompliant.push(e);
				}
			});
			return result;
		}
	}, {
		name: 'has Software Product, but no Placeholder (only active, w/ Tag "COTS Package")',
		compute: (index, applications, config) => {
			const result = {
				compliant: [],
				nonCompliant: []
			};
			applications.onlyActiveCOTSPackage.forEach((e) => {
				const subIndex = e.relApplicationToITComponent;
				if (!subIndex || subIndex.nodes.length < 1) {
					return;
				}
				const compliantITComp = subIndex.nodes.find((e2) => {
					// access itComponents
					return index.byID[e2.id];
				});
				// access itComponents
				if (index.includesTag(compliantITComp ? index.byID[compliantITComp.id] : undefined, 'Placeholder')) {
					result.nonCompliant.push(e);
				} else {
					result.compliant.push(e);
				}
			});
			return result;
		}
	}, {
		name: 'has Description (only active)',
		compute: (index, applications, config) => {
			const result = {
				compliant: [],
				nonCompliant: []
			};
			applications.onlyActive.forEach((e) => {
				if (e.description) {
					result.compliant.push(e);
				} else {
					result.nonCompliant.push(e);
				}
			});
			return result;
		}
	}, {
		name: 'has Lifecycle',
		compute: (index, applications, config) => {
			const result = {
				compliant: [],
				nonCompliant: []
			};
			applications.all.forEach((e) => {
				if (Utilities.getCurrentLifecycle(e)) {
					result.compliant.push(e);
				} else {
					result.nonCompliant.push(e);
				}
			});
			return result;
		}
	}, {
		name: 'has IT Owner (only active)',
		compute: (index, applications, config) => {
			const result = {
				compliant: [],
				nonCompliant: []
			};
			applications.onlyActive.forEach((e) => {
				if (_hasSubscriptionRole(e, 'IT Owner')) {
					result.compliant.push(e);
				} else {
					result.nonCompliant.push(e);
				}
			});
			return result;
		}
	}, {
		name: 'has SPOC (only active)',
		compute: (index, applications, config) => {
			const result = {
				compliant: [],
				nonCompliant: []
			};
			applications.onlyActive.forEach((e) => {
				if (_hasSubscriptionRole(e, 'SPOC')) {
					result.compliant.push(e);
				} else {
					result.nonCompliant.push(e);
				}
			});
			return result;
		}
	}, {
		name: 'has Business Value (only active)',
		compute: (index, applications, config) => {
			const result = {
				compliant: [],
				nonCompliant: []
			};
			applications.onlyActive.forEach((e) => {
				if (e.functionalSuitability) {
					result.compliant.push(e);
				} else {
					result.nonCompliant.push(e);
				}
			});
			return result;
		}
	}, {
		name: 'has Technical Condition (only active)',
		compute: (index, applications, config) => {
			const result = {
				compliant: [],
				nonCompliant: []
			};
			applications.onlyActive.forEach((e) => {
				if (e.technicalSuitability) {
					result.compliant.push(e);
				} else {
					result.nonCompliant.push(e);
				}
			});
			return result;
		}
	}, {
		name: 'has Cost Centre (only active)',
		compute: (index, applications, config) => {
			const result = {
				compliant: [],
				nonCompliant: []
			};
			applications.onlyActive.forEach((e) => {
				if (index.getFirstTagFromGroup(e, 'CostCentre')) {
					result.compliant.push(e);
				} else {
					result.nonCompliant.push(e);
				}
			});
			return result;
		}
	}, {
		name: 'Overall Quality',
		overall: true,
		compute: (compliants, nonCompliants, config) => {
			const result = {
				compliant: 0,
				nonCompliant: 0
			};
			for (let key in compliants) {
				result.compliant += compliants[key];
				result.nonCompliant += nonCompliants[key];
			}
			return result;
		}
	}
];

const _tmp = new Date();
_tmp.setFullYear(_tmp.getFullYear() - 1);
const ONE_YEAR_BEFORE = _tmp.getTime();

function _hasProductionLifecycle(application) {
	if (!application || !application.lifecycle || !application.lifecycle.phases
		 || !Array.isArray(application.lifecycle.phases)) {
		return false;
	}
	const currentLifecycle = Utilities.getCurrentLifecycle(application);
	return currentLifecycle && Utilities.isProductionPhase(currentLifecycle) && currentLifecycle.startDate > ONE_YEAR_BEFORE;
}

function _isRetired(application) {
	if (!application || !application.lifecycle || !application.lifecycle.phases
		 || !Array.isArray(application.lifecycle.phases)) {
		return false;
	}
	const phase = application.lifecycle.phases.find((e) => {
		return e.phase === 'endOfLife' && e.startDate && Date.parse(e.startDate + ' 00:00:00') > ONE_YEAR_BEFORE;
	});
	return phase !== undefined && phase !== null;
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