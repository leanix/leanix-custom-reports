// 3rd party css files
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../node_modules/bootstrap/dist/css/bootstrap-theme.min.css';
import '../node_modules/react-bootstrap-table/dist/react-bootstrap-table.min.css';

// Import css declarations for the report
import './assets/main.css';

import '@leanix/reporting';
import React from 'react';
import ReactDOM from 'react-dom';
import Report from './Report';

ReactDOM.render(<Report />, document.getElementById('report'));