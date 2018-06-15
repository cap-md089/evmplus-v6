import * as React from 'react';
import * as ReactDOM from 'react-dom';

import FileInput from './FileInput';

import * as Enzyme from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';

// import { shallow } from 'enzyme';

// import { stub, spy } from 'sinon';
// import { spy } from 'sinon';

Enzyme.configure({ adapter: new Adapter() });

describe ('<FileInput />', () => {
	it ('should render without crashing', () => {
		const div = document.createElement('div');
		ReactDOM.render(
			<FileInput
				name="test"
			/>,
			div
		);
		ReactDOM.unmountComponentAtNode(div);
	});
});