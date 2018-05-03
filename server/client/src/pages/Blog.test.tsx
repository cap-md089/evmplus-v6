import * as React from 'react';
import * as ReactDOM from 'react-dom';

import Blog from './Blog';

import * as Enzyme from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';

Enzyme.configure({ adapter: new Adapter() });

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

describe('<Blog />', () => {
	it ('should render without crashing', () => {
		const div = document.createElement('div');
		ReactDOM.render(
			<Provider store={store}>
				<Router>
					<Blog />
				</Router>
			</Provider>,
			div
		);
		ReactDOM.unmountComponentAtNode(div);
	});
});