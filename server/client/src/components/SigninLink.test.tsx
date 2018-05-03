import * as React from 'react';
import * as ReactDOM from 'react-dom';

import SigninLink from './SigninLink';

import * as Enzyme from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });

import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';

import reducers from '../reducers';
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

describe ('<SigninLink />', () => {
	it ('should render without crashing', () => {
		const div = document.createElement('div');
		ReactDOM.render(
			<Provider store={store}>
				<Router>
					<SigninLink />
				</Router>
			</Provider>,
			div
		);
		ReactDOM.unmountComponentAtNode(div);
	});
});