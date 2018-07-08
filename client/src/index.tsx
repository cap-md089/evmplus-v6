import './polyfills';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App, { Head } from './App';
// import registerServiceWorker from './registerServiceWorker';
import { BrowserRouter as Router } from 'react-router-dom';

import './nhq.css';

ReactDOM.render(
	<Router>
		<App isMobile={false} />
	</Router>,
	document.getElementById('root') as HTMLElement
);
document.onload = function () {
	ReactDOM.render(
		<Head />,
		document.getElementById('headelem') as HTMLElement
	);
};

// registerServiceWorker();

window.addEventListener(
	'message',
	(event: MessageEvent): void => {
		if (event.data.source && event.data.source.indexOf('react-devtools') > -1) {
			return;
		}
		if (typeof event.data.sessionID === 'undefined') {
			return;
		}
		localStorage.setItem('sessionID', event.data.sessionID);
	},
	false
);
