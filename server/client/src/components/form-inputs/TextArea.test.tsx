import * as React from 'react';
import * as ReactDOM from 'react-dom';

import TextArea from './TextArea';

import * as Enzyme from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });

describe('<TextInput />', () => {
	it ('should render without crashing', () => {
		const div = document.createElement('div');
		ReactDOM.render(
			<TextArea
				name="test1"
			/>,
			div
		);
		ReactDOM.unmountComponentAtNode(div);
	});
});