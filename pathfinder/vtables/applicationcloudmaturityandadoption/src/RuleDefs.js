/*
import Utilities from './common/Utilities';
const ONE_YEAR_BEFORE_DATE = new Date();
ONE_YEAR_BEFORE_DATE.setHours(0, 0, 0, 0);
ONE_YEAR_BEFORE_DATE.setFullYear(ONE_YEAR_BEFORE_DATE.getFullYear() - 1);
const ONE_YEAR_BEFORE = ONE_YEAR_BEFORE_DATE.getTime();
*/
// the list of adoption & maturity rule ids, names
const PERCENT = 0;
const PHYSICAL = 1;
const VIRTUALISED = 2;
const TBD = 3;
const READY = 4;
const NATIVE = 5;
const DEPLOYED = 6;
const RULE_COUNT = 7;  // last + 1

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

export default {
	PERCENT: PERCENT,
	PHYSICAL: PHYSICAL,
	VIRTUALISED: VIRTUALISED,
	TBD: TBD,
	READY: READY,
	NATIVE: NATIVE,
	DEPLOYED: DEPLOYED,
	RULE_COUNT: RULE_COUNT,
	rules: ruleDefs
};
