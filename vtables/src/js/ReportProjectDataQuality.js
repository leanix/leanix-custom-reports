var ReportProjectDataQuality = (function () {
    function ReportProjectDataQuality(reportSetup, tagFilter) {
        this.reportSetup = reportSetup;
        this.tagFilter = tagFilter;
    }

    ReportProjectDataQuality.prototype.render = function (hideSpinner) {
        var that = this;

        var factSheetPromise = $.get(this.reportSetup.apiBaseUrl + '/factsheets?relations=true'
            + '&types[]=10&types[]=16'
            + '&filterRelations[]=factSheetHasLifecycles'
            + '&filterRelations[]=serviceHasProjects'
            + '&filterAttributes[]=displayName'
            + '&filterAttributes[]=fullName'
            + '&filterAttributes[]=ID'
            + '&filterAttributes[]=resourceType'
            + '&filterAttributes[]=tags'

            + '&pageSize=-1')
            .then(function (response) {
                return response.data;
            });

        $.when(factSheetPromise)
            .then(function (data) {

                var fsIndex = new FactSheetIndex(data);
                var list = fsIndex.getSortedList('projects');
                var reportUtils = new ReportUtils();

                var output = [];
                var markets = {};

                var groupedByMarket = {};

                function getGreenToRed(percent) {
                    var r = percent < 50 ? 255 : Math.floor(255 - (percent * 2 - 100) * 255 / 100);
                    var g = percent > 50 ? 255 : Math.floor((percent * 2) * 255 / 100);
                    return 'rgb(' + r + ',' + g + ',0)';
                }

                groupedByMarket['unassigned'] = [];
                for (var i = 0; i < list.length; i++) {
                    if (!that.tagFilter || list[i].tags.indexOf(that.tagFilter) != -1) {

                        // Extract market
                        var re = /^([A-Z]{2,3})_/;
                        var market = '';

                        if ((m = re.exec(list[i].fullName)) !== null) {
                            if (m.index === re.lastIndex) {
                                re.lastIndex++;
                            }
                            // View your result using the m-variable.
                            market = m[1];
                            if (market && !(market in groupedByMarket)) {
                                groupedByMarket[market] = [];
                                markets[market] = market;
                            }
                            groupedByMarket[market].push(list[i]);

                        } else
                            groupedByMarket['unassigned'].push(list[i]);
                    }
                }

                for (var key in groupedByMarket) {
                    var compliant = [];
                    var noncompliant = [];

                    rule = 'Affects Application';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        var project = groupedByMarket[key][i];
                        var c = false;
                        for (var j = 0; j < project.serviceHasProjects.length; j++) {
                            var serviceHasProject = project.serviceHasProjects[j];
                            if (serviceHasProject && serviceHasProject.serviceID) {
                                var service = fsIndex.index.services[serviceHasProject.serviceID];
                                if (service) {
                                    c = true;
                                    break;
                                }
                            }
                        }
                        if (c) compliant[rule]++; else noncompliant[rule]++;

                    }
                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'type=16&'+ (key != 'unassigned' ? 'filter=' + key+ '_&' : '') +'serviceHasProjects[]=na'
                    );

                    rule = 'Planned Start Date';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        var project = groupedByMarket[key][i];
                        var c = false;
                        for (var j = 0; j < project.factSheetHasLifecycles.length; j++) {
                            if (project.factSheetHasLifecycles[j].lifecycleStateID == 3) {
                                c = true;
                                break;
                            }
                        }
                        if (c) compliant[rule]++; else noncompliant[rule]++;

                    }
                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'type=16&'+ (key != 'unassigned' ? 'filter=' + key+ '_&' : '') +'lifecycle[]=na'
                    );

                    rule = 'Planned Finish Date';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        var project = groupedByMarket[key][i];
                        var c = false;
                        for (var j = 0; j < project.factSheetHasLifecycles.length; j++) {
                            if (project.factSheetHasLifecycles[j].lifecycleStateID == 5) {
                                c = true;
                                break;
                            }
                        }
                        if (c) compliant[rule]++; else noncompliant[rule]++;

                    }
                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'type=16&'+ (key != 'unassigned' ? 'filter=' + key+ '_&' : '') +'lifecycle[]=na'
                    );
                }

                function pushToOutput(output, market, rule, compliant, noncompliant, url) {
                    output.push({
                        rule: rule,
                        id: key,
                        market: market,
                        compliant: compliant[rule],
                        noncompliant: noncompliant[rule],
                        percentage: 100 - Math.floor(noncompliant[rule] / (compliant[rule] + noncompliant[rule]) * 100),
                        url: url
                    });

                }


                function link(cell, row) {
                    return '<a href="' + that.reportSetup.baseUrl + '/inventory?' + row.url + '" target="_blank">' + cell + '</a>';
                }


                function percentage(cell, row) {
                    return '<div class="percentage" style="background-color: ' + getGreenToRed(cell) + ';">' + cell + ' %</div>';
                }

                hideSpinner();
                ReactDOM.render(
                    <div className="report-data-quality">
                        <BootstrapTable data={output} striped={false} hover={true} search={true} condensed={true} exportCSV={true}>
                            <TableHeaderColumn dataField="id" isKey={true} hidden={true}>ID</TableHeaderColumn>
                            <TableHeaderColumn dataField="market" width="80" dataAlign="left" dataSort={false} filter={{ type: "SelectFilter", options: markets }}>Market</TableHeaderColumn>
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

    return ReportProjectDataQuality;
})();