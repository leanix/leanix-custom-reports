var ReportApplicationPortfolio = (function () {
    function ReportApplicationPortfolio(reportSetup, tagFilter, title) {
        this.reportSetup = reportSetup;
        this.tagFilter = tagFilter;
        this.title = title;
    }

    ReportApplicationPortfolio.prototype.render = function (hideSpinner) {
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

        var userPromise = $.get(this.reportSetup.apiBaseUrl + '/users')
            .then(function (response) {
                var users = {};
                for (var i = 0; i < response.length; i++) {
                    users[response[i]['ID']] = response[i]['email'];
                }
                return users;
            });


        var factSheetPromise = $.get(this.reportSetup.apiBaseUrl +
            '/factsheets?relations=true&types[]=10&types[]=12&types[]=18&types[]=19' +
            '&filterRelations[]=serviceHasBusinessCapabilities' +
            '&filterRelations[]=factSheetHasLifecycles' +
            '&filterRelations[]=serviceHasConsumers' +
            '&filterRelations[]=serviceHasResources' +
            '&filterRelations[]=userSubscriptions' +
            '&filterAttributes[]=businessCriticalityID' +
            '&filterAttributes[]=alias' +
            '&filterAttributes[]=description' +
            '&filterAttributes[]=displayName' +
            '&filterAttributes[]=functionalSuitabilityID' +
            '&filterAttributes[]=ID' +
            '&filterAttributes[]=name' +
            '&filterAttributes[]=reference' +
            '&filterAttributes[]=resourceType' +
            '&filterAttributes[]=objectCategoryID' +
            '&filterAttributes[]=tags' +
            '&filterAttributes[]=technicalSuitabilityID' +
            '&pageSize=-1')
            .then(function (response) {
                return response.data;
            });

        $.when(tagGroupPromise, userPromise, factSheetPromise)
            .then(function (tagGroups, users, data) {

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

                var getAllTagsFromGroup = function (object, validTags) {
                    return object.tags.filter(function (x) {
                        if (validTags.indexOf(x) >= 0)
                            return true;
                        else
                            return false;
                    });
                };


                var getLookup = function (data) {
                    var ret = {};
                    for (var i = 0; i < data.length; i++) {
                        ret[data[i]] = data[i];
                    }

                    return ret;
                };

                var output = [];
                var markets = {};
                var projectEffects = {};
                var projectTypes = {};

                var costCentres = tagGroups['CostCentre'];
                var stacks = tagGroups['Stack'];
                var deployments = tagGroups['Deployment'];
                var cotsPackages = tagGroups['COTS Package'];
                var soxpciFlags = tagGroups['SOX / PCI'];
                var recommendations = tagGroups['Recommendation'];
                var lastUpgrades = tagGroups['Last Major Upgrade'];
                var usages = tagGroups['Application Usage'];
                var accessTypes = tagGroups['Access Type'];
                var networkProductFamilies = tagGroups['Network Technical Product Family'];

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

                var technicalCondition = {
                    4: "4-High",
                    3: "3-Med/High",
                    2: "2-Low/Med",
                    1: "1-Low"
                };
                var technicalConditionOptions = [];
                for (var key in technicalCondition) {
                    technicalConditionOptions.push(technicalCondition[key]);
                }

                var businessCriticality = {
                    1: "Mission Critical",
                    2: "Business Premium",
                    3: "Business Standard",
                    4: "Basic"
                };
                var businessCriticalityOptions = [];
                for (var key in businessCriticality) {
                    businessCriticalityOptions.push(businessCriticality[key]);
                }

                var customisations = {
                    "High Customisation": "High",
                    "Medium Customisation": "Medium",
                    "Low Customisation": "Low"
                };
                var customisationOptions = [];
                for (var key in customisations) {
                    customisationOptions.push(customisations[key]);
                }

                var complexities = {
                    "Complexity: 1-Low": "1-Low",
                    "Complexity: 2-Low/Med": "2-Low/Med",
                    "Complexity: 3-Med": "3-Med",
                    "Complexity: 4-Med/High": "4-Med/High",
                    "Complexity: 5-High": "5-High"
                };
                var complexityOptions = [];
                for (var key in complexities) {
                    complexityOptions.push(complexities[key]);
                }

                var usages = {
                    "Usage: 1-Low": "1-Low",
                    "Usage: 2-Low/Med": "2-Low/Med",
                    "Usage: 3-Med/High": "3-Med/High",
                    "Usage: 4-High": "4-High"
                };
                var usageOptions = [];
                for (var key in usages) {
                    usageOptions.push(usages[key]);
                }

                var lifecycleArray = reportUtils.lifecycleArray();


                for (var i = 0; i < list.length; i++) {
                    if (!that.tagFilter || list[i].tags.indexOf(that.tagFilter) != -1) {

                        // Extract market
                        var re = /^([A-Z]{2,3})_/;
                        var market = '';

                        if ((m = re.exec(list[i].displayName)) !== null) {
                            if (m.index === re.lastIndex) {
                                re.lastIndex++;
                            }
                            // View your result using the m-variable.
                            market = m[1];
                            if (market)
                                markets[market] = market;
                        }

                        var resources = [];
                        var remedy = [];
                        var support = [];
                        var backend = [];
                        var frontend = [];

                        for (var z = 0; z < list[i].serviceHasResources.length; z++) {
                            var tmp = list[i].serviceHasResources[z];
                            if (tmp) {
                                var resource = fsIndex.index.resources[tmp.resourceID];
                                if (resource) {
                                    if (resource.objectCategoryID == 2) {
                                        remedy.push(resource.displayName);
                                    } else if (resource.objectCategoryID == 3) {
                                        if (resource.tags.indexOf('Development Technology') != -1) {
                                            if (resource.name.endsWith('(Back End)')) {
                                                backend.push(resource.displayName.replace(' (Back End)', ''));
                                            } else {
                                                frontend.push(resource.displayName.replace(' (Front End)', ''));
                                            }
                                        } else {
                                            support.push({
                                                id: tmp.resourceID,
                                                name: fsIndex.index.resources[tmp.resourceID].displayName,
                                            });
                                        }
                                    } else {
                                        if (resources.length == 0 || tmp.primaryTypeID == 1) {
                                            resources.push({
                                                id: tmp.resourceID,
                                                name: fsIndex.index.resources[tmp.resourceID].name,
                                                displayName: fsIndex.index.resources[tmp.resourceID].displayName,
                                            });
                                        }

                                    }
                                }
                            }
                        }

                        var cobras = [];
                        for (var z = 0; z < list[i].serviceHasBusinessCapabilities.length; z++) {
                            var tmp = list[i].serviceHasBusinessCapabilities[z];
                            if (tmp) {
                                if (tmp.businessCapabilityID && fsIndex.index.businessCapabilities[tmp.businessCapabilityID] &&
                                    fsIndex.index.businessCapabilities[tmp.businessCapabilityID].tags.indexOf('AppMap') != -1) {

                                    cobras.push({
                                        id: tmp.businessCapabilityID,
                                        name: fsIndex.index.businessCapabilities[tmp.businessCapabilityID].displayName,
                                    })
                                }
                            }
                        }

                        var usedByMarkets = [];
                        var usedBySegments = [];
                        for (var z = 0; z < list[i].serviceHasConsumers.length; z++) {
                            var tmp = list[i].serviceHasConsumers[z];
                            var consumer = fsIndex.index.consumers[tmp.consumerID];
                            if (consumer) {
                                if (consumer.tags.indexOf('Segment') != -1) {
                                    usedBySegments.push(consumer.displayName);
                                }
                                else if (tmp.usageTypeID == "1") {
                                    usedByMarkets.push(consumer.displayName);
                                }
                            }
                        }

                        var currentLifecycle = reportUtils.getCurrentLifecycle(list[i]);
                        var golive = reportUtils.getLifecycle(list[i], '3');
                        var retired = reportUtils.getLifecycle(list[i], '5');

                        var itOwner = '';
                        var businessOwner = '';
                        var spoc = '';
                        var operationsOwner = '';

                        for (var j = 0; j < list[i].userSubscriptions.length; j++) {
                            var subscription = list[i].userSubscriptions[j];
                            for (var k = 0; k < subscription.roleDetails.length; k++) {
                                if (subscription.roleDetails[k] == 'SPOC') {
                                    spoc = subscription.userID;
                                }
                                if (subscription.roleDetails[k] == 'Business Owner') {
                                    businessOwner = subscription.userID;
                                }
                                if (subscription.roleDetails[k] == 'IT Owner') {
                                    itOwner = subscription.userID;
                                }
                                if (subscription.roleDetails[k] == 'Operations Owner') {
                                    operationsOwner = subscription.userID;
                                }
                            }
                        }

                        var cotsSoftware = '';
                        var cotsSoftwareID = '';
                        var cotsVendor = '';
                        if (resources.length) {
                            cotsVendor = resources[0].displayName.substring(0, resources[0].displayName.indexOf(resources[0].name));
                            cotsSoftware = resources[0].name.endsWith('Software Product') ? '' : resources[0].displayName.substring(cotsVendor.length);
                            cotsSoftwareID = resources[0].id;
                        }
                        output.push({
                            name: list[i].displayName,
                            description: list[i].description.replace(/(?:\r\n|\r|\n|;|,)/g, ' ').replace(/(?:')/g, ' '),
                            cobraId: cobras.length ? cobras[0].id : '',
                            cobraName: cobras.length ? cobras[0].name : '',
                            id: list[i].ID,
                            lifecyclePhase: currentLifecycle ? currentLifecycle.phase : '',
                            golive: golive ? golive.startDate : '',
                            retired: retired ? retired.startDate : '',
                            market: market,
                            costCentre: getTagFromGroup(list[i], costCentres),
                            stack: getTagFromGroup(list[i], stacks),
                            admScope: getTagFromGroup(list[i], 'AD&M Scope') ? 'Yes' : 'No',
                            cotsPackage: getTagFromGroup(list[i], 'COTS Package'),
                            cotsSoftware: cotsSoftware,
                            cotsSoftwareID: cotsSoftwareID,
                            cotsVendor: cotsVendor,
                            remedyName: remedy.join(','),
                            supportID: support.length ? support[0].id : '',
                            supportName: support.length ? support[0].name : '',
                            lastUpgrade: getTagFromGroup(list[i], lastUpgrades),

                            customisation: getTagFromGroup(list[i], tagGroups['Customisation Level']) ? customisations[getTagFromGroup(list[i], tagGroups['Customisation Level'])] : '',
                            businessValue: list[i].functionalSuitabilityID ? businessValue[list[i].functionalSuitabilityID] : '',
                            technicalCondition: list[i].technicalSuitabilityID ? technicalCondition[list[i].technicalSuitabilityID] : '',
                            complexity: getTagFromGroup(list[i], tagGroups['Application Complexity']) ? complexities[getTagFromGroup(list[i], tagGroups['Application Complexity'])] : '',
                            businessCriticality: list[i].businessCriticalityID ? businessCriticality[list[i].businessCriticalityID] : '',
                            usage: getTagFromGroup(list[i], tagGroups['Application Usage']) ? usages[getTagFromGroup(list[i], tagGroups['Application Usage'])] : '',
                         
                            deployment: getTagFromGroup(list[i], deployments),
                            alias: list[i].alias ? list[i].alias : '',
                            externalID: list[i].reference.replace(/(?:;)/g, ' '),
                            soxpciFlag: getTagFromGroup(list[i], soxpciFlags),
                            itOwner: itOwner ? users[itOwner] : '',
                            businessOwner: businessOwner ? users[businessOwner] : '',
                            spoc: spoc ? users[spoc] : '',
                            operationsOwner: operationsOwner ? users[operationsOwner] : '',

                            recommendation: getTagFromGroup(list[i], recommendations),
                            accessType: getTagFromGroup(list[i], accessTypes),
                            usedByMarkets: usedByMarkets.join(','),
                            usedBySegments: usedBySegments.join(','),
                            networkProductFamilies: getAllTagsFromGroup(list[i], networkProductFamilies).join(','),
                            backend: backend.join(','),
                            frontend: frontend.join(','),
                       

                        });


                    }
                }


                function link(cell, row) {
                    return '<a href="' + that.reportSetup.baseUrl + '/services/' + row.id + '" target="_blank">' + cell + '</a>';
                }

                function linkResource(cell, row) {
                    if (row.cotsSoftwareID)
                        return '<a href="' + that.reportSetup.baseUrl + '/resources/' + row.cotsSoftwareID + '" target="_blank">' + cell + '</a>';
                }

                function linkSupport(cell, row) {
                    if (row.supportID)
                        return '<a href="' + that.reportSetup.baseUrl + '/resources/' + row.supportID + '" target="_blank">' + cell + '</a>';
                }

                function linkBC(cell, row) {
                    if (row.cobraId)
                        return '<a href="' + that.reportSetup.baseUrl + '/businessCapabilities/' + row.cobraId + '" target="_blank">' + cell + '</a>';
                }
                hideSpinner();
                ReactDOM.render(
                    <div>
                        <BootstrapTable data={output} striped={true} hover={true} search={true} pagination={true} exportCSV={true}>
                            <TableHeaderColumn dataField="id" isKey={true} hidden={true}>ID</TableHeaderColumn>
                            <TableHeaderColumn dataField="name" width="300" dataAlign="left" dataSort={true} dataFormat={link} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Application Name</TableHeaderColumn>
                            <TableHeaderColumn dataField="description" width="300" dataAlign="left" dataSort={true} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Description</TableHeaderColumn>
                            <TableHeaderColumn dataField="cobraName" width="300" dataAlign="left" dataSort={true} dataFormat={linkBC} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>COBRA</TableHeaderColumn>
                            <TableHeaderColumn dataField="lifecyclePhase" width="100" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(lifecycleArray) }}>Phase</TableHeaderColumn>
                            <TableHeaderColumn dataField="golive" width="150" dataAlign="left" dataSort={true} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Go Live Date</TableHeaderColumn>
                            <TableHeaderColumn dataField="retired" width="150" dataAlign="left" dataSort={true} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Retired Date</TableHeaderColumn>
                            <TableHeaderColumn dataField="recommendation" width="100" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(recommendations) }}>Recommendation</TableHeaderColumn>
                            <TableHeaderColumn dataField="market" width="80" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: markets }}>Market</TableHeaderColumn>
                            <TableHeaderColumn dataField="costCentre" width="120" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(costCentres) }}>Cost Centre</TableHeaderColumn>
                            <TableHeaderColumn dataField="stack" width="120" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(stacks) }}>Stack</TableHeaderColumn>
                            <TableHeaderColumn dataField="admScope" width="120" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(['Yes', 'No']) }}>In AD&M Scope</TableHeaderColumn>
                            <TableHeaderColumn dataField="cotsPackage" width="120" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(cotsPackages) }}>COTS Package</TableHeaderColumn>
                            <TableHeaderColumn dataField="cotsSoftware" width="200" dataAlign="left" dataSort={true} dataFormat={linkResource} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>COTS Software</TableHeaderColumn>
                            <TableHeaderColumn dataField="cotsVendor" width="150" dataAlign="left" dataSort={true} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>COTS Vendor</TableHeaderColumn>
                            <TableHeaderColumn dataField="lastUpgrade" width="150" dataAlign="left" dataSort={true} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Last Major Upgrade Date</TableHeaderColumn>

                            <TableHeaderColumn dataField="remedyName" width="150" dataAlign="left" dataSort={true} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Remedy Business Service</TableHeaderColumn>
                            <TableHeaderColumn dataField="supportName" width="150" dataAlign="left" dataSort={true} dataFormat={linkSupport} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Supported By</TableHeaderColumn>
                            <TableHeaderColumn dataField="customisation" width="120" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(customisationOptions) }}>Level of Customisation</TableHeaderColumn>
                            <TableHeaderColumn dataField="businessValue" width="120" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(businessValueOptions) }}>Business Value</TableHeaderColumn>
                            <TableHeaderColumn dataField="technicalCondition" width="120" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(technicalConditionOptions) }}>Technical Condition</TableHeaderColumn>
                            <TableHeaderColumn dataField="complexity" width="120" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(complexityOptions) }}>Application Complexity</TableHeaderColumn>
                            <TableHeaderColumn dataField="businessCriticality" width="120" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(businessCriticalityOptions) }}>Business Criticality</TableHeaderColumn>
                            <TableHeaderColumn dataField="usage" width="100" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(usageOptions) }}>Application Usage</TableHeaderColumn>
                            <TableHeaderColumn dataField="alias" width="100" dataAlign="left" dataSort={true} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Alternate names</TableHeaderColumn>
                            <TableHeaderColumn dataField="externalID" width="100" dataAlign="left" dataSort={true} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>External ID</TableHeaderColumn>
                            <TableHeaderColumn dataField="deployment" width="100" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(deployments) }}>Deployment</TableHeaderColumn>
                            <TableHeaderColumn dataField="soxpciFlag" width="100" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(soxpciFlags) }}>SOX / PCI</TableHeaderColumn>
                            <TableHeaderColumn dataField="itOwner" width="150" dataAlign="left" dataSort={true} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>IT Owner</TableHeaderColumn>
                            <TableHeaderColumn dataField="businessOwner" width="150" dataAlign="left" dataSort={true} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Business Owner</TableHeaderColumn>
                            <TableHeaderColumn dataField="spoc" width="150" dataAlign="left" dataSort={true} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>SPOC</TableHeaderColumn>
                            <TableHeaderColumn dataField="operationsOwner" width="150" dataAlign="left" dataSort={true} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Operations Owner</TableHeaderColumn>
                            <TableHeaderColumn dataField="accessType" width="100" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(accessTypes) }}>Access Type</TableHeaderColumn>
                            <TableHeaderColumn dataField="usedByMarkets" width="150" dataAlign="left" dataSort={true} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Used By Markets</TableHeaderColumn>
                            <TableHeaderColumn dataField="usedBySegments" width="150" dataAlign="left" dataSort={true} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Used By Segments</TableHeaderColumn>
                            <TableHeaderColumn dataField="networkProductFamilies" width="200" dataAlign="left" dataSort={true} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Network Product Families</TableHeaderColumn>
                            <TableHeaderColumn dataField="backend" width="200" dataAlign="left" dataSort={true} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Backend Technology</TableHeaderColumn>
                            <TableHeaderColumn dataField="frontend" width="200" dataAlign="left" dataSort={true} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Frontend Technology</TableHeaderColumn>




                        </BootstrapTable>
                    </div>,
                    document.getElementById("app")
                );
            });
    };

    return ReportApplicationPortfolio;
})();