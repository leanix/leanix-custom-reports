// 3rd party css files
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../node_modules/bootstrap/dist/css/bootstrap-theme.min.css';
import '../node_modules/c3/c3.min.css';

// Import css declarations for the report
import './assets/main.css';

import '@leanix/reporting';
import Report from './Report';

lx.init()
.then((setup) => {
	const report = new Report(setup);
	lx.ready(report.config);
	report.init();
});
