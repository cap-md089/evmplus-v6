import * as React from 'react';
import * as ReactDOM from 'react-dom';

import PageRouter from './PageRouter';

import * as Enzyme from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';

import { BrowserRouter as Router } from 'react-router-dom';

Enzyme.configure({ adapter: new Adapter() });

describe('<PageRouter />', () => {
	it ('should render without crashing', () => {
		const div = document.createElement('div');
		ReactDOM.render(
			<Router>
				<PageRouter />
			</Router>,
			div
		);
		ReactDOM.unmountComponentAtNode(div);
	});
});