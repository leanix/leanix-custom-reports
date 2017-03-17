import React, { Component } from 'react';
import ReactGantt from 'gantt-for-react';

class Diagram extends Component {
	
	constructor(props) {
		super(props);
		this._handleClick = this._handleClick.bind(this);
		this._handleDateChange = this._handleDateChange.bind(this);
		this._handleProgressChange = this._handleProgressChange.bind(this);
		this._handleViewChange = this._handleViewChange.bind(this);
		this._renderPopup = this._renderPopup.bind(this);
	}
	
	_handleClick(task) {
		//console.log(task);
	}
	
	_handleDateChange(task, start, end) {
		//console.log(task);
		//console.log(start);
		//console.log(end);
	}
	
	_handleProgressChange(task, progress) {
		//console.log(task);
		//console.log(progress);
	}
	
	_handleViewChange(viewMode) {
		//console.log(viewMode);
	}
	
	_renderPopup(task) {
		// TODO implement later
    	return '';
    }
	
	render() {
		let tasks = [];
		const services = this.props.factsheets.getSortedList('services');
		services.forEach((item) => {
			const appBCs = item.serviceHasBusinessCapabilities;
			if (!appBCs) {
				return;
			}
			const predecessors = item.factSheetHasPredecessors;
			if (!predecessors) {
				return;
			}
			let dependencies = '';
			predecessors.forEach((item2) => {
				dependencies += item2.factSheetID + ',';
			});
			dependencies = dependencies.substring(0, dependencies.length - 1);
			if (this.props.filter) {
				let include = false;
				appBCs.forEach((item2) => {
					if (checkAssociationWithBC(this.props.factsheets, item2, this.props.filter.ID)) {
						include = true;
					}
				});
				if (!include) {
					return;
				}
			}
			// TODO regeln ueberpruefen (vor allem die fallbacks)
			const lifecycles = getLifecycles(item);
			let start = lifecycles[3];
			if (!start) {
				start = lifecycles[2];
			}
			if (!start) {
				start = lifecycles[1];
			}
			if (!start) {
				start = lifecycles[4];
			}
			let end = lifecycles[5];
			if (!end) {
				end = { start: new Date() };
			}
			if (!start || !end) {
				return;
			}
			start = start.start;
			end = end.start;
			if (start.getTime() > end.getTime()) {
				// application is planned for a date in future, don't show
				return;
			}
			const task = {
				id: item.ID,
				name: item.displayName,
				start: start,
				end: end,
				progress: 100,
				dependencies: dependencies,
				factsheet: item
			};
			tasks.push(task);
		});
		if (tasks.length === 0) {
			return (
				<div style={{ width: '100%', textAlign: 'center', fontWeight: 'bold' }}>
					No data available { this.props.filter ? ' for ' + this.props.filter.displayName : '' }
				</div>
			);
		}
		return (
			<div style={{ width: '100%', overflow: 'auto' }}>
				<ReactGantt
					tasks={tasks}
					viewMode='Month'
					onClick={this._handleClick} 
					onDateChange={this._handleDateChange}
					onProgressChange={this._handleProgressChange}
					onViewChange={this._handleViewChange} 
					customPopupHtml={this._renderPopup}
				/>
			</div>
		);
	}
}

Diagram.propTypes = {
	factsheets: React.PropTypes.object.isRequired,
	filter: React.PropTypes.shape({
		ID: React.PropTypes.string.isRequired
	})
};

export default Diagram;

const lifecycles = {
    1: "Plan",
    2: "Phase In",
    3: "Active",
    4: "Phase Out",
    5: "End of Life"
}

function getLifecycle(item, stateID) {
	for (var i = 0; i < item.factSheetHasLifecycles.length; i++) {
		if (item.factSheetHasLifecycles[i].lifecycleStateID === stateID) {
			return {
				phase: lifecycles[item.factSheetHasLifecycles[i].lifecycleStateID],
				phaseID: item.factSheetHasLifecycles[i].lifecycleStateID,
				start: new Date(item.factSheetHasLifecycles[i].startDate)
			};
		}
	}
}

function getLifecycles(item) {
	const result = {};
	for (let key in lifecycles) {
		if (lifecycles.hasOwnProperty(key)) {
			const lifecycle = getLifecycle(item, key);
			if (lifecycle) {
				result[lifecycle.phaseID] = lifecycle;
			}
		}
	}
	return result;
}

function checkAssociationWithBC(factsheets, itemRef, id, idKey) {
	if (!idKey) {
		idKey = 'businessCapabilityID';
	}
	if (isIdEqualTo(itemRef, idKey, id)) {
		return true;
	}
	const bc = factsheets.byID[itemRef[idKey]];
	if (bc.factSheetHasParents) {
		for (let i = 0; i < bc.factSheetHasParents.length; i++) {
			if (checkAssociationWithBC(factsheets, bc.factSheetHasParents[i], id, 'factSheetRefID')) {
				return true;
			}
		}
	}
	return false;
}

function isIdEqualTo(item, idKey, id) {
	if (item[idKey] === id) {
		return true;
	}
	return false;
}