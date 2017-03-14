var ReportCSMOperations = (function () {
    function ReportCSMOperations(reportSetup, tagFilter, title) {
        this.reportSetup = reportSetup;
        this.tagFilter = tagFilter;
        this.title = title;
    }

    ReportCSMOperations.prototype.render = function (hideSpinner) {
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
            + '&types[]=10&types[]=18&pageSize=-1'
            + '&filterAttributes[]=ID'
            + '&filterAttributes[]=description'
            + '&filterAttributes[]=displayName'
            + '&filterAttributes[]=fullName'
            + '&filterAttributes[]=level'
            + '&filterAttributes[]=parentID'
            + '&filterAttributes[]=resourceType'
            + '&filterAttributes[]=tags'
            + '&filterRelations[]=factSheetHasRequires'
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

                var output = [];
                for (var i = 0; i < list.length; i++) {
                    if (list[i].level > 2)
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

                        output.push({
                            name: list[i].fullName,
                            level: list[i].level + 1,
                            id: list[i].ID,
                            description: list[i].description,
                            hierarchy: hierarchy,
                            hierarchyL0Name: hierarchy.L0 ? hierarchy.L0.fullName : '',
                            hierarchyL1Name: hierarchy.L1 ? hierarchy.L1.fullName : '',
                            hierarchyL2Name: hierarchy.L2 ? hierarchy.L2.fullName : '',
                            status: reportUtils.getTagFromGroup(list[i], statusOptions),
                            platformID: platform ? platform.ID : '',
                            platformName: platform ? platform.fullName : ''

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

                function trClassFormat(rowData, rIndex) {
                    return 'tr-level-' + rowData.level;
                }

                var levels = [];

                for (var z = 0; z < that.maxLevel; z++) {
                    levels.push(z + 1);
                }
                hideSpinner();
                ReactDOM.render(
                    <div className="report-csm-operations">
                        <BootstrapTable data={output} striped={false} hover={false} search={true} exportCSV={true} trClassName={trClassFormat}>
                            <TableHeaderColumn dataField="id" isKey={true} hidden={true}>ID</TableHeaderColumn>
                            <TableHeaderColumn dataField="level" width="150" dataAlign="left" filter={{ type: "NumberFilter", options: levels, numberComparators: ['<='], defaultValue: { comparator: '<=' } }}>Level</TableHeaderColumn>
                            <TableHeaderColumn dataField="hierarchyL0Name" width="200" dataAlign="left" dataFormat={linkL0} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Service Domain</TableHeaderColumn>
                            <TableHeaderColumn dataField="hierarchyL1Name" width="200" dataAlign="left" dataFormat={linkL1} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Service Name</TableHeaderColumn>
                            <TableHeaderColumn dataField="hierarchyL2Name" width="200" dataAlign="left" dataFormat={linkL2} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Service Operation</TableHeaderColumn>
                            <TableHeaderColumn dataField="description" width="200" dataAlign="left" filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Service Operation Description</TableHeaderColumn>
                            <TableHeaderColumn dataField="status" width="200" dataAlign="left" filter={{ type: "SelectFilter", options: reportUtils.getLookup(statusOptions) }} >Service Operation Status</TableHeaderColumn>
                            <TableHeaderColumn dataField="platformName" width="200" dataAlign="left" dataFormat={linkPlatform} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Platform</TableHeaderColumn>
                        </BootstrapTable>
                    </div>,
                    document.getElementById("app")
                );
            });
    };

    return ReportCSMOperations;
})();