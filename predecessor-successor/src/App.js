// app css
import './App.css';

// app dependencies
import React, { Component } from 'react';
import LeanixApi from './LeanixApi';
import FactsheetsIndex from './FactsheetsIndex';
import Inputfield from './Inputfield';
import Diagram from './Diagram';

const LOADING_INIT = 0;
const LOADING_SUCCESSFUL = 1;
const LOADING_ERROR = 2;

class App extends Component {

	constructor(props) {
		super(props);
		this.leanixApi = new LeanixApi();
		this._handleLoadingSuccess = this._handleLoadingSuccess.bind(this);
		this._handleLoadingError = this._handleLoadingError.bind(this);
		this._handleFilterChange = this._handleFilterChange.bind(this);
		this.state = {
			loadingState: LOADING_INIT,
			factsheets: null,
			selectedFilter: {
				index: -1,
				value: null
			},
			filterData: []
		};
	}

	componentDidMount() {
		try {
			this.leanixApi.queryFactsheets(this._handleLoadingSuccess, this._handleLoadingError,
				true, -1, [10, 18],
				['serviceHasBusinessCapabilities', 'factSheetHasLifecycles', 'factSheetHasPredecessors',
				'factSheetHasSuccessors', 'factSheetHasParents', 'factSheetHasChildren'],
				['ID', 'resourceType', 'displayName', 'description', 'level', 'parentID']);
		} catch (error) {
			this._handleLoadingError(error);
		}
	}

	_handleLoadingSuccess(data) {
		try {
			const factsheetsIndex = new FactsheetsIndex(data);
			this.setState({
				loadingState: LOADING_SUCCESSFUL,
				factsheets: factsheetsIndex,
				filterData: factsheetsIndex.getSortedList('businessCapabilities')
			});
		} catch (err) {
			this._handleLoadingError(err);
		}
	}

	_handleLoadingError(err) {
		console.error(err);
		this.setState({
			loadingState: LOADING_ERROR
		});
	}
	
	_handleFilterChange(index, value) {
		const oldValue = this.state.selectedFilter.index;
		if (oldValue === index) {
			return;
		}
		if (index < 0) {
			this.setState({
				selectedFilter: {
					index: index,
					value: null
				}
			});
		} else {
			this.setState({
				selectedFilter: {
					index: index,
					value: value
				}
			});
		}
	}

	render() {
		switch (this.state.loadingState) {
		case LOADING_INIT:
			return this._renderLoading();
		case LOADING_SUCCESSFUL:
			return this._renderSuccessful();
		case LOADING_ERROR:
			return this._renderError();
		default:
			throw new Error('Unknown loading state: ' + this.state.loadingState);
		}
	}

    _renderLoading() {
        return (
            <div className='loader' aria-hidden='true' aria-label='loading ...' />
        );
    }

    _renderError() {
        return null;
    }
	
	_renderSuccessful() {
        return (
            <div className='container-fluid App'>
				<div className='panel panel-default'>
					<div className='panel-body'>
						<Inputfield
							label='Filter:'
							placeholder='Business capability ...'
							items={this.state.filterData}
							getItemValue={item => item.displayName}
							onChange={this._handleFilterChange}
						/>
					</div>
				</div>
				<Diagram
					factsheets={this.state.factsheets}
					filter={this.state.selectedFilter.value}
				/>
            </div>
        );
    }
}

export default App;