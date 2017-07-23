import Moment from 'moment';
import { extendMoment } from 'moment-range';

const moment = extendMoment(Moment);
const adjacent = {
	adjacent: true
};

class Category {

	constructor(name, start, end) {
		this.name = name;
		// start is considered to be inclusive
		this.start = start ? moment(start) : undefined;
		// end is considered to be inclusive
		this.end = end ? moment(end) : undefined;
		if (this.start && this.end) {
			this.range = moment.range(this.start, this.end);
		}
	}

	contains(value) {
		if (!value) {
			return false;
		}
		const valueM = moment(value);
		if (!this.start) {
			// end >= value
			return this.end.isSameOrAfter(valueM);
		}
		if (!this.end) {
			// start <= value
			return this.start.isSameOrBefore(valueM);
		}
		// value between [start, end]
		return valueM.isBetween(this.start, this.end, null, '[]');
	}

	overlapsWith(from, to) {
		const fromM = from ? moment(from) : null;
		const toM = to ? moment(to) : null;
		if (this.range) {
			return this.range.overlaps(moment.range(fromM, toM), adjacent);
		} else if (this.start) {
			return this.start.isBetween(fromM, toM, null, '[]');
		} else if (this.end) {
			return this.end.isBetween(fromM, toM, null, '[]');
		}
		return false;
	}
}

export default Category;
