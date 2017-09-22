import Utilities from './common/Utilities';

// the index of the rules within the list of adoption & maturity rules
const PERCENT = 0;
const PHYSICAL = 1;
const VIRTUALISED = 2;
const TBD = 3;
const READY = 4;
const NATIVE = 5;
const DEPLOYED = 6;
const RULE_COUNT = 7;  // last + 1

// the list of adoption & maturity rule ids, names
const ruleDefs = [
	{
		id: PERCENT,
		name: '% Cloud Applications',
		percentage: true
	},
	{
		id: PHYSICAL,
		name: 'Total Number applications are Physical',
		percentage: false
	},
	{
		id: VIRTUALISED,
		name: 'Total Number applications are Virtualised',
		percentage: false
	},
	{
		id: TBD,
		name: 'Total Number applications are Cloud TBD',
		percentage: false
	},
	{
		id: READY,
		name: 'Total Number applications are Cloud Ready',
		percentage: false
	},
	{
		id: NATIVE,
		name: 'Total Number applications are Cloud Native',
		percentage: false
	},
	{
		id: DEPLOYED,
		name: 'Total Number of Deployed Applications (Current Lifecycle Phase "Active") according to IT Scope',
		percentage: false
	}
];

// the list of rules (for row selection in table)
const RULE_OPTIONS = Utilities.createOptionsObj(ruleDefs);

// the expected Cloud Maturity States
const MS_CLOUD_NATIVE = 'Cloud Native';
const MS_CLOUD_READY = 'Cloud Ready';
const MS_CLOUD_TBD = 'Cloud TBD';
//const MS_LEGACY = 'Legacy Containment';
const MS_PHYSICAL = 'Physical/Legacy';
const MS_VIRTUALISED = 'Virtualised';

function getMaturityStateFromTag(tag) {
	switch (tag) {
	case MS_CLOUD_NATIVE: return NATIVE;
	case MS_CLOUD_READY:  return READY;
	case MS_CLOUD_TBD:    return TBD;
	case MS_PHYSICAL:     return PHYSICAL;
	case MS_VIRTUALISED:  return VIRTUALISED;
	}
	return undefined;
}

export default {
	rules: ruleDefs,
	RULE_OPTIONS: RULE_OPTIONS,
	PERCENT: PERCENT,
	PHYSICAL: PHYSICAL,
	VIRTUALISED: VIRTUALISED,
	TBD: TBD,
	READY: READY,
	NATIVE: NATIVE,
	DEPLOYED: DEPLOYED,
	RULE_COUNT: RULE_COUNT,
	getMaturityStateFromTag: getMaturityStateFromTag
};
