var ReportCSMServices = (function () {
    function ReportCSMServices(reportSetup, tagFilter, title) {
        this.reportSetup = reportSetup;
        this.tagFilter = tagFilter;
        this.title = title;
    }

    ReportCSMServices.prototype.render = function (hideSpinner) {
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
            + '&types[]=10&types[]=17&types[]=18&pageSize=-1'
            + '&filterAttributes[]=ID'
            + '&filterAttributes[]=description'
            + '&filterAttributes[]=displayName'
            + '&filterAttributes[]=fullName'
            + '&filterAttributes[]=level'
            + '&filterAttributes[]=parentID'
            + '&filterAttributes[]=resourceType'
            + '&filterAttributes[]=tags'
            + '&filterRelations[]=factSheetHasRequires'
            + '&filterRelations[]=factSheetHasRequiredby'
            + '&filterRelations[]=serviceHasBusinessCapabilities'
            + '&filterRelations[]=serviceHasBusinessObjects'

        )
            .then(function (response) {
                return response.data;
            });


        $.when(tagGroupPromise, factSheetPromise)
            .then(function (tagGroups, data) {

                var fsIndex = new FactSheetIndex(data);
                var list = fsIndex.getSortedList('services');
                var reportUtils = new ReportUtils();

                var statusOptions = tagGroups['Service Status'];
                var serviceClassificationOptions = tagGroups['Service Classification'];
                var serviceOriginOptions = tagGroups['Service Origin'];

                var output = [];
                for (var i = 0; i < list.length; i++) {
                    if (list[i].level != 1)
                        continue;

                    if (!that.tagFilter || list[i].tags.indexOf(that.tagFilter) != -1) {

                        var hierarchy = {};
                        for (var z = 0; z < that.maxLevel; z++) {
                            hierarchy['L' + z] = null;
                        }

                        var tmp = list[i];

                        while (tmp != null) {
                            hierarchy['L' + tmp.level] = tmp;
                            tmp = fsIndex.getParent('services', tmp.ID);
                        }

                        var platform;
                        for (var j = 0; j < list[i].factSheetHasRequires.length; j++) {
                            var factSheetHasRequires = list[i].factSheetHasRequires[j];
                            var bc = fsIndex.index.businessCapabilities[factSheetHasRequires.factSheetRefID];
                            if (bc && bc.tags.indexOf('Platform') != -1) {
                                platform = bc;
                                break;
                            }
                        }

                        var tmf;
                        for (var j = 0; j < list[i].factSheetHasRequires.length; j++) {
                            var service = fsIndex.index.services[factSheetHasRequires.factSheetRefID];
                            if (service && service.tags.indexOf('TMF Open API') != -1) {
                                tmf = service;
                                break;
                            }
                        }

                        var platform2;
                        for (var j = 0; j < list[i].factSheetHasRequiredby.length; j++) {
                            var factSheetHasRequiredBy = list[i].factSheetHasRequiredby[j];
                            var bc = fsIndex.index.businessCapabilities[factSheetHasRequiredBy.factSheetRefID];
                            if (bc && bc.tags.indexOf('Platform') != -1) {
                                platform2 = bc;
                                break;
                            }
                        }

                        var bca;
                        for (var j = 0; j < list[i].serviceHasBusinessCapabilities.length; j++) {
                            var serviceHasBusinessCapabilities = list[i].serviceHasBusinessCapabilities[j];
                            var bc = fsIndex.index.businessCapabilities[serviceHasBusinessCapabilities.businessCapabilityID];
                            if (bc && bc.tags.indexOf('BCA') != -1) {
                                bca = bc;
                                break;
                            }
                        }

                        var cim;
                        for (var j = 0; j < list[i].serviceHasBusinessObjects.length; j++) {
                            var serviceHasBusinessObjects = list[i].serviceHasBusinessObjects[j];
                            var bo = fsIndex.index.businessObjects[serviceHasBusinessObjects.businessObjectID];
                            if (bo) {
                                cim = bo;
                                break;
                            }
                        }



                        output.push({
                            name: list[i].fullName,
                            level: list[i].level + 1,
                            id: list[i].ID,
                            description: list[i].description,
                            hierarchy: hierarchy,
                            hierarchyL0Name: hierarchy.L0 ? hierarchy.L0.fullName : '',
                            hierarchyL1Name: hierarchy.L1 ? hierarchy.L1.fullName : '',
                            serviceClassification: reportUtils.getTagFromGroup(list[i], serviceClassificationOptions),
                            serviceOrigin: reportUtils.getTagFromGroup(list[i], serviceOriginOptions),
                            status: reportUtils.getTagFromGroup(list[i], statusOptions),
                            platform2ID: platform2 ? platform2.ID : '',
                            platform2Name: platform2 ? platform2.fullName : '',
                            platformID: platform ? platform.ID : '',
                            platformName: platform ? platform.fullName : '',
                            bcaID: bca ? bca.ID : '',
                            bcaName: bca ? bca.fullName : '',
                            cimID: cim ? cim.ID : '',
                            cimName: cim ? cim.fullName : '',
                            tmfID: tmf ? tmf.ID : '',
                            tmfName: tmf ? tmf.fullName : ''


                        });
                    }
                }

                function linkL0(cell, row) {
                    if (row.hierarchy.L0)
                        return '<a href="' + that.reportSetup.baseUrl + '/services/' + row.hierarchy.L0.ID + '" target="_blank">' + cell + '</a>';
                }

                function linkL1(cell, row) {
                    if (row.hierarchy.L1)
                        return '<a href="' + that.reportSetup.baseUrl + '/services/' + row.hierarchy.L1.ID + '" target="_blank">' + cell + '</a>';
                }

                function linkL2(cell, row) {
                    if (row.hierarchy.L2)
                        return '<a href="' + that.reportSetup.baseUrl + '/services/' + row.hierarchy.L2.ID + '" target="_blank">' + cell + '</a>';
                }

                function linkPlatform(cell, row) {
                    if (row.platformID)
                        return '<a href="' + that.reportSetup.baseUrl + '/businessCapabilities/' + row.platformID + '" target="_blank">' + cell + '</a>';
                }

                function linkPlatform2(cell, row) {
                    if (row.platform2ID)
                        return '<a href="' + that.reportSetup.baseUrl + '/businessCapabilities/' + row.platform2ID + '" target="_blank">' + cell + '</a>';
                }

                function linkBCA(cell, row) {
                    if (row.bcaID)
                        return '<a href="' + that.reportSetup.baseUrl + '/businessCapabilities/' + row.bcaID + '" target="_blank">' + cell + '</a>';
                }

                function linkCIM(cell, row) {
                    if (row.cimID)
                        return '<a href="' + that.reportSetup.baseUrl + '/businessObjects/' + row.cimID + '" target="_blank">' + cell + '</a>';
                }

                function linkTMF(cell, row) {
                    if (row.tmfID)
                        return '<a href="' + that.reportSetup.baseUrl + '/businessObjects/' + row.tmfID + '" target="_blank">' + cell + '</a>';
                }


                function trClassFormat(rowData, rIndex) {
                    return 'tr-level-' + rowData.level;
                }

                var levels = [];

                for (var z = 0; z < that.maxLevel; z++) {
                    levels.push(z + 1);
                }
                hideSpinner();
                ReactDOM.render(
                    <div className="report-cms-services">
                        <BootstrapTable data={output} striped={false} hover={false} search={true} exportCSV={true} trClassName={trClassFormat}>
                            <TableHeaderColumn dataField="id" isKey={true} hidden={true}>ID</TableHeaderColumn>
                            <TableHeaderColumn dataField="hierarchyL0Name" width="200" dataAlign="left" dataFormat={linkL0} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Service Domain</TableHeaderColumn>
                            <TableHeaderColumn dataField="serviceClassification" width="200" dataAlign="left" filter={{ type: "SelectFilter", options: reportUtils.getLookup(serviceClassificationOptions) }} >Service Classification</TableHeaderColumn>
                            <TableHeaderColumn dataField="hierarchyL1Name" width="200" dataAlign="left" dataFormat={linkL1} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Service Name</TableHeaderColumn>
                            <TableHeaderColumn dataField="serviceOrigin" width="200" dataAlign="left" filter={{ type: "SelectFilter", options: reportUtils.getLookup(serviceOriginOptions) }} >Service Origin</TableHeaderColumn>
                            <TableHeaderColumn dataField="description" width="200" dataAlign="left" filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Service Description</TableHeaderColumn>
                            <TableHeaderColumn dataField="status" width="200" dataAlign="left" filter={{ type: "SelectFilter", options: reportUtils.getLookup(statusOptions) }} >Service Status</TableHeaderColumn>
                            <TableHeaderColumn dataField="bcaName" width="200" dataAlign="left" dataFormat={linkBCA} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>BCA</TableHeaderColumn>
                            <TableHeaderColumn dataField="cimName" width="200" dataAlign="left" dataFormat={linkCIM} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>CIM</TableHeaderColumn>
                            <TableHeaderColumn dataField="platformName" width="200" dataAlign="left" dataFormat={linkPlatform} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Platform (Produced By)</TableHeaderColumn>
                            <TableHeaderColumn dataField="platform2Name" width="200" dataAlign="left" dataFormat={linkPlatform2} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Platform (Consumed By)</TableHeaderColumn>
                            <TableHeaderColumn dataField="tmfName" width="200" dataAlign="left" dataFormat={linkTMF} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>TMF</TableHeaderColumn>
                        </BootstrapTable>
                    </div>,
                    document.getElementById("app")
                );
            });
    };

    return ReportCSMServices;
})();