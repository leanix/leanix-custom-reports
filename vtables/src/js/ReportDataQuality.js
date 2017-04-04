var ReportDataQuality = (function () {
    function ReportDataQuality(reportSetup, tagFilter) {
        this.reportSetup = reportSetup;
        this.tagFilter = tagFilter;
    }

    ReportDataQuality.prototype.render = function (hideSpinner) {
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

                var tagIDs = {};
                for (var i = 0; i < response.length; i++) {
                    for (var j = 0; j < response[i]['tags'].length; j++) {
                        var tag = response[i]['tags'][j];
                        tagIDs[tag['name']] = tag['ID'];
                    }
                }
                return { ids: tagIDs, groups: tagGroups };
            });

        var rolePromise = $.get(this.reportSetup.apiBaseUrl + '/userRoleDetails')
            .then(function (response) {
                var roleIDs = {};
                for (var i = 0; i < response.length; i++) {
                    roleIDs[response[i]['name']] = response[i]['ID'];
                }
                return roleIDs;
            });

        var factSheetPromise = $.get(this.reportSetup.apiBaseUrl + '/factsheets?relations=true'
            + '&types[]=10&types[]=12&types[]=16&types[]=18&types[]=19'
            + '&filterRelations[]=factSheetHasLifecycles'
            + '&filterRelations[]=serviceHasConsumers'
            + '&filterRelations[]=serviceHasProjects'
            + '&filterRelations[]=serviceHasBusinessCapabilities'
            + '&filterRelations[]=serviceHasResources'
            + '&filterRelations[]=userSubscriptions'
            + '&filterAttributes[]=description'
            + '&filterAttributes[]=displayName'
            + '&filterAttributes[]=functionalSuitabilityID'
            + '&filterAttributes[]=ID'
            + '&filterAttributes[]=objectCategoryID'
            + '&filterAttributes[]=resourceType'
            + '&filterAttributes[]=tags'
            + '&filterAttributes[]=technicalSuitabilityID'


            + '&pageSize=-1')
            .then(function (response) {
                return response.data;
            });

        $.when(tagGroupPromise, rolePromise, factSheetPromise)
            .then(function (tagGroupData, roleIDs, data) {

                var fsIndex = new FactSheetIndex(data);
                var list = fsIndex.getSortedList('services');
                var reportUtils = new ReportUtils();
                var tagIDs = tagGroupData.ids;
                var tagGroups = tagGroupData.groups;

                var getLookup = function (data) {
                    var ret = {};
                    for (var i = 0; i < data.length; i++) {
                        ret[data[i]] = data[i];
                    }

                    return ret;
                };

                var businessValue = {
                    4: "4-High",
                    3: "3-Med/High",
                    2: "2-Low/Med",
                    1: "1-Low"
                };
                var businessValueOptions = [];
                for (var key in businessValue) {
                    businessValueOptions.push(businessValue[key]);
                }

                var output = [];
                var markets = {};

                var groupedByMarket = {};

                var oneYearBefore = new Date();
                oneYearBefore.setFullYear(oneYearBefore.getFullYear() - 1);

            var day = '' + oneYearBefore.getDate();
                if (day.length < 2) day = '0' + day;
            var month = '' + (oneYearBefore.getMonth() + 1);
                if (month.length < 2)month = '0' + month;
                var oneYearBeforeStr = oneYearBefore.getFullYear() + "_" + month + "_" + day;

                function getGreenToRed(percent) {
                    var r = percent < 50 ? 255 : Math.floor(255 - (percent * 2 - 100) * 255 / 100);
                    var g = percent > 50 ? 255 : Math.floor((percent * 2) * 255 / 100);
                    return 'rgb(' + r + ',' + g + ',0)';
                }

                for (var i = 0; i < list.length; i++) {
                    var service = list[i];
                    if (service.tags.indexOf('Application') != -1 && service.tags.indexOf('IT') != -1) {

                        // Extract market
                        var re = /^([A-Z]{2,3})_/;
                        var market = '';

                        if ((m = re.exec(list[i].displayName)) !== null) {
                            if (m.index === re.lastIndex) {
                                re.lastIndex++;
                            }
                            // View your result using the m-variable.
                            market = m[1];
                            if (market) {
                                if (!(market in groupedByMarket)) {
                                    groupedByMarket[market] = [];
                                    markets[market] = market;
                                }
                                groupedByMarket[market].push(service);

                            }
                        }
                    }
                }

                for (var key in groupedByMarket) {
                    var compliant = [];
                    var noncompliant = [];

                    rule = 'Adding applications, but no project';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        var service = groupedByMarket[key][i];

                        if (hasActiveLifecycle(service, oneYearBefore)) {
                            var c = false;
                            for (var j = 0; j < service.serviceHasProjects.length; j++) {
                                var serviceHasProject = service.serviceHasProjects[j];
                                if (serviceHasProject && serviceHasProject.projectID) {
                                    var proj = fsIndex.index.projects[serviceHasProject.projectID];
                                    if (proj) {
                                        c = true;
                                        break;
                                    }
                                }
                            }
                            if (c) compliant[rule]++; else noncompliant[rule]++;
                        }
                    }
                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'lifecycle[]=2&lifecycle[]=3&lifecycle_data=' + oneYearBeforeStr + '_to_' + oneYearBeforeStr + '&lifecycle_op=OR&serviceHasProjects[]=na'
                    );

                    rule = 'Retiring applications, but no project';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        var service = groupedByMarket[key][i];

                        if (isRetired(service, oneYearBefore)) {
                            var c = false;
                            for (var j = 0; j < service.serviceHasProjects.length; j++) {
                                var serviceHasProject = service.serviceHasProjects[j];
                                if (serviceHasProject && serviceHasProject.projectID) {
                                    var proj = fsIndex.index.projects[serviceHasProject.projectID];
                                    if (proj) {
                                        c = true;
                                        break;
                                    }
                                }
                            }
                            if (c) compliant[rule]++; else noncompliant[rule]++;
                        }
                    }
                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'lifecycle[]=5&lifecycle_data=' + oneYearBeforeStr + '_to_' + oneYearBeforeStr + '&lifecycle_op=OR&serviceHasProjects[]=na'
                    );

                    rule = 'has COBRA';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        if (reportUtils.getCurrentLifecycle(groupedByMarket[key][i]) && reportUtils.getCurrentLifecycle(groupedByMarket[key][i]).phaseID == 3) {
                            var c = false;
                            for (var z = 0; z < groupedByMarket[key][i].serviceHasBusinessCapabilities.length; z++) {
                                var tmp = groupedByMarket[key][i].serviceHasBusinessCapabilities[z];
                                if (tmp && tmp.businessCapabilityID) {
                                    var bc = fsIndex.index.businessCapabilities[tmp.businessCapabilityID];
                                    if (bc && bc.tags.indexOf('AppMap') != -1) {
                                        if (c) {
                                          c = false;
                                          break;
                                        }
                                        c = true;
                                    }
                                }
                            }
                            if (c) compliant[rule]++; else noncompliant[rule]++;
                        }
                    }
                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'lifecycle[]=3&lifecycle_data=today&serviceHasBusinessCapabilities[]=tag-' + tagIDs['AppMap'] + '&serviceHasBusinessCapabilities_op=NOR&tags_service_type[]=Application');

                    rule = 'has COTS Package';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        if (reportUtils.getCurrentLifecycle(groupedByMarket[key][i]) && reportUtils.getCurrentLifecycle(groupedByMarket[key][i]).phaseID == 3) {
                            if (reportUtils.getTagFromGroup(groupedByMarket[key][i], 'COTS Package') || reportUtils.getTagFromGroup(groupedByMarket[key][i], 'Mo COTS Package'))
                                compliant[rule]++;
                            else
                                noncompliant[rule]++;
                        }
                    }
                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'lifecycle[]=3&lifecycle_data=today&tags_cots_package[]=COTS+Package&tags_cots_package[]=No+COTS+Package&tags_cots_package_op=NOR&serviceHasBusinessCapabilities_op=NOR&tags_service_type[]=Application');

                    rule = 'has Software Product';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        if (reportUtils.getTagFromGroup(groupedByMarket[key][i], 'COTS Package') && reportUtils.getCurrentLifecycle(groupedByMarket[key][i]) && reportUtils.getCurrentLifecycle(groupedByMarket[key][i]).phaseID == 3) {
                            var c = false;
                            for (var z = 0; z < groupedByMarket[key][i].serviceHasResources.length; z++) {
                                var tmp = groupedByMarket[key][i].serviceHasResources[z];
                                if (tmp && tmp.resourceID) {
                                    var resource = fsIndex.index.resources[tmp.resourceID];
                                    if (resource && resource.objectCategoryID == 1) {
                                        c = true;
                                        break;
                                    }
                                }
                            }
                            if (c) compliant[rule]++; else noncompliant[rule]++;
                        }
                    }
                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'lifecycle[]=3&lifecycle_data=today&tags_cots_package[]=COTS+Package&serviceHasSoftware[]=na');

                    rule = 'has Software Product Placeholder';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        if (reportUtils.getTagFromGroup(groupedByMarket[key][i], 'COTS Package') && reportUtils.getCurrentLifecycle(groupedByMarket[key][i]) && reportUtils.getCurrentLifecycle(groupedByMarket[key][i]).phaseID == 3) {
                            var c = false;
                            for (var z = 0; z < groupedByMarket[key][i].serviceHasResources.length; z++) {
                                var tmp = groupedByMarket[key][i].serviceHasResources[z];
                                if (tmp && tmp.resourceID) {
                                    var resource = fsIndex.index.resources[tmp.resourceID];
                                    if (resource && resource.objectCategoryID == 1) {
                                        if (resource.tags.indexOf('Placeholder') != -1) {
                                            noncompliant[rule]++;
                                        } else {
                                            compliant[rule]++;
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                    }
                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'lifecycle[]=3&lifecycle_data=today&tags_cots_package[]=COTS+Package&serviceHasSoftware[]=tag-' + tagIDs['Placeholder']);


                    rule = 'has Description';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        if (reportUtils.getCurrentLifecycle(groupedByMarket[key][i]) && reportUtils.getCurrentLifecycle(groupedByMarket[key][i]).phaseID == 3) {
                            if (groupedByMarket[key][i].description) compliant[rule]++; else noncompliant[rule]++;
                        }
                    }
                    pushToOutput(output, key, rule, compliant, noncompliant, 'lifecycle[]=3&lifecycle_data=today&quality[]=4');

                    rule = 'has Lifecycle';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        if (reportUtils.getCurrentLifecycle(groupedByMarket[key][i])) compliant[rule]++; else noncompliant[rule]++;
                    }
                    pushToOutput(output, key, rule, compliant, noncompliant, 'quality[]=5');


                    rule = 'has IT Owner';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        if (reportUtils.getCurrentLifecycle(groupedByMarket[key][i]) && reportUtils.getCurrentLifecycle(groupedByMarket[key][i]).phaseID == 3) {
                            var c = false;
                            for (var j = 0; j < groupedByMarket[key][i].userSubscriptions.length; j++) {
                                var subscription = groupedByMarket[key][i].userSubscriptions[j];
                                for (var k = 0; k < subscription.roleDetails.length; k++) {
                                    if (subscription.roleDetails[k] == 'IT Owner') {
                                        c = true;
                                        break;
                                    }
                                }
                            }
                            if (c) compliant[rule]++; else noncompliant[rule]++;
                        }
                    }

                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'lifecycle[]=3&lifecycle_data=today&subscriptions[]=na&subscriptions_data=r_' + roleIDs['IT Owner'] + '&type_op=OR&lifecycle_op=OR&subscriptions_op=OR&serviceHasConsumers_op=OR');

                    rule = 'has SPOC';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        if (reportUtils.getCurrentLifecycle(groupedByMarket[key][i]) && reportUtils.getCurrentLifecycle(groupedByMarket[key][i]).phaseID == 3) {
                            var c = false;
                            for (var j = 0; j < groupedByMarket[key][i].userSubscriptions.length; j++) {
                                var subscription = groupedByMarket[key][i].userSubscriptions[j];
                                for (var k = 0; k < subscription.roleDetails.length; k++) {
                                    if (subscription.roleDetails[k] == 'SPOC') {
                                        c = true;
                                        break;
                                    }
                                }
                            }
                            if (c) compliant[rule]++; else noncompliant[rule]++;
                        }
                    }

                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'lifecycle[]=3&lifecycle_data=today&subscriptions[]=na&subscriptions_data=r_' + roleIDs['SPOC'] + '&type_op=OR&lifecycle_op=OR&subscriptions_op=OR&serviceHasConsumers_op=OR');

                    rule = 'has Business Value';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        var lifecycle = reportUtils.getCurrentLifecycle(groupedByMarket[key][i]);
                        if (lifecycle && lifecycle.phaseID == 3) {
                            if (groupedByMarket[key][i].functionalSuitabilityID)
                                compliant[rule]++; else noncompliant[rule]++;
                        }

                    }
                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'lifecycle[]=3&lifecycle_data=today&serviceHasFunctionalSuitability[]=na&serviceHasFunctionalSuitability_op=OR');

                    rule = 'has Technical Condition';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        var lifecycle = reportUtils.getCurrentLifecycle(groupedByMarket[key][i]);
                        if (lifecycle && lifecycle.phaseID == 3) {
                            if (groupedByMarket[key][i].technicalSuitabilityID)
                                compliant[rule]++; else noncompliant[rule]++;
                        }

                    }
                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'lifecycle[]=3&lifecycle_data=today&serviceHasTechnicalSuitability[]=na&serviceHasTechnicalSuitability_op=OR');

                    rule = 'has Cost Centre';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        if (reportUtils.getCurrentLifecycle(groupedByMarket[key][i]) && reportUtils.getCurrentLifecycle(groupedByMarket[key][i]).phaseID == 3) {
                            if (reportUtils.getTagFromGroup(groupedByMarket[key][i], tagGroups['CostCentre']))
                                compliant[rule]++;
                            else
                                noncompliant[rule]++;
                        }
                    }
                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'lifecycle[]=3&lifecycle_data=today&tags_cotscentre[]=na&serviceHasBusinessCapabilities_op=NOR&tags_service_type[]=Application');

                    rule = 'Overall Quality';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var c in compliant) {
                        if (c != rule) compliant[rule] += compliant[c];
                    }
                    for (var n in noncompliant) {
                        if (n != rule) noncompliant[rule] += noncompliant[n];
                    }
                    pushToOutput(output, key, rule, compliant, noncompliant);

                }

                function hasActiveLifecycle(service, oneYearBefore) {
                    var hasActiveLifecycle = false;

                    var current = reportUtils.getCurrentLifecycle(service);
                    if (current && current.phaseID > 1 && current.phaseID < 4 && current.date > oneYearBefore) {
                        hasActiveLifecycle = true;
                    }
                    return hasActiveLifecycle;
                }

                function isRetired(service, oneYearBefore) {
                    var isRetired = false;
                    for (var j = 0; j < service.factSheetHasLifecycles.length; j++) {
                        if (service.factSheetHasLifecycles[j].lifecycleStateID == 5 && Date.parse(service.factSheetHasLifecycles[j].startDate) > oneYearBefore) {
                            isRetired = true;
                            break;
                        }
                    }
                    return isRetired;
                }

                function pushToOutput(output, key, rule, compliant, noncompliant, url) {
                    output.push({
                        rule: rule,
                        id: key,
                        market: key,
                        compliant: compliant[rule],
                        noncompliant: noncompliant[rule],
                        percentage: 100 - Math.floor(noncompliant[rule] / (compliant[rule] + noncompliant[rule]) * 100),
                        url: url ? 'type=10&filter=' + key + '_&tags_costcentre[]=IT&' + url : ''
                    });

                }

                function link(cell, row) {
                    if (row.url) {
                        if (row.noncompliant == 0) {
                            return cell;
                        } else {
                            return '<a href="' + that.reportSetup.baseUrl + '/inventory?' + row.url + '" target="_blank">' + cell + '</a>';
                        }
                    }
                    else return cell;
                }

                function linkMarket(cell, row) {
                    if (row.market)
                        return '<a href="' + that.reportSetup.baseUrl + '/inventory?type=10&filter=' + row.market + '_" target="_blank">' + cell + '</a>';
                }



                function percentage(cell, row) {
                    return '<div class="percentage" style="background-color: ' + getGreenToRed(cell) + ';">' + cell + ' %</div>';
                }

                hideSpinner();
                ReactDOM.render(
                    <div className="report-data-quality">
                        <BootstrapTable data={output} striped={false} hover={true} search={true} condensed={true} exportCSV={true}>
                            <TableHeaderColumn dataField="id" isKey={true} hidden={true}>ID</TableHeaderColumn>
                            <TableHeaderColumn dataField="market" width="80" dataAlign="left" dataSort={true} filterFormatted dataFormat={linkMarket} formatExtraData={markets} filter={{ type: "SelectFilter", options: markets }}>Market</TableHeaderColumn>
                            <TableHeaderColumn dataField="rule" dataAlign="left" dataSort={true} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Rule</TableHeaderColumn>
                            <TableHeaderColumn dataField="compliant" dataAlign="left" dataSort={true} filter={{ type: "NumberFilter", defaultValue: { comparator: '<=' } }}>Compliant</TableHeaderColumn>
                            <TableHeaderColumn dataField="noncompliant" dataAlign="left" dataSort={true} dataFormat={link} filter={{ type: "NumberFilter", defaultValue: { comparator: '<=' } }}>Non-Compliant</TableHeaderColumn>
                            <TableHeaderColumn dataField="percentage" dataAlign="left" dataSort={true} dataFormat={percentage} filter={{ type: "NumberFilter", defaultValue: { comparator: '<=' } }}>% Compliant</TableHeaderColumn>
                        </BootstrapTable>
                    </div>,
                    document.getElementById("app")
                );
            });
    };

    return ReportDataQuality;
})();