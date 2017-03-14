var ReportAppMap2CIM = (function () {
    function ReportAppMap2CIM(reportSetup, tagFilter, title) {
        this.reportSetup = reportSetup;
        this.tagFilter = tagFilter;
        this.title = title;
    }

    ReportAppMap2CIM.prototype.render = function (hideSpinner) {
        var that = this;

        var factSheetPromise = $.get(this.reportSetup.apiBaseUrl + '/factsheets?relations=true'
            + '&types[]=17&&types[]=18&pageSize=-1'
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
                                var refBO = fsIndex.index.businessObjects[factSheetHasRequires.factSheetRefID];

                                if (refBO) {
                                    var refBOL1 = fsIndex.getParent('businessObjects', refBO.ID);
                                    var appmapL1 = fsIndex.getParent('businessCapabilities', list[i].ID);

                                    output.push({
                                        name: list[i].fullName,
                                        id: list[i].ID,
                                        appmapNameL1: appmapL1 ? appmapL1.fullName : '',
                                        appmapIdL1: appmapL1 ? appmapL1.ID : '',
                                        refNameL2: refBO.fullName,
                                        refIdL2: refBO.ID,
                                        refNameL1: refBOL1 ? refBOL1.fullName : '',
                                        refIdL1: refBOL1 ? refBOL1.ID : '',
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
                            <TableHeaderColumn dataField="refNameL1" dataAlign="left" dataSort={true} dataFormat={linkRefL1} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>CIM Domain</TableHeaderColumn>
                            <TableHeaderColumn dataField="refNameL2" dataAlign="left" dataSort={true} dataFormat={linkRefL2} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>CIM Entity</TableHeaderColumn>

                        </BootstrapTable>
                    </div>,
                    document.getElementById("app")
                );
            });
    };

    return ReportAppMap2CIM;
})();