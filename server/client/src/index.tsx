import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App, { Head } from './App';
import registerServiceWorker from './registerServiceWorker';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import reducers from './reducers';

import './nhq.css';

const store = createStore(
	reducers
);

ReactDOM.render(
	<Provider store={store}>
		<Router>
			<App isMobile={false} />
		</Router>
	</Provider>,
	document.getElementById('root') as HTMLElement
);
document.onload = function () {
	ReactDOM.render(
		<Head />,
		document.getElementById('headelem') as HTMLElement
	);
};

registerServiceWorker();

window.addEventListener(
	'message',
	(event: MessageEvent): void => {
		let log = document.getElementById('log');
		if (log) {
			log.innerHTML += JSON.stringify(event.data);
		}
	},
	false
);