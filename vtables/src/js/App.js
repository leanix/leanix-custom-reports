(function () {
    'use strict';

    var hideSpinner;
    var reportSetup = new ReportSetup();

    switch (reportSetup.getArg('report')) {
        case 'appmap2bca':
            var report = new ReportAppMap2BCA(reportSetup);
            break;
        case 'appmap2cim':
            var report = new ReportAppMap2CIM(reportSetup);
            break;
        case 'appmap2etom':
            var report = new ReportAppMap2ETOM(reportSetup);
            break;
        case 'appmap2platforms':
            var report = new ReportAppMap2Platforms(reportSetup);
            break;
        case 'app-lifecycle':
            var report = new ReportApplicationLifecycle(reportSetup, 'Application');
            break;
        case 'app-portfolio':
            var report = new ReportApplicationPortfolio(reportSetup, 'Application');
            break;
        case 'cim-masterlist':
            var report = new ReportCIMMasterList(reportSetup);
            break;
        case 'csm-operations':
            var report = new ReportCSMOperations(reportSetup, 'CSM');
            break;
        case 'csm-services':
            var report = new ReportCSMServices(reportSetup, 'CSM');
            break;
        case 'data-quality':
            var report = new ReportDataQuality(reportSetup);
            break;
        case 'passbook':
            var report = new ReportPassbook(reportSetup);
            break;
        case 'project-data-quality':
            var report = new ReportProjectDataQuality(reportSetup);
            break;
		case 'technopedia':
			var report = new ReportTechnopedia(reportSetup, 'Application');
			break;
    }

    hideSpinner = function hideSpinner() {
        document.getElementById('spinnerloader').style.display = 'none';
    };

    if (report) {
        report.render(hideSpinner);
    }

})();