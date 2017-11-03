import React from 'react';
import Utilities from './Utilities';
import Link from './Link';
import LinkList from './LinkList';

/* formatting functions for the table */

const OVERFLOW_CELL_STYLE = {
	maxHeight: '100px',
	overflow: 'auto'
};

function formatLinkFactsheet(setup) {
	const baseUrl = Utilities.getFrom(setup, 'settings.baseUrl');
	return (cell, row, extraData) => {
		if (!cell || !baseUrl) {
			return '';
		}
		return (
			<Link
				link={baseUrl + '/factsheet/' + extraData.type + '/' + row[extraData.id]}
				target='_blank'
				text={cell} />
		);
	};
}

function formatLinkArrayFactsheets(setup) {
	const baseUrl = Utilities.getFrom(setup, 'settings.baseUrl');
	return (cell, row, extraData) => {
		if (!cell || !baseUrl) {
			return '';
		}
		return (
			<div style={OVERFLOW_CELL_STYLE}>
				<LinkList links={
					cell.reduce((arr, e, i) => {
						arr.push({
							link: baseUrl + '/factsheet/' + extraData.type + '/' + row[extraData.id][i],
							target: '_blank',
							text: e
						});
						return arr;
				}, [])}
				delimiter={extraData.delimiter} />
			</div>
		);
	};
}

function formatEnum(cell, row, enums) {
	if (!cell && cell !== 0) {
		return '';
	}
	return enums[cell] ? enums[cell] : '';
}

function formatEnumArray(cell, row, extraData) {
	let result = '';
	if (!cell || !extraData || !extraData.delimiter || !extraData.enums) {
		return result;
	}
	let first = false;
	cell.forEach((e) => {
		const formatted = formatEnum(e, row, extraData.enums);
		if (formatted === '') {
			return;
		}
		if (first) {
			result += extraData.delimiter;
		} else {
			first = true;
		}
		result += formatted;
	});
	if (extraData.delimiter === '<br/>') {
		return (
			<div style={OVERFLOW_CELL_STYLE}
				dangerouslySetInnerHTML={{ __html: result }} />
		);
	}
	return result;
}

function formatOptionalText(cell, row, formatRaw) {
	if (!cell) {
		return '';
	}
	return formatRaw ? cell : (
		<div style={OVERFLOW_CELL_STYLE}>{cell}</div>
	);
}

function formatDate(cell, row) {
	if (!cell) {
		return '';
	}
	return (
		<span style={{ paddingRight: '10%' }}>
			{_formatDate(cell)}
		</span>
	);
}

function _formatDate(date) {
	return _formatDateNumber(date.getDate()) + '-'
		+ _formatDateNumber(date.getMonth() + 1) + '-'
		+ date.getFullYear();
}

function _formatDateNumber(n) {
	return n < 10 ? '0' + n : n;
}

function formatArray(cell, row, delimiter) {
	let result = '';
	if (!cell || !delimiter) {
		return result;
	}
	cell.forEach((e) => {
		if (result.length) {
			result += delimiter;
		}
		result += e;
	});
	if (delimiter === '<br/>') {
		return (
			<div style={OVERFLOW_CELL_STYLE}
				dangerouslySetInnerHTML={{ __html: result }} />
		);
	}
	return result;
}

/* formatting functions for the csv export */

function csvFormatDate(cell, row) {
	if (!cell) {
		return '';
	}
	return cell.toLocaleDateString();
}

/* pre-defined filter objects */

const textFilter = {
	type: 'TextFilter',
	condition: 'like',
	placeholder: 'Please enter a value'
};

function selectFilter(options) {
	return {
		type: 'SelectFilter',
		condition: 'eq',
		placeholder: 'Please choose',
		options: options
	};
}

const dateFilter = {
	type: 'DateFilter'
};

const numberFilter = {
	type: 'NumberFilter',
	placeholder: 'Please enter a value',
	defaultValue: {
		comparator: '<='
	}
};

/* custom PropTypes */

function options(props, propName, componentName) {
	const options = props[propName];
	if (options !== null && typeof options === 'object' && checkKeysAndValues(options)) {
		// test passes successfully
		return;
	}
	return new Error(
		'Invalid prop "' + propName + '" supplied to "' + componentName + '". Validation failed.'
	);
}

const intRegExp = /^\d+$/;

function checkKeysAndValues(options) {
	for (let key in options) {
		if (!intRegExp.test(key)) {
			return false;
		}
		const value = options[key];
		if (typeof value !== 'string' && !(value instanceof String)) {
			return false;
		}
	}
	return true;
}

function idArray(namesPropName) {
	return (props, propName, componentName) => {
		const ids = props[propName];
		const names = props[namesPropName];
		if (names && ids
			 && Array.isArray(names) && Array.isArray(ids)
			 && names.length === ids.length
			 && isStringArray(ids)) {
			// test passes successfully
			return;
		}
		return new Error(
			'Invalid prop "' + propName + '" supplied to "' + componentName + '". Validation failed.'
		);
	};
}

function isStringArray(arr) {
	for (let i = 0; i < arr.length; i++) {
		const e = arr[i];
		if (typeof e !== 'string' && !(e instanceof String)) {
			return false;
		}
	}
	return true;
}

export default {
	OVERFLOW_CELL_STYLE: OVERFLOW_CELL_STYLE,
	formatLinkFactsheet: formatLinkFactsheet,
	formatLinkArrayFactsheets: formatLinkArrayFactsheets,
	formatEnum: formatEnum,
	formatEnumArray: formatEnumArray,
	formatOptionalText: formatOptionalText,
	formatDate: formatDate,
	formatArray: formatArray,
	csvFormatDate: csvFormatDate,
	textFilter: textFilter,
	selectFilter: selectFilter,
	dateFilter: dateFilter,
	numberFilter: numberFilter,
	PropTypes: {
		options: options,
		idArray: idArray
	}
};