import React, { Component } from 'react';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import CommonQueries from './CommonGraphQLQueries';
import DataIndex from './DataIndex';
import Link from './Link';
import LinkList from './LinkList';
import Utilities from './Utilities';

class Report extends Component {

	constructor(props) {
		super(props);
		this._initReport = this._initReport.bind(this);
		this._handleData = this._handleData.bind(this);
		this._formatLink = this._formatLink.bind(this);
		this.ITCMP_CATEGORY = {};
		this.ITCMP_CATEGORY_EXCLUDE = 'service';
		// TODO: get Technopedia state from model as soon as it is available as attribute
		this.TECHNOP_STATE = {
			0: '',
			1: 'URL',
			2: 'Ignored',
			3: 'Missing'
		};
		this.state = {
			setup: null,
			data: []
		};
	}

	componentDidMount() {
		lx.init().then(this._initReport);
	}

	_initReport(setup) {
		lx.ready(this._createConfig());
		this.setState({
			setup: setup
		});
		// get categories of ITComponents from data model
		this.ITCMP_CATEGORY = this._getITCmpCategory(setup).
			filter((e) => {
				return e !== this.ITCMP_CATEGORY_EXCLUDE;
			}).
			reduce((r, e, i) => {
				r[i] = e;
				return r;
		}, {});
		// get all tags, then the data
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			const index = new DataIndex();
			index.put(tagGroups);
			const appTagID = index.getFirstTagID('Application Type', 'Application');
			lx.executeGraphQL(this._createQuery(appTagID)).then((data) => {
				index.put(data);
				this._handleData(index, appTagID);
			});
		});
	}

	_getITCmpCategory(setup) {
		const relationModel = setup.settings.dataModel.factSheets;
		if (!relationModel ||
			!relationModel.ITComponent ||
			!relationModel.ITComponent.fields ||
			!relationModel.ITComponent.fields.category ||
			!Array.isArray(relationModel.ITComponent.fields.category.values)
		   ) {
			return [];
		}
		return relationModel.ITComponent.fields.category.values;
	}

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_createQuery(appTagID) {
		let appTagIDFilter = ''; // initial assume tagGroup.name changed or the id couldn't be determined otherwise
		let tagNameDef = 'tags { name }'; // initial assume to get it
		if (appTagID) {
			// query filtering only bc with tag 'Application'
			appTagIDFilter = `, {facetKey: "BC Type", keys: ["${appTagID}"]}`;
			tagNameDef = '';
		}
		return `{applications: allFactSheets(
					sort: {mode: BY_FIELD, key: "displayName", order: asc},
					filter: { facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Application"]}
						${appTagIDFilter}
					] }
				) {
					edges { node {
						id name ${tagNameDef}
						... on Application {
							relApplicationToITComponent {
								edges { node { factSheet {
									id fullName type
									documents {
										edges{ node{ name url } }
									}
									... on ITComponent {
										category
										relITComponentToApplication {
											edges { node { factSheet { name } } }
										}
 									}
								} } }
							}
						}
					}}
				}}`;
	}

	_getITCmpCountInOtherMarkets(itcmp, market) {
		if (!itcmp || !itcmp.relITComponentToApplication || !market) {
			return 0;
		}
		let count = 0;
		itcmp.relITComponentToApplication.nodes.forEach((app) => {
			const appmarket = Utilities.getMarket(app);
			if (appmarket && appmarket !== market) {
				count++;
			}
		});
		return count;
	}

	_getOptionKeyFromValue(options, value) {
		if (!value) {
			return undefined;
		}
		const key = Utilities.getKeyToValue(options, value);
		return key !== undefined && key !== null ? parseInt(key, 10) : undefined;
	}

	/* a workaround for doc testing only because 'allFactSheets' don't deliver documents */
	_getDocuments(what) {
		const nodes = [];
		let node = {};
		let node2 = {};
		switch (what) {
			case 0:
				//TDBF
				node.name = 'Technopedia entry';
				node.url = 'http://technopedia.com/release/67015598';
				nodes.push(node);
				break;
			case 1:
				//ignore
				node.name = 'Technopedia entry - ignored'
				node.url = 'http://www.technopedia.com'
				nodes.push(node);
				break;
			case 2:
				//miss.
				node.name = 'Technopedia entry - missing'
				node.url = 'http://www.technopedia.com'
				nodes.push(node);
				break;
			case 3:
				//TDMaker
				node.name = 'Technopedia entry'
				node.url = 'http://technopedia.com/release/74423149'
				nodes.push(node);
				//add other
				node2.name = 'other'
				node2.url = 'https://heise.de'
				nodes.push(node2);
		}
		return nodes;
	}

	_handleData(index, appTagID) {
		const tableData = [];
		let tmpDocChoice = 0; // for doc test only
		index.applications.nodes.forEach((app) => {
			if (!appTagID && !index.includesTag(app, 'Application')) {
				return;
			}
			const subIndex = app.relApplicationToITComponent;
			if (!subIndex) {
				return;
			}
			subIndex.nodes.forEach((itcmp) => {
				if (itcmp.category === this.ITCMP_CATEGORY_EXCLUDE) {
					return;
				}
/* excluded in cause of 'for doc test only'
				const documents = itcmp.documents ? itcmp.documents.nodes : [];
*/
				const documents = this._getDocuments(tmpDocChoice);  // for doc test only
				if (tmpDocChoice > 5) {tmpDocChoice = 0} else {tmpDocChoice++};  // for doc test only
				let doc = { state: 0, ref: '' };
				documents.forEach((e) => {
					/* TODO:
						use attribute for state as soon as it is available
						instead of parsing document name
					*/
					if (!e.name.startsWith('Technopedia entry')) {
						return;
					}
					if (e.name.endsWith('ignored')) {
						doc.state = 2;
					} else {
						if (e.name.endsWith('missing')) {
							doc.state = 3;
						} else {
							doc.state = 1;
							doc.ref = e.url ? e.url : '';
						}
					}
				});

				tableData.push({
					appName: app.name,
					appID: app.id,
					itcmpName: itcmp.fullName,
					itcmpID: itcmp.id,
					itcmpCategory: this._getOptionKeyFromValue(this.ITCMP_CATEGORY, itcmp.category),
					state: doc.state,
					stateRef: doc.ref,
					count: this._getITCmpCountInOtherMarkets(itcmp, Utilities.getMarket(app))
				});
			});
		});
		this.setState({
			data: tableData
		});
	}

	/* formatting functions for the table */

	_formatLink(cell, row, extraData) {
		if (!cell && cell !== 0) {
			return '';
		}
		return (<Link link={this.state.setup.settings.baseUrl + '/factsheet/' + extraData.type + '/' + row[extraData.id]} target='_blank' text={cell} />);
	}

	_formatEnum(cell, row, enums) {
		if (!cell && cell !== 0) {
			return '';
		}
		return enums[cell] ? enums[cell] : '';
	}

	_formatState(cell, row, status) {
		if (!cell) {
			return '';
		}
		if (cell === 1) {
			return (<Link link={row.stateRef} target='_blank' text={status[cell]} />);
		}
		return status[cell] ? status[cell] : '';
	}

	/* formatting functions for the csv export */

	render() {
		return (
			<BootstrapTable data={this.state.data} keyField='appID'
				 striped hover search exportCSV pagination ignoreSinglePage
				 options={{ clearSearch: true }}>
				<TableHeaderColumn dataSort
					dataField='appName'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={{ type: 'Application', id: 'appID' }}
					csvHeader='name'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>Application name</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='itcmpName'
					dataAlign='left'
					dataFormat={this._formatLink}
					formatExtraData={{ type: 'ITComponent', id: 'itcmpID' }}
					csvHeader='resourceName'
					filter={{ type: 'TextFilter', placeholder: 'Please enter a value' }}
				>IT Component name</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='itcmpCategory'
					width='180px'
					dataAlign='left'
					dataFormat={this._formatEnum}
					formatExtraData={this.ITCMP_CATEGORY}
					csvHeader='resourceName'
					csvFormat={this._formatEnum}
					csvFormatExtraData={this.ITCMP_CATEGORY}
					filter={{ type: 'SelectFilter', condition: 'eq', placeholder: 'Please choose', options: this.ITCMP_CATEGORY }}
				>IT Component type</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='state'
					width='180px'
					dataAlign='left'
					dataFormat={this._formatState}
					formatExtraData={this.TECHNOP_STATE}
					filter={{ type: 'SelectFilter', condition: 'eq', placeholder: 'Please choose', options: this.TECHNOP_STATE }}
				>Technopedia status</TableHeaderColumn>
				<TableHeaderColumn dataSort
					dataField='count'
					width='200'
					dataAlign='right'
					filter={{ type: 'NumberFilter', placeholder: 'Please enter a value', delay: 500 }}
				>Count in other markets</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

export default Report;
