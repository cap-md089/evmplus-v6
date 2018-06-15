import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { BreadCrumbsPresentation } from './BreadCrumbs';

import * as Enzyme from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';

import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';

import { shallow } from 'enzyme';

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

describe ('<BreadCrumbs />', () => {
	it ('should render without crashing', () => {
		const div = document.createElement('div');
		ReactDOM.render(
			<Provider store={store}>
				<Router>
					<BreadCrumbsPresentation
						links={[]}
					/>
				</Router>
			</Provider>,
			div
		);
		ReactDOM.unmountComponentAtNode(div);
	});
	
	it ('should have an item for every link', () => {
		let wrapper = shallow(
			<BreadCrumbsPresentation
				links={[
					{
						text: 'Home',
						target: 'string'
					},
					{
						text: 'Calendar',
						target: 'string'
					}
				]}
			/>
		);
		expect(wrapper.find('ul').children().length).toEqual([
			'Home',
			'/',
			'Calendar'
		].length);
	});
});