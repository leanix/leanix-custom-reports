var ReportCIMMasterList = (function () {
    function ReportCIMMasterList(reportSetup, tagFilter, title) {
        this.reportSetup = reportSetup;
        this.tagFilter = tagFilter;
        this.title = title;
    }

    ReportCIMMasterList.prototype.render = function (hideSpinner) {
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
            + '&types[]=17&types[]=18&pageSize=-1'
            + '&filterAttributes[]=ID'
            + '&filterAttributes[]=description'
            + '&filterAttributes[]=displayName'
            + '&filterAttributes[]=fullName'
            + '&filterAttributes[]=level'
            + '&filterAttributes[]=parentID'
            + '&filterAttributes[]=resourceType'
            + '&filterAttributes[]=tags'
            + '&filterRelations[]=factSheetHasRequiredby'
        )
            .then(function (response) {
                return response.data;
            });


        $.when(tagGroupPromise, factSheetPromise)
            .then(function (tagGroups, data) {

                var fsIndex = new FactSheetIndex(data);
                var list = fsIndex.getSortedList('businessObjects');
                var reportUtils = new ReportUtils();

                var statusOptions = tagGroups['Service Operation Status'];

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
                            tmp = fsIndex.getParent('businessObjects', tmp.ID);
                        }

                        var appMap;
                        for (var j = 0; j < list[i].factSheetHasRequiredby.length; j++) {
                            var factSheetHasRequiredBy = list[i].factSheetHasRequiredby[j];
                            var bc = fsIndex.index.businessCapabilities[factSheetHasRequiredBy.factSheetID];
                            if (bc && bc.tags.indexOf('AppMap') != -1) {
                                appMap = bc;
                                break;
                            }
                        }

                        output.push({
                            name: list[i].fullName,
                            level: list[i].level + 1,
                            id: list[i].ID,
                            hierarchy: hierarchy,
                            hierarchyL0Name: hierarchy.L0 ? hierarchy.L0.fullName : '',
                            hierarchyL0Description: hierarchy.L0 ? hierarchy.L0.description : '',
                            hierarchyL1Name: hierarchy.L1 ? hierarchy.L1.fullName : '',
                            hierarchyL1Description: hierarchy.L1 ? hierarchy.L1.description : '',
                            landscapeAvailable: (list[i].tags.indexOf('Landscape Available') != -1) ? 'Yes' : 'No',
                            appMapID: appMap ? appMap.ID : '',
                            appMapName: appMap ? appMap.displayName : ''
                        });
                    }
                }

                function linkL0(cell, row) {
                    if (row.hierarchy.L0)
                        return '<a href="' + that.reportSetup.baseUrl + '/businessObjects/' + row.hierarchy.L0.ID + '" target="_blank">' + cell + '</a>';
                }

                function linkL1(cell, row) {
                    if (row.hierarchy.L1)
                        return '<a href="' + that.reportSetup.baseUrl + '/businessObjects/' + row.hierarchy.L1.ID + '" target="_blank">' + cell + '</a>';
                }

                function linkAppMap(cell, row) {
                    if (row.appMapID)
                        return '<a href="' + that.reportSetup.baseUrl + '/businessCapabilities/' + row.appMapID + '" target="_blank">' + cell + '</a>';
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
                    <div className="report-cim-masterlist">
                        <BootstrapTable data={output} striped={false} hover={false} search={true} exportCSV={true} trClassName={trClassFormat}>
                            <TableHeaderColumn dataField="id" isKey={true} hidden={true}>ID</TableHeaderColumn>
                            <TableHeaderColumn dataField="hierarchyL0Name" width="200" dataAlign="left" dataFormat={linkL0} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Entity Domain</TableHeaderColumn>
                            <TableHeaderColumn dataField="hierarchyL0Description" width="200" dataAlign="left"  filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Entity Domain Description</TableHeaderColumn>
                            <TableHeaderColumn dataField="hierarchyL1Name" width="200" dataAlign="left" dataFormat={linkL1} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Entity Name</TableHeaderColumn>
                            <TableHeaderColumn dataField="hierarchyL1Description" width="200" dataAlign="left" filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Entity Name Description</TableHeaderColumn>
                            <TableHeaderColumn dataField="landscapeAvailable" width="200" dataAlign="left" filter={{ type: "SelectFilter", options: reportUtils.getLookup(['Yes', 'No']) }}>Landscape Available?</TableHeaderColumn>
                            <TableHeaderColumn dataField="appMapName" width="200" dataAlign="left" dataFormat={linkAppMap} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Mapping to Application Map</TableHeaderColumn>
                        </BootstrapTable>
                    </div>,
                    document.getElementById("app")
                );
            });
    };

    return ReportCIMMasterList;
})();