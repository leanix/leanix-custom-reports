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

function createDate(dateString, asEndDate) {
	return asEndDate ? moment(dateString).endOf('day') : moment(dateString).startOf('day');
}

function createRange(from, to) {
	if (from === undefined) {
		from = null;
	}
	if (to === undefined) {
		to = null;
	}
	return moment.range(from, to);
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

function contains(dateRange, date) {
	if (!dateRange || !date) {
		return false;
	}
	if (!dateRange.start) {
		// end >= date
		return dateRange.end.isSameOrAfter(date);
	}
	if (!dateRange.end) {
		// start <= date
		return dateRange.start.isSameOrBefore(date);
	}
	if (!dateRange.start && !dateRange.end) {
		// open ended in both ways
		return true;
	}
	// date between [start, end]
	return date.isBetween(dateRange.start, dateRange.end, null, '[]');
}

function overlapsWith(firstDateRange, secondDateRange) {
	if (!firstDateRange || !firstDateRange) {
		return false;
	}
	const firstRange = firstDateRange.range ? firstDateRange.range : createRange(firstDateRange.start, firstDateRange.end);
	const secondRange = secondDateRange.range ? secondDateRange.range : createRange(secondDateRange.start, secondDateRange.end);
	return firstRange.overlaps(secondRange, adjacent);
}

export default {
	getInitDate: getInitDate,
	getCurrentDate: getCurrentDate,
	createDate: createDate,
	createRange: createRange,
	setFirstDayOfMonth: setFirstDayOfMonth,
	setLastDayOfMonth: setLastDayOfMonth,
	setNextMonth: setNextMonth,
	setPreviousMonth: setPreviousMonth,
	contains: contains,
	overlapsWith: overlapsWith
};