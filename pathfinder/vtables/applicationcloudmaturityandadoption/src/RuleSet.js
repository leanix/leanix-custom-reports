import Utilities from './common/Utilities';

const virtualisedRE = /Virtualised/i;
const cloudNativeRE = /Cloud Native/i;
const cloudReadyRE = /Cloud Ready/i;
const cloudTBDRE = /Cloud TBD/i;

const financialYearRE = /FY(\d{2}\/\d{2})/;

const singleRules = [{
		name: 'Total number applications are Physical',
		additionalNote: 'An application needs a \'Cloud Maturity\' tag of \'Physical/Legacy\' to be counted.',
		appliesTo: (index, application) => {
			const cloudMaturityTag = index.getFirstTagFromGroup(application, 'Cloud Maturity');
			return cloudMaturityTag && cloudMaturityTag.name === 'Physical/Legacy';
		},
		compute: (index, application, activePhase, marketRow, config) => {
			marketRow.forEach((e) => {
				if (_isOverlapping(e, activePhase)) {
					e.apps.push(application.name);
				}
			});
		}
	}, {
		name: 'Total number applications are Virtualised',
		additionalNote: 'An application needs a \'Cloud Maturity\' tag of \'Virtualised\' (current financial year) or '
			+ 'a project with a name that contains \'Virtualised\' (future) to be counted.',
		appliesTo: (index, application) => {
			return true;
		},
		compute: (index, application, activePhase, marketRow, config) => {
			// check tag for current financial year
			const cloudMaturityTag = index.getFirstTagFromGroup(application, 'Cloud Maturity');
			if (cloudMaturityTag && cloudMaturityTag.name === 'Virtualised') {
				if (_isOverlapping(marketRow[0], activePhase)) {
					marketRow[0].apps.push(application.name);
				}
			}
			// check projects for next financial years
			const subIndex = application.relApplicationToProject;
			if (!subIndex) {
				return;
			}
			subIndex.nodes.forEach((e) => {
				// access projects
				const project = index.byID[e.id];
				const financialYear = _getFinancialYearFromProject(project, virtualisedRE, marketRow);
				if (financialYear && !financialYear.apps.includes(application.name)) {
					financialYear.apps.push(application.name);
				}
			});
		}
	}, {
		name: 'Total number applications are Cloud TBD',
		additionalNote: 'An application needs a project with a name that contains \'Cloud TBD\' (future) to be counted.',
		appliesTo: (index, application) => {
			return true;
		},
		compute: (index, application, activePhase, marketRow, config) => {
			// check projects
			const subIndex = application.relApplicationToProject;
			if (!subIndex) {
				return;
			}
			subIndex.nodes.forEach((e) => {
				// access projects
				const project = index.byID[e.id];
				const financialYear = _getFinancialYearFromProject(project, cloudTBDRE, marketRow);
				if (financialYear && !financialYear.apps.includes(application.name)) {
					financialYear.apps.push(application.name);
				}
			});
		}
	}, {
		name: 'Total number applications are Cloud Ready',
		additionalNote: 'An application needs a \'Cloud Maturity\' tag of \'Cloud Ready\' (current financial year) or '
			+ 'a project with a name that contains \'Cloud Ready\' (future) to be counted.',
		appliesTo: (index, application) => {
			return true;
		},
		compute: (index, application, activePhase, marketRow, config) => {
			// check tag for current financial year
			const cloudMaturityTag = index.getFirstTagFromGroup(application, 'Cloud Maturity');
			if (cloudMaturityTag && cloudMaturityTag.name === 'Cloud Ready') {
				if (_isOverlapping(marketRow[0], activePhase)) {
					marketRow[0].apps.push(application.name);
				}
			}
			// check projects for next financial years
			const subIndex = application.relApplicationToProject;
			if (!subIndex) {
				return;
			}
			subIndex.nodes.forEach((e) => {
				// access projects
				const project = index.byID[e.id];
				const financialYear = _getFinancialYearFromProject(project, cloudReadyRE, marketRow);
				if (financialYear && !financialYear.apps.includes(application.name)) {
					financialYear.apps.push(application.name);
				}
			});
		}
	}, {
		name: 'Total number applications are Cloud Native',
		additionalNote: 'An application needs a \'Cloud Maturity\' tag of \'Cloud Native\' (current financial year) or '
			+ 'a project with a name that contains \'Cloud Native\' (future) to be counted.',
		appliesTo: (index, application) => {
			return true;
		},
		compute: (index, application, activePhase, marketRow, config) => {
			// check tag for current financial year
			const cloudMaturityTag = index.getFirstTagFromGroup(application, 'Cloud Maturity');
			if (cloudMaturityTag && cloudMaturityTag.name === 'Cloud Native') {
				if (_isOverlapping(marketRow[0], activePhase)) {
					marketRow[0].apps.push(application.name);
				}
			}
			// check projects for next financial years
			const subIndex = application.relApplicationToProject;
			if (!subIndex) {
				return;
			}
			subIndex.nodes.forEach((e) => {
				// access projects
				const project = index.byID[e.id];
				const financialYear = _getFinancialYearFromProject(project, cloudNativeRE, marketRow);
				if (financialYear && !financialYear.apps.includes(application.name)) {
					financialYear.apps.push(application.name);
				}
			});
		}
	}, {
		name: 'Total number of deployed applications (current lifecycle phase \'Active\') according to IT scope',
		overallRule: true,
		appliesTo: (index, application) => {
			return true;
		},
		compute: (index, application, activePhase, marketRow, config) => {
			marketRow.forEach((e) => {
				if (_isOverlapping(e, activePhase)) {
					e.apps.push(application.name);
				}
			});
		}
	}
];

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
	return marketRow.find((e) => {
		return e.name === m[1];
	});
}

const adoptingApps = {
	name: '% Cloud Applications',
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
			result['fy' + i] = (cloudReady + cloudNative + (i === 0 ? 0 : cloudTBD)) * 100 / total;
		});
		return result;
	}
};

export default {
	ruleCount: singleRules.length + 1,
	singleRules: singleRules,
	adoptingApps: adoptingApps
};
