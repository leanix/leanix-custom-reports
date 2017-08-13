import Link from './Link';
import LinkList from './LinkList';

/* formatting functions for the table */

function formatLinkFactsheet(setup) {
	return (cell, row, extraData) => {
		if (!cell) {
			return '';
		}
		return (<Link
			link={setup.settings.baseUrl + '/factsheet/' + extraData.type + '/' + row[extraData.id]}
			target='_blank'
			text={cell} />);

	};
}

function formatLinkArrayFactsheets(setup) {
	return (cell, row, extraData) => {
		if (!cell) {
			return '';
		}
		return (
			<LinkList links={
				cell.reduce((arr, e, i) => {
					arr.push({
						link: setup.settings.baseUrl + '/factsheet/' + extraData.type + '/' + row[extraData.ids][i],
						target: '_blank',
						text: e
					});
					return arr;
			}, [])} />
		);
	};
}

function formatEnum(cell, row, enums) {
	if (!cell && cell !== 0) {
		return '';
	}
	return enums[cell] ? enums[cell] : '';
}

function formatOptionalText(cell, row) {
	if (!cell) {
		return '';
	}
	return cell;
}

function formatDate(cell, row) {
	if (!cell) {
		return '';
	}
	return (
		<span style={{ paddingRight: '10%' }}>
			{cell.toLocaleDateString()}
		</span>
	);
}

function formatArray(cell, row, delimiter) {
	let result = '';
	if (!cell) {
		return result;
	}
	cell.forEach((e) => {
		if (result.length) {
			result += delimiter;
		}
		result += e;
	});
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

/* PropTypes.options */

function options(props, propName, componentName) {
	const options = props[propName];
	if (options !== null && typeof options === 'object' && checkKeysAndValues(options)) {
		// test passes successfully
		return;
	}
	return new Error(
		'Invalid prop "' + propName + '" supplied to' +
		' "' + componentName + '". Validation failed.'
	);
}

const intRegExp = /^\d+$/;

function checkKeysAndValues(options) {
	for (let key in options) {
		if (!intRegExp.test(key) {
			return false;
		}
		const value = options[key];
		if (typeof value !== 'string' && !(value instanceOf String)) {
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
			'Invalid prop "' + propName + '" supplied to' +
			' "' + componentName + '". Validation failed.'
		);
	};
}

function isStringArray(arr) {
	for (let i = 0; i < arr.length; i++) {
		const e = arr[i];
		if (typeof e !== 'string' && !(e instanceOf String)) {
			return false;
		}
	}
	return true;
}

export default {
	formatLinkFactsheet: formatLinkFactsheet,
	formatLinkArrayFactsheets: formatLinkArrayFactsheets,
	formatEnum: formatEnum,
	formatOptionalText: formatOptionalText,
	formatDate: formatDate,
	formatArray: formatArray,
	csvFormatDate: csvFormatDate,
	textFilter: textFilter,
	selectFilter: selectFilter,
	dateFilter: dateFilter,
	PropTypes: {
		options: options,
		idArray: idArray
	}
};