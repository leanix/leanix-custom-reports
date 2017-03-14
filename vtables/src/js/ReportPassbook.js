var ReportPassbook = (function() {
    function ReportPassbook(reportSetup, tagFilter, title) {
        this.reportSetup = reportSetup;
        this.tagFilter = tagFilter;
        this.title = title;
    }

    ReportPassbook.prototype.render = function(hideSpinner) {
        var that = this;

        var tagGroupPromise = $.get(this.reportSetup.apiBaseUrl + '/tagGroups')
            .then(function(response) {
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
            + '&types[]=19&types[]=20&pageSize=-1'
            + '&filterRelations[]=resourceHasResourceCapabilities'
            + '&filterAttributes[]=displayName'
            + '&filterAttributes[]=ID'
            + '&filterAttributes[]=fullName'
            + '&filterAttributes[]=resourceClassificationID'
            + '&filterAttributes[]=resourceType'
            + '&filterAttributes[]=tags'
        )
            .then(function(response) {
                return response.data;
            });

        $.when(tagGroupPromise, factSheetPromise)
            .then(function(tagGroups, data) {
                var fsIndex = new FactSheetIndex(data);
                var list = fsIndex.getSortedList('resources');

                var reportUtils = new ReportUtils();

                var resourceClassification = [];
                var resourceClassification = {
                    1: "Investigating",
                    2: "Approved",
                    3: "Conditional",
                    4: "Retired",
                    5: "Unapproved"
                };
                var resourceClassificationOptions = [];
                for (var key in resourceClassification) {
                    resourceClassificationOptions.push(resourceClassification[key]);
                }

                var output = [];
                for (var i = 0; i < list.length; i++) {
                    if (!that.tagFilter || list[i].tags.indexOf(that.tagFilter) != -1) {

                        for (var z = 0; z < list[i].resourceHasResourceCapabilities.length; z++) {
                            var tmp = list[i].resourceHasResourceCapabilities[z];
                            if (tmp && tmp.resourceCapabilityID) {
                                var resourceCapability = fsIndex.index.resourceCapabilities[tmp.resourceCapabilityID];
                                if (resourceCapability.tags.indexOf('PASS Book') != -1)

                                    output.push({
                                        name: list[i].displayName,
                                        id: list[i].ID,
                                        resourceCapabilityName: resourceCapability.displayName,
                                        resourceCapabilityID: resourceCapability.ID,
                                        resourceClassification: tmp.resourceClassificationID ? resourceClassification[tmp.resourceClassificationID] : '',
                                    });
                            }
                        }
                    }
                }


                function link(cell, row) {
                    return '<a href="' + that.reportSetup.baseUrl + '/resources/' + row.id + '" target="_blank">' + cell + '</a>';
                }

                function linkRC(cell, row) {
                    return '<a href="' + that.reportSetup.baseUrl + '/resourceCapabilities/' + row.resourceCapabilityID + '" target="_blank">' + cell + '</a>';
                }

                hideSpinner();
                ReactDOM.render(
                    <div>
                        <BootstrapTable data={output} striped={true} hover={true} search={true} pagination={true} exportCSV={true}>
                            <TableHeaderColumn dataField="id" isKey={true} hidden={true}>ID</TableHeaderColumn>
                            <TableHeaderColumn dataField="resourceCapabilityName" dataAlign="left" dataSort={true} dataFormat={linkRC} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Channel</TableHeaderColumn>
                            <TableHeaderColumn dataField="name" dataAlign="left" dataSort={true} dataFormat={link} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Vendor / Solution</TableHeaderColumn>
                            <TableHeaderColumn dataField="resourceClassification" width="120" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: reportUtils.getLookup(resourceClassificationOptions) }}>Vendor Type</TableHeaderColumn>
                        </BootstrapTable>
                    </div>,
                    document.getElementById("app")
                );
            });
    };

    return ReportPassbook;
})();