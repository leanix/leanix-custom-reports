var ReportAppMap2ETOM = (function () {
    function ReportAppMap2ETOM(reportSetup, tagFilter, title) {
        this.reportSetup = reportSetup;
        this.tagFilter = tagFilter;
        this.title = title;
    }

    ReportAppMap2ETOM.prototype.render = function (hideSpinner) {
        var that = this;

        var factSheetPromise = $.get(this.reportSetup.apiBaseUrl + '/factsheets?relations=true'
            + '&types[]=18&types[]=22&pageSize=-1'
            + '&filterRelations[]=processHasBusinessCapabilities'
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
                        for (var z = 0; z < list[i].processHasBusinessCapabilities.length; z++) {
                            var processHasBusinessCapabilities = list[i].processHasBusinessCapabilities[z];
                            if (processHasBusinessCapabilities && processHasBusinessCapabilities.processID) {
                                var refProcess = fsIndex.index.processes[processHasBusinessCapabilities.processID];
                                if (refProcess) {

                                    var refProcL3;
                                    var refProcL2;
                                    var refProcL1;

                                    refProcL3 = fsIndex.getParent('processes', refProcess.ID);
                                    if (refProcL3) refProcL2 = fsIndex.getParent('processes', refProcL3.ID);
                                    if (refProcL2) refProcL1 = fsIndex.getParent('processes', refProcL2.ID);

                                    if (!refProcL1) {
                                        refProcL1 = refProcL2;
                                        refProcL2 = refProcL3;
                                        refProcL3 = refProcess;
                                        refProcess = null;
                                    }
                                    
                                    var appmapL1 = fsIndex.getParent('businessCapabilities', list[i].ID);

                                    output.push({
                                        name: list[i].fullName,
                                        id: list[i].ID,
                                        appmapNameL1: appmapL1 ? appmapL1.fullName : '',
                                        appmapIdL1: appmapL1 ? appmapL1.ID : '',
                                        refNameL4: refProcess ? refProcess.fullName : '',
                                        refIdL4: refProcess ? refProcess.ID : '',
                                        refNameL3: refProcL3 ? refProcL3.fullName : '',
                                        refIdL3: refProcL3 ? refProcL3.ID : '',
                                        refNameL2: refProcL2 ? refProcL2.fullName : '',
                                        refIdL2: refProcL2 ? refProcL2.ID : '',
                                        refNameL1: refProcL1 ? refProcL1.fullName : '',
                                        refIdL1: refProcL1 ? refProcL1.ID : '',
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
                        return '<a href="' + that.reportSetup.baseUrl + '/processes/' + id + '" target="_blank">' + cell + '</a>';
                }
                hideSpinner();
                ReactDOM.render(
                    <div>
                        <BootstrapTable data={output} striped={true} hover={true} search={true} pagination={true} exportCSV={true}>
                            <TableHeaderColumn dataField="id" isKey={true} hidden={true}>ID</TableHeaderColumn>
                            <TableHeaderColumn dataField="appmapNameL1" dataAlign="left" dataSort={true} dataFormat={linkL1} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>App Map L1</TableHeaderColumn>
                            <TableHeaderColumn dataField="name" dataAlign="left" dataSort={true} dataFormat={link} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>App Map L2</TableHeaderColumn>
                            <TableHeaderColumn dataField="refNameL1" dataAlign="left" dataSort={true} dataFormat={linkRefL1} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>eTOM L1</TableHeaderColumn>
                            <TableHeaderColumn dataField="refNameL2" dataAlign="left" dataSort={true} dataFormat={linkRefL2} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>eTOM L2 </TableHeaderColumn>
                            <TableHeaderColumn dataField="refNameL3" dataAlign="left" dataSort={true} dataFormat={linkRefL3} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>eTOM L3 </TableHeaderColumn>
                            <TableHeaderColumn dataField="refNameL4" dataAlign="left" dataSort={true} dataFormat={linkRefL4} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>eTOM L4 </TableHeaderColumn>
                        </BootstrapTable>
                    </div>,
                    document.getElementById("app")
                );
            });

    };

    return ReportAppMap2ETOM;
})();