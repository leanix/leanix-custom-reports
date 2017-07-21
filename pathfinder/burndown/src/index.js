import '@leanix/reporting';
import Report from './report';

lx.init()
.then((setup) => {
	const report = new Report(setup);
	lx.ready(report.config);
	report.init();
});
