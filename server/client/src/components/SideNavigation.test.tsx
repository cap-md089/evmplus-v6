import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { SideNavigation, LinkType } from './SideNavigation';

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

describe ('<SideNavigation />', () => {
	it ('should render without crashing', () => {
		const div = document.createElement('div');
		ReactDOM.render(
			<Provider store={store}>
				<Router>
					<SideNavigation
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
			<SideNavigation
				links={[
					{
						text: 'Home',
						url: 'string',
						type: LinkType.LINK
					},
					{
						text: 'Calendar',
						url: 'string',
						type: LinkType.LINK
					}
				]}
			/>
		);

		expect(wrapper.find('ul').children().length).toEqual([
			'Sign in',
			'Home',
			'Calendar'
		].length);
	});
});