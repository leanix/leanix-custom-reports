var ReportApplicationLifecycle = (function () {

	'use strict';

    function ReportApplicationLifecycle(reportSetup, tagFilter, title) {
        this.reportSetup = reportSetup;
        this.tagFilter = tagFilter;
        this.title = title;
    }

    ReportApplicationLifecycle.prototype.render = function (hideSpinner) {
        var that = this;

        var tagGroupPromise = $.get(this.reportSetup.apiBaseUrl + '/tagGroups')
            .then(function (response) {
                var tagGroups = {};
                for (var i = 0; i < response.length; i++) {
                    tagGroups[response[i]['name']] = [];
                    for (var j = 0; j < response[i]['tags'].length; j++) {
                        tagGroups[response[i]['name']].push(response[i]['tags'][j]['name']);
                    }
                }
                return tagGroups;
            });

        var factSheetPromise = $.get(this.reportSetup.apiBaseUrl + '/factsheets?relations=true'
            + '&types[]=10&types[]=16&pageSize=-1'
            + '&filterRelations[]=serviceHasProjects&filterRelations[]=factSheetHasLifecycles'
            + '&filterAttributes[]=displayName'
            + '&filterAttributes[]=ID'
            + '&filterAttributes[]=fullName'
            + '&filterAttributes[]=resourceType'
            + '&filterAttributes[]=tags'
        )
            .then(function (response) {
                return response.data;
            });



        $.when(tagGroupPromise, factSheetPromise)
            .then(function (tagGroups, data) {
                var fsIndex = new FactSheetIndex(data);
                var list = fsIndex.getSortedList('services');

                var reportUtils = new ReportUtils();

                var getTagFromGroup = function (object, validTags) {
                    var cc = object.tags.filter(function (x) {
                        if (validTags.indexOf(x) >= 0)
                            return true;
                        else
                            return false;
                    });

                    if (cc.length)
                        return cc[0];

                    return '';
                };

                var getLookup = function (data) {
                    var ret = {};
                    for (var i = 0; i < data.length; i++) {
                        ret[data[i]] = data[i];
                    }

                    return ret;
                };

                var projectTypes = tagGroups['Project Type'];
                var costCentres = tagGroups['CostCentre'];
                var deployments = tagGroups['Deployment'];
				var lifecycleArray = reportUtils.lifecycleArray();

                var projectImpacts = {
                    1: 'Adds',
                    2: 'Modifies',
                    3: 'Sunsets'
                };
                var projectImpactOptions = [];
                for (var key in projectImpacts) {
                    projectImpactOptions.push(projectImpacts[key]);
                }
                var decommissioningRE = /decommissioning/i;
				
				var createItem = function (outputItem, lifecycle) {
					var newItem = {};
					for (var key in outputItem) {
						newItem[key] = outputItem[key];
					}
					newItem.lifecyclePhase = lifecycle.phase;
					newItem.lifecycleStart = lifecycle.startDate;
					return newItem;
				};
				
				var copy = function (item) {
					var newItem = {};
					for (var key in item) {
						newItem[key] = item[key];
					}
					return newItem;
				};

                var output = [];
                for (var i = 0; i < list.length; i++) {
					var service = list[i];
                    if (!that.tagFilter || service.tags.indexOf(that.tagFilter) != -1) {
                        var lifecycles = reportUtils.getLifecycles(service);
						for (var j = 0; j < lifecycles.length; j++) {
							var lifecycle = lifecycles[j];
							var outputItem = {
								name: service.fullName,
                                id: service.ID,
                                costCentre: getTagFromGroup(service, costCentres),
                                deployment: getTagFromGroup(service, deployments),
                                projectId: '',
                                projectName: '',
                                projectImpact: '',
                                projectType: '',
                                lifecyclePhase: lifecycle.phase,
                                lifecycleStart: lifecycle.startDate
							};
							if (!service.serviceHasProjects) {
								// add directly, if no projects
								output.push(outputItem);
								continue;
							}
							var nothingAdded = true;
							// add duplicates with project information according to lifecycle rules
							switch (lifecycle.phaseID) {
								case '1': // plan
								case '2': // phase in
									for (var k = 0; k < service.serviceHasProjects.length; k++) {
										var projectRef = service.serviceHasProjects[k];
										var projectId = projectRef.projectID;
										var project = fsIndex.index.projects[projectId];
										if (!project) {
											continue;
										}
										var projectName = project.fullName;
										var projectType = getTagFromGroup(project, projectTypes);
										// project doesn't contain decommissioning in name and impact is 'adds'
										if (!decommissioningRE.test(projectName) && projectRef.projectImpactID && projectRef.projectImpactID === '1') {
											var projectImpact = projectImpacts[projectRef.projectImpactID];
											var copiedItem = copy(outputItem);
											copiedItem.projectId = projectId;
											copiedItem.projectName = projectName;
											copiedItem.projectImpact = projectImpact;
											copiedItem.projectType = projectType;
											output.push(copiedItem);
											nothingAdded = false;
										}
									}
									break;
								case '3': // active
									for (var k = 0; k < service.serviceHasProjects.length; k++) {
										var projectRef = service.serviceHasProjects[k];
										var projectId = service.serviceHasProjects[k].projectID;
										var project = fsIndex.index.projects[projectId];
										if (!project) {
											continue;
										}
										var projectName = project.fullName;
										var projectType = getTagFromGroup(project, projectTypes);
										// project doesn't contain decommissioning in name and impact is 'adds', 'modifies' or no impact
										if (!decommissioningRE.test(projectName)
												&& (!projectRef.projectImpactID || projectRef.projectImpactID === '1' || projectRef.projectImpactID === '2')) {
											var projectImpact = projectRef.projectImpactID ? projectImpacts[projectRef.projectImpactID] : '';
											if (projectImpact === 'foo') {
												console.log(projectRef);//TD_Appl22_withManyPrj-mix
											}
											var copiedItem = copy(outputItem);
											copiedItem.projectId = projectId;
											copiedItem.projectName = projectName;
											copiedItem.projectImpact = projectImpact;
											copiedItem.projectType = projectType;
											output.push(copiedItem);
											nothingAdded = false;
										}
									}
									break;
								case '4': // phase out
								case '5': // end of life
									for (var k = 0; k < service.serviceHasProjects.length; k++) {
										var projectRef = service.serviceHasProjects[k];
										var projectId = service.serviceHasProjects[k].projectID;
										var project = fsIndex.index.projects[projectId];
										if (!project) {
											continue;
										}
										var projectName = project.fullName;
										var projectType = getTagFromGroup(project, projectTypes);
										// project does contain decommissioning in name or impact is 'sunsets'
										if (decommissioningRE.test(projectName) || projectRef.projectImpactID === '3') {
											var projectImpact = projectRef.projectImpactID ? projectImpacts[projectRef.projectImpactID] : '';
											var copiedItem = copy(outputItem);
											copiedItem.projectId = projectId;
											copiedItem.projectName = projectName;
											copiedItem.projectImpact = projectImpact;
											copiedItem.projectType = projectType;
											output.push(copiedItem);
											nothingAdded = false;
										}
									}
									break;
								default:
									throw new Error('Unknown phaseID: ' + lifecycles[j].phaseID);
							}
							if (nothingAdded) {
								// add directly, if no rule applies, but without project information
								output.push(outputItem);
							}
						}
                    }
                }


                function link(cell, row) {
                    return '<a href="' + that.reportSetup.baseUrl + '/services/' + row.id + '" target="_blank">' + row.name + '</a>';
                }

                function linkProject(cell, row) {
                    if (row.projectId)
                        return '<a href="' + that.reportSetup.baseUrl + '/projects/' + row.projectId + '" target="_blank">' + row.projectName + '</a>';
                }
                hideSpinner();
                ReactDOM.render(
                    <BootstrapTable
                            data={output}
                            striped={true}
                            hover={true}
                            search={true}
                            pagination={true}
                            exportCSV={true}>
                        <TableHeaderColumn
                            dataField="id"
                            isKey={true}
                            hidden={true}>ID</TableHeaderColumn>
                        <TableHeaderColumn
                            dataField="name"
							width="300"
                            dataAlign="left"
                            dataSort={true}
                            dataFormat={link}
                            filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Application Name</TableHeaderColumn>
                        <TableHeaderColumn
                            dataField="costCentre"
                            width="150"
                            dataAlign="left"
                            dataSort={true}
                            filter={{ type: "SelectFilter", options: getLookup(costCentres) }}>Cost Centre</TableHeaderColumn>
                        <TableHeaderColumn
                            dataField="deployment"
                            width="180"
                            dataAlign="left"
                            dataSort={true}
                            filter={{ type: "SelectFilter", options: getLookup(deployments) }}>Deployment</TableHeaderColumn>
                        <TableHeaderColumn
                            dataField="lifecyclePhase"
                            width="120"
                            dataAlign="left"
                            dataSort={true}
                            filter={{ type: "SelectFilter", options: getLookup(lifecycleArray) }}>Phase</TableHeaderColumn>
                        <TableHeaderColumn
                            dataField="lifecycleStart"
                            width="120"
                            dataAlign="left"
                            dataSort={true}
                            filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Phase Start</TableHeaderColumn>
                        <TableHeaderColumn
                            dataField="projectName"
							width="300"
                            dataAlign="left"
                            dataSort={true}
                            dataFormat={linkProject}
                            filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Project Name</TableHeaderColumn>
                        <TableHeaderColumn
                            dataField="projectImpact"
                            width="150"
                            dataAlign="left"
                            dataSort={true}
                            filter={{ type: "SelectFilter", options: getLookup(projectImpactOptions) }}>Project Impact</TableHeaderColumn>
                        <TableHeaderColumn
                            dataField="projectType"
                            width="150"
                            dataAlign="left"
                            dataSort={true}
                            filter={{ type: "SelectFilter", options: getLookup(projectTypes) }}>Project Type</TableHeaderColumn>
                    </BootstrapTable>,
                    document.getElementById("app")
                );
            });
    };

    return ReportApplicationLifecycle;
})();