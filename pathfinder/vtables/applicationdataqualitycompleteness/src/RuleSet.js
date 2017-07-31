import Utilities from './Utilities';

export default [{
		name: 'Adding applications, but no project',
		compute: (index, applications) => {
			const result = {
				compliant: 0,
				nonCompliant: 0
			};
			applications.all.forEach((e) => {
				if (!_hasProductionLifecycle(e)) {
					return;
				}
				const subIndex = e.relApplicationToProject;
				if (!subIndex) {
					result.nonCompliant++;
					return;
				}
				if (subIndex.nodes.length > 0) {
					result.compliant++;
				} else {
					result.nonCompliant++;
				}
			});
			return result;
		}
	}, {
		name: 'Retiring applications, but no project',
		compute: (index, applications) => {
			const result = {
				compliant: 0,
				nonCompliant: 0
			};
			applications.all.forEach((e) => {
				if (!_isRetired(e)) {
					return;
				}
				const subIndex = e.relApplicationToProject;
				if (!subIndex) {
					result.nonCompliant++;
					return;
				}
				if (subIndex.nodes.length > 0) {
					result.compliant++;
				} else {
					result.nonCompliant++;
				}
			});
			return result;
		}
	}, {
		name: 'has COBRA (only active, exactly one)',
		compute: (index, applications) => {
			const result = {
				compliant: 0,
				nonCompliant: 0
			};
			applications.onlyActive.forEach((e) => {
				const subIndex = e.relApplicationToBusinessCapability;
				if (!subIndex || subIndex.nodes.length < 1) {
					result.nonCompliant++;
					return;
				}
				const compliantBCs = subIndex.nodes.filter((e2) => {
					const bc = index.byID[e2.id];
					return bc && index.includesTag(bc, 'AppMap');
				});
				if (compliantBCs.length === 1) {
					result.compliant++;
				} else {
					result.nonCompliant++;
				}
			});
			return result;
		}
	}, {
		name: 'has COTS Package (only active)',
		compute: (index, applications) => {
			const result = {
				compliant: 0,
				nonCompliant: 0
			};
			applications.onlyActive.forEach((e) => {
				if (index.getFirstTagFromGroup(e, 'COTS Package')) {
					result.compliant++;
				} else {
					result.nonCompliant++;
				}
			});
			return result;
		}
	}, {
		name: 'has Software Product (only active, w/ COTS Package)',
		compute: (index, applications) => {
			const result = {
				compliant: 0,
				nonCompliant: 0
			};
			applications.onlyActiveCOTSPackage.forEach((e) => {
				const subIndex = e.relApplicationToITComponent;
				if (!subIndex || subIndex.nodes.length < 1) {
					result.nonCompliant++;
					return;
				}
				const compliantITComp = subIndex.nodes.find((e2) => {
					return index.byID[e2.id];
				});
				if (compliantITComp) {
					result.compliant++;
				} else {
					result.nonCompliant++;
				}
			});
			return result;
		}
	}, {
		name: 'has Software Product, but no Placeholder (only active, w/ COTS Package)',
		compute: (index, applications) => {
			const result = {
				compliant: 0,
				nonCompliant: 0
			};
			applications.onlyActiveCOTSPackage.forEach((e) => {
				const subIndex = e.relApplicationToITComponent;
				if (!subIndex || subIndex.nodes.length < 1) {
					return;
				}
				const compliantITComp = subIndex.nodes.find((e2) => {
					return index.byID[e2.id];
				});
				if (index.includesTag(compliantITComp ? index.byID[compliantITComp.id] : undefined, 'Placeholder')) {
					result.nonCompliant++;
				} else {
					result.compliant++;
				}
			});
			return result;
		}
	}, {
		name: 'has Description (only active)',
		compute: (index, applications) => {
			const result = {
				compliant: 0,
				nonCompliant: 0
			};
			applications.onlyActive.forEach((e) => {
				if (e.description) {
					result.compliant++;
				} else {
					result.nonCompliant++;
				}
			});
			return result;
		}
	}, {
		name: 'has Lifecycle',
		compute: (index, applications) => {
			const result = {
				compliant: 0,
				nonCompliant: 0
			};
			applications.all.forEach((e) => {
				if (Utilities.getCurrentLifecycle(e)) {
					result.compliant++;
				} else {
					result.nonCompliant++;
				}
			});
			return result;
		}
	}, {
		name: 'has IT Owner (only active)',
		compute: (index, applications) => {
			const result = {
				compliant: 0,
				nonCompliant: 0
			};
			applications.onlyActive.forEach((e) => {
				if (_hasSubscriptionRole(e, 'IT Owner')) {
					result.compliant++;
				} else {
					result.nonCompliant++;
				}
			});
			return result;
		}
	}, {
		name: 'has SPOC (only active)',
		compute: (index, applications) => {
			const result = {
				compliant: 0,
				nonCompliant: 0
			};
			applications.onlyActive.forEach((e) => {
				if (_hasSubscriptionRole(e, 'SPOC')) {
					result.compliant++;
				} else {
					result.nonCompliant++;
				}
			});
			return result;
		}
	}, {
		name: 'has Business Value (only active)',
		compute: (index, applications) => {
			const result = {
				compliant: 0,
				nonCompliant: 0
			};
			applications.onlyActive.forEach((e) => {
				if (e.functionalSuitability) {
					result.compliant++;
				} else {
					result.nonCompliant++;
				}
			});
			return result;
		}
	}, {
		name: 'has Technical Condition (only active)',
		compute: (index, applications) => {
			const result = {
				compliant: 0,
				nonCompliant: 0
			};
			applications.onlyActive.forEach((e) => {
				if (e.technicalSuitability) {
					result.compliant++;
				} else {
					result.nonCompliant++;
				}
			});
			return result;
		}
	}, {
		name: 'has Cost Centre (only active)',
		compute: (index, applications) => {
			const result = {
				compliant: 0,
				nonCompliant: 0
			};
			applications.onlyActive.forEach((e) => {
				if (index.getFirstTagFromGroup(e, 'CostCentre')) {
					result.compliant++;
				} else {
					result.nonCompliant++;
				}
			});
			return result;
		}
	}, {
		name: 'Overall Quality',
		overall: true,
		compute: (compliants, nonCompliants) => {
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
		return e.phase === 'endOfLife' && e.startDate && Date.parse(e.startDate) > ONE_YEAR_BEFORE;
	});
	return phase !== undefined && phase !== null;
}

function _hasSubscriptionRole(application, subscriptionRole) {
	const subIndex = application.subscriptions;
	if (!subIndex || subIndex.nodes.length < 1) {
		return false;
	}
	const compliantSubscription = subIndex.nodes.find((e) => {
		const roles = e.roles;
		return roles && roles.find((e2) => {
			return e2.name === subscriptionRole;
		});
	});
	return compliantSubscription;
}