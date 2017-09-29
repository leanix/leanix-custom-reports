import Moment from 'moment';
import { extendMoment } from 'moment-range';

const moment = extendMoment(Moment);
const adjacent = {
	adjacent: true
};

// DO NOT modify these dates!
const INIT_DATE_START = getCurrentDate(false);
const INIT_DATE_END = getCurrentDate(true);

function getInitDate(asEndDate) {
	return asEndDate ? INIT_DATE_END.clone() : INIT_DATE_START.clone();
}

function getCurrentDate(asEndDate) {
	return asEndDate ? moment().endOf('day') : moment().startOf('day');
}

function setFirstDayOfMonth(date, asEndDate) {
	if (!date) {
		return asEndDate ? moment().startOf('month').endOf('day') : moment().startOf('month');
	}
	return asEndDate ? date.startOf('month').endOf('day') : date.startOf('month');
}

function setLastDayOfMonth(date, asEndDate) {
	if (!date) {
		return asEndDate ? moment().endOf('month') : moment().endOf('month').startOf('day');
	}
	return asEndDate ? date.endOf('month') : date.endOf('month').startOf('day');
}

function setNextMonth(date) {
	if (!date) {
		return;
	}
	return date.add(1, 'months');
}

function setPreviousMonth(date) {
	if (!date) {
		return;
	}
	return date.subtract(1, 'months');
}

export default {
	getInitDate: getInitDate,
	getCurrentDate: getCurrentDate,
	setFirstDayOfMonth: setFirstDayOfMonth,
	setLastDayOfMonth: setLastDayOfMonth,
	setNextMonth: setNextMonth,
	setPreviousMonth: setPreviousMonth
};