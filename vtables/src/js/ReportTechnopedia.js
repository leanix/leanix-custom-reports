var ReportTechnopedia = (function () {

	'use strict';

	function ReportTechnopedia(reportSetup, tagFilter, title) {
		this.reportSetup = reportSetup;
		this.tagFilter = tagFilter;
		this.title = title;
	}

	ReportTechnopedia.prototype.render = function (hideSpinner) {
		var that = this;
		var documentsUrl = '/documents?relations=false&referenceSystem=technopedia';
		var documentsPromise = $.get(this.reportSetup.apiBaseUrl + documentsUrl).then(function (documents) {
				return documents;
			});
		var factsheetsUrl = '/factsheets?'
			// add information about relations
			 + 'relations=true'
			// use maximum result limit
			 + '&pageSize=-1'
			// include services (applications)
			 + '&types[]=10'
			// include resources (IT components)
			 + '&types[]=19'
			// define wanted relations
			 + '&filterRelations[]=serviceHasResources'
			 + '&filterRelations[]=factSheetHasDocuments'
			// define wanted attributes
			 + '&filterAttributes[]=ID'
			 + '&filterAttributes[]=fullName'
			 + '&filterAttributes[]=objectCategoryID'
			 + '&filterAttributes[]=tags'
			 + '&filterAttributes[]=resourceType'
			 + '&filterAttributes[]=displayName';
		var factsheetsPromise = $.get(this.reportSetup.apiBaseUrl + factsheetsUrl).then(function (response) {
				return response.data;
			});
		$.when(documentsPromise, factsheetsPromise).then(function (documents, factsheets) {
			var reportUtils = new ReportUtils();
			// extract data
			var fsIndex = new FactSheetIndex(factsheets);
			var services = fsIndex.getSortedList('services');
			var resources = fsIndex.getSortedList('resources');
			var resourceTypes = { // exclude 'services'
				1: 'Software',
				2: 'Hardware'
			};
			var resourceTypesArray = [// objectCategoryID & exclude 'services'
				'Software',
				'Hardware'
			];
			var docIndex = {};
			for (var i = 0; i < documents.length; i++) {
				docIndex[documents[i].ID] = documents[i];
			}
			var getTechnopediaDocument = function (serviceResource) {
				if (!serviceResource.factSheetHasDocuments) {
					return;
				}
				for (var i = 0; i < serviceResource.factSheetHasDocuments.length; i++) {
					var documentRef = serviceResource.factSheetHasDocuments[i];
					if (documentRef && documentRef.documentID) {
						var document = docIndex[documentRef.documentID];
						if (document) {
							return document;
						}
					}
				}
			};
			var technopediaStates = [
				'Linked by URL',
				'Ignored',
				'Missing',
				'Not linked'
			];
			var getTechnopediaStateFromDoc = function (document) {
				if (!document || !document.referenceType) {
					return technopediaStates[3];
				}
				switch (document.referenceType) {
				case 'skipped':
					return technopediaStates[1];
				case 'missing':
					return technopediaStates[2];
				default:
					return technopediaStates[0];
				}
			};
			var marketRE = /^([A-Z]{2,3})_/;
			var getMarket = function (service) {
				var m = marketRE.exec(service.displayName);
				if (!m) {
					return null;
				}
				return m[1]; // first one is the match, followed by group matches
			};
			var getResourceCountInOtherMarkets = function (serviceResource, market) {
				if (!serviceResource || !serviceResource.serviceHasResources || !serviceResource.serviceHasResources.length
						|| !market) {
					return 0;
				}
				var count = 0;
				for (var i = 0; i < serviceResource.serviceHasResources.length; i++) {
					var serviceId = serviceResource.serviceHasResources[i].serviceID;
					var service = fsIndex.index.services[serviceId];
					if (!service) {
						continue;
					}
					var serviceMarket = getMarket(service);
					if (!serviceMarket) {
						continue;
					}
					if (serviceMarket !== market) {
						count++;
					}
				}
				return count;
			};
			// transform data
			var output = [];
			for (var i = 0; i < services.length; i++) {
				var service = services[i];
				if (that.tagFilter && service.tags.indexOf(that.tagFilter) < 0) {
					// only tagged services
					continue;
				}
				var serviceResources = service.serviceHasResources;
				for (var j = 0; j < serviceResources.length; j++) {
					var serviceResourceId = serviceResources[j].resourceID;
					var serviceResource = fsIndex.index.resources[serviceResourceId];
					var resourceType = resourceTypes[serviceResource.objectCategoryID];
					if (!resourceType) {
						continue;
					}
					var technopediaDoc = getTechnopediaDocument(serviceResource);
					output.push({
						id: service.ID,
						name: service.fullName,
						resourceId: serviceResourceId,
						resourceName: serviceResource.fullName,
						resourceType: resourceTypes[serviceResource.objectCategoryID],
						state: getTechnopediaStateFromDoc(technopediaDoc),
						stateRef: technopediaDoc ? technopediaDoc.url : '',
						stateTitle: technopediaDoc ? technopediaDoc.name : '',
						count: getResourceCountInOtherMarkets(serviceResource, getMarket(service))
					});
				}
			}
			// data & functions for BootstrapTable
			function formatApplication(cell, row) {
				return '<a href="' + that.reportSetup.baseUrl + '/services/' + row.id + '" target="_blank">' + row.name + '</a>';
			}

			function formatResource(cell, row) {
				return '<a href="' + that.reportSetup.baseUrl + '/resources/' + row.resourceId + '" target="_blank">' + row.resourceName + '</a>';
			}
			
			function formatState(cell, row) {
				switch (row.state) {
				case technopediaStates[0]:
					return '<a href="' + row.stateRef + '" target="_blank" title="' + row.stateTitle + '">' + technopediaStates[0] + '</a>';
				case technopediaStates[1]:
					return '<span title="' + row.stateTitle + '">' + technopediaStates[1] + '</span>';
				case technopediaStates[2]:
					return '<span title="' + row.stateTitle + '">' + technopediaStates[2] + '</span>';
				case technopediaStates[3]:
					return technopediaStates[3];
				}
				return technopediaStates[3];
			}

            hideSpinner();
			ReactDOM.render(
				<BootstrapTable
					data={output}
					striped hover search pagination exportCSV>
					<TableHeaderColumn isKey hidden
						dataField='id'>ID</TableHeaderColumn>
					<TableHeaderColumn dataSort
						dataField='name'
						dataAlign='left'
						dataFormat={formatApplication}
						filter={{
							type: 'TextFilter',
							placeholder: 'Please enter a value'
						}}>Application name</TableHeaderColumn>
					<TableHeaderColumn dataSort
						dataField='resourceName'
						dataAlign='left'
						dataFormat={formatResource}
						filter={{
							type: 'TextFilter',
							placeholder: 'Please enter a value'
						}}>IT Component name</TableHeaderColumn>
					<TableHeaderColumn dataSort
						dataField='resourceType'
						width='180'
						dataAlign='left'
						filter={{
							type: 'SelectFilter',
							placeholder: 'Select a type',
							options: reportUtils.getLookup(resourceTypesArray)
						}}>IT Component type</TableHeaderColumn>
					<TableHeaderColumn dataSort
						dataField='state'
						width='180'
						dataAlign='left'
						dataFormat={formatState}
						filter={{
							type: 'SelectFilter',
							placeholder: 'Select a status',
							options: reportUtils.getLookup(technopediaStates)
						}}>Technopedia status</TableHeaderColumn>
					<TableHeaderColumn dataSort
						dataField='count'
						width='200'
						dataAlign='right'
						filter={{
							type: 'NumberFilter',
							placeholder: 'Please enter a value',
							delay: 500
						}}>Count in other markets</TableHeaderColumn>
				</BootstrapTable>
			, document.getElementById('app'));
		});
	};

	return ReportTechnopedia;
})();
