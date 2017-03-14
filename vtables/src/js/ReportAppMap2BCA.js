var ReportAppMap2BCA = (function () {
    function ReportAppMap2BCA(reportSetup, tagFilter, title) {
        this.reportSetup = reportSetup;
        this.tagFilter = tagFilter;
        this.title = title;
    }

    ReportAppMap2BCA.prototype.render = function (hideSpinner) {
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
                                if (refBC && refBC.tags.indexOf('BCA') != -1) {

                                    var refBCL3;
                                    var refBCL2;
                                    var refBCL1;

                                    refBCL3 = fsIndex.getParent('businessCapabilities', refBC.ID);
                                    if (refBCL3) refBCL2 = fsIndex.getParent('businessCapabilities', refBCL3.ID);
                                    if (refBCL2) refBCL1 = fsIndex.getParent('businessCapabilities', refBCL2.ID);

                                    var appmapL1 = fsIndex.getParent('businessCapabilities', list[i].ID);

                                    output.push({
                                        name: list[i].fullName,
                                        id: list[i].ID,
                                        appmapNameL1: appmapL1 ? appmapL1.fullName : '',
                                        appmapIdL1: appmapL1 ? appmapL1.ID : '',
                                        refNameL4: refBC.fullName,
                                        refIdL4: refBC.ID,
                                        refNameL3: refBCL3 ? refBCL3.fullName : '',
                                        refIdL3: refBCL3 ? refBCL3.ID : '',
                                        refNameL2: refBCL2 ? refBCL2.fullName : '',
                                        refIdL2: refBCL2 ? refBCL2.ID : '',
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
                function linkRefL3(cell, row) {
                    return linkRef(cell, row.refIdL3);
                }
                function linkRefL4(cell, row) {
                    return linkRef(cell, row.refIdL4);
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
                            <TableHeaderColumn dataField="appmapNameL1" dataAlign="left" dataSort={true} dataFormat={linkL1} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>App Map L1</TableHeaderColumn>
                            <TableHeaderColumn dataField="name" dataAlign="left" dataSort={true} dataFormat={link} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>App Map L2</TableHeaderColumn>
                            <TableHeaderColumn dataField="refNameL1" dataAlign="left" dataSort={true} dataFormat={linkRefL1} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>BCA L1</TableHeaderColumn>
                            <TableHeaderColumn dataField="refNameL2" dataAlign="left" dataSort={true} dataFormat={linkRefL2} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>BCA L2 </TableHeaderColumn>
                            <TableHeaderColumn dataField="refNameL3" dataAlign="left" dataSort={true} dataFormat={linkRefL3} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>BCA L3 </TableHeaderColumn>
                            <TableHeaderColumn dataField="refNameL4" dataAlign="left" dataSort={true} dataFormat={linkRefL4} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>BCA L4 </TableHeaderColumn>
                        </BootstrapTable>
                    </div>,
                    document.getElementById("app")
                );
            });
    };

    return ReportAppMap2BCA;
})();