import 'promise-polyfill/src/polyfill';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
// import registerServiceWorker from './registerServiceWorker';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './nhq.css';
import './polyfills';

ReactDOM.render(
	<Router>
		<App isMobile={false} />
	</Router>,
	document.getElementById('root') as HTMLElement
);

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
