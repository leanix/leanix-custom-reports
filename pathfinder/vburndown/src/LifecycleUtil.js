import DateUtil from './DateUtil';

function _createLifecycleObj(lifecyclePhase) {
	if (!lifecyclePhase) {
		return;
	}
	return {
		name: lifecyclePhase.phase,
		start: !lifecyclePhase.startDate ? null : DateUtil.createDate(lifecyclePhase.startDate)
	};
}

function _addLifecyclePhaseEnd(lifecycles, phase, lifecycleModel) {
	if (!lifecycles || !phase || !phase.name || !lifecycleModel) {
		return;
	}
	let nextPhaseKey = lifecycleModel(phase.name);
	let nextPhase = getLifecyclePhase(lifecycles, nextPhaseKey);
	while (!nextPhase) {
		nextPhaseKey = lifecycleModel(nextPhaseKey);
		if (!nextPhaseKey) {
			break;
		}
		nextPhase = getLifecyclePhase(lifecycles, nextPhaseKey);
	}
	if (nextPhase) {
		// end is always inclusive, therefore subtract one ms
		phase.end = nextPhase.start.clone().subtract(1, 'ms');
		phase.range = DateUtil.createRange(phase.start, phase.end);
		phase.next = nextPhase.name;
	} else {
		phase.end = null;
		phase.range = DateUtil.createRange(phase.start, null);
		phase.next = undefined;
	}
}

function getLifecycles(node, lifecycleModel) {
	if (!node || !node.lifecycle || !node.lifecycle.phases
		 || !Array.isArray(node.lifecycle.phases)) {
		return [];
	}
	const lifecycles = node.lifecycle.phases.map((e) => {
		return _createLifecycleObj(e, lifecycleModel);
	});
	// get end dates
	lifecycles.forEach((e) => {
		_addLifecyclePhaseEnd(lifecycles, e, lifecycleModel);
	});
	return lifecycles;
}

function getLifecyclePhase(lifecycles, phase) {
	if (!lifecycles || !phase) {
		return;
	}
	for (let i = 0; i < lifecycles.length; i++) {
		const lifecycle = lifecycles[i];
		if (lifecycle && lifecycle.name === phase) {
			return lifecycle;
		}
	}
}

export default {
	getLifecycles: getLifecycles,
	getLifecyclePhase: getLifecyclePhase
};