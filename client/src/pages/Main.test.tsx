import * as React from 'react';
import * as ReactDOM from 'react-dom';

import Main from './Main';

import * as Enzyme from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });

describe('<Main />', () => {
	it ('should render without crashing', () => {
		const div = document.createElement('div');
		ReactDOM.render(
			<Main />,
			div
		);
		ReactDOM.unmountComponentAtNode(div);
	});
});