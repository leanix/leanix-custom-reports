const QUARTERS = ['-01-01', '-04-01', '-07-01', '-10-01'];

function createCategories() {
	// create categories in an interval from now - 3 to now + 1 (e.g. now = 2017 -> [2014, 2018])
	const now = new Date().getFullYear();
	const result = [];
	for (let i = now - 3, max = now + 2; i < max; i++) {
		QUARTERS.forEach((quarter) => {
			result.push(i + quarter);
		});
	}
	return result;
}

function map(requestData, factsheetType, categories) {
	// just to be safe
	if (!factsheetType) {
		return {
			min: {
				x: undefined,
				y: undefined,
				y2: undefined
			},
			max: {
				x: undefined,
				y: undefined,
				y2: undefined
			},
			data: []
		};
	}
	const chartData = {
		data: [
			['total'],
			['retired'],
			['added']
		]
	};

	chartData.min = {
		x: undefined,
		y: -150,
		y2: 3900
	};
	chartData.max = {
		x: undefined,
		y: 150,
		y2: 4200
	};

	chartData.data = [
		['total', 4015, 4047, 4092, 4125, 4110, 4114, 4123, 4108, 4109, 4111, 4119, 4116, 4130, 4119, 4104, 4086, 4064, 3939, 3936, 3928],
		['retired', -46, -16, -20, -54, -23, -17, -24, -28, -25, -15, -17, -38, -38, -27, -22, -23, -127, -3, -8, 0],
		['added', 78, 61, 53, 39, 27, 26, 9, 29, 27, 23, 14, 52, 19, 12, 4, 1, 2, 0, 0, 0]
	];

	return chartData;
}

export default {
	createCategories: createCategories,
	map: map
};
