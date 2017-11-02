import Utilities from './common/Utilities';

// regexp are designed to be forgivable regarding case-sensitivity and spaces
const virtualisedRE = /Virtualised/i;
const cloudNativeRE = /Cloud\s*Native/i;
const cloudReadyRE = /Cloud\s*Ready/i;
const cloudTBDRE = /Cloud\s*TBD/i;

// 'FYnn/nn'
const financialYearRE = /FY(\d{2}\/\d{2})/i;

const singleRules = [{
		name: 'Total number of physical applications',
		additionalNote: 'An application needs a \'Cloud Maturity\' tag of \'Physical/Legacy\' to be counted.',
		appliesTo: (index, application) => {
			const cloudMaturityTag = index.getFirstTagFromGroup(application, 'Cloud Maturity');
			return cloudMaturityTag && cloudMaturityTag.name === 'Physical/Legacy';
		},
		compute: (index, application, productionPhase, marketRow, config) => {
			marketRow.forEach((e) => {
				if (_isOverlapping(e, productionPhase) && !_includesID(e.apps, application.id)) {
					e.apps.push(application);
				}
			});
		}
	}, {
		name: 'Total number of virtualised applications',
		additionalNote: 'An application needs a \'Cloud Maturity\' tag of \'Virtualised\' or '
			+ 'a project with a name that contains \'Virtualised\' to be counted.',
		appliesTo: (index, application) => {
			return true;
		},
		compute: (index, application, productionPhase, marketRow, config) => {
			// check and add from tag for financial years
			_addFromCloudMaturity(index, application, productionPhase, marketRow, 'Virtualised');
			// check and add from projects for financial years
			_addFromProjects(index, application, virtualisedRE, marketRow);
		}
	}, {
		name: 'Total number of Cloud TBD applications',
		additionalNote: 'An application needs a project with a name that contains \'Cloud TBD\' to be counted.',
		appliesTo: (index, application) => {
			return true;
		},
		compute: (index, application, productionPhase, marketRow, config) => {
			// check and add from projects for financial years
			_addFromProjects(index, application, cloudTBDRE, marketRow);
		}
	}, {
		name: 'Total number of Cloud Ready applications',
		additionalNote: 'An application needs a \'Cloud Maturity\' tag of \'Cloud Ready\' or '
			+ 'a project with a name that contains \'Cloud Ready\' to be counted.',
		appliesTo: (index, application) => {
			return true;
		},
		compute: (index, application, productionPhase, marketRow, config) => {
			// check and add from tag for financial years
			_addFromCloudMaturity(index, application, productionPhase, marketRow, 'Cloud Ready');
			// check and add from projects for financial years
			_addFromProjects(index, application, cloudReadyRE, marketRow);
		}
	}, {
		name: 'Total number of Cloud Native applications',
		additionalNote: 'An application needs a \'Cloud Maturity\' tag of \'Cloud Native\' or '
			+ 'a project with a name that contains \'Cloud Native\' to be counted.',
		appliesTo: (index, application) => {
			return true;
		},
		compute: (index, application, productionPhase, marketRow, config) => {
			// check and add from tag for financial years
			_addFromCloudMaturity(index, application, productionPhase, marketRow, 'Cloud Native');
			// check and add from projects for financial years
			_addFromProjects(index, application, cloudNativeRE, marketRow);
		}
	}, {
		name: 'Total number of group applications used',
		additionalNote: 'An application is counted if it is related to a market that uses applications having a name '
			+ 'which is prefixed by \'VGS\' or \'VGE\' and  an \'Active\' and/or \'Phase Out\' lifecycle phase in the financial year.',
		appliesTo: (index, application) => {
			const subIndex = application.relApplicationToOwningUserGroup;
			if (!subIndex) {
				return false;
			}
			return true;
		},
		compute: (index, application, productionPhase, marketRow, config) => {
			// check and add from owing user groups for financial years
			_addFromOwningUsergroups(index, application, productionPhase, marketRow);
		}
	}, {
		name: 'Total number of deployed applications according to IT scope',
		additionalNote: 'An application is counted if its lifecycle phase is \'Active\' '
			+ 'and/or \'Phase Out\' in the financial year.',
		overallRule: true,
		appliesTo: (index, application) => {
			return true;
		},
		compute: (index, application, productionPhase, marketRow, config) => {
			marketRow.forEach((e) => {
				if (_isOverlapping(e, productionPhase) && !_includesID(e.apps, application.id)) {
					e.apps.push(application);
				}
			});
			// check and add from owing user groups for financial years
			_addFromOwningUsergroups(index, application, productionPhase, marketRow);
		}
	}
];

function _includesID(apps, id) {
	return apps.some((e) => {
		return e.id === id;
	});
}

function _isOverlapping(first, second) {
	if (!first || !second) {
		return false;
	}
	if (first.end < second.start || first.start > second.end) {
		return false;
	}
	return true;
}

function _getFinancialYearFromProject(project, cloudRE, marketRow) {
	if (!cloudRE.test(project.name)) {
		return;
	}
	// get financial year
	const m = financialYearRE.exec(project.name);
	if (!m) {
		return;
	}
	return marketRow.findIndex((e) => {
		return e.name === m[1];
	});
}

function _addFromProjects(index, application, cloudRE, marketRow) {
	const subIndex = application.relApplicationToProject;
	if (!subIndex) {
		return;
	}
	subIndex.nodes.forEach((e) => {
		// access projects
		const project = index.byID[e.id];
		const financialYearIndex = _getFinancialYearFromProject(project, cloudRE, marketRow);
		const financialYear = marketRow[financialYearIndex];
		if (financialYear && !_includesID(financialYear.apps, application.id)) {
			financialYear.apps.push(application);
			// TODO das irgendwie anders gestalten
			if (financialYear.isCurrentYear && financialYearIndex > 0) {
				// the 'current' column is always right before the current fiscal year!
				marketRow[financialYearIndex - 1].apps.push(application);
			}
			// add application for future financial years as well
			for (let i = financialYearIndex + 1; i < marketRow.length; i++) {
				const futureFY = marketRow[i];
				if (!_includesID(futureFY.apps, application.id)) {
					futureFY.apps.push(application);
				}
			}
		}
	});
}

function _addFromCloudMaturity(index, application, productionPhase, marketRow, cloudMaturityTagName) {
	const cloudMaturityTag = index.getFirstTagFromGroup(application, 'Cloud Maturity');
	if (cloudMaturityTag && cloudMaturityTag.name === cloudMaturityTagName) {
		marketRow.forEach((e) => {
			if (_isOverlapping(e, productionPhase) && !_includesID(e.apps, application.id)) {
				e.apps.push(application);
			}
		});
	}
}

/**
  * adapt FY counters depending on related 'owned user groups' and
  * their 'used applications' with Prefix 'VGS' or 'VGE'
  */
function _addFromOwningUsergroups(index, application, productionPhase, marketRow) {
	// get the applicaton's related 'owning user groups'
	const subIndex = application.relApplicationToOwningUserGroup;
	if (!subIndex) {
		return;
	}
	// access userGroups - there can be more than one and
	// there could be more at the parents
	subIndex.nodes.forEach((ug) => {
		let currentUG = index.byID[ug.id];
		while (currentUG) {
			const usedApplIndex = currentUG.relUserGroupToApplication;
			if (!usedApplIndex) {
				currentUG = index.getParent('userGroups', currentUG.id);
				continue;
			}
			usedApplIndex.nodes.forEach((e) => {
				const usedApp = index.byID[e.id];
				if (!usedApp || (!usedApp.name.startsWith('VGS') && !usedApp.name.startsWith('VGE'))) {
					return;
				}
				marketRow.forEach((e1) => {
					// TODO use productionPhase from usedApp
					if (_isOverlapping(e1, productionPhase) && !_includesID(e1.apps, usedApp.id)) {
						e1.apps.push(usedApp);
					}
				});
			});
			// set parent as next
			currentUG = index.getParent('userGroups', currentUG.id);
		}
	});
}

const adoptingApps = {
	name: '% Cloud applications',
	compute: (marketRows, config) => {
		const result = {};
		const cloudTBDRow = marketRows[singleRules[2].name];
		const cloudReadyRow = marketRows[singleRules[3].name];
		const cloudNativeRow = marketRows[singleRules[4].name];
		const groupAppsRow = marketRows[singleRules[5].name];
		const totalRow = marketRows[singleRules[6].name];
		totalRow.forEach((e, i) => {
			const cloudTBD = cloudTBDRow[i].apps.length;
			const cloudReady = cloudReadyRow[i].apps.length;
			const cloudNative = cloudNativeRow[i].apps.length;
			const groupApps = groupAppsRow[i].apps.length;
			const total = totalRow[i].apps.length;
			/* formula:
				fy0 -> (cloudTBD + cloudReady + cloudNative + groupApps) * 100 / total
				fy1-n & current -> (cloudReady + cloudNative + groupApps) * 100 / total
			*/
			const percentage = total === 0 ? 0
				: ((i === 0 ? 0 : cloudTBD) + cloudReady + cloudNative + groupApps) * 100 / total;
			result[(i > 0 ? 'fy' + (i - 1) : 'current')] = Math.round(percentage * 10) / 10;
		});
		return result;
	}
};

export default {
	ruleCount: singleRules.length + 1,
	singleRules: singleRules,
	adoptingApps: adoptingApps
};
