var ReportAppMap2Platforms = (function () {
    function ReportAppMap2Platforms(reportSetup, tagFilter, title) {
        this.reportSetup = reportSetup;
        this.tagFilter = tagFilter;
        this.title = title;
    }

    ReportAppMap2Platforms.prototype.render = function (hideSpinner) {
        var that = this;

        var factSheetPromise = $.get(this.reportSetup.apiBaseUrl + '/factsheets?relations=true'
            + '&types[]=18&pageSize=-1'
            + '&filterRelations[]=factSheetHasRequires'
            + '&filterAttributes[]=displayName'
            + '&filterAttributes[]=ID'
            + '&filterAttributes[]=fullName'
            + '&filterAttributes[]=parentID'
            + '&filterAttributes[]=resourceType'
            + '&filterAttributes[]=tags'
        )
            .then(function (response) {
                return response.data;
            });

        $.when(factSheetPromise)
            .then(function (data) {
                var fsIndex = new FactSheetIndex(data);
                var list = fsIndex.getSortedList('businessCapabilities');

                var output = [];
                for (var i = 0; i < list.length; i++) {
                    if (list[i].tags.indexOf('AppMap') != -1) {
                        for (var z = 0; z < list[i].factSheetHasRequires.length; z++) {
                            var factSheetHasRequires = list[i].factSheetHasRequires[z];
                            if (factSheetHasRequires && factSheetHasRequires.factSheetRefID) {
                                var refBC = fsIndex.index.businessCapabilities[factSheetHasRequires.factSheetRefID];
                                if (refBC && refBC.tags.indexOf('Platform') != -1) {

                                    var refBCL1 = fsIndex.getParent('businessCapabilities', refBC.ID);
                                    var appmapL1 = fsIndex.getParent('businessCapabilities', list[i].ID);

                                    output.push({
                                        name: list[i].fullName,
                                        id: list[i].ID,
                                        appmapNameL1: appmapL1 ? appmapL1.fullName : '',
                                        appmapIdL1: appmapL1 ? appmapL1.ID : '',
                                        refNameL2: refBC.fullName,
                                        refIdL2: refBC.ID,
                                        refNameL1: refBCL1 ? refBCL1.fullName : '',
                                        refIdL1: refBCL1 ? refBCL1.ID : '',
                                    });
                                }
                            }
                        }
                    }
                }


                function link(cell, row) {
                    return '<a href="' + that.reportSetup.baseUrl + '/businessCapabilities/' + row.id + '" target="_blank">' + cell + '</a>';
                }
                function linkL1(cell, row) {
                    return '<a href="' + that.reportSetup.baseUrl + '/businessCapabilities/' + row.appmapIdL1 + '" target="_blank">' + cell + '</a>';
                }

                function linkRefL1(cell, row) {
                    return linkRef(cell, row.refIdL1);
                }
                function linkRefL2(cell, row) {
                    return linkRef(cell, row.refIdL2);
                }
                function linkRef(cell, id) {
                    if (id)
                        return '<a href="' + that.reportSetup.baseUrl + '/businessCapabilities/' + id + '" target="_blank">' + cell + '</a>';
                }
                hideSpinner();
                ReactDOM.render(
                    <div>
                        <BootstrapTable data={output} striped={true} hover={true} search={true} pagination={true} exportCSV={true}>
                            <TableHeaderColumn dataField="id" isKey={true} hidden={true}>ID</TableHeaderColumn>
                            <TableHeaderColumn dataField="appmapNameL1" dataAlign="left" dataSort={true} dataFormat={linkL1} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>AppMap Domain</TableHeaderColumn>
                            <TableHeaderColumn dataField="name" dataAlign="left" dataSort={true} dataFormat={link} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>AppMap Solution Area</TableHeaderColumn>
                            <TableHeaderColumn dataField="refNameL1" dataAlign="left" dataSort={true} dataFormat={linkRefL1} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Platform Layer</TableHeaderColumn>
                            <TableHeaderColumn dataField="refNameL2" dataAlign="left" dataSort={true} dataFormat={linkRefL2} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Platform</TableHeaderColumn>
                        </BootstrapTable>
                    </div>,
                    document.getElementById("app")
                );
            });
    };

    return ReportAppMap2Platforms;
})();