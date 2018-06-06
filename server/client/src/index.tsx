import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App, { Head } from './App';
// import registerServiceWorker from './registerServiceWorker';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import reducers from './reducers';

import './nhq.css';
import { signIn } from './actions/userActions';

const store = createStore(
	reducers,
	{
		BreadCrumbs : {
			links: []
		},
		SideNavigation : {
			links: []
		},
		SignedInUser : {

		}
	}
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
		store.dispatch(signIn(
			event.data.sessionID !== '',
			event.data.sessionID,
			event.data.error,
			event.data.member
		));
	},
	false
);
