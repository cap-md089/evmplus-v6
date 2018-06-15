import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App, { Head } from './App';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';

import * as fetch from 'isomorphic-fetch';

import reducers from './reducers';
import { createStore } from 'redux';

const store = createStore(
	reducers,
	{
		BreadCrumbs : {
			links: []
		},
		SideNavigation : {
			links: []
		},
		Dialogue: {
			open: false,
			text: '',
			title: ''
		}
	}
);

describe ('<App />', () => {
	it('renders without crashing', () => {
		const div = document.createElement('div');
		ReactDOM.render(
			<Provider store={store}>
				<Router>
					<App isMobile={false} fetch={fetch} />
				</Router>
			</Provider>,
			div
		);
		ReactDOM.unmountComponentAtNode(div);
	});
});

describe ('<Head />', () => {
	it('renders without crashing', () => {
		const div = document.createElement('div');
		ReactDOM.render(<Head />, div);
		ReactDOM.unmountComponentAtNode(div);
	});
});