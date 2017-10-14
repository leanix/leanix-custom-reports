import Utilities from './common/Utilities';

const virtualisedRE = /Virtualised/i;
const cloudNativeRE = /Cloud Native/i;
const cloudReadyRE = /Cloud Ready/i;
const cloudTBDRE = /Cloud TBD/i;

const financialYearRE = /FY(\d{2}\/\d{2})/;

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
		name: 'Total number of deployed applications according to IT scope',
		additionalNote: 'An application is counted if it\'s lifecycle phase is \'Active\' '
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

const adoptingApps = {
	name: '% Cloud applications',
	compute: (marketRows, config) => {
		const result = {};
		const cloudTBDRow = marketRows[singleRules[2].name];
		const cloudReadyRow = marketRows[singleRules[3].name];
		const cloudNativeRow = marketRows[singleRules[4].name];
		const totalRow = marketRows[singleRules[5].name];
		totalRow.forEach((e, i) => {
			const cloudTBD = cloudTBDRow[i].apps.length;
			const cloudReady = cloudReadyRow[i].apps.length;
			const cloudNative = cloudNativeRow[i].apps.length;
			const total = totalRow[i].apps.length;
			const percentage = total === 0 ? 0
				: ((cloudReady + cloudNative + (i === 0 ? 0 : cloudTBD)) * 100 / total);
			result['fy' + i] = percentage;
		});
		return result;
	}
};

export default {
	ruleCount: singleRules.length + 1,
	singleRules: singleRules,
	adoptingApps: adoptingApps
};
