import '@leanix/reporting';
import Report from './Report';

lx.init()
.then((setup) => {
	const report = new Report(setup);
	lx.ready(report.config);
	report.init();
});
